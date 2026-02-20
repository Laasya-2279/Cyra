#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include "sensors.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET   -1
#define OLED_ADDRESS 0x3C

extern Adafruit_SSD1306 oled;

void initOLED() {
  if (!oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("[OLED] Init failed!");
    return;
  }
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println("  CycleAura v1.0");
  oled.println("  Initializing...");
  oled.display();
  delay(1500);
}

// Main display: shows all live readings
void displaySensorData(const SensorReading& s, const char* phase) {
  oled.clearDisplay();

  // ── Row 0: Phase (from ML) ────────────────────────────────────
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.print("Phase: ");
  oled.println(phase);

  // ── Divider line ──────────────────────────────────────────────
  oled.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // ── Row 1: BBT ───────────────────────────────────────────────
  oled.setCursor(0, 13);
  oled.print("BBT: ");
  if (s.bbt_valid) {
    oled.print(s.bbt_celsius, 2);
    oled.println(" C");
  } else {
    oled.println("--  C");
  }

  // ── Row 2: Heart Rate ─────────────────────────────────────────
  oled.setCursor(0, 25);
  oled.print("HR:  ");
  if (s.finger_detected && s.bpm > 0) {
    oled.print(s.bpm);
    oled.println(" BPM");
  } else {
    oled.println("-- BPM");
  }

  // ── Row 3: SpO2 ───────────────────────────────────────────────
  oled.setCursor(0, 37);
  oled.print("SpO2:");
  if (s.spo2_estimate > 0) {
    oled.print(s.spo2_estimate, 1);
    oled.println(" %");
  } else {
    oled.println("--  %");
  }

  // ── Row 4: Motion status ──────────────────────────────────────
  oled.setCursor(0, 49);
  oled.print("Motion: ");
  oled.print(s.motion_magnitude, 2);
  oled.println("g");

  // ── WiFi indicator (top right) ────────────────────────────────
  oled.setCursor(100, 0);
  oled.print(WiFi.status() == WL_CONNECTED ? "WiFi" : "    ");

  oled.display();
}

// Splash screen for BBT morning reading mode
void displayBBTMode() {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(10, 5);
  oled.println("== BBT MODE ==");
  oled.setCursor(0, 20);
  oled.println("Hold still.");
  oled.println("Reading temperature");
  oled.println("Please wait 30s...");
  oled.display();
}

// Show ML prediction result
void displayPrediction(const char* phase, float confidence, int daysToNext) {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println("== ML PREDICTION ==");
  oled.drawLine(0, 9, 127, 9, SSD1306_WHITE);
  oled.setCursor(0, 12);
  oled.print("Phase: "); oled.println(phase);
  oled.print("Conf:  "); oled.print(confidence * 100, 0); oled.println("%");
  oled.print("Next:  "); oled.print(daysToNext); oled.println(" days");
  oled.display();
}

#endif
