// ════════════════════════════════════════════════════════════════
//  CycleAura Firmware — cycleaura_firmware.ino
//  ESP32 + DS18B20 + MAX30102 + ADXL335 + OLED
//  Sends sensor data to Flask backend via HTTP POST
//  Receives ML cycle phase prediction via HTTP GET
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
OneWire          oneWire(DS18B20_PIN);
DallasTemperature tempSensor(&oneWire);
MAX30105         heartSensor;
Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ── State ─────────────────────────────────────────────────────────
char   currentPhase[20]  = "Unknown";
float  currentConfidence = 0.0;
int    daysToNextPeriod  = -1;
unsigned long lastHRSend = 0;
unsigned long lastPredFetch = 0;

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
    heartSensor.setPulseAmplitudeRed(0x1F);   // Medium LED power
    heartSensor.setPulseAmplitudeIR(0x1F);
    heartSensor.setPulseAmplitudeGreen(0);
    Serial.println("[MAX30102] Ready");
  }

  // ADXL335 (analog, no init needed)
  analogReadResolution(12);
  Serial.println("[ADXL335] Ready");

  // WiFi
  connectWiFi();

  Serial.println("=== CycleAura Ready ===\n");
}

// ── Loop ──────────────────────────────────────────────────────────
void loop() {
  // 1. Read all sensors
  SensorReading s = readAllSensors();

  // 2. Feed MAR filter
  marFilter.update(s.ir_value, s.motion_magnitude);
  bool signalClean = marFilter.isClean(s.motion_magnitude);

  // 3. Print to Serial Monitor
  printSerial(s, signalClean);

  // 4. Update OLED display
  displaySensorData(s, currentPhase);

  // 5. Send heart rate to Flask every 60 seconds (if finger on sensor)
  if (s.finger_detected && signalClean &&
      millis() - lastHRSend > HEARTRATE_SEND_INTERVAL_MS) {
    sendHeartRate(s, USER_ID);
    lastHRSend = millis();
  }

  // 6. Fetch new ML prediction every 5 minutes
  if (millis() - lastPredFetch > 300000) {
    String pred = getCyclePrediction(USER_ID);
    parsePrediction(pred);
    lastPredFetch = millis();
    displayPrediction(currentPhase, currentConfidence, daysToNextPeriod);
    delay(3000); // Show prediction for 3s
  }

  delay(DISPLAY_REFRESH_MS);
}

// ── BBT Morning Reading Mode ───────────────────────────────────────
// Call this function manually (or via button) for morning BBT reading
void morningBBTReading() {
  Serial.println("\n[BBT] Morning reading mode started...");
  displayBBTMode();
  delay(BBT_STABILIZE_DELAY_MS); // Wait 30s for stabilization

  SensorReading s = readAllSensors();

  if (!s.bbt_valid) {
    Serial.println("[BBT] ERROR: Invalid reading. Check DS18B20.");
    return;
  }

  Serial.print("[BBT] Stable reading: ");
  Serial.print(s.bbt_celsius, 2);
  Serial.println(" °C");

  // Send BBT to Flask (triggers ML prediction update)
  bool sent = sendBBT(s, USER_ID);
  if (sent) {
    Serial.println("[BBT] Sent to server successfully.");
    // Immediately fetch updated ML prediction
    String pred = getCyclePrediction(USER_ID);
    parsePrediction(pred);
    displayPrediction(currentPhase, currentConfidence, daysToNextPeriod);
  }
}

// ── Parse ML Prediction JSON ──────────────────────────────────────
void parsePrediction(const String& json) {
  if (json == "{}") return;

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, json);
  if (err) {
    Serial.println("[ML] JSON parse error: " + String(err.c_str()));
    return;
  }

  const char* phase = doc["phase"] | "Unknown";
  strncpy(currentPhase, phase, sizeof(currentPhase) - 1);
  currentConfidence  = doc["confidence"]        | 0.0f;
  daysToNextPeriod   = doc["next_period_in_days"] | -1;

  Serial.print("[ML] Phase: ");      Serial.println(currentPhase);
  Serial.print("[ML] Confidence: "); Serial.print(currentConfidence * 100, 0);
  Serial.println("%");
  Serial.print("[ML] Days to next period: "); Serial.println(daysToNextPeriod);
}

// ── Serial Debug Print ────────────────────────────────────────────
void printSerial(const SensorReading& s, bool clean) {
  Serial.println("----------------------------------");

  Serial.println("=== DS18B20 ===");
  if (s.bbt_valid) {
    Serial.print("BBT: "); Serial.print(s.bbt_celsius, 2); Serial.println(" °C");
  } else {
    Serial.println("BBT: ERROR - check sensor");
  }

  Serial.println("=== MAX30102 ===");
  Serial.print("IR: ");  Serial.println(s.ir_value);
  Serial.print("Red: "); Serial.println(s.red_value);
  if (s.finger_detected) {
    Serial.print("BPM: ");  Serial.println(s.bpm);
    Serial.print("SpO2: "); Serial.print(s.spo2_estimate, 1); Serial.println(" %");
    Serial.print("Signal clean (MAR): "); Serial.println(clean ? "YES" : "NO - motion detected");
  } else {
    Serial.println(">> No finger detected.");
  }

  Serial.println("=== ADXL335 ===");
  Serial.print("X: "); Serial.print(s.accel_x, 3);
  Serial.print("g | Y: "); Serial.print(s.accel_y, 3);
  Serial.print("g | Z: "); Serial.print(s.accel_z, 3);
  Serial.println("g");
  Serial.print("Motion magnitude: "); Serial.print(s.motion_magnitude, 3); Serial.println("g");

  Serial.println("=== ML Phase ===");
  Serial.print("Phase: "); Serial.print(currentPhase);
  Serial.print(" ("); Serial.print(currentConfidence * 100, 0); Serial.println("%)");
}
