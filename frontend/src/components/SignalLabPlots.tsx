import React, { useEffect, useRef, useState } from 'react';
import type {
  WaveformVisualization,
  FftVisualization,
  SpectrogramVisualization,
  ConstellationVisualization
} from '../types/visualizations';

// ═══════════════════════════════════════════════════════════════════════════════
// Real Signal Lab Visualizations - Canvas-based for performance
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Time Domain Waveform (Real I/Q Data) ───────────────────────────────────
interface WaveformProps {
  data: WaveformVisualization | null;
  height?: number;
}

type WaveformMode = 'i' | 'q' | 'magnitude';

export const RealTimeDomainWaveform: React.FC<WaveformProps> = ({ data, height = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<WaveformMode>('i');
  const [zoom, setZoom] = useState({ start: 0, end: 1 });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; time: number; value: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.time.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, width, canvasHeight);

    const padL = 50, padB = 35, padR = 15, padT = 15;
    const plotW = width - padL - padR;
    const plotH = canvasHeight - padT - padB;

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, canvasHeight);

    // Get selected data
    const timeData = data.time;
    const values = mode === 'i' ? data.i_samples :
                   mode === 'q' ? data.q_samples :
                   data.i_samples.map((i, idx) => Math.sqrt(i * i + data.q_samples[idx] * data.q_samples[idx]));

    if (!values.length) return;

    // Apply zoom
    const startIdx = Math.floor(zoom.start * values.length);
    const endIdx = Math.ceil(zoom.end * values.length);
    const zoomedTime = timeData.slice(startIdx, endIdx);
    const zoomedValues = values.slice(startIdx, endIdx);

    if (!zoomedValues.length) return;

    // Find min/max for scaling
    const minVal = Math.min(...zoomedValues);
    const maxVal = Math.max(...zoomedValues);
    const range = maxVal - minVal || 1.0;

    // Grid
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';

    // Y-axis labels
    ctx.textAlign = 'right';
    const numYTicks = 5;
    for (let i = 0; i < numYTicks; i++) {
      const y = padT + (i / (numYTicks - 1)) * plotH;
      const val = maxVal - (i / (numYTicks - 1)) * range;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(val.toFixed(2), padL - 6, y + 3);
    }

    // X-axis labels (time)
    ctx.textAlign = 'center';
    const numXTicks = 6;
    for (let i = 0; i < numXTicks; i++) {
      const x = padL + (i / (numXTicks - 1)) * plotW;
      const timeVal = zoomedTime[0] + (i / (numXTicks - 1)) * (zoomedTime[zoomedTime.length - 1] - zoomedTime[0]);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, canvasHeight - padB);
      ctx.stroke();
      ctx.fillText((timeVal * 1000).toFixed(2), x, canvasHeight - 16);
    }
    ctx.fillText('Time (ms)', padL + plotW / 2, canvasHeight - 2);

    // Y-axis label
    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();

    // Draw waveform
    ctx.shadowBlur = 6;
    ctx.shadowColor = mode === 'i' ? '#3b82f6' : mode === 'q' ? '#10b981' : '#a855f7';
    ctx.strokeStyle = mode === 'i' ? '#3b82f6' : mode === 'q' ? '#10b981' : '#a855f7';
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    for (let i = 0; i < zoomedValues.length; i++) {
      const x = padL + (i / (zoomedValues.length - 1)) * plotW;
      const yNorm = (zoomedValues[i] - minVal) / range;
      const y = padT + (1 - yNorm) * plotH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [data, mode, zoom]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!data || !data.time.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padL = 50, padR = 15;
    const plotW = canvas.width - padL - padR;

    if (x >= padL && x <= canvas.width - padR) {
      const ratio = (x - padL) / plotW;
      const startIdx = Math.floor(zoom.start * data.time.length);
      const endIdx = Math.ceil(zoom.end * data.time.length);
      const idx = startIdx + Math.floor(ratio * (endIdx - startIdx));

      if (idx >= 0 && idx < data.time.length) {
        const values = mode === 'i' ? data.i_samples :
                       mode === 'q' ? data.q_samples :
                       data.i_samples.map((i, idx) => Math.sqrt(i * i + data.q_samples[idx] * data.q_samples[idx]));
        setHoveredPoint({ x, y, time: data.time[idx], value: values[idx] });
        return;
      }
    }
    setHoveredPoint(null);
  };

  if (!data || !data.time.length) {
    return (
      <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        No waveform data available
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '4px', zIndex: 10 }}>
        <button
          onClick={() => setMode('i')}
          style={{
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: mode === 'i' ? '1px solid #3b82f6' : '1px solid #1a2645',
            borderRadius: '4px',
            background: mode === 'i' ? 'rgba(59, 130, 246, 0.2)' : '#0a0f1e',
            color: mode === 'i' ? '#3b82f6' : '#64748b',
            cursor: 'pointer'
          }}
        >
          I
        </button>
        <button
          onClick={() => setMode('q')}
          style={{
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: mode === 'q' ? '1px solid #10b981' : '1px solid #1a2645',
            borderRadius: '4px',
            background: mode === 'q' ? 'rgba(16, 185, 129, 0.2)' : '#0a0f1e',
            color: mode === 'q' ? '#10b981' : '#64748b',
            cursor: 'pointer'
          }}
        >
          Q
        </button>
        <button
          onClick={() => setMode('magnitude')}
          style={{
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: mode === 'magnitude' ? '1px solid #a855f7' : '1px solid #1a2645',
            borderRadius: '4px',
            background: mode === 'magnitude' ? 'rgba(168, 85, 247, 0.2)' : '#0a0f1e',
            color: mode === 'magnitude' ? '#a855f7' : '#64748b',
            cursor: 'pointer'
          }}
        >
          |IQ|
        </button>
        <button
          onClick={() => setZoom({ start: 0, end: 1 })}
          style={{
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: '1px solid #1a2645',
            borderRadius: '4px',
            background: '#0a0f1e',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={700}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      />
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: hoveredPoint.x + 10,
          top: hoveredPoint.y - 30,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #1a2645',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          color: '#f1f5f9',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          t={(hoveredPoint.time * 1000).toFixed(3)}ms, {mode.toUpperCase()}={hoveredPoint.value.toFixed(4)}
        </div>
      )}
    </div>
  );
};

// ─── 2. FFT / Frequency Spectrum (Real FFT Data) ───────────────────────────────
interface FftProps {
  data: FftVisualization | null;
  height?: number;
}

export const RealFrequencySpectrum: React.FC<FftProps> = ({ data, height = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; freq: number; power: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.frequencies.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, width, canvasHeight);

    const padL = 50, padB = 35, padR = 15, padT = 15;
    const plotW = width - padL - padR;
    const plotH = canvasHeight - padT - padB;

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, canvasHeight);

    const freqs = data.frequencies;
    const mags = data.magnitudes_db;

    if (!mags.length) return;

    // Find min/max for scaling
    const minDb = Math.min(...mags);
    const maxDb = Math.max(...mags);
    const dbRange = maxDb - minDb || 100;

    // Grid
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';

    // Y-axis (dB)
    ctx.textAlign = 'right';
    const numYTicks = 6;
    for (let i = 0; i < numYTicks; i++) {
      const y = padT + (i / (numYTicks - 1)) * plotH;
      const db = maxDb - (i / (numYTicks - 1)) * dbRange;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(db.toFixed(0) + ' dB', padL - 6, y + 4);
    }

    // X-axis (Frequency)
    ctx.textAlign = 'center';
    const minFreq = freqs[0];
    const maxFreq = freqs[freqs.length - 1];
    const freqRange = maxFreq - minFreq;
    const freqUnit = Math.abs(maxFreq) > 1e6 ? 'MHz' : Math.abs(maxFreq) > 1e3 ? 'kHz' : 'Hz';
    const freqScale = freqUnit === 'MHz' ? 1e6 : freqUnit === 'kHz' ? 1e3 : 1;

    const numXTicks = 7;
    for (let i = 0; i < numXTicks; i++) {
      const x = padL + (i / (numXTicks - 1)) * plotW;
      const freq = minFreq + (i / (numXTicks - 1)) * freqRange;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, canvasHeight - padB);
      ctx.stroke();
      ctx.fillText((freq / freqScale).toFixed(2), x, canvasHeight - 16);
    }
    ctx.fillText(`Frequency (${freqUnit})`, padL + plotW / 2, canvasHeight - 2);

    // Y-axis label
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Power (dB)', 0, 0);
    ctx.restore();

    // Draw spectrum
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#3b82f6';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    for (let i = 0; i < mags.length; i++) {
      const x = padL + (i / (mags.length - 1)) * plotW;
      const yNorm = (mags[i] - minDb) / dbRange;
      const y = padT + (1 - yNorm) * plotH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Peak marker if available
    if (data.peak_frequency_hz !== undefined && data.peak_power_dbfs !== undefined) {
      const peakIdx = freqs.findIndex(f => Math.abs(f - data.peak_frequency_hz!) < Math.abs(freqRange / mags.length));
      if (peakIdx >= 0) {
        const peakX = padL + (peakIdx / (mags.length - 1)) * plotW;
        const peakY = padT + (1 - (data.peak_power_dbfs - minDb) / dbRange) * plotH;

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(peakX, peakY);
        ctx.lineTo(peakX, canvasHeight - padB);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${(data.peak_frequency_hz / freqScale).toFixed(3)} ${freqUnit}`, peakX, peakY - 8);
        ctx.fillText(`${data.peak_power_dbfs.toFixed(1)} dB`, peakX, peakY - 20);
      }
    }

  }, [data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!data || !data.frequencies.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padL = 50, padR = 15;
    const plotW = canvas.width - padL - padR;

    if (x >= padL && x <= canvas.width - padR) {
      const ratio = (x - padL) / plotW;
      const idx = Math.floor(ratio * data.frequencies.length);
      if (idx >= 0 && idx < data.frequencies.length) {
        setHoveredPoint({ x, y, freq: data.frequencies[idx], power: data.magnitudes_db[idx] });
        return;
      }
    }
    setHoveredPoint(null);
  };

  if (!data || !data.frequencies.length) {
    return (
      <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        No FFT data available
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <canvas
        ref={canvasRef}
        width={700}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      />
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: hoveredPoint.x + 10,
          top: hoveredPoint.y - 30,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #1a2645',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          color: '#f1f5f9',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          {(hoveredPoint.freq / (Math.abs(hoveredPoint.freq) > 1e6 ? 1e6 : Math.abs(hoveredPoint.freq) > 1e3 ? 1e3 : 1)).toFixed(3)} {Math.abs(hoveredPoint.freq) > 1e6 ? 'MHz' : Math.abs(hoveredPoint.freq) > 1e3 ? 'kHz' : 'Hz'}, {hoveredPoint.power.toFixed(1)} dB
        </div>
      )}
    </div>
  );
};

// ─── 3. Spectrogram / Waterfall (Real STFT Data) ───────────────────────────────
interface SpectrogramProps {
  data: SpectrogramVisualization | null;
  height?: number;
}

export const RealWaterfallSpectrogram: React.FC<SpectrogramProps> = ({ data, height = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; time: number; freq: number; power: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.times.length || !data.frequencies.length || !data.power_matrix_db.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, width, canvasHeight);

    const padL = 50, padB = 35, padR = 60, padT = 15;
    const plotW = width - padL - padR;
    const plotH = canvasHeight - padT - padB;

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, canvasHeight);

    const times = data.times;
    const freqs = data.frequencies;
    const matrix = data.power_matrix_db;

    const minDb = data.min_db ?? Math.min(...matrix.flat());
    const maxDb = data.max_db ?? Math.max(...matrix.flat());
    const dbRange = maxDb - minDb || 100;

    // Draw spectrogram heatmap
    const numFreqBins = matrix.length;
    const numTimeBins = matrix[0]?.length || 0;

    if (numTimeBins === 0) return;

    const cellW = plotW / numTimeBins;
    const cellH = plotH / numFreqBins;

    for (let t = 0; t < numTimeBins; t++) {
      for (let f = 0; f < numFreqBins; f++) {
        const power = matrix[f][t];
        const intensity = (power - minDb) / dbRange;
        const color = getTurboColor(intensity);
        ctx.fillStyle = color;
        const x = padL + t * cellW;
        const y = padT + (numFreqBins - 1 - f) * cellH;
        ctx.fillRect(x, y, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
      }
    }

    // Border
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Time axis
    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const numTimeTicks = 5;
    for (let i = 0; i < numTimeTicks; i++) {
      const t = times[0] + (i / (numTimeTicks - 1)) * (times[times.length - 1] - times[0]);
      const x = padL + (i / (numTimeTicks - 1)) * plotW;
      ctx.fillText(t.toFixed(2) + 's', x, canvasHeight - 16);
    }
    ctx.fillText('Time (s)', padL + plotW / 2, canvasHeight - 2);

    // Frequency axis
    ctx.textAlign = 'right';
    const freqUnit = Math.abs(freqs[freqs.length - 1]) > 1e6 ? 'MHz' : Math.abs(freqs[freqs.length - 1]) > 1e3 ? 'kHz' : 'Hz';
    const freqScale = freqUnit === 'MHz' ? 1e6 : freqUnit === 'kHz' ? 1e3 : 1;
    const numFreqTicks = 5;
    for (let i = 0; i < numFreqTicks; i++) {
      const freq = freqs[0] + (i / (numFreqTicks - 1)) * (freqs[freqs.length - 1] - freqs[0]);
      const y = padT + plotH - (i / (numFreqTicks - 1)) * plotH;
      ctx.fillText((freq / freqScale).toFixed(1), padL - 6, y + 4);
    }
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Frequency (${freqUnit})`, 0, 0);
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

    ctx.fillStyle = '#64748b';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${maxDb.toFixed(0)} dB`, barX + barW + 4, barY + 10);
    ctx.fillText(`${minDb.toFixed(0)} dB`, barX + barW + 4, barY + barH);

  }, [data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!data || !data.times.length || !data.frequencies.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padL = 50, padB = 35, padR = 60, padT = 15;
    const plotW = canvas.width - padL - padR;
    const plotH = canvas.height - padT - padB;

    if (x >= padL && x <= canvas.width - padR && y >= padT && y <= canvas.height - padB) {
      const tRatio = (x - padL) / plotW;
      const fRatio = 1 - (y - padT) / plotH;

      const tIdx = Math.floor(tRatio * data.times.length);
      const fIdx = Math.floor(fRatio * data.frequencies.length);

      if (tIdx >= 0 && tIdx < data.times.length && fIdx >= 0 && fIdx < data.frequencies.length) {
        const power = data.power_matrix_db[fIdx][tIdx];
        setHoveredPoint({ x, y, time: data.times[tIdx], freq: data.frequencies[fIdx], power });
        return;
      }
    }
    setHoveredPoint(null);
  };

  if (!data || !data.times.length || !data.frequencies.length || !data.power_matrix_db.length) {
    return (
      <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        No spectrogram data available
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <canvas
        ref={canvasRef}
        width={700}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      />
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: hoveredPoint.x + 10,
          top: hoveredPoint.y - 40,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #1a2645',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          color: '#f1f5f9',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          t={hoveredPoint.time.toFixed(3)}s<br />
          f={(hoveredPoint.freq / (Math.abs(hoveredPoint.freq) > 1e6 ? 1e6 : 1e3)).toFixed(2)} {Math.abs(hoveredPoint.freq) > 1e6 ? 'MHz' : 'kHz'}<br />
          {hoveredPoint.power.toFixed(1)} dB
        </div>
      )}
    </div>
  );
};

// ─── 4. I/Q Constellation (Real Symbol Data) ───────────────────────────────────
interface ConstellationProps {
  data: ConstellationVisualization | null;
  modulation?: string;
  height?: number;
}

export const RealConstellationDiagram: React.FC<ConstellationProps> = ({ data, height = 240 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; i: number; q: number; idx: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.i.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, width, canvasHeight);

    const padL = 42, padB = 32, padR = 12, padT = 12;
    const plotW = width - padL - padR;
    const plotH = canvasHeight - padT - padB;

    // Dark background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, width, canvasHeight);

    const iVals = data.i;
    const qVals = data.q;

    // Find range
    const maxI = Math.max(...iVals.map(Math.abs));
    const maxQ = Math.max(...qVals.map(Math.abs));
    const maxVal = Math.max(maxI, maxQ, 1.0);
    const range = maxVal * 2.2 / zoom;

    // Grid
    ctx.strokeStyle = '#1a2645';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';

    const axisLabels = ['2', '1', '0', '-1', '-2'].map(v => (parseFloat(v) * range / 4.4).toFixed(1));
    ctx.textAlign = 'right';
    axisLabels.forEach((label, idx) => {
      const y = padT + (idx / (axisLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label, padL - 6, y + 3);
    });

    ctx.textAlign = 'center';
    axisLabels.forEach((label, idx) => {
      const x = padL + (idx / (axisLabels.length - 1)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, canvasHeight - padB);
      ctx.stroke();
      ctx.fillText(label, x, canvasHeight - 16);
    });

    ctx.fillText('In-Phase (I)', padL + plotW / 2, canvasHeight - 2);
    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Quadrature (Q)', 0, 0);
    ctx.restore();

    // Draw constellation points with density visualization
    const maxPoints = 2000;
    const step = Math.max(1, Math.floor(iVals.length / maxPoints));

    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    for (let i = 0; i < iVals.length; i += step) {
      const iVal = iVals[i];
      const qVal = qVals[i];

      const xCanvas = padL + ((iVal + range / 2) / range) * plotW;
      const yCanvas = padT + ((-qVal + range / 2) / range) * plotH;

      ctx.beginPath();
      ctx.arc(xCanvas, yCanvas, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [data, zoom]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!data || !data.i.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padL = 42, padB = 32, padR = 12, padT = 12;

    if (mouseX >= padL && mouseX <= canvas.width - padR && mouseY >= padT && mouseY <= canvas.height - padB) {
      const maxI = Math.max(...data.i.map(Math.abs));
      const maxQ = Math.max(...data.q.map(Math.abs));
      const maxVal = Math.max(maxI, maxQ, 1.0);
      const range = maxVal * 2.2 / zoom;

      // Find closest point
      let minDist = Infinity;
      let closestIdx = -1;

      const step = Math.max(1, Math.floor(data.i.length / 2000));
      for (let i = 0; i < data.i.length; i += step) {
        const iVal = data.i[i];
        const qVal = data.q[i];
        const plotW = canvas.width - padL - padR;
        const plotH = canvas.height - padT - padB;

        const xCanvas = padL + ((iVal + range / 2) / range) * plotW;
        const yCanvas = padT + ((-qVal + range / 2) / range) * plotH;

        const dist = Math.sqrt((mouseX - xCanvas) ** 2 + (mouseY - yCanvas) ** 2);
        if (dist < minDist && dist < 10) {
          minDist = dist;
          closestIdx = i;
        }
      }

      if (closestIdx >= 0) {
        setHoveredPoint({ x: mouseX, y: mouseY, i: data.i[closestIdx], q: data.q[closestIdx], idx: closestIdx });
        return;
      }
    }
    setHoveredPoint(null);
  };

  if (!data || !data.i.length) {
    return (
      <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        No constellation data available
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '4px', zIndex: 10 }}>
        <button
          onClick={() => setZoom(Math.min(zoom * 1.5, 5))}
          style={{
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: '1px solid #1a2645',
            borderRadius: '4px',
            background: '#0a0f1e',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          Zoom+
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom / 1.5, 0.5))}
          style={{
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: '1px solid #1a2645',
            borderRadius: '4px',
            background: '#0a0f1e',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          Zoom-
        </button>
        <button
          onClick={() => setZoom(1.0)}
          style={{
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: '1px solid #1a2645',
            borderRadius: '4px',
            background: '#0a0f1e',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      />
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: hoveredPoint.x + 10,
          top: hoveredPoint.y - 30,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #1a2645',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          color: '#f1f5f9',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          I={hoveredPoint.i.toFixed(4)}, Q={hoveredPoint.q.toFixed(4)}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Turbo Colormap
// ═══════════════════════════════════════════════════════════════════════════════
function getTurboColor(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  const r = Math.floor(Math.max(0, Math.min(255, 34.61 + t * (1172.33 - 10793.56 * t + 33300.12 * t * t - 38774.16 * t * t * t + 16211.12 * t * t * t * t))));
  const g = Math.floor(Math.max(0, Math.min(255, 23.31 + t * (557.33 + 1225.33 * t - 3574.96 * t * t + 1073.77 * t * t * t))));
  const b = Math.floor(Math.max(0, Math.min(255, 27.2 + t * (3211.1 - 15327.97 * t + 27814.0 * t * t - 22569.18 * t * t * t + 6838.66 * t * t * t * t))));
  return `rgb(${r},${g},${b})`;
}
