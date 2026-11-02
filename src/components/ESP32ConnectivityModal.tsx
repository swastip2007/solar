/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Cpu,
  Wifi,
  Radio,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Server,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ESP32NodeStatus, ESP32AnomalyDetail } from '../types/solar';
import { ESP32_ARDUINO_SKETCH } from '../services/telemetryService';

interface ESP32ConnectivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ESP32NodeStatus;
  onOpenFirebaseConfig: () => void;
  anomalies?: ESP32AnomalyDetail[];
}

export const ESP32ConnectivityModal: React.FC<ESP32ConnectivityModalProps> = ({
  isOpen,
  onClose,
  status,
  onOpenFirebaseConfig,
  anomalies = [],
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'code' | 'wiring'>('status');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ESP32_ARDUINO_SKETCH);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-hero text-base font-bold uppercase tracking-wider text-white">
                  ESP32 Microcontroller Node Monitor
                </h3>
                <span className="px-2 py-0.5 rounded font-hero text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 uppercase tracking-wider">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AIoT Edge Sensor Hub · {status.deviceId}
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 text-xs">
          {[
            { id: 'status', label: 'HARDWARE TELEMETRY' },
            { id: 'wiring', label: 'GPIO PINOUT MAP' },
            { id: 'code', label: 'ARDUINO FIRMWARE' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 font-hero tracking-wider uppercase transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 font-semibold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Telemetry info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Hardware Model
                  </span>
                  <span className="text-slate-200 font-semibold text-[11px] truncate block">
                    {status.hardwareModel}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Local IP Address
                  </span>
                  <span className="text-slate-200 font-semibold">{status.localIp}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    MAC Address
                  </span>
                  <span className="text-slate-200 font-semibold text-[11px]">
                    {status.macAddress}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Wi-Fi SSID & RSSI
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {status.rssi} dBm <span className="text-slate-500 font-normal">({status.wifiSsid})</span>
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Firmware Version
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {status.firmwareVersion}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Sampling Frequency
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    Every {status.samplingIntervalSeconds} seconds
                  </span>
                </div>
              </div>

              {/* Data source indicator & Firebase banner */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">
                      Current Telemetry Stream: Realistic Simulated Demo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ready to receive real sensor payloads from your physical ESP32 via Firebase or REST API.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenFirebaseConfig();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Connect Firebase</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'wiring' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Physical sensor pin connection wiring mapping on the ESP32 micro-controller:
              </p>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 text-xs font-mono">
                {Object.entries(status.sensorPins).map(([key, sensor]) => {
                  const sensorAnomaly = anomalies.find((a) => {
                    if (key === 'ds18b20' && a.sensorKey === 'panelTemp') return true;
                    if (key === 'dht22' && (a.sensorKey === 'ambientTemp' || a.sensorKey === 'humidity')) return true;
                    if (key === 'ldr' && a.sensorKey === 'lightIntensity') return true;
                    if (key === 'currentSensor' && a.sensorKey === 'current') return true;
                    if (key === 'voltageDivider' && a.sensorKey === 'voltage') return true;
                    return false;
                  });

                  return (
                    <div
                      key={key}
                      className={`p-3 flex items-center justify-between transition-colors ${
                        sensorAnomaly ? 'bg-red-950/40 border-l-2 border-red-500' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white capitalize block">
                            {key === 'ds18b20'
                              ? 'DS18B20 (Panel Temp)'
                              : key === 'dht22'
                              ? 'DHT22 (Ambient Temp/Hum)'
                              : key === 'ldr'
                              ? 'LDR Sensor (Light Lux)'
                              : key === 'currentSensor'
                              ? 'INA219 (Panel Current)'
                              : 'Voltage Divider (Panel Volts)'}
                          </span>
                          {sensorAnomaly && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-900/80 text-red-200 border border-red-600 font-bold uppercase">
                              Anomaly
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{sensor.bus}</span>
                        {sensorAnomaly && (
                          <span className="text-[10px] text-red-300 block mt-0.5 font-mono">
                            {sensorAnomaly.errorCode}: {sensorAnomaly.observedValue}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold block ${
                            sensorAnomaly ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {sensor.pin}
                        </span>
                        {sensorAnomaly ? (
                          <span className="text-[10px] text-red-400 uppercase inline-flex items-center gap-1 font-bold">
                            Out Of Envelope
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 uppercase inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Nominal
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Ready-to-flash Arduino C++ firmware sketch for ESP32:
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 max-h-72 overflow-y-auto text-[11px] font-mono text-slate-300 leading-relaxed">
                <pre>{ESP32_ARDUINO_SKETCH}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
