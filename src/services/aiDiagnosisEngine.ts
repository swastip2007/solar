/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorReading, DiagnosisReport, FaultType, HealthSeverity } from '../types/solar';

/**
 * Standard Photovoltaic Evaluation Baseline:
 * Standard Test Condition (STC): 1000 W/m² irradiance (~100,000 Lux), 25°C cell temp.
 * Nominal 100W module baseline: Voc = 21.6V, Vmp = 18.2V, Isc = 5.8A, Imp = 5.5A.
 * Temperature coefficient of Pmax: gamma = -0.38%/°C.
 */
export function calculateTheoreticalExpectedPower(lightIntensityLux: number, panelTemp: number): number {
  // Irradiance ratio relative to full sun (approx 90,000 Lux = ~900 W/m²)
  const normalizedSunRatio = Math.max(0, Math.min(1.2, lightIntensityLux / 85000));
  const baseRatedPowerWatts = 100; // 100W rated testing panel module
  
  // Temperature derating: -0.38% per degree above 25°C
  const tempDeltaFromSTC = Math.max(0, panelTemp - 25);
  const tempDeratingFactor = 1 - (tempDeltaFromSTC * 0.0038);
  
  const expectedWatts = baseRatedPowerWatts * normalizedSunRatio * Math.max(0.65, tempDeratingFactor);
  return Number(Math.max(0, expectedWatts).toFixed(1));
}

export function diagnoseSolarPanelHealth(reading: SensorReading): DiagnosisReport {
  const { panelTemp, ambientTemp, lightIntensity, voltage, current, power, expectedPower } = reading;
  const tempDelta = Number((panelTemp - ambientTemp).toFixed(1));
  const powerShortfallWatts = expectedPower > 0 ? expectedPower - power : 0;
  const powerLossPercent = expectedPower > 5 
    ? Math.max(0, Math.min(100, Number(((powerShortfallWatts / expectedPower) * 100).toFixed(1))))
    : 0;

  // 1. Critical Electrical Fault / Abnormal Circuit
  if (voltage > 14 && current < 0.15 && lightIntensity > 20000) {
    return {
      id: `diag-${reading.timestamp}`,
      timestamp: reading.timestamp,
      severity: 'critical',
      faultType: 'abnormal_electrical',
      title: 'Open Circuit or Load Disconnect Detected',
      summary: 'Panel maintains open-circuit voltage but delivers negligible current under adequate solar irradiance.',
      rootCause: 'Likely open load circuit, disconnected MC4 cable, blown inline fuse, or charge controller open loop.',
      detectedMetrics: {
        panelTempDelta: tempDelta,
        powerLossPercent: 95.0,
        luxLevel: lightIntensity,
        voltageStability: 'Floating High Voc with Zero Amperage',
      },
      recommendations: [
        'Inspect MC4 terminal connectors for loose crimping or weather oxidation.',
        'Check ESP32 INA219 current shunt resistor wiring and circuit continuity.',
        'Verify solar charge controller / battery load switch is closed.',
      ],
      confidenceScore: 98,
    };
  }

  // 2. Severe Overheating / Hotspot Risk
  if (panelTemp >= 62 || (tempDelta >= 28 && panelTemp > 50)) {
    const isCritical = panelTemp >= 68 || tempDelta >= 33;
    const severity: HealthSeverity = isCritical ? 'critical' : 'warning';
    return {
      id: `diag-${reading.timestamp}`,
      timestamp: reading.timestamp,
      severity,
      faultType: 'overheating',
      title: isCritical ? 'Critical Thermal Hotspot & Overheating' : 'Elevated Cell Temperature Warning',
      summary: `Panel temperature has escalated to ${panelTemp}°C (${tempDelta}°C above ambient ${ambientTemp}°C). Significant PV silicon efficiency degradation underway.`,
      rootCause: 'Restricted rear ventilation, thermal hotspot from cracked cell, or localized bypass diode reverse dissipation.',
      detectedMetrics: {
        panelTempDelta: tempDelta,
        powerLossPercent,
        luxLevel: lightIntensity,
        voltageStability: `Voltage depressed by ~${(tempDelta * 0.08).toFixed(1)}V due to negative temp coefficient`,
      },
      recommendations: [
        'Inspect rear panel clearance; ensure minimum 10cm airflow gap behind mounting frame.',
        'Perform infrared thermography inspection for localized cell hotspotting.',
        'Verify bypass diodes inside junction box are not operating in reverse breakdown mode.',
      ],
      confidenceScore: 94,
    };
  }

  // 3. Partial Shading Anomaly
  // Condition: High ambient illumination detected by LDR / DHT22, but current is sharply suppressed while voltage is moderate
  if (lightIntensity >= 32000 && powerLossPercent >= 38 && panelTemp < 58) {
    const severity: HealthSeverity = powerLossPercent >= 60 ? 'critical' : 'warning';
    return {
      id: `diag-${reading.timestamp}`,
      timestamp: reading.timestamp,
      severity,
      faultType: 'partial_shading',
      title: 'Partial Cell Shading or Obstruction Detected',
      summary: `Solar irradiance is substantial (${lightIntensity.toLocaleString()} Lux), but power generation is suppressed by ${powerLossPercent}% against theoretical output.`,
      rootCause: 'Physical obstruction over solar module sub-strings (e.g. overhanging branch, utility pole shadow, or leaf/debris accumulation).',
      detectedMetrics: {
        panelTempDelta: tempDelta,
        powerLossPercent,
        luxLevel: lightIntensity,
        voltageStability: 'Voltage intact; current bottlenecked across shaded bypass group',
      },
      recommendations: [
        'Examine panel surface for fallen foliage, bird soiling, or external shadow lines.',
        'Check if bypass diodes are successfully bypassing shaded sub-strings without localized heating.',
        'Trim surrounding vegetation obstructing direct solar azimuth angles.',
      ],
      confidenceScore: 92,
    };
  }

  // 4. Low Output / Surface Dust & Soiling
  // Condition: Moderate power shortfall (15% to 35%) with normal temperature delta
  if (powerLossPercent >= 16 && powerLossPercent < 38 && lightIntensity > 15000) {
    return {
      id: `diag-${reading.timestamp}`,
      timestamp: reading.timestamp,
      severity: 'warning',
      faultType: 'low_output_dust',
      title: 'Surface Soiling & Low Output Attenuation',
      summary: `Panel is delivering ${power}W against an expected ${expectedPower}W (${powerLossPercent}% output deficit). Thermal margins are healthy.`,
      rootCause: 'Atmospheric particulate/dust layer, pollen deposition, or anti-reflective coating transmittance loss reducing optical photon reception.',
      detectedMetrics: {
        panelTempDelta: tempDelta,
        powerLossPercent,
        luxLevel: lightIntensity,
        voltageStability: 'Uniform proportional drop in both voltage and current',
      },
      recommendations: [
        'Schedule demineralized water surface washing during early morning or sunset.',
        'Inspect protective tempered glass for micro-abrasions or yellowing polymer film.',
        'Verify LDR optical sensor window is cleaned and calibrated to ambient sunlight.',
      ],
      confidenceScore: 88,
    };
  }

  // 5. Nominal Condition
  return {
    id: `diag-${reading.timestamp}`,
    timestamp: reading.timestamp,
    severity: 'normal',
    faultType: 'none',
    title: 'Optimal Nominal Performance',
    summary: `Solar module is operating within standard parameters (${power}W output, ${reading.efficiency}% system conversion efficiency).`,
    rootCause: 'None. I-V curve conforms closely to irradiance and ambient temperature expectations.',
    detectedMetrics: {
      panelTempDelta: tempDelta,
      powerLossPercent: Math.max(0, powerLossPercent),
      luxLevel: lightIntensity,
      voltageStability: 'Stable nominal MPPT voltage',
    },
    recommendations: [
      'No corrective action required. Routine ESP32 telemetry streaming active.',
      'Maintain periodic weekly check of DS18B20 thermal contact gel.',
    ],
    confidenceScore: 97,
  };
}
