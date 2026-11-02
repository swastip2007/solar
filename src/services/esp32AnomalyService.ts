/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorReading, ThresholdSettings, ESP32NodeStatus, ESP32AnomalyDetail } from '../types/solar';

/**
 * Evaluates real-time ESP32 sensor telemetry against electrical physics,
 * hardware bus signal integrity standards, and user-configured threshold envelopes.
 */
export function evaluateESP32Anomalies(
  reading: SensorReading,
  thresholds: ThresholdSettings,
  status?: ESP32NodeStatus
): ESP32AnomalyDetail[] {
  const anomalies: ESP32AnomalyDetail[] = [];

  // =========================================================================
  // 1. DS18B20 PANEL TEMPERATURE (GPIO 4 - 1-Wire Dallas Protocol)
  // =========================================================================
  // Dallas 1-Wire returns -127.0°C when connection is lost, wire detached, or CRC fails.
  // Dallas 1-Wire returns 85.0°C at power-on reset before conversion completes.
  if (reading.panelTemp <= -120 || reading.panelTemp === 85.0) {
    anomalies.push({
      id: `anom-ds18b20-disconnect-${reading.id}`,
      sensorKey: 'panelTemp',
      sensorName: 'DS18B20 Temperature Probe',
      hardwarePin: 'GPIO 4',
      busType: '1-Wire Dallas Bus',
      errorCode: 'ERR_1WIRE_HARDWARE_DISCONNECT',
      severity: 'critical',
      title: 'DS18B20 Bus Disconnect / Read Timeout (-127°C)',
      observedValue: `${reading.panelTemp.toFixed(1)}°C (Bus Error)`,
      expectedRange: `${thresholds.panelTemp.min.toFixed(1)}°C - ${thresholds.panelTemp.max.toFixed(1)}°C`,
      deviation: 'Signal loss / CRC mismatch',
      diagnosis:
        '1-Wire bus reported standard disconnect flag (-127°C). ESP32 is unable to communicate with DS18B20 digital probe on GPIO 4.',
      recommendedHardwareFix:
        'Check physical wire connection to GPIO 4. Verify 4.7kΩ pull-up resistor between VCC (3.3V) and DATA pin.',
    });
  } else if (thresholds.panelTemp.enabled && reading.panelTemp > thresholds.panelTemp.max) {
    const diff = reading.panelTemp - thresholds.panelTemp.max;
    anomalies.push({
      id: `anom-ds18b20-overheat-${reading.id}`,
      sensorKey: 'panelTemp',
      sensorName: 'DS18B20 Temperature Probe',
      hardwarePin: 'GPIO 4',
      busType: '1-Wire Dallas Bus',
      errorCode: 'ERR_THERMAL_HOTSPOT_RUNAWAY',
      severity: 'critical',
      title: 'Panel Thermal Hotspot / Overheat Threshold Exceeded',
      observedValue: `${reading.panelTemp.toFixed(1)}°C`,
      expectedRange: `Max allowable ${thresholds.panelTemp.max.toFixed(1)}°C`,
      deviation: `+${diff.toFixed(1)}°C over upper safety bound`,
      diagnosis:
        'Solar cell operating temperature has surged past safe thermal degradation limits. High risk of EVA browning, solder fatigue, and accelerated cell breakdown.',
      recommendedHardwareFix:
        'Inspect module backside with FLIR thermal camera for localized hot spots or shorted bypass diodes. Check ventilation gap beneath panel.',
    });
  } else if (thresholds.panelTemp.enabled && reading.panelTemp < thresholds.panelTemp.min) {
    const diff = thresholds.panelTemp.min - reading.panelTemp;
    anomalies.push({
      id: `anom-ds18b20-freezing-${reading.id}`,
      sensorKey: 'panelTemp',
      sensorName: 'DS18B20 Temperature Probe',
      hardwarePin: 'GPIO 4',
      busType: '1-Wire Dallas Bus',
      errorCode: 'ERR_PANEL_SUB_NOMINAL_TEMP',
      severity: 'warning',
      title: 'Panel Temperature Below Configured Minimum',
      observedValue: `${reading.panelTemp.toFixed(1)}°C`,
      expectedRange: `Min allowable ${thresholds.panelTemp.min.toFixed(1)}°C`,
      deviation: `-${diff.toFixed(1)}°C below minimum bound`,
      diagnosis:
        'Operating temperature has dipped below configured lower limit. Cell Voc increases, but watch for frost/icing conditions.',
      recommendedHardwareFix:
        'Verify panel is not covered by frost, snow, or sub-zero condensation. Ensure probe is firmly adhered to the module backsheet.',
    });
  } else if (reading.panelTemp - reading.ambientTemp > 28.0) {
    anomalies.push({
      id: `anom-ds18b20-delta-${reading.id}`,
      sensorKey: 'panelTemp',
      sensorName: 'DS18B20 Temperature Probe',
      hardwarePin: 'GPIO 4',
      busType: '1-Wire Dallas Bus',
      errorCode: 'ERR_ABNORMAL_THERMAL_DELTA',
      severity: 'warning',
      title: 'Extreme Panel-to-Ambient Temperature Delta',
      observedValue: `ΔT = +${(reading.panelTemp - reading.ambientTemp).toFixed(1)}°C`,
      expectedRange: 'ΔT < 24.0°C in nominal airflow',
      deviation: `+${(reading.panelTemp - reading.ambientTemp - 24.0).toFixed(1)}°C above normal thermal equilibrium`,
      diagnosis:
        'Panel surface is heating drastically faster than the surrounding ambient atmosphere, suggesting inadequate convective cooling or localized internal resistance.',
      recommendedHardwareFix:
        'Clear debris around mounting brackets; verify underside heatsink clearance is at least 100mm from rooftop deck.',
    });
  }

  // =========================================================================
  // 2. SOLAR VOLTAGE (GPIO 35 - ADC1 / INA219 Bus Voltage)
  // =========================================================================
  if (thresholds.voltage.enabled && reading.voltage > thresholds.voltage.max) {
    const diff = reading.voltage - thresholds.voltage.max;
    anomalies.push({
      id: `anom-volt-high-${reading.id}`,
      sensorKey: 'voltage',
      sensorName: 'Solar Voltage Monitor',
      hardwarePin: 'GPIO 35 / INA219',
      busType: 'I2C / ADC Calibrated Divider',
      errorCode: 'ERR_OVERVOLTAGE_SURGE_LIMIT',
      severity: 'critical',
      title: 'Solar Bus Overvoltage Surge',
      observedValue: `${reading.voltage.toFixed(2)} V`,
      expectedRange: `Max allowable ${thresholds.voltage.max.toFixed(2)} V`,
      deviation: `+${diff.toFixed(2)} V over maximum limit`,
      diagnosis:
        'Bus voltage has climbed above the maximum allowable input limit. Exposes ESP32 ADC and MPPT charge regulator capacitors to overvoltage stress.',
      recommendedHardwareFix:
        'Inspect voltage divider resistor network (100kΩ/10kΩ). Verify charge controller clamping and test open-circuit Voc rating with multimeter.',
    });
  } else if (thresholds.voltage.enabled && reading.voltage < thresholds.voltage.min && reading.lightIntensity > 20000) {
    const diff = thresholds.voltage.min - reading.voltage;
    anomalies.push({
      id: `anom-volt-low-${reading.id}`,
      sensorKey: 'voltage',
      sensorName: 'Solar Voltage Monitor',
      hardwarePin: 'GPIO 35 / INA219',
      busType: 'I2C / ADC Calibrated Divider',
      errorCode: 'ERR_UNDERVOLTAGE_UNDER_LIGHT',
      severity: 'warning',
      title: 'Abnormal Voltage Drop Under Sunlight',
      observedValue: `${reading.voltage.toFixed(2)} V`,
      expectedRange: `Min expected ${thresholds.voltage.min.toFixed(2)} V @ ${reading.lightIntensity.toLocaleString()} Lux`,
      deviation: `-${diff.toFixed(2)} V below minimum bound`,
      diagnosis:
        'Module voltage has collapsed below nominal operating range despite abundant sunlight (>20,000 Lux). Indicates partial bypass diode conduction or cell string micro-cracking.',
      recommendedHardwareFix:
        'Check junction box bypass diodes for reverse leakage or short circuits. Test string voltage under load vs open circuit.',
    });
  }

  // =========================================================================
  // 3. SOLAR CURRENT & LOAD (GPIO 21/22 - INA219 I2C Current Shunt)
  // =========================================================================
  // Disconnect / Open Circuit Anomaly: Bright sun (>30,000 Lux) + Open Voltage (>17V) but zero current (<0.15A)
  if (reading.lightIntensity > 30000 && reading.voltage > 16.5 && reading.current < 0.15) {
    anomalies.push({
      id: `anom-curr-open-circuit-${reading.id}`,
      sensorKey: 'current',
      sensorName: 'INA219 Current Shunt Sensor',
      hardwarePin: 'GPIO 21 (SDA) / 22 (SCL)',
      busType: 'I2C (Address 0x40)',
      errorCode: 'ERR_OPEN_CIRCUIT_DISCONNECT',
      severity: 'critical',
      title: 'Open Circuit / Load Disconnect (0.0 W Output)',
      observedValue: `${reading.power.toFixed(1)} W actual (${reading.current.toFixed(2)} A)`,
      expectedRange: `${reading.expectedPower.toFixed(1)} W estimated at current solar irradiance`,
      deviation: '-98% power transfer choke',
      diagnosis:
        'Panel has sufficient irradiance and high voltage, but current cannot flow. Indicates broken circuit breaker, tripped fuse, disconnected MC4 plug, or inverter shutdown.',
      recommendedHardwareFix:
        'Inspect MC4 terminal connectors for crimp pull-out or corrosion. Check inline DC fuse and inverter DC isolation switch position.',
    });
  } else if (
    reading.lightIntensity > 20000 &&
    (
      (reading.expectedPower > 25 && (reading.expectedPower - reading.power) > 14) ||
      (reading.current < 2.8 && reading.current >= 0.15 && reading.lightIntensity > 35000)
    )
  ) {
    // Current Choke / Dust / Soiling Accumulation
    const powerLossWatts = Math.max(0, reading.expectedPower - reading.power);
    const powerLossPct = reading.expectedPower > 0 ? (powerLossWatts / reading.expectedPower) * 100 : 0;
    const cleanExpectedAmps = Number((reading.expectedPower / Math.max(12, reading.voltage)).toFixed(2));

    anomalies.push({
      id: `anom-curr-dust-${reading.id}`,
      sensorKey: 'current',
      sensorName: 'INA219 Current Shunt Sensor',
      hardwarePin: 'GPIO 21 (SDA) / 22 (SCL)',
      busType: 'I2C High-Side Shunt',
      errorCode: 'ERR_DUST_SOILING_DERATE',
      severity: powerLossPct > 35 ? 'critical' : 'warning',
      title: 'Dust / Soiling Accumulation (Power Derated)',
      observedValue: `${reading.power.toFixed(1)} W actual (${reading.current.toFixed(2)} A)`,
      expectedRange: `${reading.expectedPower.toFixed(1)} W estimated clean capacity`,
      deviation: `-${powerLossWatts.toFixed(1)} W (-${powerLossPct.toFixed(1)}% harvest deficit)`,
      diagnosis:
        `Particulate dust or soiling buildup on glass surface is attenuating solar irradiance. Actual panel power is choked to ${reading.power.toFixed(1)} WATTS (${reading.current.toFixed(2)} A), generating well below the ${reading.expectedPower.toFixed(1)} WATTS estimated clean nominal power.`,
      recommendedHardwareFix:
        'Initiate automated spray wash or manual wipe with demineralized water and soft microfiber brush. Inspect surface for uniform dust film or localized bird droppings.',
    });
  }

  // =========================================================================
  // 4. DHT22 AMBIENT TEMPERATURE & HUMIDITY (GPIO 16 - Single-Bus)
  // =========================================================================
  if (thresholds.ambientTemp.enabled && reading.ambientTemp > thresholds.ambientTemp.max) {
    const diff = reading.ambientTemp - thresholds.ambientTemp.max;
    anomalies.push({
      id: `anom-dht-ambient-high-${reading.id}`,
      sensorKey: 'ambientTemp',
      sensorName: 'DHT22 Environmental Sensor',
      hardwarePin: 'GPIO 16',
      busType: 'Single-Bus Digital',
      errorCode: 'ERR_AMBIENT_HEATWAVE_LIMIT',
      severity: 'warning',
      title: 'Ambient Air Temperature Beyond Normal Limits',
      observedValue: `${reading.ambientTemp.toFixed(1)}°C`,
      expectedRange: `Max allowable ${thresholds.ambientTemp.max.toFixed(1)}°C`,
      deviation: `+${diff.toFixed(1)}°C over ambient threshold`,
      diagnosis:
        'Ambient surrounding air is excessively hot. Elevated ambient temp increases panel resistance and degrades power conversion efficiency by ~0.4%/°C.',
      recommendedHardwareFix:
        'Ensure DHT22 is sheltered from direct sun in a Stevenson radiation shield. Check ESP32 enclosure ambient airflow.',
    });
  } else if (thresholds.ambientTemp.enabled && reading.ambientTemp < thresholds.ambientTemp.min) {
    const diff = thresholds.ambientTemp.min - reading.ambientTemp;
    anomalies.push({
      id: `anom-dht-ambient-low-${reading.id}`,
      sensorKey: 'ambientTemp',
      sensorName: 'DHT22 Environmental Sensor',
      hardwarePin: 'GPIO 16',
      busType: 'Single-Bus Digital',
      errorCode: 'ERR_AMBIENT_FREEZING_LIMIT',
      severity: 'warning',
      title: 'Ambient Temperature Below Normal Range',
      observedValue: `${reading.ambientTemp.toFixed(1)}°C`,
      expectedRange: `Min allowable ${thresholds.ambientTemp.min.toFixed(1)}°C`,
      deviation: `-${diff.toFixed(1)}°C below ambient threshold`,
      diagnosis:
        'Ambient temperature is near or below freezing. Risk of frost and structural ice loading on array brackets.',
      recommendedHardwareFix:
        'Inspect module tilt angle and mountings to ensure snow/frost can slide off freely.',
    });
  }

  // Humidity check
  if (reading.humidity > 88.0) {
    anomalies.push({
      id: `anom-dht-hum-high-${reading.id}`,
      sensorKey: 'humidity',
      sensorName: 'DHT22 Environmental Sensor',
      hardwarePin: 'GPIO 16',
      busType: 'Single-Bus Digital',
      errorCode: 'ERR_HIGH_HUMIDITY_CONDENSATION_RISK',
      severity: 'warning',
      title: 'High Humidity / Condensation Ingress Risk',
      observedValue: `${reading.humidity.toFixed(1)}% RH`,
      expectedRange: '< 85.0% RH',
      deviation: `+${(reading.humidity - 85.0).toFixed(1)}% RH above safe dry envelope`,
      diagnosis:
        'Extreme ambient relative humidity detected. High risk of moisture condensation inside non-hermetic junction boxes or sensor enclosures.',
      recommendedHardwareFix:
        'Inspect silicone O-ring gasket on ESP32 junction enclosure. Check desiccant pack status inside node housing.',
    });
  }

  // =========================================================================
  // 5. LDR LIGHT SENSOR (GPIO 34 - ADC1 Channel 6)
  // =========================================================================
  const hour = new Date(reading.timestamp).getHours();
  // If it's midday (10:00 - 15:00) but LDR reads near zero lux (< 500 Lux)
  if (hour >= 10 && hour <= 15 && reading.lightIntensity < 800) {
    anomalies.push({
      id: `anom-ldr-obscured-${reading.id}`,
      sensorKey: 'lightIntensity',
      sensorName: 'LDR Light Intensity Sensor',
      hardwarePin: 'GPIO 34',
      busType: 'ADC1 Channel 6 (12-bit)',
      errorCode: 'ERR_LDR_SENSOR_OBSCURED_OR_FLOAT',
      severity: 'warning',
      title: 'LDR Irradiance Sensor Reading Dark at Midday',
      observedValue: `${reading.lightIntensity} Lux`,
      expectedRange: '> 25,000 Lux during peak solar hours',
      deviation: 'ADC raw value near zero or disconnected',
      diagnosis:
        'LDR photodiode/resistor channel is reading pitch dark during broad daylight. The sensor window may be covered by mud/leaves or the analog pull-down resistor circuit is open.',
      recommendedHardwareFix:
        'Wipe LDR acrylic dome clean. Verify ADC1 Channel 6 voltage on ESP32 GPIO 34 (expected 1.5V - 3.1V in sunlight).',
    });
  }

  return anomalies;
}
