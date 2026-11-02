/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  Filter,
  Search,
  BatteryCharging,
  Zap,
  Leaf,
  Percent,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { SensorReading, DailySummaryKPIs } from '../types/solar';

interface PerformanceSummarySectionProps {
  history: SensorReading[];
  kpis: DailySummaryKPIs;
}

export const PerformanceSummarySection: React.FC<PerformanceSummarySectionProps> = ({
  history,
  kpis,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Classify reading severity for historical table
  const getReadingSeverity = (r: SensorReading): 'normal' | 'warning' | 'critical' => {
    if (r.panelTemp >= 62 || (r.voltage > 14 && r.current < 0.15 && r.lightIntensity > 20000)) {
      return 'critical';
    }
    if (r.panelTemp >= 48 || (r.expectedPower > 10 && r.power < r.expectedPower * 0.7)) {
      return 'warning';
    }
    return 'normal';
  };

  // Filter and search history
  const filteredLogs = useMemo(() => {
    return history
      .filter((r) => {
        const severity = getReadingSeverity(r);
        if (filterSeverity !== 'all' && severity !== filterSeverity) return false;
        if (searchQuery.trim() === '') return true;
        const query = searchQuery.toLowerCase();
        return (
          r.timeLabel.toLowerCase().includes(query) ||
          r.power.toString().includes(query) ||
          r.voltage.toString().includes(query)
        );
      })
      .reverse(); // Newest first
  }, [history, filterSeverity, searchQuery]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Time_HHmmss',
      'Panel_Temp_C',
      'Ambient_Temp_C',
      'Humidity_Pct',
      'Light_Lux',
      'Voltage_V',
      'Current_A',
      'Power_Watts',
      'Expected_Watts',
      'Efficiency_Pct',
      'Status',
    ];

    const rows = history.map((r) => [
      r.timestamp,
      `"${r.timeLabel}"`,
      r.panelTemp,
      r.ambientTemp,
      r.humidity,
      r.lightIntensity,
      r.voltage,
      r.current,
      r.power,
      r.expectedPower,
      r.efficiency,
      getReadingSeverity(r),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `helios_solar_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/75 backdrop-blur-xl shadow-lg shadow-black/40 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300">Daily Energy Yield</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl lg:text-4xl font-bold font-captain tabular-nums text-white tracking-wide leading-none my-1">
            {kpis.energyGeneratedKWh.toFixed(2)}
            <span className="font-hero text-sm font-bold uppercase tracking-wider text-slate-400 ml-1">kWh</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Operating: ~{kpis.operatingHours} sun-hours
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/75 backdrop-blur-xl shadow-lg shadow-black/40 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300">Peak Power Today</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl lg:text-4xl font-bold font-captain tabular-nums text-white tracking-wide leading-none my-1">
            {kpis.peakPowerWatts.toFixed(1)}
            <span className="font-hero text-sm font-bold uppercase tracking-wider text-slate-400 ml-1">W</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Max solar irradiance point
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/75 backdrop-blur-xl shadow-lg shadow-black/40 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300">Performance Ratio (PR)</span>
            <Percent className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl lg:text-4xl font-bold font-captain tabular-nums text-white tracking-wide leading-none my-1">
            {kpis.performanceRatioPR.toFixed(1)}
            <span className="font-hero text-sm font-bold uppercase tracking-wider text-slate-400 ml-1">%</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Actual vs theoretical potential
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/75 backdrop-blur-xl shadow-lg shadow-black/40 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300">CO₂ Avoided Today</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl lg:text-4xl font-bold font-captain tabular-nums text-white tracking-wide leading-none my-1">
            {kpis.co2OffsetKg.toFixed(2)}
            <span className="font-hero text-sm font-bold uppercase tracking-wider text-slate-400 ml-1">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Clean green offset footprint
          </span>
        </div>
      </div>

      {/* Historical Telemetry Logs Table Card */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/75 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-hero text-base font-bold uppercase tracking-wider text-white">
              Historical Sensor Telemetry Log
            </h3>
            <p className="text-xs text-slate-400">
              Correlated 7-channel records captured from ESP32 edge node
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search time / value..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 w-36 sm:w-44"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              {(['all', 'normal', 'warning', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded capitalize font-hero tracking-wider text-xs uppercase transition-colors ${
                    filterSeverity === sev
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 font-medium'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-hero text-xs font-bold uppercase tracking-wider text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
              title="Download full history as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800 z-10 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Panel T (DS18B20)</th>
                <th className="py-2.5 px-3">Ambient T (DHT22)</th>
                <th className="py-2.5 px-3">Humidity</th>
                <th className="py-2.5 px-3">Light (LDR)</th>
                <th className="py-2.5 px-3">Voltage</th>
                <th className="py-2.5 px-3">Current</th>
                <th className="py-2.5 px-3">Power</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No historical readings match current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((row) => {
                  const severity = getReadingSeverity(row);
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <CheckCircle className="w-3 h-3" /> Normal
                    </span>
                  );
                  if (severity === 'critical') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                        <AlertOctagon className="w-3 h-3" /> Critical
                      </span>
                    );
                  } else if (severity === 'warning') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                        <AlertTriangle className="w-3 h-3" /> Warning
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors tabular-nums"
                    >
                      <td className="py-2 px-3 text-slate-400">{row.timeLabel}</td>
                      <td className="py-2 px-3 text-slate-200">
                        {row.panelTemp.toFixed(1)}°C
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {row.ambientTemp.toFixed(1)}°C
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {row.humidity.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-amber-300">
                        {row.lightIntensity.toLocaleString()} lx
                      </td>
                      <td className="py-2 px-3 text-blue-300 font-semibold">
                        {row.voltage.toFixed(2)} V
                      </td>
                      <td className="py-2 px-3 text-emerald-300 font-semibold">
                        {row.current.toFixed(2)} A
                      </td>
                      <td className="py-2 px-3 text-white font-bold">
                        {row.power.toFixed(1)} W
                      </td>
                      <td className="py-2 px-3">{statusBadge}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Showing {filteredLogs.length} logged records</span>
          <span>Sample Buffer Limit: 100 entries</span>
        </div>
      </div>
    </div>
  );
};
