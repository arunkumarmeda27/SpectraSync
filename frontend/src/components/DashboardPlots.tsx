import React, { useEffect, useRef } from 'react';
import type {
  ConstellationVisualization,
  FftVisualization,
  SpectrogramVisualization,
  WaveformVisualization,
} from '../types/visualizations';

// Real backend-driven plotting only. No generated waveform/spectrum/constellation data.

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatFrequencyLabel = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(3)} MHz`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(3)} kHz`;
  return `${value.toFixed(0)} Hz`;
};

export const LiveSignalSpectrum: React.FC<{
  data?: FftVisualization | null;
  centerFreq?: number;
  span?: number;
}> = ({ data, centerFreq: _centerFreq, span: _span }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.frequencies?.length || !data.magnitudes_db?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 52;
    const padB = 34;
    const padR = 14;
    const padT = 14;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';

    const freqs = data.frequencies;
    const mags = data.magnitudes_db;
    const minDb = Math.min(...mags);
    const maxDb = Math.max(...mags);
    const dbRange = maxDb - minDb || 1;

    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      const label = (maxDb - (i / 5) * dbRange).toFixed(0);
      ctx.textAlign = 'right';
      ctx.fillText(`${label} dB`, padL - 6, y + 3);
    }

    const minFreq = freqs[0];
    const maxFreq = freqs[freqs.length - 1];
    const freqRange = maxFreq - minFreq || 1;

    for (let i = 0; i <= 6; i++) {
      const x = padL + (i / 6) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      const freq = minFreq + (i / 6) * freqRange;
      ctx.textAlign = 'center';
      ctx.fillText(formatFrequencyLabel(freq), x, height - 14);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Frequency', padL + plotW / 2, height - 2);
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Power (dB)', 0, 0);
    ctx.restore();

    ctx.shadowBlur = 8;
    ctx.shadowColor = '#3b82f6';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    mags.forEach((mag, index) => {
      const x = padL + (index / (mags.length - 1)) * plotW;
      const yNorm = (mag - minDb) / dbRange;
      const y = padT + (1 - clamp(yNorm, 0, 1)) * plotH;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (typeof data.peak_frequency_hz === 'number' && typeof data.peak_power_dbfs === 'number') {
      const peakIdx = freqs.findIndex((freq) => Math.abs(freq - data.peak_frequency_hz!) < 1e-6);
      const markerX = padL + (peakIdx >= 0 ? peakIdx / (freqs.length - 1) : 0.5) * plotW;
      const markerY = padT + (1 - clamp((data.peak_power_dbfs - minDb) / dbRange, 0, 1)) * plotH;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(markerX, markerY);
      ctx.lineTo(markerX, height - padB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatFrequencyLabel(data.peak_frequency_hz), markerX, markerY - 8);
      ctx.fillText(`${data.peak_power_dbfs.toFixed(1)} dB`, markerX, markerY - 20);
    }
  }, [data]);

  if (!data || !data.frequencies?.length || !data.magnitudes_db?.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b', fontSize: '0.8rem' }}>FFT unavailable</div>;
  }

  return <canvas ref={canvasRef} width={700} height={280} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

export const WaterfallSpectrogram: React.FC<{
  data?: SpectrogramVisualization | null;
}> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.times?.length || !data.frequencies?.length || !data.power_matrix_db?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 52;
    const padB = 34;
    const padR = 60;
    const padT = 14;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    const matrix = data.power_matrix_db;
    const minDb = data.min_db ?? Math.min(...matrix.flat());
    const maxDb = data.max_db ?? Math.max(...matrix.flat());
    const dbRange = maxDb - minDb || 1;

    const freqBins = matrix.length;
    const timeBins = matrix[0]?.length || 0;
    if (!timeBins) return;

    const cellW = plotW / timeBins;
    const cellH = plotH / freqBins;

    for (let t = 0; t < timeBins; t++) {
      for (let f = 0; f < freqBins; f++) {
        const power = matrix[f][t];
        const intensity = clamp((power - minDb) / dbRange, 0, 1);
        ctx.fillStyle = getTurboColor(intensity);
        const x = padL + t * cellW;
        const y = padT + (freqBins - 1 - f) * cellH;
        ctx.fillRect(x, y, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
      }
    }

    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const x = padL + (i / 4) * plotW;
      const t = data.times[0] + (i / 4) * (data.times[data.times.length - 1] - data.times[0]);
      ctx.fillText(`${t.toFixed(2)}s`, x, height - 14);
    }
    ctx.fillText('Time (s)', padL + plotW / 2, height - 2);

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      const f = data.frequencies[0] + (1 - i / 4) * (data.frequencies[data.frequencies.length - 1] - data.frequencies[0]);
      ctx.fillText(formatFrequencyLabel(f), padL - 6, y + 4);
    }
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency', 0, 0);
    ctx.restore();

    const barX = width - padR + 16;
    const barY = padT;
    const barH = plotH;
    for (let i = 0; i < 100; i++) {
      const intensity = 1 - i / 100;
      ctx.fillStyle = getTurboColor(intensity);
      ctx.fillRect(barX, barY + (i / 100) * barH, 18, Math.max(1, barH / 100));
    }
    ctx.strokeStyle = '#1a2645';
    ctx.strokeRect(barX, barY, 18, barH);
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillText(`${maxDb.toFixed(0)} dB`, barX + 24, barY + 10);
    ctx.fillText(`${minDb.toFixed(0)} dB`, barX + 24, barY + barH);
  }, [data]);

  if (!data || !data.times?.length || !data.frequencies?.length || !data.power_matrix_db?.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b', fontSize: '0.8rem' }}>Spectrogram unavailable</div>;
  }

  return <canvas ref={canvasRef} width={700} height={300} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

export const TimeDomainWaveform: React.FC<{
  data?: WaveformVisualization | null;
}> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.time?.length || !data.i_samples?.length || !data.q_samples?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    const padL = 52;
    const padB = 34;
    const padR = 12;
    const padT = 14;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const samples = data.i_samples;
    const minVal = Math.min(...samples, ...data.q_samples);
    const maxVal = Math.max(...samples, ...data.q_samples);
    const range = maxVal - minVal || 1;

    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';

    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      const label = (maxVal - (i / 5) * range).toFixed(2);
      ctx.textAlign = 'right';
      ctx.fillText(label, padL - 6, y + 3);
    }

    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW;
      const t = data.time[0] + (i / 5) * (data.time[data.time.length - 1] - data.time[0]);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(`${(t * 1000).toFixed(2)} ms`, x, height - 14);
    }

    const drawSeries = (values: number[], color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      values.forEach((value, index) => {
        const x = padL + (index / (values.length - 1)) * plotW;
        const y = padT + (1 - clamp((value - minVal) / range, 0, 1)) * plotH;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawSeries(data.i_samples, '#3b82f6');
    drawSeries(data.q_samples, '#10b981');

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Time (ms)', padL + plotW / 2, height - 2);
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();
  }, [data]);

  if (!data || !data.time?.length || !data.i_samples?.length || !data.q_samples?.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b', fontSize: '0.8rem' }}>Waveform unavailable</div>;
  }

  return <canvas ref={canvasRef} width={700} height={220} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

export const ConstellationDiagram: React.FC<{
  data?: ConstellationVisualization | null;
  modulation?: string;
}> = ({ data, modulation }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.i?.length || !data.q?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    const padL = 42;
    const padB = 32;
    const padR = 12;
    const padT = 12;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxAbsI = Math.max(...data.i.map(Math.abs), 1);
    const maxAbsQ = Math.max(...data.q.map(Math.abs), 1);
    const maxAbs = Math.max(maxAbsI, maxAbsQ);
    const range = maxAbs * 2.0;

    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      const value = (maxAbs - (i / 4) * range).toFixed(1);
      ctx.fillText(value, padL - 6, y + 3);
    }

    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const x = padL + (i / 4) * plotW;
      const value = (-maxAbs + (i / 4) * range).toFixed(1);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(value, x, height - 14);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('In-Phase (I)', padL + plotW / 2, height - 2);
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Quadrature (Q)', 0, 0);
    ctx.restore();

    const step = Math.max(1, Math.floor(data.i.length / 5000));
    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    for (let idx = 0; idx < data.i.length; idx += step) {
      const x = padL + ((data.i[idx] + maxAbs) / range) * plotW;
      const y = padT + ((-data.q[idx] + maxAbs) / range) * plotH;
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (modulation) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(modulation, width - 10, 18);
    }
  }, [data, modulation]);

  if (!data || !data.i?.length || !data.q?.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b', fontSize: '0.8rem' }}>Constellation unavailable</div>;
  }

  return <canvas ref={canvasRef} width={360} height={240} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

export const MiniConstellationPlot: React.FC<{
  data?: ConstellationVisualization | null;
  modulation?: string;
}> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.i?.length || !data.q?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxAbs = Math.max(...data.i.map(Math.abs), ...data.q.map(Math.abs), 1);
    const scale = Math.min(width, height) * 0.28;

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    const step = Math.max(1, Math.floor(data.i.length / 500));
    for (let idx = 0; idx < data.i.length; idx += step) {
      const x = centerX + (data.i[idx] / maxAbs) * scale;
      const y = centerY - (data.q[idx] / maxAbs) * scale;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [data]);

  if (!data || !data.i?.length || !data.q?.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b', fontSize: '0.72rem' }}>No constellation</div>;
  }

  return <canvas ref={canvasRef} width={120} height={120} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

function getTurboColor(intensity: number): string {
  const t = clamp(intensity, 0, 1);
  const r = Math.floor(clamp(34.61 + t * (1172.33 - 10793.56 * t + 33300.12 * t * t - 38774.16 * t * t * t + 16211.12 * t * t * t * t), 0, 255));
  const g = Math.floor(clamp(23.31 + t * (557.33 + 1225.33 * t - 3574.96 * t * t + 1073.77 * t * t * t), 0, 255));
  const b = Math.floor(clamp(27.2 + t * (3211.1 - 15327.97 * t + 27814.0 * t * t - 22569.18 * t * t * t + 6838.66 * t * t * t * t), 0, 255));
  return `rgb(${r}, ${g}, ${b})`;
}
