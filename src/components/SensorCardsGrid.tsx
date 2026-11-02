/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Thermometer,
  CloudSun,
  Droplets,
  SunMedium,
  Zap,
  Activity,
  Gauge,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { SensorReading, ThresholdSettings } from '../types/solar';
import { Sliders } from 'lucide-react';

interface SensorCardsGridProps {
  reading: SensorReading;
  previousReading?: SensorReading;
  thresholds?: ThresholdSettings;
  onOpenThresholdModal?: () => void;
}

export const SensorCardsGrid: React.FC<SensorCardsGridProps> = ({
  reading,
  previousReading,
  thresholds,
  onOpenThresholdModal,
}) => {
  // Helper to calculate trend
  const getTrend = (current: number, prev: number | undefined) => {
    if (prev === undefined) return null;
    const diff = current - prev;
    if (Math.abs(diff) < 0.05) return 'flat';
    return diff > 0 ? 'up' : 'down';
  };

  const tempDelta = Number((reading.panelTemp - reading.ambientTemp).toFixed(1));
  const estimatedIrradianceWM2 = Math.round(reading.lightIntensity / 105);

  // Check custom user threshold breaches
  const isVoltageBreached =
    !!thresholds?.voltage.enabled &&
    (reading.voltage < thresholds.voltage.min || reading.voltage > thresholds.voltage.max);

  const isPanelTempBreached =
    !!thresholds?.panelTemp.enabled &&
    (reading.panelTemp < thresholds.panelTemp.min || reading.panelTemp > thresholds.panelTemp.max);

  const isAmbientTempBreached =
    !!thresholds?.ambientTemp.enabled &&
    (reading.ambientTemp < thresholds.ambientTemp.min || reading.ambientTemp > thresholds.ambientTemp.max);

  const cards = [
    {
      id: 'panel_temp',
      title: 'Panel Temperature',
      sensorTag: 'DS18B20 · 1-Wire GPIO 4',
      value: reading.panelTemp.toFixed(1),
      unit: '°C',
      trend: getTrend(reading.panelTemp, previousReading?.panelTemp),
      icon: <Thermometer className={`w-4 h-4 ${isPanelTempBreached ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />,
      subtext: `Δ ${tempDelta > 0 ? '+' : ''}${tempDelta}°C over ambient`,
      status: isPanelTempBreached
        ? 'critical'
        : reading.panelTemp > 60
        ? 'critical'
        : reading.panelTemp > 48
        ? 'warning'
        : 'nominal',
      barPercent: Math.min(100, Math.max(0, ((reading.panelTemp - 15) / 65) * 100)),
      barColor: isPanelTempBreached
        ? 'bg-rose-500'
        : reading.panelTemp > 60
        ? 'bg-rose-500'
        : reading.panelTemp > 48
        ? 'bg-amber-500'
        : 'bg-emerald-500',
      isBreached: isPanelTempBreached,
      thresholdBadge: thresholds?.panelTemp.enabled
        ? `${thresholds.panelTemp.min}°C – ${thresholds.panelTemp.max}°C`
        : null,
    },
    {
      id: 'ambient_temp',
      title: 'Ambient Temperature',
      sensorTag: 'DHT22 · GPIO 15',
      value: reading.ambientTemp.toFixed(1),
      unit: '°C',
      trend: getTrend(reading.ambientTemp, previousReading?.ambientTemp),
      icon: <CloudSun className="w-4 h-4 text-sky-400" />,
      subtext: 'Local environmental weather',
      status: isAmbientTempBreached ? 'warning' : 'nominal',
      barPercent: Math.min(100, Math.max(0, ((reading.ambientTemp - 10) / 35) * 100)),
      barColor: isAmbientTempBreached ? 'bg-amber-500' : 'bg-sky-500',
      isBreached: isAmbientTempBreached,
      thresholdBadge: thresholds?.ambientTemp.enabled
        ? `${thresholds.ambientTemp.min}°C – ${thresholds.ambientTemp.max}°C`
        : null,
    },
    {
      id: 'humidity',
      title: 'Relative Humidity',
      sensorTag: 'DHT22 · GPIO 15',
      value: reading.humidity.toFixed(1),
      unit: '% RH',
      trend: getTrend(reading.humidity, previousReading?.humidity),
      icon: <Droplets className="w-4 h-4 text-cyan-400" />,
      subtext: reading.humidity > 80 ? 'Condensation risk high' : 'Nominal ambient humidity',
      status: reading.humidity > 85 ? 'warning' : 'nominal',
      barPercent: reading.humidity,
      barColor: 'bg-cyan-500',
      isBreached: false,
      thresholdBadge: null,
    },
    {
      id: 'light_intensity',
      title: 'Light Intensity',
      sensorTag: 'LDR · ADC1 CH6',
      value: reading.lightIntensity.toLocaleString(),
      unit: 'Lux',
      trend: getTrend(reading.lightIntensity, previousReading?.lightIntensity),
      icon: <SunMedium className="w-4 h-4 text-amber-400" />,
      subtext: `~${estimatedIrradianceWM2} W/m² solar irradiance`,
      status: reading.lightIntensity < 15000 ? 'warning' : 'nominal',
      barPercent: Math.min(100, Math.max(0, (reading.lightIntensity / 90000) * 100)),
      barColor: 'bg-amber-500',
      isBreached: false,
      thresholdBadge: null,
    },
    {
      id: 'voltage',
      title: 'Solar Panel Voltage',
      sensorTag: 'Calibrated Divider · GPIO 35',
      value: reading.voltage.toFixed(2),
      unit: 'V',
      trend: getTrend(reading.voltage, previousReading?.voltage),
      icon: <Zap className={`w-4 h-4 ${isVoltageBreached ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`} />,
      subtext: 'Nominal Vmp target: 18.2V (Voc 21.6V)',
      status: isVoltageBreached
        ? 'critical'
        : reading.voltage < 12
        ? 'critical'
        : reading.voltage < 15
        ? 'warning'
        : 'nominal',
      barPercent: Math.min(100, Math.max(0, (reading.voltage / 24) * 100)),
      barColor: isVoltageBreached ? 'bg-rose-500' : 'bg-blue-500',
      isBreached: isVoltageBreached,
      thresholdBadge: thresholds?.voltage.enabled
        ? `${thresholds.voltage.min}V – ${thresholds.voltage.max}V`
        : null,
    },
    {
      id: 'current',
      title: 'Solar Panel Current',
      sensorTag: 'INA219 Shunt · I2C Bus',
      value: reading.current.toFixed(2),
      unit: 'A',
      trend: getTrend(reading.current, previousReading?.current),
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      subtext: 'Nominal Imp target: 4.8A (Isc 5.5A)',
      status: reading.current < 0.2 ? 'critical' : reading.current < 1.5 ? 'warning' : 'nominal',
      barPercent: Math.min(100, Math.max(0, (reading.current / 5.8) * 100)),
      barColor: 'bg-emerald-500',
      isBreached: false,
      thresholdBadge: null,
    },
    {
      id: 'power',
      title: 'Calculated Power',
      sensorTag: 'Real-time (V × I)',
      value: reading.power.toFixed(1),
      unit: 'W',
      trend: getTrend(reading.power, previousReading?.power),
      icon: <Gauge className="w-4 h-4 text-teal-300" />,
      subtext: `Expected: ${reading.expectedPower.toFixed(1)}W (STC reference)`,
      status: reading.power < 5 ? 'critical' : reading.power < reading.expectedPower * 0.7 ? 'warning' : 'nominal',
      barPercent: Math.min(100, Math.max(0, (reading.power / 100) * 100)),
      barColor: 'bg-teal-400',
      isPrimaryMetric: true,
      isBreached: false,
      thresholdBadge: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        return (
          <div
            key={card.id}
            className={`relative rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${
              card.isBreached
                ? 'border-rose-500 bg-rose-950/40 ring-2 ring-rose-500/40 shadow-xl shadow-rose-950/40 animate-pulse'
                : card.isPrimaryMetric
                ? 'border-emerald-500/50 bg-gradient-to-b from-slate-950/85 to-emerald-950/30 sm:col-span-2 lg:col-span-1 xl:col-span-1 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/20 backdrop-blur-xl'
                : 'border-slate-800/80 bg-slate-950/75 backdrop-blur-xl shadow-lg shadow-black/40 hover:border-slate-700/80 hover:bg-slate-950/85'
            }`}
          >
            {/* Top row: Sensor Tag & Icon */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono text-slate-400 truncate">
                {card.sensorTag}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
                {card.icon}
              </div>
            </div>

            {/* Title */}
            <h3 className="font-hero text-sm font-bold uppercase tracking-wider text-slate-200 mb-1">
              {card.title}
            </h3>

            {/* Reading Value */}
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-3xl lg:text-4xl font-captain font-bold tabular-nums text-white tracking-wide leading-none">
                {card.value}
              </span>
              <span className="font-hero text-sm font-bold uppercase tracking-wider text-slate-400">
                {card.unit}
              </span>

              {/* Trend indicator */}
              {card.trend && (
                <span className="ml-auto flex items-center text-xs font-hero tracking-wider">
                  {card.trend === 'up' && (
                    <span className="text-emerald-400 flex items-center font-bold">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +
                    </span>
                  )}
                  {card.trend === 'down' && (
                    <span className="text-rose-400 flex items-center font-bold">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Progress / Range Meter */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden my-2.5">
              <div
                className={`h-full ${card.barColor} transition-all duration-500`}
                style={{ width: `${card.barPercent}%` }}
              />
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="truncate">{card.subtext}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {card.isBreached && (
                  <span className="font-hero text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                    Out Of Bounds
                  </span>
                )}
                <span
                  className={`font-hero text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    card.status === 'critical'
                      ? 'text-rose-400 bg-rose-950/60'
                      : card.status === 'warning'
                      ? 'text-amber-400 bg-amber-950/60'
                      : 'text-emerald-400 bg-emerald-950/60'
                  }`}
                >
                  {card.status}
                </span>
              </div>
            </div>

            {/* Configured Threshold Limits Indicator */}
            {card.thresholdBadge && (
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Threshold:</span>
                <button
                  onClick={onOpenThresholdModal}
                  title="Configure custom min/max threshold"
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                    card.isBreached
                      ? 'text-rose-300 bg-rose-950/80 border border-rose-800 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Sliders className="w-2.5 h-2.5 text-amber-400" />
                  <span>{card.thresholdBadge}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
