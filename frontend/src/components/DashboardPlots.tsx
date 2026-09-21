import React, { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// Dark Workstation Canvas Visualizations
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Live Signal Spectrum (FFT Power Spectral Density) ─────────────────────
export const LiveSignalSpectrum: React.FC<{
  data?: number[];
  centerFreq?: number;
  span?: number;
}> = ({ data, centerFreq = 437.123, span = 2.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Margins
    const padL = 50;
    const padB = 35;
    const padR = 15;
    const padT = 15;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Dark Background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    // Grid lines (subtle dark blue)
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;

    // Horizontal grid (Power dB: 0, -20, -40, -60, -80, -100)
    const yLabels = ['0', '-20', '-40', '-60', '-80', '-100'];
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label + ' dB', padL - 6, y + 4);
    });

    // Vertical grid (Frequency axis)
    const freqStart = centerFreq - span / 2;
    const numFreqTicks = 7;
    for (let i = 0; i < numFreqTicks; i++) {
      const freq = freqStart + (i / (numFreqTicks - 1)) * span;
      const x = padL + (i / (numFreqTicks - 1)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(freq.toFixed(2), x, height - 18);
    }

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (MHz)', padL + plotW / 2, height - 2);
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Power (dB)', 0, 0);
    ctx.restore();

    // Generate realistic spectrum trace
    const numPoints = 600;
    const spectrumData: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      const freqNorm = i / numPoints;
      const freq = freqStart + freqNorm * span;
      const distFromCenter = Math.abs(freq - centerFreq);

      // Gaussian-shaped signal peak at center frequency
      const signalPeak = -12.4 * Math.exp(-Math.pow(distFromCenter / 0.12, 2));

      // Noise floor with small random variations
      const noiseFloor = -85 + (Math.random() - 0.5) * 8;

      // Combine signal + noise
      const power = Math.max(signalPeak, noiseFloor);
      spectrumData.push(power);
    }

    // Draw spectrum trace with neon glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#3b82f6';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    for (let i = 0; i < spectrumData.length; i++) {
      const x = padL + (i / (spectrumData.length - 1)) * plotW;
      const powerDb = spectrumData[i];
      const yNorm = (powerDb - 0) / (-100 - 0);
      const y = padT + yNorm * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Peak marker at center frequency
    const peakX = padL + 0.5 * plotW;
    const peakY = padT + ((-12.4 - 0) / (-100 - 0)) * plotH;

    // Dashed line to peak
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(peakX, height - padB);
    ctx.stroke();
    ctx.setLineDash([]);

    // Peak annotation
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${centerFreq.toFixed(3)} MHz`, peakX, peakY - 8);
    ctx.fillText('-12.4 dB', peakX, peakY - 20);

  }, [data, centerFreq, span]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={280}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── 2. Waterfall Spectrogram (STFT Time-Frequency Heatmap) ───────────────────
export const WaterfallSpectrogram: React.FC<{
  data?: number[][];
}> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 50;
    const padB = 35;
    const padR = 60; // Right margin for colorbar
    const padT = 15;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    // Generate spectrogram data (time x frequency)
    const numTimeSteps = 80;
    const numFreqBins = 256;
    const spectrogramData: number[][] = [];

    for (let t = 0; t < numTimeSteps; t++) {
      const row: number[] = [];
      for (let f = 0; f < numFreqBins; f++) {
        const centerBin = numFreqBins / 2;
        const distFromCenter = Math.abs(f - centerBin);

        // Strong signal at center frequency bin
        const signalStrength = Math.exp(-Math.pow(distFromCenter / 30, 2));
        const noise = Math.random() * 0.15;
        const intensity = Math.min(1.0, signalStrength * 0.85 + noise);

        row.push(intensity);
      }
      spectrogramData.push(row);
    }

    // Draw spectrogram as heatmap
    const cellW = plotW / numTimeSteps;
    const cellH = plotH / numFreqBins;

    for (let t = 0; t < numTimeSteps; t++) {
      for (let f = 0; f < numFreqBins; f++) {
        const intensity = spectrogramData[t][f];
        const color = getTurboColor(intensity);
        ctx.fillStyle = color;
        const x = padL + t * cellW;
        const y = padT + (numFreqBins - 1 - f) * cellH;
        ctx.fillRect(x, y, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
      }
    }

    // Axes
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Time axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const t = i * 5;
      const x = padL + (i / 4) * plotW;
      ctx.fillText(`${t}s`, x, height - 18);
    }
    ctx.fillText('Time (s)', padL + plotW / 2, height - 2);

    // Frequency axis labels
    ctx.textAlign = 'right';
    const freqs = [436.6, 436.9, 437.2, 437.5, 437.8];
    freqs.forEach((freq, idx) => {
      const y = padT + plotH - (idx / (freqs.length - 1)) * plotH;
      ctx.fillText(`${freq.toFixed(1)}`, padL - 6, y + 4);
    });
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency (MHz)', 0, 0);
    ctx.restore();

    // Colorbar
    const barX = width - padR + 15;
    const barW = 18;
    const barH = plotH;
    const barY = padT;
    for (let i = 0; i < 100; i++) {
      const intensity = 1.0 - i / 100;
      ctx.fillStyle = getTurboColor(intensity);
      ctx.fillRect(barX, barY + (i / 100) * barH, barW, barH / 100 + 1);
    }
    ctx.strokeStyle = '#1a2645';
    ctx.strokeRect(barX, barY, barW, barH);

    // Colorbar labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0 dB', barX + barW + 4, barY + 10);
    ctx.fillText('-100 dB', barX + barW + 4, barY + barH);

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={300}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── 3. Time Domain Waveform (I/Q Signal) ──────────────────────────────────────
export const TimeDomainWaveform: React.FC<{
  data?: { i: number[]; q: number[] };
}> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 45;
    const padB = 30;
    const padR = 12;
    const padT = 12;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    const yLabels = ['1.0', '0.5', '0', '-0.5', '-1.0'];
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label, padL - 6, y + 3);
    });

    // Time ticks
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i += 2) {
      const x = padL + (i / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(`${i}`, x, height - 16);
    }
    ctx.fillText('Time (ms)', padL + plotW / 2, height - 2);

    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();

    // Synthesize high-density modulated carrier
    const numPoints = 800;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#3b82f6';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * 10; // 10ms span
      const envelope = 0.5 + 0.35 * Math.sin(t * 1.2) * Math.cos(t * 0.6);
      const carrier = Math.sin(t * 60.0 + Math.sin(t * 2.5));
      const val = Math.max(-1, Math.min(1, envelope * carrier));

      const x = padL + (i / (numPoints - 1)) * plotW;
      const y = padT + ((-val + 1) / 2) * plotH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={220}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── 4. Constellation Diagram (I/Q Scatter) ────────────────────────────────────
export const ConstellationDiagram: React.FC<{
  data?: { i: number[]; q: number[] };
  modulation?: string;
}> = ({ data, modulation = 'QPSK' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 42;
    const padB = 32;
    const padR = 12;
    const padT = 12;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    // Grid (I and Q axes from -2 to +2)
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;

    // Horizontal lines
    const yLabels = ['2', '1', '0', '-1', '-2'];
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label, padL - 6, y + 3);
    });

    // Vertical lines
    ctx.textAlign = 'center';
    yLabels.forEach((label, idx) => {
      const x = padL + (idx / (yLabels.length - 1)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(label, x, height - 16);
    });

    // Axes labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('In-Phase (I)', padL + plotW / 2, height - 2);
    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Quadrature (Q)', 0, 0);
    ctx.restore();

    // Generate QPSK constellation points with noise
    const numPoints = 1200;
    const clusters = [
      { i: 0.707, q: 0.707 },
      { i: -0.707, q: 0.707 },
      { i: -0.707, q: -0.707 },
      { i: 0.707, q: -0.707 }
    ];

    for (let p = 0; p < numPoints; p++) {
      const cluster = clusters[Math.floor(Math.random() * 4)];
      const noiseI = (Math.random() - 0.5) * 0.15;
      const noiseQ = (Math.random() - 0.5) * 0.15;
      const iVal = cluster.i + noiseI;
      const qVal = cluster.q + noiseQ;

      const xCanvas = padL + ((iVal + 2) / 4) * plotW;
      const yCanvas = padT + ((-qVal + 2) / 4) * plotH;

      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.beginPath();
      ctx.arc(xCanvas, yCanvas, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw glow at cluster centers
    clusters.forEach(cluster => {
      const xCanvas = padL + ((cluster.i + 2) / 4) * plotW;
      const yCanvas = padT + ((-cluster.q + 2) / 4) * plotH;

      const gradient = ctx.createRadialGradient(xCanvas, yCanvas, 0, xCanvas, yCanvas, 20);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(xCanvas, yCanvas, 20, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [data, modulation]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={240}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── 5. Mini Constellation for Signal DNA Card ─────────────────────────────────
export const MiniConstellationPlot: React.FC<{
  modulation?: string;
}> = ({ modulation = 'QPSK' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    // QPSK 4 clusters
    const clusters = [
      { i: 0.65, q: 0.65 },
      { i: -0.65, q: 0.65 },
      { i: -0.65, q: -0.65 },
      { i: 0.65, q: -0.65 }
    ];

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.32;

    clusters.forEach(cluster => {
      const x = centerX + cluster.i * scale;
      const y = centerY - cluster.q * scale;

      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crosshair axes
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

  }, [modulation]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Turbo Colormap (Perceptually uniform intensity → color)
// ═══════════════════════════════════════════════════════════════════════════════
function getTurboColor(intensity: number): string {
  // Clamp 0-1
  const t = Math.max(0, Math.min(1, intensity));

  // Turbo color approximation
  const r = Math.floor(Math.max(0, Math.min(255, 34.61 + t * (1172.33 - 10793.56 * t + 33300.12 * t * t - 38774.16 * t * t * t + 16211.12 * t * t * t * t))));
  const g = Math.floor(Math.max(0, Math.min(255, 23.31 + t * (557.33 + 1225.33 * t - 3574.96 * t * t + 1073.77 * t * t * t))));
  const b = Math.floor(Math.max(0, Math.min(255, 27.2 + t * (3211.1 - 15327.97 * t + 27814.0 * t * t - 22569.18 * t * t * t + 6838.66 * t * t * t * t))));

  return `rgb(${r},${g},${b})`;
}
