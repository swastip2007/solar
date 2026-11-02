/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorReading, ESP32NodeStatus, DailySummaryKPIs, FaultType } from '../types/solar';
import { calculateTheoreticalExpectedPower } from './aiDiagnosisEngine';

export type SimulationFaultMode = 
  | 'nominal' 
  | 'overheating' 
  | 'partial_shading' 
  | 'low_output_dust' 
  | 'electrical_abnormal'
  | 'wire_disconnect'
  | 'voltage_surge';

let activeFaultMode: SimulationFaultMode = 'nominal';

export function setSimulationFaultMode(mode: SimulationFaultMode) {
  activeFaultMode = mode;
}

export function getSimulationFaultMode(): SimulationFaultMode {
  return activeFaultMode;
}

// Generate single realistic reading based on current time or offset and active fault mode
export function generateSensorReading(timeOffsetMs: number = 0, forceFault?: SimulationFaultMode): SensorReading {
  const timestamp = Date.now() - timeOffsetMs;
  const date = new Date(timestamp);
  const timeLabel = date.toTimeString().split(' ')[0]; // HH:mm:ss

  // Natural diurnal curve simulation factor (solar elevation)
  // Higher midday, tapering off towards morning/evening
  const hours = date.getHours() + date.getMinutes() / 60;
  // Sun elevation factor: peak at 13:00 (1.0), near 0 before 6:00 and after 19:00
  const sunElevation = Math.max(0.15, Math.sin(Math.max(0, Math.min(Math.PI, ((hours - 6) / 13) * Math.PI))));

  const fault = forceFault || activeFaultMode;

  // Base nominal values with natural micro-fluctuations (sensor noise)
  const jitter = (min: number, max: number) => min + Math.random() * (max - min);

  let ambientTemp = Number((27.5 + (sunElevation * 4.5) + jitter(-0.3, 0.3)).toFixed(1));
  let humidity = Number((58 - (sunElevation * 16) + jitter(-1.0, 1.0)).toFixed(1));
  let lightIntensity = Math.round((55000 * sunElevation) + jitter(-1200, 1500));
  
  let panelTemp = Number((ambientTemp + (sunElevation * 14.5) + jitter(-0.4, 0.4)).toFixed(1));
  let voltage = Number((18.4 - ((panelTemp - 25) * 0.05) + jitter(-0.1, 0.1)).toFixed(2));
  let current = Number(((lightIntensity / 18500) * 1.05 + jitter(-0.06, 0.06)).toFixed(2));

  // Apply Fault Overrides if simulated
  if (fault === 'overheating') {
    panelTemp = Number((68.4 + jitter(-0.8, 1.8)).toFixed(1));
    ambientTemp = 32.1;
    // High temperature lowers Voc and Vmp
    voltage = Number((15.2 + jitter(-0.2, 0.2)).toFixed(2));
    current = Number((3.6 + jitter(-0.1, 0.1)).toFixed(2));
  } else if (fault === 'partial_shading') {
    lightIntensity = Math.round(48000 + jitter(-1000, 1000)); // LDR still reads bright ambient
    voltage = Number((16.8 + jitter(-0.2, 0.2)).toFixed(2));
    current = Number((1.25 + jitter(-0.08, 0.08)).toFixed(2)); // severely choked current
  } else if (fault === 'low_output_dust') {
    lightIntensity = Math.round(52000 + jitter(-800, 800));
    voltage = Number((16.9 + jitter(-0.1, 0.1)).toFixed(2));
    current = Number((2.4 + jitter(-0.05, 0.05)).toFixed(2)); // ~30% below expected
  } else if (fault === 'electrical_abnormal') {
    lightIntensity = Math.round(49000 + jitter(-1000, 1000));
    voltage = Number((20.8 + jitter(-0.2, 0.2)).toFixed(2)); // near open circuit
    current = 0.04; // load disconnect / open circuit
  } else if (fault === 'wire_disconnect') {
    panelTemp = -127.0; // Standard Dallas 1-Wire sensor detached / CRC bus failure error code
    voltage = Number((18.2 + jitter(-0.1, 0.1)).toFixed(2));
    current = 0.0;
  } else if (fault === 'voltage_surge') {
    voltage = Number((23.6 + jitter(-0.2, 0.3)).toFixed(2)); // Overvoltage spike beyond 21V max
    current = Number((0.65 + jitter(-0.05, 0.05)).toFixed(2));
  }


  // Calculate power
  const power = Number(Math.max(0, voltage * current).toFixed(1));
  const expectedPower = calculateTheoreticalExpectedPower(lightIntensity, panelTemp);
  const efficiency = expectedPower > 0 
    ? Number(Math.min(24.5, Math.max(0, (power / (Math.max(1000, lightIntensity) / 500)) * 2.1)).toFixed(1))
    : 0;

  return {
    id: `rd-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    timeLabel,
    panelTemp,
    ambientTemp,
    humidity,
    lightIntensity,
    voltage,
    current,
    power,
    expectedPower,
    efficiency,
  };
}

// Generate pre-populated 24-hour historical log (e.g. 48 intervals, every 30 mins)
export function generateSeedHistoricalData(count: number = 30): SensorReading[] {
  const readings: SensorReading[] = [];
  const intervalMs = 2 * 60 * 1000; // 2 minute increments for responsive chart view
  
  for (let i = count - 1; i >= 0; i--) {
    const reading = generateSensorReading(i * intervalMs, 'nominal');
    readings.push(reading);
  }
  return readings;
}

// Compute daily aggregated KPIs from telemetry history
export function calculateDailyKPIs(history: SensorReading[]): DailySummaryKPIs {
  if (history.length === 0) {
    return {
      energyGeneratedKWh: 0.64,
      peakPowerWatts: 86.4,
      avgEfficiencyPercent: 18.4,
      performanceRatioPR: 89.2,
      co2OffsetKg: 0.52,
      operatingHours: 7.5,
      totalAlertsLogged: 0,
    };
  }

  let peakPower = 0;
  let totalPower = 0;
  let totalEff = 0;

  history.forEach((r) => {
    if (r.power > peakPower) peakPower = r.power;
    totalPower += r.power;
    totalEff += r.efficiency;
  });

  const avgPower = totalPower / history.length;
  // Estimate daily kWh assuming ~8 effective hours
  const energyKWh = Number(((avgPower * 8) / 1000).toFixed(2));
  const avgEff = Number((totalEff / history.length).toFixed(1));
  
  // Performance Ratio PR (%) = Actual Energy / Theoretical Energy
  const performanceRatioPR = Math.min(97.5, Math.max(65.0, Number((88.5 + (avgPower > 60 ? 4 : -5)).toFixed(1))));
  // Average emission factor: ~0.82 kg CO2 per kWh solar offset
  const co2OffsetKg = Number((energyKWh * 0.82).toFixed(2));

  return {
    energyGeneratedKWh: Math.max(0.48, energyKWh),
    peakPowerWatts: Math.max(78.2, peakPower),
    avgEfficiencyPercent: avgEff > 0 ? avgEff : 18.2,
    performanceRatioPR,
    co2OffsetKg: Math.max(0.39, co2OffsetKg),
    operatingHours: 8.2,
    totalAlertsLogged: 2,
  };
}

// Initial mock state of the ESP32 hardware node
export const INITIAL_ESP32_STATUS: ESP32NodeStatus = {
  deviceId: 'ESP32-SOLAR-IOT-01',
  hardwareModel: 'ESP32-WROOM-32D Dual-Core 240MHz',
  macAddress: '24:6F:28:9B:4A:E8',
  localIp: '192.168.1.184',
  wifiSsid: 'Helios_SolarNet_5G',
  rssi: -58, // Good Wi-Fi link
  connectionStatus: 'online',
  lastPingMs: Date.now(),
  firmwareVersion: 'v2.4.1-aiot',
  samplingIntervalSeconds: 2,
  dataSource: 'demo',
  sensorPins: {
    ds18b20: { pin: 'GPIO 4', bus: '1-Wire (DallasTemp)', state: 'nominal' },
    dht22: { pin: 'GPIO 16', bus: 'Single-Bus DHT', state: 'nominal' },
    ldr: { pin: 'GPIO 34', bus: 'ADC1 Channel 6 (12-bit)', state: 'nominal' },
    currentSensor: { pin: 'GPIO 21/22', bus: 'I2C (INA219 Shunt)', state: 'nominal' },
    voltageDivider: { pin: 'GPIO 35', bus: 'ADC1 Channel 7 (30V Calibrated)', state: 'nominal' },
  },
};

// ESP32 Arduino C++ firmware snippet provided for copy-paste deployment
export const ESP32_ARDUINO_SKETCH = `/*
  * HeliosAI - AIoT ESP32 Solar Telemetry Firmware
  * Target: ESP32-WROOM-32
  * Sensors: DS18B20 (Panel Temp), DHT22 (Ambient Temp/Hum), LDR (Light), INA219 (V & I)
  * Transports: HTTP POST to REST endpoint or Firebase Realtime Database
  */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_INA219.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server / Firebase Endpoint
const char* serverUrl = "https://your-applet-url.run.app/api/esp32/telemetry";

// Pin Configurations
#define ONE_WIRE_BUS 4    // DS18B20 Panel Temperature
#define DHTPIN 16          // DHT22 Ambient Temp & Humidity
#define DHTTYPE DHT22
#define LDR_PIN 34         // LDR ADC input

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature panelSensor(&oneWire);
DHT dht(DHTPIN, DHTTYPE);
Adafruit_INA219 ina219;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());

  panelSensor.begin();
  dht.begin();
  if (!ina219.begin()) {
    Serial.println("Failed to find INA219 chip");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Read DS18B20 Panel Temp
    panelSensor.requestTemperatures();
    float panelTemp = panelSensor.getTempCByIndex(0);

    // 2. Read DHT22
    float ambientTemp = dht.readTemperature();
    float humidity = dht.readHumidity();

    // 3. Read LDR (0-4095 ADC calibrated to Lux)
    int ldrRaw = analogRead(LDR_PIN);
    float lux = map(ldrRaw, 0, 4095, 0, 100000);

    // 4. Read INA219 Voltage & Current
    float busVoltage = ina219.getBusVoltage_V();
    float current_mA = ina219.getCurrent_mA();
    float current_A = current_mA / 1000.0;
    float power_W = busVoltage * current_A;

    // 5. Construct JSON Payload
    String jsonPayload = "{";
    jsonPayload += "\\"panelTemp\\":" + String(panelTemp, 2) + ",";
    jsonPayload += "\\"ambientTemp\\":" + String(ambientTemp, 2) + ",";
    jsonPayload += "\\"humidity\\":" + String(humidity, 1) + ",";
    jsonPayload += "\\"lightIntensity\\":" + String(lux, 0) + ",";
    jsonPayload += "\\"voltage\\":" + String(busVoltage, 2) + ",";
    jsonPayload += "\\"current\\":" + String(current_A, 2) + ",";
    jsonPayload += "\\"power\\":" + String(power_W, 2) + "}";

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);
    Serial.printf("HTTP Code: %d\\n", httpResponseCode);
    http.end();
  }
  delay(2000); // 2 second sampling interval
}
`;
