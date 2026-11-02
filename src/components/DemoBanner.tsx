/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, RefreshCw, AlertOctagon, Flame, CloudSun, Sparkles, ZapOff } from 'lucide-react';
import { SimulationFaultMode } from '../services/telemetryService';

interface DemoBannerProps {
  isStreaming: boolean;
  onToggleStreaming: () => void;
  activeFaultMode: SimulationFaultMode;
  onSelectFaultMode: (mode: SimulationFaultMode) => void;
  samplingInterval: number;
  onSelectInterval: (interval: number) => void;
  onResetStream: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  isStreaming,
  onToggleStreaming,
  activeFaultMode,
  onSelectFaultMode,
  samplingInterval,
  onSelectInterval,
  onResetStream,
}) => {
  const faultModes: { id: SimulationFaultMode; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'nominal', label: 'Nominal Sun', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'emerald' },
    { id: 'wire_disconnect', label: '1-Wire Disconnect', icon: <AlertOctagon className="w-3.5 h-3.5" />, color: 'rose' },
    { id: 'overheating', label: 'Overheating (68°C)', icon: <Flame className="w-3.5 h-3.5" />, color: 'rose' },
    { id: 'partial_shading', label: 'Partial Shading', icon: <CloudSun className="w-3.5 h-3.5" />, color: 'amber' },
    { id: 'low_output_dust', label: 'Dust / Soiling', icon: <AlertOctagon className="w-3.5 h-3.5" />, color: 'amber' },
    { id: 'electrical_abnormal', label: 'Open Circuit Fault', icon: <ZapOff className="w-3.5 h-3.5" />, color: 'rose' },
  ];

  return (
    <div className="bg-slate-950/70 backdrop-blur-md border-b border-slate-800/60 px-4 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
        {/* Left: Clear DEMO DATA Badge and description */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-captain tracking-widest text-xs uppercase shadow-sm shadow-amber-500/10">
            DEMO DATA
          </span>
          <span className="text-slate-300 font-medium">
            Simulated ESP32 IoT Sensor Stream <span className="text-slate-500">·</span> DS18B20 + DHT22 + LDR + INA219
          </span>
          <span className="hidden sm:inline-flex items-center text-[11px] text-emerald-400 font-hero tracking-wider uppercase bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
            Grid Feed-In: Active
          </span>
        </div>

        {/* Right: Simulation Controls & Fault Scenario Injector */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {/* Fault mode selector pills */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            <span className="text-[11px] text-slate-400 px-2 font-hero uppercase tracking-wider font-bold hidden sm:inline">Scenario:</span>
            {faultModes.map((fm) => {
              const isSelected = activeFaultMode === fm.id;
              let selectedClass = 'bg-slate-800 text-slate-200';
              if (isSelected) {
                if (fm.color === 'emerald') selectedClass = 'bg-emerald-600/90 text-white font-bold shadow-sm';
                else if (fm.color === 'rose') selectedClass = 'bg-rose-600/90 text-white font-bold shadow-sm';
                else selectedClass = 'bg-amber-600/90 text-white font-bold shadow-sm';
              }

              return (
                <button
                  key={fm.id}
                  onClick={() => onSelectFaultMode(fm.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-hero text-xs tracking-wider uppercase transition-colors whitespace-nowrap ${
                    isSelected ? selectedClass : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
                  }`}
                  title={`Inject ${fm.label} scenario to test AI diagnosis`}
                >
                  {fm.icon}
                  <span>{fm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Stream controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Interval */}
            <select
              value={samplingInterval}
              onChange={(e) => onSelectInterval(Number(e.target.value))}
              aria-label="Sensor sampling frequency"
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-slate-700"
            >
              <option value={1}>1s Stream</option>
              <option value={2}>2s Stream</option>
              <option value={5}>5s Stream</option>
            </select>

            {/* Pause / Play */}
            <button
              onClick={onToggleStreaming}
              className={`p-1.5 rounded border transition-colors ${
                isStreaming
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
              }`}
              title={isStreaming ? 'Pause Sensor Stream' : 'Resume Sensor Stream'}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Reset */}
            <button
              onClick={onResetStream}
              className="p-1.5 rounded border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset telemetry baseline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
