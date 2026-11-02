/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type BackgroundMode = 'balanced' | 'vivid' | 'focused';

interface GridSubstationBackgroundProps {
  mode: BackgroundMode;
}

export const GridSubstationBackground: React.FC<GridSubstationBackgroundProps> = ({ mode }) => {
  const imageSrc = '/assets/aistudio/Data_centers_could_significantly_boost_electric_bills__study_finds_9e958f59.jpeg';

  // Opacity & scrim parameters based on mode
  const getScrimStyles = () => {
    switch (mode) {
      case 'vivid':
        return {
          imageBrightness: 'brightness-90 contrast-105 saturate-110',
          scrimGradient: 'from-slate-950/75 via-slate-950/65 to-slate-950/85',
          dotOpacity: 'opacity-10',
          vignette: 'radial-gradient(circle at 15% 45%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
        };
      case 'focused':
        return {
          imageBrightness: 'brightness-60 contrast-100 saturate-90',
          scrimGradient: 'from-slate-950/92 via-slate-950/88 to-slate-950/95',
          dotOpacity: 'opacity-15',
          vignette: 'radial-gradient(circle at 15% 45%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)',
        };
      case 'balanced':
      default:
        return {
          imageBrightness: 'brightness-75 contrast-105 saturate-105',
          scrimGradient: 'from-slate-950/85 via-slate-950/75 to-slate-950/90',
          dotOpacity: 'opacity-12',
          vignette: 'radial-gradient(circle at 15% 45%, rgba(245, 158, 11, 0.12) 0%, transparent 55%)',
        };
    }
  };

  const current = getScrimStyles();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Base Grid Substation Photography */}
      <img
        src={imageSrc}
        alt="High Voltage Electrical Grid Substation and Transmission Pylons"
        className={`w-full h-full object-cover object-center transform scale-[1.02] transition-all duration-700 ${current.imageBrightness}`}
      />

      {/* 2. Solar Golden Sunset Ambient Radial Vignette */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ background: current.vignette }}
      />

      {/* 3. Multi-Stop Scrim for Flawless Dashboard Typography Legibility */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${current.scrimGradient} transition-all duration-700`}
      />

      {/* 4. Fine Technical Grid Overlay (Engineering SCADA Mesh) */}
      <div
        className={`absolute inset-0 tech-dot-grid ${current.dotOpacity} transition-opacity duration-700`}
      />

      {/* 5. Delicate Horizontal Horizon Ray (simulating high-voltage bus line) */}
      <div className="absolute top-[38%] inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
      <div className="absolute top-[42%] inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />
    </div>
  );
};
