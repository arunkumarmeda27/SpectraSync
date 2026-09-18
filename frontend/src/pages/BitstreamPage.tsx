import React, { useState } from 'react';
import { Binary, Download, Search, FileCode, CheckCircle, Hash } from 'lucide-react';
import { useStore } from '../store';

const SAMPLE_HEX_ROWS = [
  { offset: '00000000', hex: '49 51 5F 53 41 54 5F 30 31 1A CF FC 1D 01 02 03', ascii: 'IQ_SAT_01.......' },
  { offset: '00000010', hex: '04 05 06 07 08 09 0A 0B 0C 0D 0E 0F 10 11 12 13', ascii: '................' },
  { offset: '00000020', hex: '43 43 53 44 53 2D 53 59 4E 43 20 50 41 43 4B 45', ascii: 'CCSDS-SYNC PACKE' },
  { offset: '00000030', hex: '54 20 44 41 54 41 20 50 41 59 4C 4F 41 44 20 30', ascii: 'T DATA PAYLOAD 0' },
  { offset: '00000040', hex: '31 32 33 34 35 36 37 38 39 41 42 43 44 45 46 00', ascii: '123456789ABCDEF.' },
  { offset: '00000050', hex: '7E 41 58 32 35 2D 46 52 41 4D 45 2D 48 45 41 44', ascii: '~AX25-FRAME-HEAD' },
  { offset: '00000060', hex: '45 52 20 56 41 4C 49 44 41 54 45 44 20 4F 4B 7E', ascii: 'ER VALIDATED OK~' },
  { offset: '00000070', hex: '55 55 55 55 55 55 55 D5 08 00 45 00 00 3C 1A 2B', ascii: 'UUUUUUU...E..<..+' },
  { offset: '00000080', hex: '48 65 6C 6C 6F 20 53 70 65 63 74 72 61 53 79 6E', ascii: 'Hello SpectraSyn' },
  { offset: '00000090', hex: '63 20 52 46 20 49 6E 74 65 6C 6C 69 67 65 6E 63', ascii: 'c RF Intelligenc' },
  { offset: '000000A0', hex: '65 20 50 6C 61 74 66 6F 72 6D 21 00 00 00 00 00', ascii: 'e Platform!.....' },
];

const DETECTED_HEADERS = [
  { name: 'CCSDS-32 Sync Marker', hex: '1A CF FC 1D', offset: 'Bit 72 (Byte 9)', confidence: 'High (0.99)', status: 'Verified' },
  { name: 'Barker-11 Preamble', hex: '11100010010', offset: 'Bit 240 (Byte 30)', confidence: 'High (0.96)', status: 'Verified' },
  { name: 'AX.25 HDLC Flag', hex: '0x7E', offset: 'Bit 640 (Byte 80)', confidence: 'High (0.95)', status: 'Verified' },
  { name: 'Ethernet SFD', hex: '0xD5', offset: 'Bit 952 (Byte 119)', confidence: 'High (0.98)', status: 'Verified' },
];

const BitstreamPage: React.FC = () => {
  const { addToast } = useStore();
  const [searchPattern, setSearchPattern] = useState('');

  const handleDownload = (format: string) => {
    addToast('success', `Exporting bitstream as .${format}...`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Card */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Binary size={20} className="card-title-icon" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
              Bit Stream Inspector & Packet Header Correlator
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Recovered hard-decision symbol stream, framing synchronization, and payload extraction
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => handleDownload('bin')}>
            <Download size={13} />
            Download .BIN
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => handleDownload('hex')}>
            <Download size={13} />
            Download .HEX
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Total Bits</div>
          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            51,200
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>6,400 Bytes recovered</div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Bit Density (Ones)</div>
          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb', marginTop: '0.2rem' }}>
            49.82%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Equally distributed (PRBS)</div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Transition Density</div>
          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            0.501
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Clock extraction suitable</div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Headers Detected</div>
          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
            4 Valid
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>CCSDS, Barker, AX.25, SFD</div>
        </div>
      </div>

      {/* Main Grid: Hex Viewer (Left) + Detected Preambles (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.25rem' }}>
        
        {/* Hex & ASCII Viewer */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div className="card-title" style={{ fontSize: '0.9rem' }}>
              Hex Dump & ASCII Representation
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search hex or text..."
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                className="input-control"
                style={{ width: 180, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              />
            </div>
          </div>

          <div style={{
            background: '#0f172a',
            borderRadius: '8px',
            padding: '1rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.76rem',
            color: '#e2e8f0',
            overflowX: 'auto',
            maxHeight: 380
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', marginBottom: '0.4rem', color: '#64748b', fontSize: '0.7rem' }}>
              <span style={{ width: 80 }}>OFFSET</span>
              <span style={{ flex: 1 }}>00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F</span>
              <span style={{ width: 140, textAlign: 'right' }}>ASCII</span>
            </div>
            {SAMPLE_HEX_ROWS.map(row => (
              <div key={row.offset} style={{ display: 'flex', lineHeight: '1.6' }}>
                <span style={{ width: 80, color: '#38bdf8' }}>{row.offset}</span>
                <span style={{ flex: 1, color: '#f8fafc', letterSpacing: '0.05em' }}>{row.hex}</span>
                <span style={{ width: 140, textAlign: 'right', color: '#a7f3d0' }}>{row.ascii}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Framing & Packet Header Detection */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ marginBottom: '0.85rem', fontSize: '0.9rem' }}>
            Detected Framing Preambles
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {DETECTED_HEADERS.map((h, i) => (
              <div key={i} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                    {h.name}
                  </span>
                  <span className="badge badge-high">{h.confidence}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Location: <b style={{ color: '#0f172a' }}>{h.offset}</b></span>
                  <span className="font-mono" style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                    {h.hex}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BitstreamPage;
