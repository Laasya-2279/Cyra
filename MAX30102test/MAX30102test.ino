#include <Wire.h>
#include "MAX30105.h"
#include <OneWire.h>
#include <DallasTemperature.h>

MAX30105 particleSensor;

// ADXL335 Pins
#define XOUT 34
#define YOUT 35
#define ZOUT 32

// DS18B20 Pin
#define ONE_WIRE_BUS 4

#define ADXL335_VCC 3.3
#define ADC_RESOLUTION 4095.0

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32 Sensor Test: MAX30102 + ADXL335 + DS18B20");

  // ---- MAX30102 Init ----
  Wire.begin(21, 22);
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found! Check wiring.");
    while (1);
  }
  Serial.println("MAX30102 connected!");
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  // ---- ADXL335 Init ----
  analogReadResolution(12);
  Serial.println("ADXL335 ready.");

  // ---- DS18B20 Init ----
  ds18b20.begin();
  Serial.println("DS18B20 ready.");
  Serial.println("----------------------------------");
}

void loop() {
  // ---- MAX30102 ----
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  Serial.println("=== MAX30102 ===");
  Serial.print("IR : "); Serial.println(irValue);
  Serial.print("Red: "); Serial.println(redValue);
  if (irValue < 50000)
    Serial.println(">> No finger detected.");
  else
    Serial.println(">> Finger detected!");

  // ---- ADXL335 ----
  int rawX = 0, rawY = 0, rawZ = 0;
  for (int i = 0; i < 10; i++) {
    rawX += analogRead(XOUT);
    rawY += analogRead(YOUT);
    rawZ += analogRead(ZOUT);
  }
  rawX /= 10; rawY /= 10; rawZ /= 10;

  float vX = (rawX / ADC_RESOLUTION) * ADXL335_VCC;
  float vY = (rawY / ADC_RESOLUTION) * ADXL335_VCC;
  float vZ = (rawZ / ADC_RESOLUTION) * ADXL335_VCC;

  float gX = (vX - 1.65) / 0.300;
  float gY = (vY - 1.65) / 0.300;
  float gZ = (vZ - 1.65) / 0.300;

  Serial.println("=== ADXL335 ===");
  Serial.print("Accel -> X: "); Serial.print(gX, 3);
  Serial.print("g | Y: ");      Serial.print(gY, 3);
  Serial.print("g | Z: ");      Serial.print(gZ, 3);
  Serial.println("g");

  // ---- DS18B20 ----
  ds18b20.requestTemperatures();
  float tempC = ds18b20.getTempCByIndex(0);
  float tempF = (tempC * 9.0 / 5.0) + 32.0;

  Serial.println("=== DS18B20 ===");
  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println(">> Sensor not found! Check wiring.");
  } else {
    Serial.print("Temperature: "); Serial.print(tempC, 2);
    Serial.print("°C | ");        Serial.print(tempF, 2);
    Serial.println("°F");
  }

  Serial.println("----------------------------------");
  delay(1000);
}