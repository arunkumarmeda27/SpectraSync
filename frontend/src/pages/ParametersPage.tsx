import React, { useState } from 'react';
import { SlidersHorizontal, ShieldCheck, Download } from 'lucide-react';
import { useStore } from '../store';

interface ParameterDetail {
  name: string;
  value: string;
  unit: string;
  confidence: number;
  confidenceLabel: 'High' | 'Medium' | 'Low';
  source: 'Metadata' | 'DSP Estimate' | 'ML Classifier';
  method: string;
  uncertainty: string;
  physicalCheck: string;
  notes: string;
}

const PARAMETER_DATA: ParameterDetail[] = [
  {
    name: 'Sample Rate (fs)',
    value: '2.000',
    unit: 'MHz',
    confidence: 0.98,
    confidenceLabel: 'High',
    source: 'Metadata',
    method: 'RIFF Header & Clock Spectral Lines',
    uncertainty: '± 10 Hz',
    physicalCheck: 'Valid: fs > 2 * B (Nyquist Compliant)',
    notes: 'Extracted from valid RIFF chunk headers and cross-referenced with cyclic autocorrelation peak.'
  },
  {
    name: 'Carrier Frequency (fc)',
    value: '437.123',
    unit: 'MHz',
    confidence: 0.95,
    confidenceLabel: 'High',
    source: 'DSP Estimate',
    method: '3-Point Parabolic FFT Interpolation',
    uncertainty: '± 244 Hz',
    physicalCheck: 'Valid: Centered within receiver IF passband',
    notes: 'Baseband offset detected at +123.4 kHz relative to nominal sensor tuning frequency.'
  },
  {
    name: 'Occupied Bandwidth (99% OBW)',
    value: '250',
    unit: 'kHz',
    confidence: 0.92,
    confidenceLabel: 'High',
    source: 'DSP Estimate',
    method: 'Cumulative Welch PSD Power Integration',
    uncertainty: '± 4.8 kHz',
    physicalCheck: 'Valid: Matches expected QPSK roll-off shape (alpha=0.35)',
    notes: 'Computed by integrating spectral power between 0.5% and 99.5% cumulative percentiles.'
  },
  {
    name: 'Symbol Rate (Rs)',
    value: '100',
    unit: 'kSym/s',
    confidence: 0.78,
    confidenceLabel: 'Medium',
    source: 'DSP Estimate',
    method: 'Non-linear Squaring & Gardner TED Error',
    uncertainty: '± 1.5 kBd',
    physicalCheck: 'Valid: Rs <= Bandwidth (100 kSym/s <= 250 kHz)',
    notes: '20 samples per symbol at 2.0 MSps nominal sampling rate.'
  },
  {
    name: 'Primary Modulation',
    value: 'QPSK',
    unit: 'Quadrature Phase Shift Keying',
    confidence: 0.96,
    confidenceLabel: 'High',
    source: 'ML Classifier',
    method: 'Higher-Order Cumulants (C20, C21, C40, C42)',
    uncertainty: 'Margin > 15%',
    physicalCheck: 'Valid: Circular constellation with C20 ~= 0 and C42 ~= -1',
    notes: 'Verified against Random Forest classification trained on golden calibration dataset.'
  },
  {
    name: 'Signal-to-Noise Ratio (SNR)',
    value: '18.5',
    unit: 'dB',
    confidence: 0.80,
    confidenceLabel: 'Medium',
    source: 'DSP Estimate',
    method: 'M2M4 Moment Estimator + Spectral Out-of-band Floor',
    uncertainty: '± 1.2 dB',
    physicalCheck: 'Valid: Sufficient for error-free demodulation (BER < 1e-4)',
    notes: 'Estimated from out-of-band spectral density relative to integrated carrier power.'
  }
];

const ParametersPage: React.FC = () => {
  const { addToast } = useStore();
  const [selectedParam, setSelectedParam] = useState<ParameterDetail>(PARAMETER_DATA[0]);

  const handleExportCsv = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'Confidence', 'Source', 'Method', 'Uncertainty'];
    const rows = PARAMETER_DATA.map(p => [
      p.name, p.value, p.unit, p.confidence, p.source, `"${p.method}"`, `"${p.uncertainty}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spectrasync_parameters_provenance.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Exported parameter provenance CSV.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SlidersHorizontal size={20} className="card-title-icon" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
              Signal Parameter Inference & Provenance
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Deterministic parameter estimation with rigorous scientific traceability and uncertainty metrics
            </div>
          </div>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={handleExportCsv}
          style={{ gap: '0.4rem' }}
        >
          <Download size={14} />
          Export Parameters (CSV)
        </button>
      </div>

      {/* Main Grid: Parameters Table (Left) + Provenance Deep-Dive (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        
        {/* Table of Parameters */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            Inferred Signal Metrics
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Confidence</th>
                  <th>Source</th>
                  <th>Uncertainty</th>
                </tr>
              </thead>
              <tbody>
                {PARAMETER_DATA.map((p) => {
                  const isSelected = selectedParam.name === p.name;
                  return (
                    <tr
                      key={p.name}
                      onClick={() => setSelectedParam(p)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#f0f7ff' : undefined,
                        borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent'
                      }}
                    >
                      <td style={{ fontWeight: 600, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                        {p.name}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {p.value} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.unit}</span>
                      </td>
                      <td>
                        <span className={`badge ${p.confidenceLabel === 'High' ? 'badge-high' : 'badge-medium'}`}>
                          {p.confidenceLabel} ({p.confidence.toFixed(2)})
                        </span>
                      </td>
                      <td style={{ color: '#475569' }}>{p.source}</td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {p.uncertainty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Provenance Detail Drawer */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mathematical Provenance
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {selectedParam.name}
              </div>
            </div>
            <span className={`badge ${selectedParam.confidenceLabel === 'High' ? 'badge-high' : 'badge-medium'}`}>
              Confidence: {Math.round(selectedParam.confidence * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Inferred Value
              </div>
              <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>
                {selectedParam.value} <span style={{ fontSize: '0.85rem', color: '#475569' }}>{selectedParam.unit}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                Estimated Margin of Uncertainty: <b>{selectedParam.uncertainty}</b>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Algorithmic Method
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {selectedParam.method}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Physical Consistency Check
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#15803d',
                background: '#dcfce7',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                <ShieldCheck size={16} />
                {selectedParam.physicalCheck}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Analyst Notes
              </div>
              <div style={{ color: '#475569', fontSize: '0.78rem', lineHeight: 1.5 }}>
                {selectedParam.notes}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ParametersPage;
