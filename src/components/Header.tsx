/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Wifi, Cpu, AlertTriangle, ShieldCheck, Database, Radio, Sparkles, Sliders, Bell } from 'lucide-react';
import { ESP32NodeStatus, HealthSeverity } from '../types/solar';
import { BackgroundMode } from './GridSubstationBackground';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  esp32Status: ESP32NodeStatus;
  currentSeverity: HealthSeverity;
  onOpenEspModal: () => void;
  onOpenFirebaseModal: () => void;
  bgMode: BackgroundMode;
  onCycleBgMode: () => void;
  onOpenThresholdModal: () => void;
  activeBreachCount: number;
  anomalyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  esp32Status,
  currentSeverity,
  onOpenEspModal,
  onOpenFirebaseModal,
  bgMode,
  onCycleBgMode,
  onOpenThresholdModal,
  activeBreachCount,
  anomalyCount = 0,
}) => {
  const getSeverityStyle = () => {
    switch (currentSeverity) {
      case 'critical':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/80';
      case 'warning':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/80';
      default:
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/80';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/70 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand wordmark & Grid Interconnect Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <div className="w-full h-full bg-slate-950/90 rounded-[7px] flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-captain text-2xl tracking-wider text-white whitespace-nowrap leading-none">
                HELIOS<span className="text-emerald-400">AI</span>
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-hero tracking-wider text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-700/60 uppercase">
                <Radio className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                <span>33kV Substation Synced · 50.02 Hz</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-hero tracking-widest uppercase mt-0.5">
              AIoT Solar Diagnostics & Grid Telemetry
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium">
          {[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'telemetry', label: 'TELEMETRY' },
            { id: 'diagnosis', label: 'AI DIAGNOSIS' },
            { id: 'analytics', label: 'ANALYTICS & LOGS' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-md transition-all font-hero text-xs lg:text-sm tracking-wider uppercase whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-white bg-slate-800/90 border border-slate-700/80 font-bold shadow-sm shadow-black/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-semibold'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Hardware connectivity & System Status */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Background Atmosphere Toggle */}
          <button
            onClick={onCycleBgMode}
            title={`Current background: ${bgMode}. Click to cycle ambiance.`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-300 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline capitalize">Grid Ambience: {bgMode}</span>
          </button>

          {/* Health Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium uppercase tracking-wider ${getSeverityStyle()}`}
          >
            {currentSeverity === 'critical' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>{currentSeverity}</span>
          </div>

          {/* Threshold Alert Rules Button */}
          <button
            onClick={onOpenThresholdModal}
            title="Configure custom min/max voltage and temperature thresholds"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-hero uppercase tracking-wider font-bold transition-all whitespace-nowrap shrink-0 border ${
              activeBreachCount > 0
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 ${activeBreachCount > 0 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">Thresholds</span>
            {activeBreachCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-captain text-[11px] bg-rose-600 text-white font-bold ml-0.5 animate-pulse">
                {activeBreachCount}
              </span>
            )}
          </button>

          {/* Firebase Config Button */}
          <button
            onClick={onOpenFirebaseModal}
            title="Configure Cloud Firebase / REST Database"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Firebase Sync</span>
          </button>

          {/* ESP32 Hardware Status Button */}
          <button
            onClick={onOpenEspModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-hero uppercase tracking-wider font-bold transition-all whitespace-nowrap shrink-0 border ${
              anomalyCount > 0
                ? 'bg-red-950/90 hover:bg-red-900 border-red-500 text-red-200 shadow-md shadow-red-950/60 animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 border-transparent text-white shadow-sm shadow-emerald-950'
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${anomalyCount > 0 ? 'text-red-400' : 'text-white'}`} />
            <span className="hidden sm:inline">{anomalyCount > 0 ? `ESP32 Abnormal (${anomalyCount})` : 'ESP32 Node'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                anomalyCount > 0 ? 'bg-red-400 shadow-sm shadow-red-500 animate-ping' : 'bg-emerald-300 shadow-sm shadow-emerald-400'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

