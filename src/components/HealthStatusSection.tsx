/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { HealthSeverity, SensorReading, DiagnosisReport } from '../types/solar';

interface HealthStatusSectionProps {
  reading: SensorReading;
  diagnosis: DiagnosisReport;
}

export const HealthStatusSection: React.FC<HealthStatusSectionProps> = ({ reading, diagnosis }) => {
  const severity = diagnosis.severity;

  // Calculate Health Score (0 - 100)
  let healthScore = 98;
  if (severity === 'critical') {
    healthScore = Math.max(25, 45 - Math.round(diagnosis.detectedMetrics.powerLossPercent / 2));
  } else if (severity === 'warning') {
    healthScore = Math.max(60, 85 - Math.round(diagnosis.detectedMetrics.powerLossPercent / 3));
  }

  const getStatusBadge = () => {
    switch (severity) {
      case 'critical':
        return {
          label: 'CRITICAL FAULT DETECTED',
          desc: 'Immediate technician inspection required to avert hardware damage or severe power loss.',
          badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
          ringColor: 'stroke-rose-500',
        };
      case 'warning':
        return {
          label: 'OPERATIONAL WARNING',
          desc: 'System operating under suboptimal conditions with reduced efficiency or elevated temperatures.',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          ringColor: 'stroke-amber-500',
        };
      default:
        return {
          label: 'NORMAL OPERATION',
          desc: 'All photovoltaic cells and ESP32 telemetry sensors operating within nominal parameters.',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          ringColor: 'stroke-emerald-500',
        };
    }
  };

  const statusMeta = getStatusBadge();

  // Metrics indicators
  const indicators: {
    label: string;
    value: string;
    status: HealthSeverity;
    detail: string;
  }[] = [
    {
      label: 'Thermal Margin',
      value: `${(75 - reading.panelTemp).toFixed(1)}°C head`,
      status: reading.panelTemp >= 62 ? 'critical' : reading.panelTemp >= 48 ? 'warning' : 'normal',
      detail: `Panel ${reading.panelTemp}°C (Safe limit: < 75°C)`,
    },
    {
      label: 'Yield Ratio to STC',
      value: `${reading.expectedPower > 0 ? Math.round((reading.power / reading.expectedPower) * 100) : 0}%`,
      status:
        reading.expectedPower > 10 && reading.power < reading.expectedPower * 0.5
          ? 'critical'
          : reading.expectedPower > 10 && reading.power < reading.expectedPower * 0.75
          ? 'warning'
          : 'normal',
      detail: `${reading.power}W actual vs ${reading.expectedPower}W STC`,
    },
    {
      label: 'MPPT Voltage Conformance',
      value: `${reading.voltage.toFixed(1)} V`,
      status: reading.voltage < 12 || reading.voltage > 22.5 ? 'critical' : reading.voltage < 15 ? 'warning' : 'normal',
      detail: 'Nominal Vmp design window: 17.5V – 19.5V',
    },
    {
      label: 'Circuit Continuity',
      value: reading.current < 0.1 && reading.lightIntensity > 20000 ? 'Open Circuit' : 'Closed Loop',
      status: reading.current < 0.1 && reading.lightIntensity > 20000 ? 'critical' : 'normal',
      detail: `${reading.current.toFixed(2)}A active loop current`,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/75 p-5 backdrop-blur-xl shadow-xl shadow-black/40">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
            {statusMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-hero text-xl font-bold uppercase tracking-wider text-white">
                Solar Array Health & Operability
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded font-hero text-xs font-bold uppercase tracking-widest border ${statusMeta.badgeClass}`}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {statusMeta.desc}
            </p>
          </div>
        </div>

        {/* Health Score Circular / Gauge */}
        <div className="flex items-center gap-3 self-end md:self-auto bg-slate-950/70 px-3.5 py-2 rounded-lg border border-slate-800">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest font-hero font-bold block">
              Health Index
            </span>
            <span className="text-2xl font-bold font-captain text-white tabular-nums tracking-wide">
              {healthScore}
              <span className="text-sm text-slate-500 font-normal font-sans ml-0.5">/100</span>
            </span>
          </div>

          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-slate-800"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${statusMeta.ringColor} transition-all duration-700`}
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-captain text-sm font-bold text-slate-200">
              {healthScore}%
            </span>
          </div>
        </div>
      </div>

      {/* 4 Health Criteria Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {indicators.map((ind, idx) => {
          let badgeBorder = 'border-slate-800';
          let textColor = 'text-emerald-400';
          let statusText = 'Normal';

          if (ind.status === 'critical') {
            badgeBorder = 'border-rose-900/50 bg-rose-950/20';
            textColor = 'text-rose-400';
            statusText = 'Critical';
          } else if (ind.status === 'warning') {
            badgeBorder = 'border-amber-900/50 bg-amber-950/20';
            textColor = 'text-amber-400';
            statusText = 'Warning';
          }

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border bg-slate-950/40 flex flex-col justify-between ${badgeBorder}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-hero text-xs uppercase tracking-wide text-slate-300 font-bold">
                  {ind.label}
                </span>
                <span
                  className={`font-hero text-[11px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                    ind.status === 'critical'
                      ? 'bg-rose-950 text-rose-300'
                      : ind.status === 'warning'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {statusText}
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className={`text-2xl font-bold font-captain tracking-wide tabular-nums ${textColor}`}>
                  {ind.value}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {ind.detail}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
