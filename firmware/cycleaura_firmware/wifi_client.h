#ifndef WIFI_CLIENT_H
#define WIFI_CLIENT_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include "config.h"
#include "sensors.h"

// ── Human-readable WiFi status ────────────────────────────────────
String wifiStatusText(int status) {
  switch (status) {
    case WL_IDLE_STATUS:     return "IDLE";
    case WL_NO_SSID_AVAIL:  return "NO_SSID_AVAIL <- Wrong WiFi name!";
    case WL_CONNECTED:       return "CONNECTED";
    case WL_CONNECT_FAILED:  return "CONNECT_FAILED <- Wrong password!";
    case WL_CONNECTION_LOST: return "CONNECTION_LOST";
    case WL_DISCONNECTED:    return "DISCONNECTED";
    default:                 return "UNKNOWN(" + String(status) + ")";
  }
}

// ── Scan nearby networks ──────────────────────────────────────────
void scanNetworks() {
  Serial.println("\n[WiFi] Scanning nearby networks...");
  int n = WiFi.scanNetworks();
  if (n == 0) {
    Serial.println("  No networks found!");
  } else {
    Serial.print("  Found "); Serial.print(n); Serial.println(" networks:");
    for (int i = 0; i < n && i < 10; i++) {
      Serial.print("  ["); Serial.print(i + 1); Serial.print("] ");
      Serial.print(WiFi.SSID(i));
      Serial.print("  Signal: "); Serial.print(WiFi.RSSI(i)); Serial.print(" dBm");
      Serial.print("  Ch: "); Serial.print(WiFi.channel(i));
      Serial.println(WiFi.channel(i) <= 13 ? " (2.4GHz OK)" : " (5GHz CANT USE)");
    }
  }
  Serial.println();
}

// ── Connect to WiFi with full debug ──────────────────────────────
void connectWiFi() {
  Serial.println("\n[WiFi] ── Starting Connection ──");
  Serial.print("[WiFi] Target SSID  : "); Serial.println(WIFI_SSID);
  Serial.print("[WiFi] Flask Server : "); Serial.println(FLASK_SERVER);

  scanNetworks();

  WiFi.disconnect(true);
  delay(500);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[WiFi] Connecting");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts % 10 == 0) {
      Serial.print(" ["); Serial.print(wifiStatusText(WiFi.status())); Serial.print("]");
    }
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] ✅ CONNECTED!");
    Serial.print("[WiFi] ESP32 IP   : "); Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Gateway IP : "); Serial.println(WiFi.gatewayIP());
    Serial.print("[WiFi] Signal     : "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
    Serial.println();
    Serial.println("[WiFi] Your laptop must be on the SAME hotspot.");
    Serial.println("[WiFi] Run ipconfig (Windows) or ifconfig (Mac) on laptop.");
    Serial.print("[WiFi] Laptop IP will be in same range as ESP32: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] ❌ FAILED!");
    Serial.print("[WiFi] Status: "); Serial.println(wifiStatusText(WiFi.status()));
    Serial.println("[WiFi] Check:");
    Serial.println("  1. Hotspot name in config.h matches exactly (case-sensitive)");
    Serial.println("  2. Hotspot password is correct");
    Serial.println("  3. iPhone: Settings → Personal Hotspot → ON");
    Serial.println("  4. Android: force 2.4GHz band in hotspot settings");
  }
}

// ── Reconnect if dropped ──────────────────────────────────────────
void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost connection — reconnecting...");
    connectWiFi();
  }
}

// ── Test Flask is reachable ───────────────────────────────────────
void testFlaskConnection() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(FLASK_SERVER) + "/api/health";
  http.begin(url);
  http.addHeader("ngrok-skip-browser-warning", "true"); 
  http.setTimeout(3000);

  Serial.print("[Flask] Testing: "); Serial.println(url);
  int code = http.GET();

  if (code == 200) {
    Serial.println("[Flask] ✅ Flask reachable!");
  } else {
    Serial.println("[Flask] ❌ Flask NOT reachable!");
    Serial.println("[Flask] → Is python app.py running on your laptop?");
    Serial.println("[Flask] → Is laptop on the same hotspot?");
    Serial.print("[Flask] → Try opening in phone browser: ");
    Serial.println(url);
  }
  http.end();
}

// ── POST BBT to Flask ─────────────────────────────────────────────
bool sendBBT(const SensorReading& s, const char* userId) {
  ensureWiFiConnected();
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  WiFiClientSecure client;
  client.setInsecure();  
  String url = String(FLASK_SERVER) + "/api/sensor/bbt";
  http.begin(client,url);
  http.addHeader("ngrok-skip-browser-warning", "true"); 
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);

  StaticJsonDocument<256> doc;
  doc["user_id"]   = userId;
  doc["bbt"]       = round(s.bbt_celsius * 100.0) / 100.0;
  doc["timestamp"] = millis();

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.print("[HTTP] POST /api/sensor/bbt → "); Serial.println(code);
  if (code < 0) { Serial.print("[HTTP] Error: "); Serial.println(HTTPClient::errorToString(code)); }
  http.end();
  return (code == 200 || code == 201);
}

// ── POST heart rate to Flask ──────────────────────────────────────
bool sendHeartRate(const SensorReading& s, const char* userId) {
  ensureWiFiConnected();
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(FLASK_SERVER) + "/api/sensor/heartrate";
  http.begin(url);
  http.addHeader("ngrok-skip-browser-warning", "true"); 
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  StaticJsonDocument<512> doc;
  doc["user_id"]          = userId;
  doc["bpm"]              = s.bpm;
  doc["ir_value"]         = s.ir_value;
  doc["red_value"]        = s.red_value;
  doc["spo2"]             = s.spo2_estimate;
  doc["motion_magnitude"] = s.motion_compensated;
  doc["motion_mag"]       = s.motion_compensated;
  doc["accel_x"]          = s.accel_x;
  doc["accel_y"]          = s.accel_y;
  doc["accel_z"]          = s.accel_z;
  doc["finger_detected"]  = s.finger_detected;
  doc["mar_clean"]        = s.finger_detected;
  doc["timestamp"]        = millis();

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.print("[HTTP] POST /api/sensor/heartrate → "); Serial.println(code);
  if (code < 0) { Serial.print("[HTTP] Error: "); Serial.println(HTTPClient::errorToString(code)); }
  http.end();
  return (code == 200 || code == 201);
}

// ── GET ML prediction ─────────────────────────────────────────────
String getCyclePrediction(const char* userId) {
  ensureWiFiConnected();
  if (WiFi.status() != WL_CONNECTED) return "{}";

  HTTPClient http;
  String url = String(FLASK_SERVER) + "/api/cycle/prediction?user_id=" + userId;
  http.begin(url);
  http.addHeader("ngrok-skip-browser-warning", "true");
  http.setTimeout(5000);

  int code = http.GET();
  Serial.print("[HTTP] GET /api/cycle/prediction → "); Serial.println(code);

  String payload = "{}";
  if (code == 200) {
    payload = http.getString();
    Serial.println("[ML] " + payload);
  } else if (code < 0) {
    Serial.print("[HTTP] Error: "); Serial.println(HTTPClient::errorToString(code));
  }
  http.end();
  return payload;
}

#endif
