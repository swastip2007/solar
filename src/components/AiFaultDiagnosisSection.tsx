/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Brain,
  AlertTriangle,
  Flame,
  CloudSun,
  AlertOctagon,
  ZapOff,
  CheckCircle,
  Wrench,
  Search,
  Cpu,
} from 'lucide-react';
import { DiagnosisReport, SensorReading, FaultType } from '../types/solar';
import { SimulationFaultMode } from '../services/telemetryService';

interface AiFaultDiagnosisSectionProps {
  diagnosis: DiagnosisReport;
  reading: SensorReading;
  onSimulateFault: (mode: SimulationFaultMode) => void;
  onRunDeepScan: () => void;
  isScanning: boolean;
}

export const AiFaultDiagnosisSection: React.FC<AiFaultDiagnosisSectionProps> = ({
  diagnosis,
  reading,
  onSimulateFault,
  onRunDeepScan,
  isScanning,
}) => {
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const toggleAction = (rec: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [rec]: !prev[rec],
    }));
  };

  const getFaultMeta = (type: FaultType) => {
    switch (type) {
      case 'overheating':
        return {
          icon: <Flame className="w-5 h-5 text-rose-400" />,
          categoryTitle: 'Thermal Overheating / Hotspot Risk',
          color: 'text-rose-400',
          borderColor: 'border-rose-900/60 bg-rose-950/20',
        };
      case 'partial_shading':
        return {
          icon: <CloudSun className="w-5 h-5 text-amber-400" />,
          categoryTitle: 'Partial Cell Obstruction / Shading',
          color: 'text-amber-400',
          borderColor: 'border-amber-900/60 bg-amber-950/20',
        };
      case 'low_output_dust':
        return {
          icon: <AlertOctagon className="w-5 h-5 text-amber-400" />,
          categoryTitle: 'Surface Soiling / Dust Layer / Low Output',
          color: 'text-amber-400',
          borderColor: 'border-amber-900/60 bg-amber-950/20',
        };
      case 'abnormal_electrical':
        return {
          icon: <ZapOff className="w-5 h-5 text-rose-400" />,
          categoryTitle: 'Abnormal Electrical / Open Circuit',
          color: 'text-rose-400',
          borderColor: 'border-rose-900/60 bg-rose-950/20',
        };
      default:
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
          categoryTitle: 'Optimal Nominal Conversion',
          color: 'text-emerald-400',
          borderColor: 'border-emerald-900/60 bg-emerald-950/20',
        };
    }
  };

  const currentMeta = getFaultMeta(diagnosis.faultType);

  return (
    <div className="space-y-5">
      {/* Top Banner & Scan Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-hero text-lg font-bold uppercase tracking-wider text-white">
              AI Automated Fault & Performance Diagnosis
            </h2>
            <p className="text-xs text-slate-400">
              Edge-correlated inference matching DS18B20, DHT22, LDR and electrical telemetry
            </p>
          </div>
        </div>

        {/* Deep Scan Trigger */}
        <button
          onClick={onRunDeepScan}
          disabled={isScanning}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-hero text-xs font-bold uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <Cpu className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Scanning Telemetry Buffer...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Run On-Demand AI Scan</span>
            </>
          )}
        </button>
      </div>

      {/* Main Active Diagnosis Card */}
      <div className={`rounded-xl border p-5 backdrop-blur-xl bg-slate-950/75 shadow-xl shadow-black/40 ${currentMeta.borderColor}`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 shrink-0 mt-0.5">
              {currentMeta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-hero text-xs uppercase tracking-wider text-slate-300 font-bold">
                  {currentMeta.categoryTitle}
                </span>
                <span className="text-slate-600">·</span>
                <span className="font-hero text-xs uppercase tracking-wider text-slate-400">
                  Confidence: <span className="text-white font-bold">{diagnosis.confidenceScore}%</span>
                </span>
              </div>
              <h3 className="font-hero text-xl lg:text-2xl font-bold uppercase tracking-wide text-white leading-tight">
                {diagnosis.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {diagnosis.summary}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge Cluster */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 text-xs font-mono shrink-0">
            <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
              <span className="font-hero text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Thermal ΔT</span>
              <span className="font-captain text-xl font-bold text-slate-200 tabular-nums tracking-wide">
                {diagnosis.detectedMetrics.panelTempDelta > 0 ? '+' : ''}
                {diagnosis.detectedMetrics.panelTempDelta}°C
              </span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
              <span className="font-hero text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Power Deficit</span>
              <span className={`font-captain text-xl font-bold tabular-nums tracking-wide ${diagnosis.detectedMetrics.powerLossPercent > 20 ? 'text-rose-400' : 'text-slate-200'}`}>
                {diagnosis.detectedMetrics.powerLossPercent}%
              </span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
              <span className="font-hero text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Irradiance</span>
              <span className="font-captain text-xl font-bold text-slate-200 tabular-nums tracking-wide">
                {diagnosis.detectedMetrics.luxLevel.toLocaleString()} <span className="font-hero text-xs text-slate-400">Lux</span>
              </span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
              <span className="font-hero text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Operating Voc</span>
              <span className="font-captain text-xl font-bold text-slate-200 tabular-nums tracking-wide">
                {reading.voltage.toFixed(1)} <span className="font-hero text-xs text-slate-400">V</span>
              </span>
            </div>
          </div>
        </div>

        {/* Root Cause & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {/* Root cause analysis */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Root Cause Analysis</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              {diagnosis.rootCause}
            </p>
          </div>

          {/* Actionable recommendations */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              <span>Field Technician Action Protocol</span>
            </div>
            <ul className="space-y-2">
              {diagnosis.recommendations.map((rec, index) => {
                const isChecked = !!completedActions[rec];
                return (
                  <li
                    key={index}
                    onClick={() => toggleAction(rec)}
                    className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors text-xs border ${
                      isChecked
                        ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300 line-through'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent li click
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="leading-snug">{rec}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* 4 Monitored Fault Signatures Reference Matrix */}
      <div>
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
          Monitored AI Fault Classification Matrix
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              mode: 'overheating' as SimulationFaultMode,
              title: 'Overheating & Thermal Hotspotting',
              sensors: 'DS18B20 + DHT22',
              symptom: 'Panel Temp > 60°C or ΔT > 25°C',
              mechanism: 'Elevated PV cell temperature drives down voltage (-0.38%/°C) and accelerates solder degradation.',
              icon: <Flame className="w-4 h-4 text-rose-400" />,
            },
            {
              mode: 'partial_shading' as SimulationFaultMode,
              title: 'Partial Cell Shading',
              sensors: 'LDR + INA219 Current',
              symptom: 'Lux > 35k with Current dropped > 40%',
              mechanism: 'Shaded cells reverse bias, dissipating current as heat and triggering bypass diode conduction.',
              icon: <CloudSun className="w-4 h-4 text-amber-400" />,
            },
            {
              mode: 'low_output_dust' as SimulationFaultMode,
              title: 'Surface Dust & Low Output',
              sensors: 'LDR + V × I Power',
              symptom: 'Power 15%–35% below expected STC curve',
              mechanism: 'Soiling layer scatters optical photons; uniform attenuation without thermal hotspotting.',
              icon: <AlertOctagon className="w-4 h-4 text-amber-400" />,
            },
            {
              mode: 'electrical_abnormal' as SimulationFaultMode,
              title: 'Abnormal Electrical / Open Circuit',
              sensors: 'INA219 Voltage + Current',
              symptom: 'High Voc (>19V) but Current near 0A',
              mechanism: 'Loose MC4 terminal crimp, blown inline fuse, or open charge controller bypass loop.',
              icon: <ZapOff className="w-4 h-4 text-rose-400" />,
            },
          ].map((item, idx) => {
            const isActive = diagnosis.faultType === item.mode;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                      {item.icon}
                    </div>
                    <button
                      onClick={() => onSimulateFault(item.mode)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title={`Simulate ${item.title}`}
                    >
                      Test Fault
                    </button>
                  </div>
                  <h4 className="text-xs font-semibold text-white mb-1">
                    {item.title}
                  </h4>
                  <div className="text-[11px] font-mono text-emerald-400/90 mb-1.5">
                    {item.sensors}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mb-2">
                    {item.symptom}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.mechanism}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
