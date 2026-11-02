/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HealthSeverity = 'normal' | 'warning' | 'critical';

export type FaultType = 
  | 'none'
  | 'overheating'
  | 'partial_shading'
  | 'low_output_dust'
  | 'abnormal_electrical';

export interface SensorReading {
  id: string;
  timestamp: number; // Unix epoch ms
  timeLabel: string; // HH:mm:ss
  panelTemp: number; // °C from DS18B20
  ambientTemp: number; // °C from DHT22
  humidity: number; // % RH from DHT22
  lightIntensity: number; // Lux from LDR
  voltage: number; // Volts (V)
  current: number; // Amperes (A)
  power: number; // Watts (W) = V * I
  expectedPower: number; // Theoretical expected W for current lux & ambient
  efficiency: number; // %
}

export interface DiagnosisReport {
  id: string;
  timestamp: number;
  severity: HealthSeverity;
  faultType: FaultType;
  title: string;
  summary: string;
  rootCause: string;
  detectedMetrics: {
    panelTempDelta: number; // Panel - Ambient (°C)
    powerLossPercent: number; // % below expected
    luxLevel: number; // Lux
    voltageStability: string;
  };
  recommendations: string[];
  confidenceScore: number; // e.g. 96%
}

export interface DailySummaryKPIs {
  energyGeneratedKWh: number;
  peakPowerWatts: number;
  avgEfficiencyPercent: number;
  performanceRatioPR: number; // %
  co2OffsetKg: number;
  operatingHours: number;
  totalAlertsLogged: number;
}

export interface ESP32NodeStatus {
  deviceId: string;
  hardwareModel: string;
  macAddress: string;
  localIp: string;
  wifiSsid: string;
  rssi: number; // dBm
  connectionStatus: 'online' | 'intermittent' | 'offline';
  lastPingMs: number;
  firmwareVersion: string;
  samplingIntervalSeconds: number;
  dataSource: 'demo' | 'firebase' | 'rest_api';
  sensorPins: {
    ds18b20: { pin: string; bus: string; state: 'nominal' | 'error' };
    dht22: { pin: string; bus: string; state: 'nominal' | 'error' };
    ldr: { pin: string; bus: string; state: 'nominal' | 'error' };
    currentSensor: { pin: string; bus: string; state: 'nominal' | 'error' };
    voltageDivider: { pin: string; bus: string; state: 'nominal' | 'error' };
  };
}

export interface FirebaseConnectionConfig {
  enabled: boolean;
  apiKey: string;
  databaseURL: string;
  projectId: string;
  streamPath: string; // e.g., 'esp32_nodes/solar_node_01/live'
  autoSync: boolean;
}

export interface ThresholdSettings {
  voltage: {
    min: number;
    max: number;
    enabled: boolean;
  };
  panelTemp: {
    min: number;
    max: number;
    enabled: boolean;
  };
  ambientTemp: {
    min: number;
    max: number;
    enabled: boolean;
  };
  soundEnabled: boolean;
}

export interface ThresholdAlertEvent {
  id: string;
  timestamp: number;
  timeLabel: string;
  metric: 'voltage' | 'panelTemp' | 'ambientTemp';
  label: string;
  currentValue: number;
  breachType: 'below_min' | 'above_max';
  thresholdValue: number;
  unit: string;
  severity: 'warning' | 'critical';
  acknowledged: boolean;
}

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  voltage: {
    min: 14.0,
    max: 21.0,
    enabled: true,
  },
  panelTemp: {
    min: 15.0,
    max: 58.0,
    enabled: true,
  },
  ambientTemp: {
    min: 10.0,
    max: 42.0,
    enabled: true,
  },
  soundEnabled: false,
};
export interface ESP32AnomalyDetail {
  id: string;
  sensorKey: 'panelTemp' | 'ambientTemp' | 'humidity' | 'lightIntensity' | 'voltage' | 'current' | 'bus';
  sensorName: string;
  hardwarePin: string;
  busType: string;
  errorCode: string;
  severity: 'warning' | 'critical';
  title: string;
  observedValue: string;
  expectedRange: string;
  deviation: string;
  diagnosis: string;
  recommendedHardwareFix: string;
}
