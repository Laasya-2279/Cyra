#ifndef WIFI_CLIENT_H
#define WIFI_CLIENT_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"

// ── Connect to WiFi ───────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] FAILED. Running in offline mode.");
  }
}

// ── POST BBT reading to Flask ─────────────────────────────────────
bool sendBBT(const SensorReading& s, const char* userId) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(FLASK_SERVER) + "/api/sensor/bbt";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["user_id"]     = userId;
  doc["bbt"]         = round(s.bbt_celsius * 100.0) / 100.0;
  doc["timestamp"]   = millis();

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.print("[HTTP BBT] Response: "); Serial.println(code);
  http.end();
  return (code == 200 || code == 201);
}

// ── POST heart rate + motion to Flask ────────────────────────────
bool sendHeartRate(const SensorReading& s, const char* userId) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(FLASK_SERVER) + "/api/sensor/heartrate";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["user_id"]          = userId;
  doc["bpm"]              = s.bpm;
  doc["ir_value"]         = s.ir_value;
  doc["red_value"]        = s.red_value;
  doc["spo2"]             = s.spo2_estimate;
  doc["motion_magnitude"] = s.motion_magnitude;
  doc["accel_x"]          = s.accel_x;
  doc["accel_y"]          = s.accel_y;
  doc["accel_z"]          = s.accel_z;
  doc["finger_detected"]  = s.finger_detected;
  doc["timestamp"]        = millis();

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.print("[HTTP HR] Response: "); Serial.println(code);
  http.end();
  return (code == 200 || code == 201);
}

// ── GET cycle prediction from Flask ML model ──────────────────────
String getCyclePrediction(const char* userId) {
  if (WiFi.status() != WL_CONNECTED) return "{}";

  HTTPClient http;
  String url = String(FLASK_SERVER) + "/api/cycle/prediction?user_id=" + userId;
  http.begin(url);

  int code = http.GET();
  String payload = "{}";
  if (code == 200) {
    payload = http.getString();
    Serial.println("[ML] Prediction received: " + payload);
  }
  http.end();
  return payload;
}

#endif
