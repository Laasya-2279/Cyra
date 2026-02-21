// ════════════════════════════════════════════════════════════════
//  CycleAura Firmware — cycleaura_firmware.ino
//  ESP32 + DS18B20 + MAX30102 + ADXL335 + OLED
//  Sends sensor data to Flask backend via HTTP POST
//  Receives ML cycle phase prediction via HTTP GET
//
//  FIXES:
//  1. MAR filter now uses motion_compensated (not motion_magnitude)
//  2. MAX30102 LED power boosted 0x1F → 0x3F
//  3. BBT auto-sends on startup + every 30 minutes
//  4. Prediction fetch interval reduced to 15s for testing
// ════════════════════════════════════════════════════════════════

#include <Wire.h>
#include <WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "config.h"
#include "sensors.h"
#include "mar_filter.h"
#include "oled_display.h"
#include "wifi_client.h"

// ── Global Objects ────────────────────────────────────────────────
OneWire           oneWire(DS18B20_PIN);
DallasTemperature tempSensor(&oneWire);
MAX30105          heartSensor;
Adafruit_SSD1306  oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ── State ─────────────────────────────────────────────────────────
char          currentPhase[20] = "Unknown";
float         currentConfidence = 0.0;
int           daysToNextPeriod  = -1;
unsigned long lastHRSend        = 0;
unsigned long lastBBTSend       = 0;
unsigned long lastPredFetch     = 0;

// ── Setup ─────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== CycleAura Booting ===");

  // I2C Bus (shared by MAX30102 + OLED)
  Wire.begin(21, 22);

  // OLED
  initOLED();

  // DS18B20
  tempSensor.begin();
  Serial.println("[DS18B20] Ready");

  // MAX30102
  if (!heartSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[MAX30102] ERROR: Not found! Check wiring.");
  } else {
    heartSensor.setup();
    // FIX 2: Boosted from 0x1F to 0x3F for stronger signal
    heartSensor.setPulseAmplitudeRed(0x3F);
    heartSensor.setPulseAmplitudeIR(0x3F);
    heartSensor.setPulseAmplitudeGreen(0);
    Serial.println("[MAX30102] Ready — LED power: 0x3F");
  }

  // ADXL335 (analog, no init needed)
  analogReadResolution(12);
  Serial.println("[ADXL335] Ready");

  // WiFi
  connectWiFi();

  // Test Flask connection after WiFi
  if (WiFi.status() == WL_CONNECTED) {
    testFlaskConnection();
  }

  // FIX 3: Send initial BBT reading right after boot
  Serial.println("[BBT] Taking initial reading...");
  delay(2000); // Short stabilization
  SensorReading initReading = readAllSensors();
  if (initReading.bbt_valid) {
    sendBBT(initReading, USER_ID);
    lastBBTSend = millis();
  }

  Serial.println("=== CycleAura Ready ===\n");
}

// ── Loop ──────────────────────────────────────────────────────────
void loop() {

  // 1. Read all sensors
  SensorReading s = readAllSensors();

  // FIX 1: Use motion_COMPENSATED (not motion_magnitude) for MAR
  // motion_compensated removes gravity so still device reads ~0g
  // motion_magnitude includes gravity and always reads ~1.5g
  marFilter.update(s.ir_value, s.motion_compensated);
  bool signalClean = marFilter.isClean(s.motion_compensated);

  // 2. Print to Serial Monitor
  printSerial(s, signalClean);

  // 3. Update OLED display
  displaySensorData(s, currentPhase);

  // 4. Send heart rate every 60 seconds when finger detected + clean signal
  if (s.finger_detected && signalClean &&
      millis() - lastHRSend > HEARTRATE_SEND_INTERVAL_MS) {
    sendHeartRate(s, USER_ID);
    lastHRSend = millis();
  }

  // 5. Send BBT every 30 minutes automatically
  if (millis() - lastBBTSend > 1800000UL) {
    if (s.bbt_valid) {
      sendBBT(s, USER_ID);
      lastBBTSend = millis();
    }
  }

  // 6. Fetch ML prediction
  // FIX 4: Changed to 15 seconds for testing (change back to 300000 for production)
  if (millis() - lastPredFetch > 15000) {
    String pred = getCyclePrediction(USER_ID);
    parsePrediction(pred);
    lastPredFetch = millis();
    // Show prediction on OLED for 3 seconds
    if (String(currentPhase) != "Unknown") {
      displayPrediction(currentPhase, currentConfidence, daysToNextPeriod);
      delay(3000);
    }
  }

  delay(DISPLAY_REFRESH_MS);
}

// ── Manual BBT Morning Reading (called via Serial command) ────────
void morningBBTReading() {
  Serial.println("\n[BBT] Morning reading mode...");
  displayBBTMode();
  delay(BBT_STABILIZE_DELAY_MS); // Wait 30s for stabilization

  SensorReading s = readAllSensors();

  if (!s.bbt_valid) {
    Serial.println("[BBT] ERROR: Invalid reading. Check DS18B20.");
    return;
  }

  Serial.print("[BBT] Stable reading: ");
  Serial.print(s.bbt_celsius, 2);
  Serial.println(" C");

  bool sent = sendBBT(s, USER_ID);
  if (sent) {
    lastBBTSend = millis();
    Serial.println("[BBT] Sent to server.");
    String pred = getCyclePrediction(USER_ID);
    parsePrediction(pred);
    displayPrediction(currentPhase, currentConfidence, daysToNextPeriod);
  }
}

// ── Parse ML Prediction JSON ──────────────────────────────────────
void parsePrediction(const String& json) {
  if (json == "{}" || json.length() == 0) return;

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, json);
  if (err) {
    Serial.println("[ML] JSON parse error: " + String(err.c_str()));
    return;
  }

  const char* phase = doc["phase"] | "Unknown";
  strncpy(currentPhase, phase, sizeof(currentPhase) - 1);
  currentConfidence = doc["confidence"]         | 0.0f;
  daysToNextPeriod  = doc["next_period_in_days"] | -1;

  Serial.print("[ML] Phase: ");       Serial.println(currentPhase);
  Serial.print("[ML] Confidence: ");  Serial.print(currentConfidence * 100, 0); Serial.println("%");
  Serial.print("[ML] Days to next: "); Serial.println(daysToNextPeriod);
}

// ── Serial Debug Print ────────────────────────────────────────────
void printSerial(const SensorReading& s, bool clean) {
  Serial.println("----------------------------------");

  // DS18B20
  Serial.println("=== DS18B20 ===");
  if (s.bbt_valid) {
    Serial.print("BBT: "); Serial.print(s.bbt_celsius, 2); Serial.println(" C");
  } else {
    Serial.println("BBT: ERROR - check sensor");
  }

  // MAX30102
  Serial.println("=== MAX30102 ===");
  Serial.print("IR:  "); Serial.println(s.ir_value);
  Serial.print("Red: "); Serial.println(s.red_value);
  if (s.finger_detected) {
    Serial.print("BPM:  "); Serial.println(s.bpm > 0 ? String(s.bpm) : "Calculating...");
    Serial.print("SpO2: "); Serial.print(s.spo2_estimate, 1); Serial.println(" %");
    Serial.print("Signal clean (MAR): "); Serial.println(clean ? "YES" : "NO - motion detected");
  } else {
    Serial.println(">> No finger detected.");
  }

  // ADXL335
  Serial.println("=== ADXL335 ===");
  Serial.print("X: "); Serial.print(s.accel_x, 3);
  Serial.print("g | Y: "); Serial.print(s.accel_y, 3);
  Serial.print("g | Z: "); Serial.print(s.accel_z, 3); Serial.println("g");
  Serial.print("Raw magnitude  : "); Serial.print(s.motion_magnitude, 3);  Serial.println("g");
  Serial.print("Compensated mag: "); Serial.print(s.motion_compensated, 3); Serial.println("g  ← used for MAR");

  // ML
  Serial.println("=== ML Phase ===");
  Serial.print("Phase: "); Serial.print(currentPhase);
  Serial.print(" ("); Serial.print(currentConfidence * 100, 0); Serial.println("%)");
}
