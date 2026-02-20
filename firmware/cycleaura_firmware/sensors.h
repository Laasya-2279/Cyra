#ifndef SENSORS_H
#define SENSORS_H

#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <MAX30105.h>
#include <heartRate.h>
#include "mar_filter.h"

// ── Pin Definitions ───────────────────────────────────────────────
#define DS18B20_PIN  4
#define ADXL_X_PIN  34
#define ADXL_Y_PIN  35
#define ADXL_Z_PIN  32

// ── Global Sensor Objects ─────────────────────────────────────────
extern OneWire          oneWire;
extern DallasTemperature tempSensor;
extern MAX30105          heartSensor;

// ── Struct: All sensor readings in one package ────────────────────
struct SensorReading {
  float bbt_celsius;        // DS18B20 temperature
  int   bpm;                // Motion-corrected BPM from MAX30102
  long  ir_value;           // Raw IR from MAX30102
  long  red_value;          // Raw Red from MAX30102
  float spo2_estimate;      // Estimated SpO2 (0–100%)
  float accel_x;            // ADXL335 X-axis in g
  float accel_y;            // ADXL335 Y-axis in g
  float accel_z;            // ADXL335 Z-axis in g
  float motion_magnitude;   // Raw magnitude sqrt(x²+y²+z²)
  float motion_compensated; // FIX: gravity-compensated magnitude
  bool  finger_detected;    // IR > 50000
  bool  bbt_valid;          // DS18B20 read success
};

// ── DS18B20: Read Basal Body Temperature ──────────────────────────
float readBBT() {
  tempSensor.requestTemperatures();
  float temp = tempSensor.getTempCByIndex(0);
  if (temp == DEVICE_DISCONNECTED_C) {
    Serial.println("[DS18B20] ERROR: Sensor disconnected!");
    return -999.0;
  }
  return temp;
}

// ── ADXL335: Read acceleration in g-force ─────────────────────────
void readADXL335(float &ax, float &ay, float &az,
                 float &magnitude, float &compensated) {
  // Average 10 samples to reduce ADC noise
  long rawX = 0, rawY = 0, rawZ = 0;
  for (int i = 0; i < 10; i++) {
    rawX += analogRead(ADXL_X_PIN);
    rawY += analogRead(ADXL_Y_PIN);
    rawZ += analogRead(ADXL_Z_PIN);
  }
  rawX /= 10; rawY /= 10; rawZ /= 10;

  // ADC (0–4095) → voltage (0–3.3V) → g-force
  // ADXL335: 0g = 1.65V, sensitivity = 0.300 V/g
  ax = ((rawX / 4095.0f) * 3.3f - 1.65f) / 0.300f;
  ay = ((rawY / 4095.0f) * 3.3f - 1.65f) / 0.300f;
  az = ((rawZ / 4095.0f) * 3.3f - 1.65f) / 0.300f;

  // Raw magnitude (includes ~1g gravity — used for display)
  magnitude = sqrt(ax*ax + ay*ay + az*az);

  // FIX: gravity-compensated magnitude (used for MAR filter)
  // Removes the gravity component so still device reads ~0g
  compensated = MARFilter::gravityCompensated(ax, ay, az);
}

// ── MAX30102: Motion-Artifact-Removed BPM ─────────────────────────
// Uses gravity-COMPENSATED magnitude for the motion check
int readCleanBPM(float motionCompensated) {
  static byte  rateArray[4] = {0};
  static byte  rateIndex    = 0;
  static long  lastBeat     = 0;

  long rawIR = heartSensor.getIR();
  if (rawIR < 50000) return 0; // No finger

  // FIX: use compensated magnitude (threshold 0.5g for motion gate)
  if (motionCompensated < 0.5f && checkForBeat(rawIR)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    if (delta > 300 && delta < 3000) { // Valid beat: 20–200 BPM range
      int bpm = 60000 / delta;
      if (bpm > 20 && bpm < 220) {
        rateArray[rateIndex++] = (byte)bpm;
        rateIndex %= 4;
      }
    }
  }

  int avg = 0;
  for (int i = 0; i < 4; i++) avg += rateArray[i];
  return avg / 4;
}

// ── SpO2 Estimation: Red/IR ratio method ──────────────────────────
float estimateSpO2(long irValue, long redValue) {
  if (irValue < 50000 || redValue < 10000) return 0.0f;
  float ratio = (float)redValue / (float)irValue;
  // Simplified R-curve: SpO2 ≈ 110 - 25 * ratio
  float spo2 = 110.0f - (25.0f * ratio);
  return constrain(spo2, 80.0f, 100.0f);
}

// ── Master Read: fills complete SensorReading struct ──────────────
SensorReading readAllSensors() {
  SensorReading s;

  // DS18B20
  s.bbt_celsius = readBBT();
  s.bbt_valid   = (s.bbt_celsius > -99.0f);

  // ADXL335 — get both raw and gravity-compensated magnitude
  readADXL335(s.accel_x, s.accel_y, s.accel_z,
              s.motion_magnitude, s.motion_compensated);

  // MAX30102
  s.ir_value       = heartSensor.getIR();
  s.red_value      = heartSensor.getRed();
  s.finger_detected = (s.ir_value > 50000);

  // FIX: pass compensated magnitude to BPM and MAR filter
  s.bpm           = readCleanBPM(s.motion_compensated);
  s.spo2_estimate = estimateSpO2(s.ir_value, s.red_value);

  // Update MAR filter with compensated magnitude
  marFilter.update(s.ir_value, s.motion_compensated);

  return s;
}

#endif
