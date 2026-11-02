/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorReading, ThresholdSettings, ThresholdAlertEvent, DEFAULT_THRESHOLDS } from '../types/solar';

const STORAGE_KEY = 'helios_threshold_settings_v1';

export function loadThresholdSettings(): ThresholdSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_THRESHOLDS,
      ...parsed,
      voltage: { ...DEFAULT_THRESHOLDS.voltage, ...(parsed.voltage || {}) },
      panelTemp: { ...DEFAULT_THRESHOLDS.panelTemp, ...(parsed.panelTemp || {}) },
      ambientTemp: { ...DEFAULT_THRESHOLDS.ambientTemp, ...(parsed.ambientTemp || {}) },
    };
  } catch (e) {
    return DEFAULT_THRESHOLDS;
  }
}

export function saveThresholdSettings(settings: ThresholdSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save threshold settings', e);
  }
}

// Evaluate sensor reading against user thresholds
export function evaluateThresholdBreaches(
  reading: SensorReading,
  thresholds: ThresholdSettings
): ThresholdAlertEvent[] {
  const breaches: ThresholdAlertEvent[] = [];
  const timeLabel = reading.timeLabel;
  const timestamp = reading.timestamp;

  // 1. Voltage Check
  if (thresholds.voltage.enabled) {
    if (reading.voltage < thresholds.voltage.min) {
      breaches.push({
        id: `alert-v-min-${timestamp}`,
        timestamp,
        timeLabel,
        metric: 'voltage',
        label: 'Solar Panel Voltage Under-Voltage',
        currentValue: reading.voltage,
        breachType: 'below_min',
        thresholdValue: thresholds.voltage.min,
        unit: 'V',
        severity: reading.voltage < thresholds.voltage.min - 3 ? 'critical' : 'warning',
        acknowledged: false,
      });
    } else if (reading.voltage > thresholds.voltage.max) {
      breaches.push({
        id: `alert-v-max-${timestamp}`,
        timestamp,
        timeLabel,
        metric: 'voltage',
        label: 'Solar Panel Voltage Over-Voltage',
        currentValue: reading.voltage,
        breachType: 'above_max',
        thresholdValue: thresholds.voltage.max,
        unit: 'V',
        severity: reading.voltage > thresholds.voltage.max + 2 ? 'critical' : 'warning',
        acknowledged: false,
      });
    }
  }

  // 2. Panel Temperature Check (DS18B20)
  if (thresholds.panelTemp.enabled) {
    if (reading.panelTemp > thresholds.panelTemp.max) {
      breaches.push({
        id: `alert-pt-max-${timestamp}`,
        timestamp,
        timeLabel,
        metric: 'panelTemp',
        label: 'Solar Panel High Temperature Limit Exceeded',
        currentValue: reading.panelTemp,
        breachType: 'above_max',
        thresholdValue: thresholds.panelTemp.max,
        unit: '°C',
        severity: reading.panelTemp > thresholds.panelTemp.max + 6 ? 'critical' : 'warning',
        acknowledged: false,
      });
    } else if (reading.panelTemp < thresholds.panelTemp.min) {
      breaches.push({
        id: `alert-pt-min-${timestamp}`,
        timestamp,
        timeLabel,
        metric: 'panelTemp',
        label: 'Solar Panel Low Temperature Freeze Advisory',
        currentValue: reading.panelTemp,
        breachType: 'below_min',
        thresholdValue: thresholds.panelTemp.min,
        unit: '°C',
        severity: 'warning',
        acknowledged: false,
      });
    }
  }

  // 3. Ambient Temperature Check (DHT22)
  if (thresholds.ambientTemp.enabled) {
    if (reading.ambientTemp > thresholds.ambientTemp.max) {
      breaches.push({
        id: `alert-at-max-${timestamp}`,
        timestamp,
        timeLabel,
        metric: 'ambientTemp',
        label: 'Ambient Environmental Heat Threshold Exceeded',
        currentValue: reading.ambientTemp,
        breachType: 'above_max',
        thresholdValue: thresholds.ambientTemp.max,
        unit: '°C',
        severity: 'warning',
        acknowledged: false,
      });
    } else if (reading.ambientTemp < thresholds.ambientTemp.min) {
      breaches.push({
        id: `alert-at-min-${timestamp}`,
        timestamp,
        timeLabel,
        metric: 'ambientTemp',
        label: 'Ambient Environmental Low Temperature Warning',
        currentValue: reading.ambientTemp,
        breachType: 'below_min',
        thresholdValue: thresholds.ambientTemp.min,
        unit: '°C',
        severity: 'warning',
        acknowledged: false,
      });
    }
  }

  return breaches;
}

// Gentle audio alert using Web Audio API synthesis
export function playAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    // Ignore audio permission or context restrictions
  }
}
