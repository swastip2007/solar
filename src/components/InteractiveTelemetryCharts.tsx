/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SensorReading } from '../types/solar';
import { LineChart, Thermometer, Zap, SunMedium, Gauge } from 'lucide-react';

interface InteractiveTelemetryChartsProps {
  history: SensorReading[];
}

type ChartCategory = 'all' | 'temperature' | 'electrical' | 'light' | 'power';

export const InteractiveTelemetryCharts: React.FC<InteractiveTelemetryChartsProps> = ({ history }) => {
  const [selectedCategory, setSelectedCategory] = useState<ChartCategory>('all');
  const [timeWindow, setTimeWindow] = useState<'30s' | '15m' | '1h' | '24h'>('15m');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter history based on time window
  const filteredData = useMemo(() => {
    if (history.length === 0) return [];
    if (timeWindow === '30s') {
      return history.slice(-15);
    } else if (timeWindow === '15m') {
      return history.slice(-30);
    } else if (timeWindow === '1h') {
      return history.slice(-60);
    }
    return history;
  }, [history, timeWindow]);

  // SVG Chart Helper
  const renderSvgLineChart = (
    title: string,
    icon: React.ReactNode,
    series: {
      name: string;
      color: string;
      unit: string;
      values: number[];
    }[],
    minYOverride?: number,
    maxYOverride?: number
  ) => {
    const dataPointsCount = filteredData.length;
    if (dataPointsCount < 2) {
      return (
        <div className="h-52 flex items-center justify-center text-xs text-slate-500 font-mono">
          Gathering telemetry buffer...
        </div>
      );
    }

    // Determine scale min and max across all series
    let allVals: number[] = [];
    series.forEach((s) => allVals.push(...s.values));
    let rawMin = minYOverride !== undefined ? minYOverride : Math.min(...allVals);
    let rawMax = maxYOverride !== undefined ? maxYOverride : Math.max(...allVals);

    // Provide headroom
    const padding = (rawMax - rawMin) * 0.12 || 1;
    const minY = Math.floor(Math.max(0, rawMin - padding));
    const maxY = Math.ceil(rawMax + padding);
    const rangeY = maxY - minY || 1;

    const width = 560;
    const height = 180;
    const padX = 40;
    const padY = 20;
    const chartW = width - padX - 15;
    const chartH = height - padY * 2;

    const getX = (idx: number) => padX + (idx / (dataPointsCount - 1)) * chartW;
    const getY = (val: number) => padY + chartH - ((val - minY) / rangeY) * chartH;

    // Generate path d strings
    const paths = series.map((s) => {
      let d = '';
      s.values.forEach((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        if (idx === 0) d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        else d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      });
      return d;
    });

    const activeHoverData = hoverIndex !== null && filteredData[hoverIndex] ? filteredData[hoverIndex] : null;

    return (
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/75 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
              {icon}
            </div>
            <h3 className="font-hero text-sm font-bold uppercase tracking-wider text-slate-200">{title}</h3>
          </div>

          {/* Series Legends */}
          <div className="flex items-center gap-3 text-xs font-hero">
            {series.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400 uppercase tracking-wide font-medium">{s.name}</span>
                <span className="text-white font-captain text-base tracking-wide tabular-nums">
                  {s.values[s.values.length - 1]}
                  <span className="text-slate-400 font-hero text-xs font-normal ml-0.5">{s.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Viewport */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 overflow-visible"
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const normalizedX = (mouseX / rect.width) * width;
              const clampedX = Math.max(padX, Math.min(width - 15, normalizedX));
              const idx = Math.round(((clampedX - padX) / chartW) * (dataPointsCount - 1));
              setHoverIndex(Math.max(0, Math.min(dataPointsCount - 1, idx)));
            }}
          >
            <defs>
              {series.map((s, i) => (
                <linearGradient key={i} id={`grad-${title.replace(/\s+/g, '')}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.33, 0.66, 1].map((pct, i) => {
              const y = padY + chartH * (1 - pct);
              const labelVal = Math.round(minY + rangeY * pct);
              return (
                <g key={i}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={width - 15}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="2 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padX - 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Line Paths & Area Fills */}
            {series.map((s, i) => {
              const d = paths[i];
              const areaD = `${d} L ${getX(dataPointsCount - 1)} ${padY + chartH} L ${getX(0)} ${padY + chartH} Z`;
              return (
                <g key={i}>
                  <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')}-${i})`} />
                  <path
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Current Endpoint Dot */}
                  <circle
                    cx={getX(dataPointsCount - 1)}
                    cy={getY(s.values[s.values.length - 1])}
                    r="3.5"
                    fill={s.color}
                    stroke="#090d16"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* Hover Cursor Vertical Line */}
            {hoverIndex !== null && (
              <line
                x1={getX(hoverIndex)}
                y1={padY}
                x2={getX(hoverIndex)}
                y2={padY + chartH}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
          </svg>

          {/* Floating Hover Tooltip */}
          {activeHoverData && hoverIndex !== null && (
            <div
              className="pointer-events-none absolute top-1 z-20 px-2.5 py-1.5 rounded bg-slate-950/95 border border-slate-700 shadow-xl text-[11px] font-mono text-slate-200"
              style={{
                left: `${Math.min(75, Math.max(5, (hoverIndex / (dataPointsCount - 1)) * 100))}%`,
              }}
            >
              <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-0.5 mb-1">
                {activeHoverData.timeLabel}
              </div>
              {series.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span style={{ color: s.color }}>{s.name}:</span>
                  <span className="font-bold tabular-nums">
                    {s.values[hoverIndex]} {s.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* X-Axis Time Anchors */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80 mt-1">
          <span>{filteredData[0]?.timeLabel || 'Start'}</span>
          <span>Buffer: {dataPointsCount} samples</span>
          <span>{filteredData[dataPointsCount - 1]?.timeLabel || 'Latest'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-400" />
            <h2 className="font-hero text-lg font-bold uppercase tracking-wider text-white">
              Real-Time Telemetry Oscilloscope
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Interactive multi-channel sensor telemetry streams
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Tabs */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Channels' },
              { id: 'temperature', label: 'Temperature' },
              { id: 'electrical', label: 'V & I' },
              { id: 'light', label: 'Light' },
              { id: 'power', label: 'Power (W)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as ChartCategory)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-hero uppercase tracking-wider text-xs ${
                  selectedCategory === tab.id
                    ? 'bg-slate-800 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
            {(['30s', '15m', '1h', '24h'] as const).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  timeWindow === tw
                    ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Temperature Line Graph (DS18B20 vs DHT22) */}
        {(selectedCategory === 'all' || selectedCategory === 'temperature') &&
          renderSvgLineChart(
            'Thermal Dynamics (DS18B20 vs Ambient DHT22)',
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />,
            [
              {
                name: 'Panel (DS18B20)',
                color: '#f43f5e',
                unit: '°C',
                values: filteredData.map((d) => d.panelTemp),
              },
              {
                name: 'Ambient (DHT22)',
                color: '#38bdf8',
                unit: '°C',
                values: filteredData.map((d) => d.ambientTemp),
              },
            ]
          )}

        {/* 2. Voltage & Current Graph */}
        {(selectedCategory === 'all' || selectedCategory === 'electrical') &&
          renderSvgLineChart(
            'Electrical I-V Telemetry (Voltage & Current)',
            <Zap className="w-3.5 h-3.5 text-blue-400" />,
            [
              {
                name: 'Voltage (V)',
                color: '#3b82f6',
                unit: 'V',
                values: filteredData.map((d) => d.voltage),
              },
              {
                name: 'Current (A)',
                color: '#10b981',
                unit: 'A',
                values: filteredData.map((d) => d.current),
              },
            ]
          )}

        {/* 3. Light Intensity Graph (LDR) */}
        {(selectedCategory === 'all' || selectedCategory === 'light') &&
          renderSvgLineChart(
            'Solar Irradiance Flux (LDR Calibrated Lux)',
            <SunMedium className="w-3.5 h-3.5 text-amber-400" />,
            [
              {
                name: 'Light Intensity',
                color: '#f59e0b',
                unit: 'Lux',
                values: filteredData.map((d) => d.lightIntensity),
              },
            ]
          )}

        {/* 4. Calculated Power vs STC Expected (W) */}
        {(selectedCategory === 'all' || selectedCategory === 'power') &&
          renderSvgLineChart(
            'Power Generation Yield vs STC Baseline',
            <Gauge className="w-3.5 h-3.5 text-teal-400" />,
            [
              {
                name: 'Actual Power (V×I)',
                color: '#2dd4bf',
                unit: 'W',
                values: filteredData.map((d) => d.power),
              },
              {
                name: 'Theoretical STC',
                color: '#64748b',
                unit: 'W',
                values: filteredData.map((d) => d.expectedPower),
              },
            ]
          )}
      </div>
    </div>
  );
};
