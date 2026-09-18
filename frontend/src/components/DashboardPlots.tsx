import React, { useEffect, useRef } from 'react';

// ─── 1. Time Domain Waveform ──────────────────────────────────────────────────
export const TimeDomainWaveform: React.FC<{
  data?: number[];
  color?: string;
}> = ({ data, color = '#2563eb' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Grid margins
    const padL = 34;
    const padB = 22;
    const padR = 10;
    const padT = 10;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Draw grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    // Horizontal grid lines: 1.0, 0.5, 0, -0.5, -1.0
    const yLabels = ['1.0', '0.5', '0', '-0.5', '-1.0'];
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';

    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label, padL - 4, y + 3);
    });

    // Vertical grid lines: 0, 2, 4, 6, 8, 10
    const xLabels = ['0', '2', '4', '6', '8', '10'];
    ctx.textAlign = 'center';
    xLabels.forEach((label, idx) => {
      const x = padL + (idx / (xLabels.length - 1)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(label, x, height - 6);
    });

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.fillText('Time (ms)', padL + plotW / 2, height - 1);
    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();

    // Plot waveform
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;

    const points = 400;
    for (let i = 0; i < points; i++) {
      const x = padL + (i / (points - 1)) * plotW;
      // Synthesize realistic modulated RF carrier if no raw array
      const t = (i / points) * 10;
      let val = 0;
      if (data && data.length > 0) {
        const sampleIdx = Math.floor((i / points) * data.length);
        val = data[sampleIdx];
      } else {
        // High-density modulated envelope matching screenshot
        const envelope = 0.4 + 0.3 * Math.sin(t * 1.5) * Math.cos(t * 0.8) + 0.2 * Math.sin(t * 3.1);
        const carrier = Math.sin(t * 45.0 + Math.sin(t * 2.0));
        val = envelope * carrier;
      }

      // Clamp between -1.0 and 1.0
      val = Math.max(-1.0, Math.min(1.0, val));
      const y = padT + ((-val + 1.0) / 2.0) * plotH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data, color]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={155}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── 2. Frequency Spectrum (FFT) ──────────────────────────────────────────────
export const FrequencySpectrumPlot: React.FC<{
  data?: number[];
  color?: string;
}> = ({ data, color = '#2563eb' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 34;
    const padB = 22;
    const padR = 10;
    const padT = 10;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    // Y Axis: 0, -20, -40, -60, -80
    const yLabels = ['0', '-20', '-40', '-60', '-80'];
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';

    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label, padL - 4, y + 3);
    });

    // X Axis: -2, -1, 0, 1, 2
    const xLabels = ['-2', '-1', '0', '1', '2'];
    ctx.textAlign = 'center';
    xLabels.forEach((label, idx) => {
      const x = padL + (idx / (xLabels.length - 1)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(label, x, height - 6);
    });

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.fillText('Frequency (MHz)', padL + plotW / 2, height - 1);
    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Magnitude (dB)', 0, 0);
    ctx.restore();

    // Plot Spectrum line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;

    const points = 300;
    for (let i = 0; i < points; i++) {
      const x = padL + (i / (points - 1)) * plotW;
      const freqNorm = ((i / (points - 1)) - 0.5) * 4; // -2 to +2 MHz
      let db = -75;

      if (data && data.length > 0) {
        const sampleIdx = Math.floor((i / points) * data.length);
        db = Math.max(-80, Math.min(0, data[sampleIdx]));
      } else {
        // Ideal main lobe at 0 MHz with side lobes + noise floor
        const sinc = Math.abs(freqNorm) < 0.001 ? 1 : Math.sin(Math.PI * freqNorm * 4) / (Math.PI * freqNorm * 4);
        const signalDb = 20 * Math.log10(Math.abs(sinc) + 1e-4) - 5;
        const noise = -70 + 6 * (Math.sin(i * 0.7) * Math.cos(i * 0.4) + Math.random() * 0.8);
        db = Math.max(signalDb, noise);
      }

      // Map dB from [0, -80] to [padT, padT + plotH]
      const clampedDb = Math.max(-80, Math.min(0, db));
      const y = padT + (-clampedDb / 80.0) * plotH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data, color]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={155}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── 3. Spectrogram / Waterfall ───────────────────────────────────────────────
export const SpectrogramWaterfall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 34;
    const padB = 22;
    const padR = 10;
    const padT = 10;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Generate Waterfall image data
    const imgData = ctx.createImageData(plotW, plotH);
    for (let py = 0; py < plotH; py++) {
      const fNorm = ((py / plotH) - 0.5) * 4; // -2 to +2 MHz
      for (let px = 0; px < plotW; px++) {
        const idx = (py * plotW + px) * 4;
        const distFromCenter = Math.abs(fNorm);
        let intensity = 0;

        // Active center channel with noise ripples
        if (distFromCenter < 0.25) {
          intensity = 0.9 + 0.1 * Math.sin(px * 0.2 + py * 0.15) * Math.random();
        } else if (distFromCenter < 0.45) {
          intensity = 0.5 + 0.2 * Math.sin(px * 0.1);
        } else {
          intensity = 0.15 + 0.15 * Math.random();
        }

        // Color mapping (Navy -> Cyan -> Green -> Yellow)
        let r = 0, g = 0, b = 0;
        if (intensity < 0.3) {
          r = Math.floor(15 * (intensity / 0.3));
          g = Math.floor(20 * (intensity / 0.3));
          b = Math.floor(70 + 80 * (intensity / 0.3));
        } else if (intensity < 0.6) {
          const t = (intensity - 0.3) / 0.3;
          r = 0;
          g = Math.floor(180 * t);
          b = Math.floor(200 - 40 * t);
        } else if (intensity < 0.8) {
          const t = (intensity - 0.6) / 0.2;
          r = Math.floor(100 * t);
          g = Math.floor(220 + 35 * t);
          b = Math.floor(100 * (1 - t));
        } else {
          const t = (intensity - 0.8) / 0.2;
          r = Math.floor(220 + 35 * t);
          g = Math.floor(240 + 15 * t);
          b = Math.floor(40 * t);
        }

        imgData.data[idx] = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, padL, padT);

    // Labels & Axes
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';

    const yLabels = ['2', '1', '0', '-1', '-2'];
    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.fillText(label, padL - 4, y + 3);
    });

    const xLabels = ['0', '5', '10'];
    ctx.textAlign = 'center';
    xLabels.forEach((label, idx) => {
      const x = padL + (idx / (xLabels.length - 1)) * plotW;
      ctx.fillText(label, x, height - 6);
    });

    ctx.fillStyle = '#64748b';
    ctx.fillText('Time (s)', padL + plotW / 2, height - 1);
    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (MHz)', 0, 0);
    ctx.restore();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={155}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── 4. Constellation Diagram ────────────────────────────────────────────────
export const ConstellationPlot: React.FC<{
  points?: Array<{ i: number; q: number }>;
  color?: string;
}> = ({ points, color = '#2563eb' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 34;
    const padB = 22;
    const padR = 10;
    const padT = 10;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    // Y axis labels: 2, 0, -2
    const yLabels = ['2', '0', '-2'];
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';

    yLabels.forEach((label, idx) => {
      const y = padT + (idx / (yLabels.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.fillText(label, padL - 4, y + 3);
    });

    // X axis labels: -2, 0, 2
    const xLabels = ['-2', '0', '2'];
    ctx.textAlign = 'center';
    xLabels.forEach((label, idx) => {
      const x = padL + (idx / (xLabels.length - 1)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, height - padB);
      ctx.stroke();
      ctx.fillText(label, x, height - 6);
    });

    // Crosshairs at 0, 0
    const zeroX = padL + plotW / 2;
    const zeroY = padT + plotH / 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zeroX, padT);
    ctx.lineTo(zeroX, padT + plotH);
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(padL + plotW, zeroY);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.fillText('In-phase (I)', padL + plotW / 2, height - 1);
    ctx.save();
    ctx.translate(10, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Quadrature (Q)', 0, 0);
    ctx.restore();

    // Render Constellation Points
    // If points supplied, render them; else render 4 realistic QPSK clusters
    const samplePts: Array<{ i: number; q: number }> = [];
    if (points && points.length > 0) {
      samplePts.push(...points.slice(0, 600));
    } else {
      // 4 Gaussian clusters centered at (+1, +1), (-1, +1), (-1, -1), (+1, -1)
      const centers = [
        { i: 1.0, q: 1.0 },
        { i: -1.0, q: 1.0 },
        { i: -1.0, q: -1.0 },
        { i: 1.0, q: -1.0 }
      ];
      for (let k = 0; k < 120; k++) {
        centers.forEach(c => {
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2.0 * Math.log(u1 + 1e-10)) * Math.cos(2.0 * Math.PI * u2);
          const z1 = Math.sqrt(-2.0 * Math.log(u1 + 1e-10)) * Math.sin(2.0 * Math.PI * u2);
          samplePts.push({
            i: c.i + z0 * 0.16,
            q: c.q + z1 * 0.16
          });
        });
      }
    }

    // Draw scatter points
    ctx.fillStyle = color;
    samplePts.forEach(pt => {
      // Scale from [-2, 2]
      const px = zeroX + (pt.i / 2.0) * (plotW / 2);
      const py = zeroY - (pt.q / 2.0) * (plotH / 2);
      if (px >= padL && px <= padL + plotW && py >= padT && py <= padT + plotH) {
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [points, color]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={155}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};
