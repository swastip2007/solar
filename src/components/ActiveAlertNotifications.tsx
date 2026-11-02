/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  X,
  Sliders,
  CheckCircle,
  Bell,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ThresholdAlertEvent } from '../types/solar';

interface ActiveAlertNotificationsProps {
  activeBreaches: ThresholdAlertEvent[];
  alertHistory: ThresholdAlertEvent[];
  onAcknowledgeAlert: (id: string) => void;
  onClearAllAlerts: () => void;
  onOpenThresholdModal: () => void;
}

export const ActiveAlertNotifications: React.FC<ActiveAlertNotificationsProps> = ({
  activeBreaches,
  alertHistory,
  onAcknowledgeAlert,
  onClearAllAlerts,
  onOpenThresholdModal,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  if (activeBreaches.length === 0 && alertHistory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {/* 1. Urgent Active Out-Of-Bounds Notifications */}
      {activeBreaches.map((breach) => {
        const isCritical = breach.severity === 'critical';
        return (
          <div
            key={breach.id}
            className={`relative rounded-xl p-3.5 border transition-all duration-300 animate-in fade-in slide-in-from-top-2 shadow-xl ${
              isCritical
                ? 'bg-rose-950/80 border-rose-600/80 text-rose-200 shadow-rose-950/50'
                : 'bg-amber-950/80 border-amber-600/80 text-amber-200 shadow-amber-950/50'
            } backdrop-blur-xl`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left icon and message */}
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 sm:mt-0 ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isCritical ? (
                    <AlertOctagon className="w-5 h-5 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-hero text-sm font-bold uppercase tracking-wider text-white">
                      THRESHOLD ALERT: {breach.label}
                    </span>
                    <span
                      className={`font-hero text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-900/80 border-rose-500 text-rose-100'
                          : 'bg-amber-900/80 border-amber-500 text-amber-100'
                      }`}
                    >
                      OUT OF BOUNDS
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {breach.timeLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-1 leading-snug">
                    Current reading is{' '}
                    <span className="font-captain text-base tracking-wide text-white font-bold tabular-nums">
                      {breach.currentValue.toFixed(1)}{breach.unit}
                    </span>
                    , breaching your custom{' '}
                    <span className="font-semibold underline">
                      {breach.breachType === 'below_min' ? 'minimum' : 'maximum'}
                    </span>{' '}
                    limit of{' '}
                    <span className="font-mono font-bold text-white">
                      {breach.thresholdValue.toFixed(1)}{breach.unit}
                    </span>
                    .
                  </p>
                </div>
              </div>

              {/* Right action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={onOpenThresholdModal}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-hero uppercase tracking-wider text-xs font-bold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adjust Limits</span>
                </button>

                <button
                  onClick={() => onAcknowledgeAlert(breach.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-hero uppercase tracking-wider text-xs font-bold text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-600 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* 2. History Toggle & Recent Events Log Drawer */}
      {alertHistory.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className="flex items-center gap-2 font-hero uppercase tracking-wider text-slate-300 hover:text-white font-bold transition-colors"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>
                Recent Out-Of-Bounds Alert Log ({alertHistory.length} recorded)
              </span>
              {showHistory ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClearAllAlerts}
                className="font-hero uppercase tracking-wider text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
              {alertHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-slate-400">{item.timeLabel}</span>
                    <span className="text-white font-sans font-semibold">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-rose-400 font-bold">
                      {item.currentValue.toFixed(1)}{item.unit}
                    </span>
                    <span className="text-slate-500 font-sans">
                      (Limit: {item.thresholdValue.toFixed(1)}{item.unit})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
