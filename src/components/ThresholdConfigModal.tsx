/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Zap,
  Thermometer,
  CloudSun,
  Volume2,
  VolumeX,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ThresholdSettings, SensorReading, DEFAULT_THRESHOLDS } from '../types/solar';

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdSettings;
  onSaveThresholds: (settings: ThresholdSettings) => void;
  currentReading: SensorReading;
}

export const ThresholdConfigModal: React.FC<ThresholdConfigModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
  currentReading,
}) => {
  const [form, setForm] = useState<ThresholdSettings>({ ...thresholds });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveThresholds(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULT_THRESHOLDS });
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'desert') {
      setForm((prev) => ({
        ...prev,
        voltage: { min: 14.5, max: 21.5, enabled: true },
        panelTemp: { min: 20.0, max: 68.0, enabled: true },
        ambientTemp: { min: 15.0, max: 48.0, enabled: true },
      }));
    } else if (presetName === 'strict') {
      setForm((prev) => ({
        ...prev,
        voltage: { min: 16.5, max: 19.5, enabled: true },
        panelTemp: { min: 20.0, max: 48.0, enabled: true },
        ambientTemp: { min: 18.0, max: 35.0, enabled: true },
      }));
    } else if (presetName === 'winter') {
      setForm((prev) => ({
        ...prev,
        voltage: { min: 13.0, max: 22.0, enabled: true },
        panelTemp: { min: -5.0, max: 45.0, enabled: true },
        ambientTemp: { min: -10.0, max: 30.0, enabled: true },
      }));
    }
  };

  // Helper to render relative position meter
  const renderRangeBar = (
    currentVal: number,
    min: number,
    max: number,
    displayMin: number,
    displayMax: number,
    unit: string
  ) => {
    const range = displayMax - displayMin || 1;
    const currentPercent = Math.min(100, Math.max(0, ((currentVal - displayMin) / range) * 100));
    const minPercent = Math.min(100, Math.max(0, ((min - displayMin) / range) * 100));
    const maxPercent = Math.min(100, Math.max(0, ((max - displayMin) / range) * 100));
    const isOut = currentVal < min || currentVal > max;

    return (
      <div className="mt-2 space-y-1">
        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          {/* Safe green zone */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-500/60"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(2, maxPercent - minPercent)}%`,
            }}
          />
          {/* Current reading pointer */}
          <div
            className={`absolute top-0 bottom-0 w-1.5 -ml-0.5 rounded transition-all duration-300 ${
              isOut ? 'bg-rose-500 shadow-sm shadow-rose-500' : 'bg-white shadow-sm shadow-white'
            }`}
            style={{ left: `${currentPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>{displayMin}{unit}</span>
          <span className="text-slate-300 font-bold">
            Live: {currentVal.toFixed(1)}{unit} {isOut && <span className="text-rose-400 font-hero tracking-wider uppercase font-bold">(OUT OF BOUNDS)</span>}
          </span>
          <span>{displayMax}{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden glass-panel">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hero text-lg font-bold uppercase tracking-wider text-white">
                Configurable Sensor Alert Thresholds
              </h3>
              <p className="text-xs text-slate-400">
                Define custom min & max boundaries for real-time visual out-of-bounds notifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets & Audio Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-hero uppercase tracking-wider text-slate-400 font-bold text-[11px]">
              Preset Profiles:
            </span>
            <button
              onClick={() => setForm({ ...DEFAULT_THRESHOLDS })}
              className="px-2 py-0.5 rounded font-hero uppercase tracking-wider text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Factory STC
            </button>
            <button
              onClick={() => applyPreset('desert')}
              className="px-2 py-0.5 rounded font-hero uppercase tracking-wider text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Desert Heat
            </button>
            <button
              onClick={() => applyPreset('strict')}
              className="px-2 py-0.5 rounded font-hero uppercase tracking-wider text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Strict Testing
            </button>
            <button
              onClick={() => applyPreset('winter')}
              className="px-2 py-0.5 rounded font-hero uppercase tracking-wider text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Winter / Freeze
            </button>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setForm((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-hero uppercase tracking-wider text-[11px] border transition-colors ${
              form.soundEnabled
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {form.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Audio Alert: {form.soundEnabled ? 'Enabled' : 'Muted'}</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1. Solar Panel Voltage Threshold */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <h4 className="font-hero text-sm font-bold uppercase tracking-wider text-white">
                  Solar Panel Voltage Boundaries
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.voltage.enabled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      voltage: { ...form.voltage, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Trigger visual alerts if panel voltage drops under the minimum (e.g. shading or disconnection) or exceeds open-circuit maximum.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Min Voltage */}
              <div>
                <label className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Min Voltage (V)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="22"
                    step="0.5"
                    value={form.voltage.min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        voltage: { ...form.voltage, min: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={form.voltage.min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        voltage: { ...form.voltage, min: Number(e.target.value) },
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Max Voltage */}
              <div>
                <label className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Max Voltage (V)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="15"
                    max="28"
                    step="0.5"
                    value={form.voltage.max}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        voltage: { ...form.voltage, max: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={form.voltage.max}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        voltage: { ...form.voltage, max: Number(e.target.value) },
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Visual Meter */}
            {renderRangeBar(currentReading.voltage, form.voltage.min, form.voltage.max, 5, 25, 'V')}
          </div>

          {/* 2. Solar Panel Temperature Threshold (DS18B20) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-rose-400" />
                <h4 className="font-hero text-sm font-bold uppercase tracking-wider text-white">
                  Solar Panel Temperature Boundaries (DS18B20)
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.panelTemp.enabled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      panelTemp: { ...form.panelTemp, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Alerts when silicon cell temperature exceeds safe thermal limits (&gt; 58°C causes accelerated aging and power derating).
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Min Panel Temp */}
              <div>
                <label className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Min Panel Temp (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-10"
                    max="30"
                    step="1"
                    value={form.panelTemp.min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        panelTemp: { ...form.panelTemp, min: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    step="1"
                    value={form.panelTemp.min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        panelTemp: { ...form.panelTemp, min: Number(e.target.value) },
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Max Panel Temp */}
              <div>
                <label className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Max Panel Temp (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="40"
                    max="85"
                    step="1"
                    value={form.panelTemp.max}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        panelTemp: { ...form.panelTemp, max: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    step="1"
                    value={form.panelTemp.max}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        panelTemp: { ...form.panelTemp, max: Number(e.target.value) },
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Visual Meter */}
            {renderRangeBar(currentReading.panelTemp, form.panelTemp.min, form.panelTemp.max, 0, 80, '°C')}
          </div>

          {/* 3. Ambient Temperature Threshold (DHT22) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-sky-400" />
                <h4 className="font-hero text-sm font-bold uppercase tracking-wider text-white">
                  Ambient Temperature Boundaries (DHT22)
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ambientTemp.enabled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ambientTemp: { ...form.ambientTemp, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Min Ambient (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-15"
                    max="25"
                    step="1"
                    value={form.ambientTemp.min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ambientTemp: { ...form.ambientTemp, min: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    step="1"
                    value={form.ambientTemp.min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ambientTemp: { ...form.ambientTemp, min: Number(e.target.value) },
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-hero text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Max Ambient (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="30"
                    max="60"
                    step="1"
                    value={form.ambientTemp.max}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ambientTemp: { ...form.ambientTemp, max: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    step="1"
                    value={form.ambientTemp.max}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ambientTemp: { ...form.ambientTemp, max: Number(e.target.value) },
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Visual Meter */}
            {renderRangeBar(currentReading.ambientTemp, form.ambientTemp.min, form.ambientTemp.max, -5, 55, '°C')}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-hero uppercase tracking-wider text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg font-hero uppercase tracking-wider text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg font-hero uppercase tracking-wider text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950 transition-all"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Thresholds Saved!' : 'Apply Alert Rules'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
