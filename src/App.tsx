/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { DemoBanner } from './components/DemoBanner';
import { SensorCardsGrid } from './components/SensorCardsGrid';
import { HealthStatusSection } from './components/HealthStatusSection';
import { InteractiveTelemetryCharts } from './components/InteractiveTelemetryCharts';
import { AiFaultDiagnosisSection } from './components/AiFaultDiagnosisSection';
import { PerformanceSummarySection } from './components/PerformanceSummarySection';
import { ESP32ConnectivityModal } from './components/ESP32ConnectivityModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';

import {
  SensorReading,
  DiagnosisReport,
  ESP32NodeStatus,
  DailySummaryKPIs,
  FirebaseConnectionConfig,
  ThresholdSettings,
  ThresholdAlertEvent,
  DEFAULT_THRESHOLDS,
} from './types/solar';

import {
  generateSensorReading,
  generateSeedHistoricalData,
  calculateDailyKPIs,
  INITIAL_ESP32_STATUS,
  SimulationFaultMode,
  setSimulationFaultMode,
  getSimulationFaultMode,
} from './services/telemetryService';

import {
  loadThresholdSettings,
  saveThresholdSettings,
  evaluateThresholdBreaches,
  playAlertChime,
} from './services/thresholdService';

import { diagnoseSolarPanelHealth } from './services/aiDiagnosisEngine';
import { GridSubstationBackground, BackgroundMode } from './components/GridSubstationBackground';
import { ThresholdConfigModal } from './components/ThresholdConfigModal';
import { ActiveAlertNotifications } from './components/ActiveAlertNotifications';
import { ESP32AbnormalReadingSection } from './components/ESP32AbnormalReadingSection';
import { evaluateESP32Anomalies } from './services/esp32AnomalyService';
import { Info, Cpu, CheckCircle2, AlertTriangle, Layers, Activity, Radio, Sliders } from 'lucide-react';

const SOLAR_IMAGE_PATH = '/src/assets/images/solar_panel_iot_node_1793614440489.jpg';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [bgMode, setBgMode] = useState<BackgroundMode>('balanced');

  const handleCycleBgMode = () => {
    setBgMode((prev) => {
      if (prev === 'balanced') return 'vivid';
      if (prev === 'vivid') return 'focused';
      return 'balanced';
    });
  };

  // Threshold alert rules state
  const [thresholds, setThresholds] = useState<ThresholdSettings>(() => loadThresholdSettings());
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());
  const [alertHistory, setAlertHistory] = useState<ThresholdAlertEvent[]>([]);

  // Simulation streaming state
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [samplingInterval, setSamplingInterval] = useState<number>(2); // seconds
  const [faultMode, setFaultMode] = useState<SimulationFaultMode>('nominal');

  // Telemetry buffer & seed
  const [history, setHistory] = useState<SensorReading[]>(() => generateSeedHistoricalData(35));
  const currentReading: SensorReading = history[history.length - 1] || generateSensorReading();
  const previousReading: SensorReading | undefined = history[history.length - 2];

  // Evaluate active out-of-bounds breaches
  const activeBreaches: ThresholdAlertEvent[] = useMemo(() => {
    const rawBreaches = evaluateThresholdBreaches(currentReading, thresholds);
    return rawBreaches.filter((b) => !acknowledgedAlertIds.has(b.id));
  }, [currentReading, thresholds, acknowledgedAlertIds]);

  // Log breaches to history and trigger audio chime if enabled
  useEffect(() => {
    if (activeBreaches.length > 0) {
      if (thresholds.soundEnabled) {
        playAlertChime();
      }
      setAlertHistory((prev) => {
        const newItems = activeBreaches.filter(
          (ab) => !prev.some((p) => p.metric === ab.metric && Math.abs(p.timestamp - ab.timestamp) < 5000)
        );
        if (newItems.length === 0) return prev;
        const combined = [...newItems, ...prev];
        return combined.slice(0, 30); // keep recent 30
      });
    }
  }, [activeBreaches, thresholds.soundEnabled]);

  const handleAcknowledgeAlert = (id: string) => {
    setAcknowledgedAlertIds((prev) => new Set(prev).add(id));
  };

  const handleClearAllAlerts = () => {
    setAlertHistory([]);
    setAcknowledgedAlertIds(new Set(activeBreaches.map((b) => b.id)));
  };

  const handleSaveThresholds = (newSettings: ThresholdSettings) => {
    setThresholds(newSettings);
    saveThresholdSettings(newSettings);
    // Reset acknowledgements so new bounds apply immediately
    setAcknowledgedAlertIds(new Set());
  };

  // AI Diagnostic report (re-computed dynamically for current reading)
  const currentDiagnosis: DiagnosisReport = useMemo(() => {
    return diagnoseSolarPanelHealth(currentReading);
  }, [currentReading]);

  // Daily KPIs calculated over history
  const dailyKPIs: DailySummaryKPIs = useMemo(() => {
    return calculateDailyKPIs(history);
  }, [history]);

  // ESP32 Node & Firebase states
  const [esp32Status, setEsp32Status] = useState<ESP32NodeStatus>(INITIAL_ESP32_STATUS);

  // Real-time evaluation of ESP32 abnormal sensor telemetry (pin-by-pin & protocol envelope)
  const esp32Anomalies = useMemo(() => {
    return evaluateESP32Anomalies(currentReading, thresholds, esp32Status);
  }, [currentReading, thresholds, esp32Status]);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConnectionConfig>({
    enabled: false,
    apiKey: '',
    databaseURL: 'https://solar-aiot-default-rtdb.firebaseio.com',
    projectId: 'solar-aiot-demo',
    streamPath: 'esp32_nodes/solar_01/telemetry',
    autoSync: true,
  });

  // Modal dialog states
  const [isEspModalOpen, setIsEspModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Stream generator callback
  const pushNextReading = useCallback(() => {
    const newReading = generateSensorReading(0, faultMode);
    setHistory((prev) => {
      // Keep a buffer of max 100 historical readings
      const updated = [...prev, newReading];
      if (updated.length > 100) updated.shift();
      return updated;
    });

    // Update ESP32 ping time
    setEsp32Status((prev) => ({
      ...prev,
      lastPingMs: Date.now(),
    }));
  }, [faultMode]);

  // Real-time streaming timer
  useEffect(() => {
    if (!isStreaming) return;

    const intervalTimer = setInterval(() => {
      pushNextReading();
    }, samplingInterval * 1000);

    return () => clearInterval(intervalTimer);
  }, [isStreaming, samplingInterval, pushNextReading]);

  // Handle fault scenario selection
  const handleSelectFaultMode = (mode: SimulationFaultMode) => {
    setFaultMode(mode);
    setSimulationFaultMode(mode);
    // Push an immediate reading reflecting the newly selected fault condition
    const immediateReading = generateSensorReading(0, mode);
    setHistory((prev) => [...prev.slice(1), immediateReading]);
  };

  // Reset stream buffer
  const handleResetStream = () => {
    setFaultMode('nominal');
    setSimulationFaultMode('nominal');
    setHistory(generateSeedHistoricalData(35));
  };

  // Deep AI Scan trigger
  const handleRunDeepScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Power Substation & Electric Grid Atmosphere Background Layer */}
      <GridSubstationBackground mode={bgMode} />

      {/* 1. Header Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        esp32Status={esp32Status}
        currentSeverity={currentDiagnosis.severity}
        onOpenEspModal={() => setIsEspModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        bgMode={bgMode}
        onCycleBgMode={handleCycleBgMode}
        onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
        activeBreachCount={activeBreaches.length}
        anomalyCount={esp32Anomalies.length}
      />

      {/* 2. DEMO DATA Banner & Scenario Injector */}
      <DemoBanner
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming((prev) => !prev)}
        activeFaultMode={faultMode}
        onSelectFaultMode={handleSelectFaultMode}
        samplingInterval={samplingInterval}
        onSelectInterval={setSamplingInterval}
        onResetStream={handleResetStream}
      />

      {/* 3. Main Dashboard Body */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Real-Time Out-Of-Bounds Alert Notification Banner */}
        <ActiveAlertNotifications
          activeBreaches={activeBreaches}
          alertHistory={alertHistory}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onClearAllAlerts={handleClearAllAlerts}
          onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
        />

        {/* TAB 1: OVERVIEW (Complete Consolidated View) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row: System Status & Hardware Showcase Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {/* Left 2 Cols: Health Status Section */}
              <div className="lg:col-span-2">
                <HealthStatusSection
                  reading={currentReading}
                  diagnosis={currentDiagnosis}
                />
              </div>

              {/* Right Col: Physical Solar Module & ESP32 Node Showcase Card */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/75 p-4 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-hero text-sm font-bold uppercase tracking-wider text-slate-200">
                      Physical Node Enclosure
                    </span>
                    <span className="font-hero text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-900">
                      IP65 Weatherproof
                    </span>
                  </div>

                  {/* Generated Photographic Asset with Fallback */}
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-800/80 mb-3 bg-slate-950">
                    <img
                      src={SOLAR_IMAGE_PATH}
                      alt="Solar panel with ESP32 node enclosure"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback container if needed
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between font-hero text-xs tracking-wider uppercase text-white/95">
                      <span>Monocrystalline 100W Array</span>
                      <span>ESP32-WROOM-32D</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Edge node correlates real-time temperature, irradiance, and electrical data
                    every {samplingInterval}s to identify early-stage degradation.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    Wi-Fi: <span className="text-slate-200">{esp32Status.wifiSsid}</span>
                  </span>
                  <button
                    onClick={() => setIsEspModalOpen(true)}
                    className="font-hero text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Node Specs</span>
                    <Cpu className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ESP32 Abnormal Reading & Sensor Anomaly Diagnostic Center */}
            <ESP32AbnormalReadingSection
              anomalies={esp32Anomalies}
              currentReading={currentReading}
              esp32Status={esp32Status}
              thresholds={thresholds}
              activeFaultMode={faultMode}
              onSimulateFault={handleSelectFaultMode}
              onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
              history={history}
            />

            {/* Sensor Cards Grid (All 7 required sensors) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-hero text-lg font-bold uppercase tracking-wider text-white">
                    7-Channel Sensor Telemetry Matrix
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Live Buffer: {history.length} frames
                </span>
              </div>
              <SensorCardsGrid
                reading={currentReading}
                previousReading={previousReading}
                thresholds={thresholds}
                onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
              />
            </div>

            {/* AI Fault Diagnosis Section */}
            <AiFaultDiagnosisSection
              diagnosis={currentDiagnosis}
              reading={currentReading}
              onSimulateFault={handleSelectFaultMode}
              onRunDeepScan={handleRunDeepScan}
              isScanning={isScanning}
            />

            {/* Real-Time Line Graphs */}
            <InteractiveTelemetryCharts history={history} />

            {/* Panel Performance Summary & Historical Data */}
            <PerformanceSummarySection history={history} kpis={dailyKPIs} />
          </div>
        )}

        {/* TAB 2: TELEMETRY VIEW */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* ESP32 Abnormal Reading & Sensor Anomaly Diagnostic Center */}
            <ESP32AbnormalReadingSection
              anomalies={esp32Anomalies}
              currentReading={currentReading}
              esp32Status={esp32Status}
              thresholds={thresholds}
              activeFaultMode={faultMode}
              onSimulateFault={handleSelectFaultMode}
              onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
              history={history}
            />

            <SensorCardsGrid
              reading={currentReading}
              previousReading={previousReading}
              thresholds={thresholds}
              onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
            />
            <InteractiveTelemetryCharts history={history} />
          </div>
        )}

        {/* TAB 3: AI DIAGNOSIS VIEW */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-6">
            <HealthStatusSection
              reading={currentReading}
              diagnosis={currentDiagnosis}
            />
            {/* ESP32 Abnormal Reading & Sensor Anomaly Diagnostic Center */}
            <ESP32AbnormalReadingSection
              anomalies={esp32Anomalies}
              currentReading={currentReading}
              esp32Status={esp32Status}
              thresholds={thresholds}
              activeFaultMode={faultMode}
              onSimulateFault={handleSelectFaultMode}
              onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
              history={history}
            />
            <AiFaultDiagnosisSection
              diagnosis={currentDiagnosis}
              reading={currentReading}
              onSimulateFault={handleSelectFaultMode}
              onRunDeepScan={handleRunDeepScan}
              isScanning={isScanning}
            />
          </div>
        )}

        {/* TAB 4: ANALYTICS & HISTORICAL LOGS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <PerformanceSummarySection history={history} kpis={dailyKPIs} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-slate-800/70 bg-slate-950/80 backdrop-blur-xl py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-captain text-base tracking-wider text-white">
              HELIOS<span className="text-emerald-400">AI</span>
            </span>
            <span>·</span>
            <span className="font-hero uppercase tracking-wider text-slate-300">ESP32 AIoT Photovoltaic Diagnostics Console</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-hero uppercase tracking-wider text-slate-400">
            <span>Sensors: DS18B20 · DHT22 · LDR · INA219</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">Firmware {esp32Status.firmwareVersion}</span>
          </div>
        </div>
      </footer>

      {/* ESP32 Hardware Status Modal */}
      <ESP32ConnectivityModal
        isOpen={isEspModalOpen}
        onClose={() => setIsEspModalOpen(false)}
        status={esp32Status}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
        anomalies={esp32Anomalies}
      />

      {/* Firebase Cloud Sync Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        config={firebaseConfig}
        onSaveConfig={(newConfig) => {
          setFirebaseConfig(newConfig);
          if (newConfig.enabled) {
            setEsp32Status((prev) => ({
              ...prev,
              dataSource: 'firebase',
            }));
          }
        }}
      />

      {/* User-Configurable Threshold Alert Rules Modal */}
      <ThresholdConfigModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
        currentReading={currentReading}
      />
    </div>
  );
}
