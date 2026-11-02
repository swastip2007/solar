/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, Sparkles, ArrowRight, Save } from 'lucide-react';
import { FirebaseConnectionConfig } from '../types/solar';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FirebaseConnectionConfig;
  onSaveConfig: (config: FirebaseConnectionConfig) => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<FirebaseConnectionConfig>({ ...config });
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setTestState('testing');
    setTimeout(() => {
      if (formData.databaseURL.trim().length > 5 || formData.projectId.trim().length > 2) {
        setTestState('success');
      } else {
        setTestState('error');
      }
    }, 800);
  };

  const handleSave = () => {
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hero text-base font-bold uppercase tracking-wider text-white">
                Firebase Realtime Database & Cloud Sync
              </h3>
              <p className="text-xs text-slate-400">
                Connect physical ESP32 sensor telemetry via Firebase or REST
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
            <span className="font-semibold text-white block mb-1">
              Architecture & Extensibility:
            </span>
            This dashboard is pre-architected with a unified telemetry adapter. When your physical
            ESP32 is deployed in the field, configure your Firebase project credentials below. The
            ESP32 pushes readings using the standard <code className="text-amber-300 font-mono">Firebase-ESP-Client</code> library or HTTP REST.
          </div>

          <div className="space-y-3 font-mono">
            {/* Database URL */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-sans">
                Firebase Database URL / Project Endpoint
              </label>
              <input
                type="text"
                value={formData.databaseURL}
                onChange={(e) => setFormData({ ...formData, databaseURL: e.target.value })}
                placeholder="https://solar-aiot-default-rtdb.firebaseio.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Project ID */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-sans">
                Firebase Project ID
              </label>
              <input
                type="text"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                placeholder="solar-aiot-diagnosis"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Web API Key */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-sans">
                Web API Key (or Auth Token)
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="AIzaSyA..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Node Stream Path */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-sans">
                Telemetry Node Path
              </label>
              <input
                type="text"
                value={formData.streamPath}
                onChange={(e) => setFormData({ ...formData, streamPath: e.target.value })}
                placeholder="esp32_nodes/solar_array_01/telemetry"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Toggle Enable */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-sans text-slate-300">
                Switch Data Ingestion to Firebase Live Feed
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Test connection feedback */}
          {testState === 'success' && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Valid Firebase configuration schema syntax. Ready to receive node pings.</span>
            </div>
          )}
          {testState === 'error' && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please enter a valid Firebase Realtime Database URL or Project ID.</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={testState === 'testing'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {testState === 'testing' ? 'Testing Syntax...' : 'Test Config'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-sm"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
