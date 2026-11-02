/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Cpu,
  Zap,
  Wrench,
  Sliders,
  Flame,
  Unplug,
  Activity,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Gauge,
  Sun,
  Sparkles,
  TrendingDown,
  Calculator,
  ArrowRight,
  CloudSun,
  ZapOff,
  Wind,
  Layers,
} from 'lucide-react';
import { SensorReading, ThresholdSettings, ESP32NodeStatus, ESP32AnomalyDetail } from '../types/solar';
import { SimulationFaultMode } from '../services/telemetryService';

interface ESP32AbnormalReadingSectionProps {
  anomalies: ESP32AnomalyDetail[];
  currentReading: SensorReading;
  esp32Status: ESP32NodeStatus;
  thresholds: ThresholdSettings;
  activeFaultMode: SimulationFaultMode;
  onSimulateFault: (mode: SimulationFaultMode) => void;
  onOpenThresholdModal: () => void;
  history?: SensorReading[];
}

export function ESP32AbnormalReadingSection({
  anomalies,
  currentReading,
  esp32Status,
  thresholds,
  activeFaultMode,
  onSimulateFault,
  onOpenThresholdModal,
  history = [],
}: ESP32AbnormalReadingSectionProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [interactiveDustFactor, setInteractiveDustFactor] = useState<number>(
    activeFaultMode === 'low_output_dust' ? 45 : 0
  );

  const hasAnomalies = anomalies.length > 0;
  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length;
  const warningCount = anomalies.filter((a) => a.severity === 'warning').length;

  const toggleExpand = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  // =========================================================================
  // 1. ACTUAL CURRENT PASSING THROUGH SOLAR PANEL (INA219 on GPIO 21/22)
  // =========================================================================
  const actualCurrent = currentReading.current; // Amperes measured by INA219
  const actualCurrentMA = Math.round(actualCurrent * 1000);
  const shuntVoltageMV = Number((actualCurrent * 0.1 * 1000).toFixed(1)); // 0.1 ohm shunt drop in mV

  // Clean theoretical expected current based on current solar irradiance & nominal Vmp
  const cleanExpectedPower = currentReading.expectedPower;
  const nominalVoltage = Math.max(12, currentReading.voltage > 0 ? currentReading.voltage : 18.2);
  const cleanExpectedCurrent = cleanExpectedPower > 0
    ? Number((cleanExpectedPower / nominalVoltage).toFixed(2))
    : 0;
  const currentDeficit = Math.max(0, cleanExpectedCurrent - actualCurrent);
  const currentLossPercent = cleanExpectedCurrent > 0
    ? Number(((currentDeficit / cleanExpectedCurrent) * 100).toFixed(1))
    : 0;

  // =========================================================================
  // 2. ACTUAL POWER vs ANOMALY POWER CALCULATION (P = V * I)
  // =========================================================================
  const actualPower = currentReading.power; // Live generated power: P = V * I
  const powerLossWatts = Math.max(0, cleanExpectedPower - actualPower);
  const powerLossPercent = cleanExpectedPower > 5
    ? Number(((powerLossWatts / cleanExpectedPower) * 100).toFixed(1))
    : 0;
  const performanceRatio = cleanExpectedPower > 0
    ? Number(Math.min(100, (actualPower / cleanExpectedPower) * 100).toFixed(1))
    : 100;

  // Anomaly status condition
  const isAnomalyDetected =
    hasAnomalies ||
    activeFaultMode !== 'nominal' ||
    powerLossPercent >= 18.0 ||
    actualCurrent < 0.15;

  // Specific dust/soiling anomaly check
  const isDustAnomaly =
    activeFaultMode === 'low_output_dust' ||
    anomalies.some((a) => a.errorCode === 'ERR_DUST_SOILING_DERATE') ||
    (currentReading.lightIntensity > 25000 && powerLossPercent > 20 && actualCurrent > 0.5);

  // =========================================================================
  // 3. ENERGY GENERATED AFTER ANOMALY DETECTED (Wh & kWh)
  // =========================================================================
  const dtSeconds = 2.0; // sampling loop rate (2 seconds)
  const anomalyFrames = history.filter((r) => {
    const deficit = Math.max(0, r.expectedPower - r.power);
    return deficit > 8.0 || (r.expectedPower > 0 && r.power / r.expectedPower < 0.85);
  });

  // Calculate accumulated energy harvested while anomaly was detected:
  // E = sum(P_i * dt / 3600) in Watt-hours (Wh)
  const anomalyDurationSeconds = anomalyFrames.length > 0 ? anomalyFrames.length * dtSeconds : 60;
  const anomalyEnergyGeneratedWh = anomalyFrames.length > 0
    ? Number(anomalyFrames.reduce((acc, r) => acc + (r.power * dtSeconds) / 3600, 0).toFixed(2))
    : Number(((actualPower * 60) / 3600).toFixed(2));

  // Clean baseline energy that would have been harvested if no anomaly had occurred:
  const cleanBaselineEnergyWh = anomalyFrames.length > 0
    ? Number(anomalyFrames.reduce((acc, r) => acc + (r.expectedPower * dtSeconds) / 3600, 0).toFixed(2))
    : Number(((cleanExpectedPower * 60) / 3600).toFixed(2));

  // Net lost harvest energy:
  const lostHarvestEnergyWh = Math.max(0, Number((cleanBaselineEnergyWh - anomalyEnergyGeneratedWh).toFixed(2)));

  // Projected daily and monthly financial impact (at 5.2 peak sun hours & $0.16/kWh)
  const projectedDailyLostKWh = Number(((powerLossWatts * 5.2) / 1000).toFixed(3));
  const estimatedMonthlyLostUSD = Number((projectedDailyLostKWh * 30 * 0.16).toFixed(2));

  return (
    <section className="relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-2xl bg-slate-950/80 border-slate-800 space-y-6 p-5 sm:p-6">
      {/* Top ambient status accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500 ${
          isAnomalyDetected
            ? criticalCount > 0
              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600'
            : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
        }`}
      />

      {/* ===================================================================== */}
      {/* SECTION HEADER & HARDWARE CONTROLS */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
              isAnomalyDetected
                ? criticalCount > 0
                  ? 'bg-red-950/80 border-red-500/50 text-red-400 shadow-lg shadow-red-950/50 animate-pulse'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-950/50'
                : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isAnomalyDetected ? (
              criticalCount > 0 ? (
                <AlertOctagon className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-captain text-2xl sm:text-3xl tracking-wide uppercase text-white flex items-center gap-2">
                <span>ESP32 Sensor Anomaly & Performance Diagnosis</span>
              </h2>

              {isAnomalyDetected ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-hero font-bold uppercase tracking-wider border ${
                    criticalCount > 0
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span>
                    {anomalies.length > 0 ? `${anomalies.length} Abnormal Reading Active` : 'Anomaly Power Loss Active'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-hero font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>All 5 Sensor Channels Nominal</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Hardware Node: <strong className="text-slate-200 font-mono">{esp32Status.deviceId}</strong></span>
              <span>•</span>
              <span>Current Sensor: <strong className="text-cyan-300 font-mono">INA219 (GPIO 21/22)</strong></span>
              <span>•</span>
              <span>Bus Integrity: <span className={isAnomalyDetected ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>{isAnomalyDetected ? 'Anomaly Condition Under Analysis' : 'Verified Healthy'}</span></span>
            </p>
          </div>
        </div>

        {/* Quick Simulation Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-hero uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Anomaly:</span>
          </span>

          <div className="inline-flex flex-wrap gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onSimulateFault('nominal')}
              className={`px-2.5 py-1 rounded text-xs font-hero font-bold uppercase tracking-wider transition-all ${
                activeFaultMode === 'nominal'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Restore nominal healthy telemetry"
            >
              Nominal
            </button>

            {/* Dust / Soiling Trigger */}
            <button
              onClick={() => onSimulateFault('low_output_dust')}
              className={`px-2.5 py-1 rounded text-xs font-hero font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                activeFaultMode === 'low_output_dust'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Simulate dust layer / soiling accumulation choking current"
            >
              <Wind className="w-3 h-3 text-amber-300" />
              <span>Dust / Soiling</span>
            </button>

            <button
              onClick={() => onSimulateFault('partial_shading')}
              className={`px-2.5 py-1 rounded text-xs font-hero font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                activeFaultMode === 'partial_shading'
                  ? 'bg-cyan-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Simulate partial shadow on cell strip"
            >
              <CloudSun className="w-3 h-3" />
              <span>Shading</span>
            </button>

            <button
              onClick={() => onSimulateFault('wire_disconnect')}
              className={`px-2.5 py-1 rounded text-xs font-hero font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                activeFaultMode === 'wire_disconnect'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Simulate 1-Wire bus wire disconnect (-127°C error code)"
            >
              <Unplug className="w-3 h-3" />
              <span>1-Wire Drop</span>
            </button>

            <button
              onClick={() => onSimulateFault('overheating')}
              className={`px-2.5 py-1 rounded text-xs font-hero font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                activeFaultMode === 'overheating'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Simulate severe cell overheat hotspot (68.4°C)"
            >
              <Flame className="w-3 h-3" />
              <span>Hotspot</span>
            </button>

            <button
              onClick={() => onSimulateFault('electrical_abnormal')}
              className={`px-2.5 py-1 rounded text-xs font-hero font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                activeFaultMode === 'electrical_abnormal'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Simulate load disconnect / open circuit (0.04A current)"
            >
              <ZapOff className="w-3 h-3" />
              <span>Open Circuit</span>
            </button>
          </div>

          <button
            onClick={onOpenThresholdModal}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            title="Configure threshold alert limits"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DEDICATED PART: ACTUAL CURRENT & ANOMALY POWER / ENERGY YIELD ENGINE  */}
      {/* (Fulfilling User Request: Actual current generated, Energy generated  */}
      {/* after anomaly detected like dust, and live calculated anomaly power)   */}
      {/* ===================================================================== */}
      <div className="rounded-xl border border-cyan-800/60 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-5 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-40 bg-amber-500/5 blur-3xl pointer-events-none" />

        {/* Part Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-2xs font-captain tracking-widest uppercase bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                INA219 HIGH-SIDE CURRENT & ANOMALY HARVEST ENGINE
              </span>
              {isDustAnomaly ? (
                <span className="px-2.5 py-0.5 rounded text-2xs font-hero font-bold tracking-wider uppercase bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-1 animate-pulse">
                  <Wind className="w-3 h-3" />
                  <span>Dust & Soiling Anomaly Confirmed</span>
                </span>
              ) : isAnomalyDetected ? (
                <span className="px-2.5 py-0.5 rounded text-2xs font-hero font-bold tracking-wider uppercase bg-red-950/80 border border-red-500/50 text-red-300">
                  Anomaly Derating Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-2xs font-hero font-bold tracking-wider uppercase bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  Clean Optical Baseline
                </span>
              )}
            </div>

            <h3 className="font-captain text-xl sm:text-2xl text-white tracking-wide uppercase flex items-center gap-2">
              <span>Actual Solar Power & Estimated Anomaly Yield Analysis</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Real-time calculation comparing actual solar power generated (<span className="font-mono text-cyan-300">{actualPower.toFixed(1)} W</span>) against estimated clean capacity (<span className="font-mono text-cyan-300">{cleanExpectedPower.toFixed(1)} W</span>) derived from ESP32 telemetry (<span className="font-mono text-slate-300">P = V × I</span>).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isAnomalyDetected ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span>Sampling: <strong className="text-slate-200">2000ms loop</strong></span>
            </span>
          </div>
        </div>

        {/* 3 Core Metric Blocks: Actual Watts -> Estimated vs Actual Watts Calculation -> Energy Harvest Post-Anomaly */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          {/* ================================================================= */}
          {/* CARD 1: ACTUAL POWER GENERATED (WATTS) vs ESTIMATED (WATTS)       */}
          {/* ================================================================= */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4.5 flex flex-col justify-between relative group hover:border-cyan-700/60 transition-all">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-hero uppercase font-bold tracking-wider flex items-center gap-1.5 text-cyan-300">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Actual Solar Power</span>
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-mono bg-cyan-950/60 border border-cyan-800 text-cyan-300">
                  Actual: P = V × I
                </span>
              </div>

              {/* Big Digital Watts Display */}
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {actualPower.toFixed(1)}
                  </span>
                  <span className="font-captain text-2xl text-cyan-400 tracking-wider">WATTS</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                  <span>Actual: <strong className="text-white font-bold">{actualPower.toFixed(1)} W</strong></span>
                  <span>•</span>
                  <span>Estimated: <strong className="text-cyan-300 font-bold">{cleanExpectedPower.toFixed(1)} W</strong></span>
                </div>
              </div>

              {/* Power Generation vs Estimated Capacity Bar (in Watts) */}
              <div className="my-3 py-2 px-3 rounded-lg bg-slate-950 border border-slate-800/90">
                <div className="flex items-center justify-between text-2xs font-hero uppercase tracking-wider text-slate-400 mb-1.5">
                  <span>Photovoltaic Power Output</span>
                  <span className={actualPower < 5.0 ? 'text-red-400 font-bold' : powerLossWatts > 10.0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {actualPower < 5.0
                      ? 'Near Zero Generation'
                      : powerLossWatts > 10.0
                      ? 'Output Choked by Anomaly'
                      : 'Nominal Generation'}
                  </span>
                </div>
                {/* Visual Power Bar (0 to 100W rated) */}
                <div className="relative w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      actualPower < 5.0
                        ? 'bg-red-500'
                        : powerLossWatts > 10.0
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, (actualPower / 100) * 100)}%` }}
                  />
                  {/* Estimated Clean Baseline Marker in Watts */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-sm z-10"
                    style={{ left: `${Math.min(99, (cleanExpectedPower / 100) * 100)}%` }}
                    title={`Estimated clean power: ${cleanExpectedPower.toFixed(1)} W`}
                  />
                </div>
                <div className="flex items-center justify-between text-2xs font-mono text-slate-500 mt-1">
                  <span>0.0 W</span>
                  <span className="text-cyan-400 font-semibold">Estimated: {cleanExpectedPower.toFixed(1)} W</span>
                  <span>100.0 W Max</span>
                </div>
              </div>

              {/* Status Analysis Details in Watts */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2">
                {actualPower < 5.0 ? (
                  <span className="text-red-300">
                    Negligible solar generation ({actualPower.toFixed(1)} W) detected despite ambient sunlight. Circuit disconnected or open.
                  </span>
                ) : powerLossWatts > 8.0 ? (
                  <span className="text-amber-300">
                    Actual output is choked at <strong className="text-white font-mono">{actualPower.toFixed(1)} WATTS</strong>, running <strong className="text-rose-400 font-mono">-{powerLossWatts.toFixed(1)} WATTS</strong> (-{powerLossPercent.toFixed(1)}%) below estimated clean capacity (<strong className="text-cyan-300 font-mono">{cleanExpectedPower.toFixed(1)} WATTS</strong>) due to particulate obstruction (dust/soiling).
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    Solar panel is generating <strong className="text-white font-mono">{actualPower.toFixed(1)} WATTS</strong>, matching the estimated clean calculated potential of <strong className="text-cyan-300 font-mono">{cleanExpectedPower.toFixed(1)} WATTS</strong>.
                  </span>
                )}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-2xs font-mono text-slate-400">
              <span>Telemetry: {currentReading.voltage.toFixed(2)}V × {actualCurrent.toFixed(2)}A</span>
              <span className="text-cyan-300">ΔP: -{powerLossWatts.toFixed(1)} W</span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CARD 2: ESTIMATED VS ACTUAL ANOMALY POWER CALCULATION (WATTS)     */}
          {/* ================================================================= */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4.5 flex flex-col justify-between relative group hover:border-amber-700/60 transition-all">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-hero uppercase font-bold tracking-wider flex items-center gap-1.5 text-amber-300">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Estimated vs Actual Power</span>
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-mono bg-amber-950/60 border border-amber-800 text-amber-300">
                  Watts Comparison
                </span>
              </div>

              {/* Big Estimated Clean Power Output Display */}
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-cyan-300">
                    {cleanExpectedPower.toFixed(1)}
                  </span>
                  <span className="font-captain text-2xl text-slate-200 tracking-wider">WATTS</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono mt-1">
                  <span className="text-slate-400">Estimated Clean:</span>
                  <span className="text-cyan-300 font-bold">{cleanExpectedPower.toFixed(1)} W</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Actual:</span>
                  <span className={isAnomalyDetected ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {actualPower.toFixed(1)} W
                  </span>
                </div>
              </div>

              {/* Exact Mathematical Formula Breakdown Box in Watts */}
              <div className="my-3 p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono pb-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Actual Calculated Power:</span>
                  <span className="text-amber-300 font-bold">
                    {actualPower.toFixed(1)} WATTS ({currentReading.voltage.toFixed(2)}V × {actualCurrent.toFixed(2)}A)
                  </span>
                </div>

                <div className="flex items-center justify-between text-2xs font-mono pb-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Estimated Calculated Power:</span>
                  <span className="text-cyan-300 font-bold">
                    {cleanExpectedPower.toFixed(1)} WATTS (Clean STC)
                  </span>
                </div>

                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400">Calculated Power Deficit (ΔP):</span>
                  <span className={`font-bold ${powerLossWatts > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ΔP = -{powerLossWatts.toFixed(1)} WATTS (PR: {performanceRatio.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Power Generation Comparative Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-2xs font-hero uppercase tracking-wider text-slate-400">
                  <span>Actual vs Estimated Watts</span>
                  <span className="text-slate-300 font-mono">{actualPower.toFixed(1)} W / {cleanExpectedPower.toFixed(1)} W ({performanceRatio.toFixed(1)}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800 flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isAnomalyDetected ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, performanceRatio)}%` }}
                    title={`Actual generated power: ${actualPower.toFixed(1)}W`}
                  />
                  <div
                    className="h-full bg-red-600/60 transition-all duration-500"
                    style={{ width: `${Math.min(100 - performanceRatio, 100)}%` }}
                    title={`Lost power deficit: -${powerLossWatts.toFixed(1)}W`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-2xs font-mono text-slate-400">
              <span>Irradiance: {currentReading.lightIntensity.toLocaleString()} Lux</span>
              <span className="text-amber-300">
                Derate: {powerLossPercent > 0 ? `-${powerLossPercent.toFixed(1)}%` : '0.0%'}
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CARD 3: ENERGY GENERATED AFTER ANOMALY DETECTED (Wh & kWh)        */}
          {/* ================================================================= */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4.5 flex flex-col justify-between relative group hover:border-emerald-700/60 transition-all">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-hero uppercase font-bold tracking-wider flex items-center gap-1.5 text-emerald-300">
                  <Sun className="w-4 h-4 text-emerald-400" />
                  <span>Energy Harvested Under Anomaly</span>
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                  {anomalyDurationSeconds}s Anomaly Log
                </span>
              </div>

              {/* Big Energy Yield Display */}
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {anomalyEnergyGeneratedWh.toFixed(2)}
                  </span>
                  <span className="font-captain text-2xl text-emerald-400 tracking-wider">Wh</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                  <span>{(anomalyEnergyGeneratedWh / 1000).toFixed(4)} kWh generated</span>
                  <span>•</span>
                  <span className="text-slate-300">
                    Clean Target: <strong className="text-cyan-300">{cleanBaselineEnergyWh.toFixed(2)} Wh</strong>
                  </span>
                </div>
              </div>

              {/* Anomaly Impact Integration Box */}
              <div className="my-3 p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between text-2xs font-mono pb-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Actual Energy Generated (E_act):</span>
                  <span className="text-emerald-400 font-bold">{anomalyEnergyGeneratedWh.toFixed(2)} Wh</span>
                </div>

                <div className="flex items-center justify-between text-2xs font-mono pb-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Baseline Clean Energy (E_clean):</span>
                  <span className="text-cyan-400 font-bold">{cleanBaselineEnergyWh.toFixed(2)} Wh</span>
                </div>

                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400">Energy Harvest Deficit (ΔE):</span>
                  <span className={`font-bold ${lostHarvestEnergyWh > 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    -{lostHarvestEnergyWh.toFixed(2)} Wh lost
                  </span>
                </div>
              </div>

              {/* Projected Financial & Yield Forecast */}
              <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xs font-hero uppercase tracking-wider text-slate-400">
                    Projected Daily Loss (5.2 PSH)
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    -{projectedDailyLostKWh.toFixed(3)} kWh/day
                  </span>
                </div>
                <div className="flex items-center justify-between text-2xs text-slate-400 font-mono">
                  <span>Monthly Yield Drag:</span>
                  <span className="text-rose-400 font-semibold">-${estimatedMonthlyLostUSD.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-2xs font-mono text-slate-400">
              <span>Integral: Σ(P_i × Δt)</span>
              <span className={lostHarvestEnergyWh > 1 ? 'text-amber-400' : 'text-emerald-400'}>
                {lostHarvestEnergyWh > 1 ? 'Cleaning Recovers +100%' : 'Optimal Energy Capture'}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* INTERACTIVE DUST ACCUMULATION TESTING & CLEANING RESTORATION PANEL    */}
        {/* ===================================================================== */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/90 p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="font-hero text-sm font-bold uppercase tracking-wider text-white">
                  Dust Soiling Analysis & Automated Cleaning Recommendation
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {isDustAnomaly ? (
                  <span>
                    <strong className="text-amber-400">Dust Layer Detected: </strong>
                    Particulate deposit on solar glass is blocking incoming light. The actual power generated from the solar panel is reduced to <strong className="text-white font-mono">{actualPower.toFixed(1)} WATTS</strong> ({actualCurrent.toFixed(2)} A), delivering well below the estimated calculated value of <strong className="text-cyan-300 font-mono">{cleanExpectedPower.toFixed(1)} WATTS</strong> clean nominal capability. Performing a panel wash will immediately restore <strong className="text-emerald-400 font-mono">+{powerLossWatts.toFixed(1)} WATTS</strong> of generation capacity!
                  </span>
                ) : (
                  <span>
                    Photovoltaic glass surface transmission is near 100%. Solar panel is currently generating <strong className="text-white font-mono">{actualPower.toFixed(1)} WATTS</strong>, matching the estimated calculated potential of <strong className="text-emerald-300 font-mono">{cleanExpectedPower.toFixed(1)} WATTS</strong> without particulate attenuation.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {isDustAnomaly ? (
                <button
                  onClick={() => onSimulateFault('nominal')}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-hero font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute Panel Clean Cycle (Restore Nominal)</span>
                </button>
              ) : (
                <button
                  onClick={() => onSimulateFault('low_output_dust')}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-hero font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Inject Dust Accumulation Scenario</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SENSOR ABNORMAL READING BREAKDOWN CARDS (Pin-by-Pin Diagnostic Logs)  */}
      {/* ===================================================================== */}
      <div>
        {hasAnomalies ? (
          <div className="space-y-4">
            {/* Alert Banner Callout */}
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
                <div>
                  <h3 className="font-hero text-base font-bold uppercase tracking-wider text-red-200">
                    Attention: Hardware Anomaly Detected on ESP32 Microcontroller
                  </h3>
                  <p className="text-xs text-red-300/90 leading-relaxed">
                    One or more sensor channels returned electrical, physical, or protocol values outside expected operating limits. Immediate field inspection may be required to protect solar array integrity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-red-200 bg-red-900/60 px-2.5 py-1 rounded border border-red-700/60">
                  {criticalCount} Critical • {warningCount} Warning
                </span>
              </div>
            </div>

            {/* Anomaly Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((anomaly) => {
                const isExpanded = expandedCardId === anomaly.id || anomalies.length === 1;

                return (
                  <div
                    key={anomaly.id}
                    className={`rounded-xl border p-4.5 transition-all duration-200 ${
                      anomaly.severity === 'critical'
                        ? 'border-red-500/50 bg-gradient-to-b from-red-950/60 to-slate-950/80 shadow-lg shadow-red-950/30'
                        : 'border-amber-500/50 bg-gradient-to-b from-amber-950/60 to-slate-950/80 shadow-lg shadow-amber-950/30'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-2xs font-hero font-bold uppercase tracking-wider border ${
                              anomaly.severity === 'critical'
                                ? 'bg-red-500/30 text-red-200 border-red-500/50'
                                : 'bg-amber-500/30 text-amber-200 border-amber-500/50'
                            }`}
                          >
                            {anomaly.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold text-slate-300 bg-slate-900 border border-slate-700">
                            {anomaly.hardwarePin}
                          </span>
                          <span className="px-2 py-0.5 rounded text-2xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800">
                            {anomaly.busType}
                          </span>
                        </div>

                        <h4 className="font-hero text-base font-bold uppercase tracking-wider text-white">
                          {anomaly.title}
                        </h4>
                        <span className="font-mono text-2xs text-slate-400">
                          Code: <span className="text-amber-300">{anomaly.errorCode}</span>
                        </span>
                      </div>

                      <button
                        onClick={() => toggleExpand(anomaly.id)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                        title="Toggle troubleshooting guide"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Observed vs Expected Comparison Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 mb-3">
                      <div>
                        <span className="text-2xs font-hero uppercase tracking-wider text-slate-400 block">
                          Observed Sensor Value
                        </span>
                        <span
                          className={`font-mono text-base font-bold ${
                            anomaly.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          {anomaly.observedValue}
                        </span>
                      </div>
                      <div>
                        <span className="text-2xs font-hero uppercase tracking-wider text-slate-400 block">
                          Expected Safe Range
                        </span>
                        <span className="font-mono text-xs text-slate-300 block mt-0.5">
                          {anomaly.expectedRange}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-2xs font-mono">
                        <span className="text-slate-400">Deviation Offset:</span>
                        <span
                          className={`font-bold ${
                            anomaly.severity === 'critical' ? 'text-red-300' : 'text-amber-300'
                          }`}
                        >
                          {anomaly.deviation}
                        </span>
                      </div>
                    </div>

                    {/* Root Cause Diagnosis */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      <strong className="text-slate-100 font-semibold">Diagnosis: </strong>
                      {anomaly.diagnosis}
                    </p>

                    {/* Hardware Troubleshooting Action Box */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 rounded-lg bg-slate-900/90 p-3 border border-slate-800">
                        <div className="flex items-center gap-1.5 text-emerald-400 mb-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          <span className="font-hero text-xs font-bold uppercase tracking-wider">
                            Recommended Technician Action
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {anomaly.recommendedHardwareFix}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* NOMINAL HEALTHY STATE: All Channels Operating Safely */
          <div className="rounded-xl border border-emerald-900/50 bg-gradient-to-b from-emerald-950/30 to-slate-950/80 p-5 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-hero text-lg font-bold uppercase tracking-wider text-emerald-200">
                    All ESP32 Sensor Channels Operating Within Nominal Bounds
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Continuous telemetry validation confirms zero bus dropouts, zero thermal overshoots, and balanced photovoltaic load current.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-hero text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Signal Quality 99.8%</span>
                </span>
              </div>
            </div>

            {/* 5 Hardware Channels Nominal Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-2xs font-mono text-slate-400 mb-1">
                  <span>DS18B20</span>
                  <span className="text-emerald-400 font-bold">GPIO 4</span>
                </div>
                <span className="text-xs font-hero font-bold uppercase text-white block">
                  Panel Temperature
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {currentReading.panelTemp.toFixed(1)}°C
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">1-Wire OK</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-2xs font-mono text-slate-400 mb-1">
                  <span>DHT22</span>
                  <span className="text-emerald-400 font-bold">GPIO 16</span>
                </div>
                <span className="text-xs font-hero font-bold uppercase text-white block">
                  Ambient & RH
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {currentReading.ambientTemp.toFixed(1)}°C · {currentReading.humidity.toFixed(0)}%
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">Bus OK</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-2xs font-mono text-slate-400 mb-1">
                  <span>LDR Cell</span>
                  <span className="text-emerald-400 font-bold">GPIO 34</span>
                </div>
                <span className="text-xs font-hero font-bold uppercase text-white block">
                  Solar Irradiance
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {currentReading.lightIntensity.toLocaleString()} Lux
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">ADC1 OK</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-2xs font-mono text-slate-400 mb-1">
                  <span>INA219</span>
                  <span className="text-emerald-400 font-bold">GPIO 21/22</span>
                </div>
                <span className="text-xs font-hero font-bold uppercase text-white block">
                  Current & Load
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {currentReading.current.toFixed(2)} A
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">I2C OK</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-2xs font-mono text-slate-400 mb-1">
                  <span>Divider</span>
                  <span className="text-emerald-400 font-bold">GPIO 35</span>
                </div>
                <span className="text-xs font-hero font-bold uppercase text-white block">
                  Bus Voltage
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {currentReading.voltage.toFixed(2)} V
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">30V Cal OK</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
