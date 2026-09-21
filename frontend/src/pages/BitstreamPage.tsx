import React, { useState } from 'react';
import {
  Binary, Download, Search, FileText, Zap, Activity,
  Clock, CheckCircle, Radio, Target, Layers
} from 'lucide-react';
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
  { offset: '000000B0', hex: 'FF FF FF FF AA AA BB CC DD EE 00 11 22 33 44 55', ascii: '............"3DU' },
  { offset: '000000C0', hex: '66 77 88 99 AA BB CC DD EE FF 00 11 22 33 44 55', ascii: 'fw.........."3DU' },
  { offset: '000000D0', hex: '66 77 88 99 AA BB CC DD EE FF 00 11 22 33 44 55', ascii: 'fw.........."3DU' },
];

const DETECTED_HEADERS = [
  { name: 'CCSDS-32 Sync Marker', hex: '1A CF FC 1D', offset: 'Bit 72 (Byte 9)', confidence: 0.99, status: 'VERIFIED', type: 'CCSDS' },
  { name: 'Barker-11 Preamble', hex: '11100010010', offset: 'Bit 240 (Byte 30)', confidence: 0.96, status: 'VERIFIED', type: 'BARKER' },
  { name: 'AX.25 HDLC Flag', hex: '0x7E', offset: 'Bit 640 (Byte 80)', confidence: 0.95, status: 'VERIFIED', type: 'AX25' },
  { name: 'Ethernet SFD', hex: '0xD5', offset: 'Bit 952 (Byte 119)', confidence: 0.98, status: 'VERIFIED', type: 'ETHERNET' },
];

const BitstreamPage: React.FC = () => {
  const { addToast } = useStore();
  const [searchPattern, setSearchPattern] = useState('');
  const [viewMode, setViewMode] = useState<'HEX' | 'BINARY' | 'ASCII' | 'DECIMAL'>('HEX');
  const [selectedByte, setSelectedByte] = useState<number | null>(null);
  const [bytesPerRow] = useState(16);

  const handleDownload = (format: string) => {
    addToast('success', `Exporting bitstream as .${format}...`);
  };

  const handleExportReport = () => {
    addToast('info', 'Generating bitstream analysis report...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>

      {/* HEADER SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '1rem 1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h1 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#f1f5f9',
              margin: 0,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase'
            }}>
              BIT STREAM ANALYSIS
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
              Bit-level protocol inspection, synchronization detection and packet structure analysis
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* System Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>
                SYSTEM ONLINE
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDownload('bin')}
                style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
              >
                <Download size={12} />
                BIN
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDownload('hex')}
                style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
              >
                <Download size={12} />
                HEX
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleExportReport}
                style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
              >
                <FileText size={12} />
                REPORT
              </button>
            </div>
          </div>
        </div>

        {/* Status Line */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          fontSize: '0.7rem',
          color: '#64748b',
          paddingTop: '0.75rem',
          borderTop: '1px solid #334155'
        }}>
          <div>
            <span style={{ color: '#94a3b8' }}>STREAM STATUS:</span>{' '}
            <span style={{ color: '#10b981', fontWeight: 600 }}>ANALYZED</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>CONFIDENCE:</span>{' '}
            <span style={{ color: '#10b981', fontWeight: 600 }}>96.8%</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>ANALYSIS ID:</span>{' '}
            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>JOB-2147</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>TIMESTAMP:</span>{' '}
            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>2026-09-21 11:26:21 UTC</span>
          </div>
        </div>
      </div>

      {/* TELEMETRY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
        {[
          { icon: Binary, label: 'TOTAL BITS', value: '51,200', sub: '6,400 Bytes', color: '#3b82f6' },
          { icon: Activity, label: 'BIT DENSITY', value: '49.82%', sub: 'Balanced', color: '#10b981' },
          { icon: Zap, label: 'TRANSITION DENSITY', value: '0.501', sub: 'Clock suitable', color: '#f59e0b' },
          { icon: Target, label: 'HEADERS DETECTED', value: '4', sub: '4 valid patterns', color: '#10b981' },
          { icon: CheckCircle, label: 'SYNC CONFIDENCE', value: '96.8%', sub: 'High confidence', color: '#10b981' },
          { icon: Layers, label: 'PAYLOAD ESTIMATE', value: '5.7 KB', sub: 'Recoverable', color: '#3b82f6' },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '0.75rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0.15
            }}>
              <item.icon size={32} color={item.color} />
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'JetBrains Mono', marginBottom: '0.15rem' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN WORKSPACE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* LEFT: BIT STREAM INSPECTOR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>

          {/* Bit Visualization */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                BIT TRANSITION PROFILE
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem' }}>
                <button style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: 600
                }}>
                  ZOOM -
                </button>
                <button style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: 600
                }}>
                  ZOOM +
                </button>
                <button style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: 600
                }}>
                  FIT
                </button>
              </div>
            </div>

            {/* Waveform visualization */}
            <div style={{
              background: '#0a0f1e',
              borderRadius: '4px',
              padding: '0.5rem',
              height: '60px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <svg width="100%" height="100%" style={{ display: 'block' }}>
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
                {/* Simulated bit transition waveform */}
                {[...Array(120)].map((_, i) => {
                  const x = (i / 120) * 100;
                  const bit = Math.random() > 0.5 ? 1 : 0;
                  const y = bit ? 10 : 40;
                  return (
                    <rect
                      key={i}
                      x={`${x}%`}
                      y={y}
                      width="0.8%"
                      height={bit ? 30 : 10}
                      fill={bit ? '#10b981' : '#3b82f6'}
                      opacity={0.8}
                    />
                  );
                })}
              </svg>
              <div style={{
                position: 'absolute',
                bottom: 4,
                left: 8,
                fontSize: '0.6rem',
                color: '#64748b',
                fontFamily: 'JetBrains Mono'
              }}>
                0/1 Distribution: 50.18% / 49.82% | Transitions: 25,600 | Entropy: 0.998
              </div>
            </div>
          </div>

          {/* Hex Viewer */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0
          }}>
            {/* Toolbar */}
            <div style={{
              padding: '0.75rem',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  BIT STREAM INSPECTOR
                </span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {(['HEX', 'BINARY', 'ASCII', 'DECIMAL'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        background: viewMode === mode ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        border: `1px solid ${viewMode === mode ? '#3b82f6' : '#334155'}`,
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.65rem',
                        color: viewMode === mode ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={12} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search hex, binary or ASCII..."
                  value={searchPattern}
                  onChange={(e) => setSearchPattern(e.target.value)}
                  style={{
                    background: '#0a0f1e',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.7rem',
                    color: '#f1f5f9',
                    width: '220px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Hex Dump */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '0.75rem',
              background: '#0a0f1e',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.72rem'
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 140px',
                gap: '1rem',
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                color: '#64748b',
                fontSize: '0.65rem',
                fontWeight: 600,
                position: 'sticky',
                top: 0,
                background: '#0a0f1e',
                zIndex: 1
              }}>
                <div>OFFSET</div>
                <div>HEX BYTES</div>
                <div style={{ textAlign: 'right' }}>ASCII</div>
              </div>

              {/* Rows */}
              {SAMPLE_HEX_ROWS.map((row, idx) => (
                <div
                  key={row.offset}
                  onMouseEnter={() => setSelectedByte(idx)}
                  onMouseLeave={() => setSelectedByte(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 140px',
                    gap: '1rem',
                    padding: '0.25rem 0',
                    borderRadius: '4px',
                    background: selectedByte === idx ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ color: '#3b82f6', fontWeight: 600 }}>{row.offset}</div>
                  <div style={{ color: '#f1f5f9', letterSpacing: '0.05em' }}>{row.hex}</div>
                  <div style={{ color: '#10b981', textAlign: 'right' }}>{row.ascii}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {selectedByte !== null && (
              <div style={{
                padding: '0.5rem 0.75rem',
                borderTop: '1px solid #1e293b',
                background: 'rgba(15, 23, 42, 0.8)',
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.65rem',
                color: '#94a3b8'
              }}>
                <span>
                  <b style={{ color: '#f1f5f9' }}>SELECTED:</b> BYTE {selectedByte * bytesPerRow}
                </span>
                <span>
                  <b style={{ color: '#f1f5f9' }}>BIT:</b> {selectedByte * bytesPerRow * 8}-{(selectedByte * bytesPerRow + 1) * 8 - 1}
                </span>
                <span>
                  <b style={{ color: '#f1f5f9' }}>VALUE:</b> 0x{SAMPLE_HEX_ROWS[selectedByte]?.hex.split(' ')[0] || '00'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: FRAME DETECTION & ANALYSIS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0, overflowY: 'auto' }}>

          {/* Detected Frame Structures */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 0.75rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              DETECTED FRAME STRUCTURES
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {DETECTED_HEADERS.map((header, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(10, 15, 30, 0.8)',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '0.65rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.background = 'rgba(10, 15, 30, 0.8)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>
                      {header.name}
                    </span>
                    <div style={{
                      fontSize: '0.6rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontWeight: 600
                    }}>
                      {header.status}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', width: '80px' }}>CONFIDENCE</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${header.confidence * 100}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${header.confidence > 0.95 ? '#10b981' : '#f59e0b'}, ${header.confidence > 0.95 ? '#34d399' : '#fbbf24'})`,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono', minWidth: '35px' }}>
                        {(header.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', fontSize: '0.65rem' }}>
                    <span style={{ color: '#64748b' }}>LOCATION</span>
                    <span style={{ color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>{header.offset}</span>

                    <span style={{ color: '#64748b' }}>PATTERN</span>
                    <span style={{
                      color: '#3b82f6',
                      fontFamily: 'JetBrains Mono',
                      background: 'rgba(59, 130, 246, 0.1)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      {header.hex}
                    </span>

                    <span style={{ color: '#64748b' }}>FRAME TYPE</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{header.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Identification */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 0.75rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              PROTOCOL IDENTIFICATION
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { name: 'CCSDS', confidence: 0.99, icon: Radio },
                { name: 'AX.25 / HDLC', confidence: 0.95, icon: Radio },
                { name: 'Ethernet', confidence: 0.91, icon: Radio },
                { name: 'Barker Sync', confidence: 0.96, icon: Clock },
              ].map((proto, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem',
                  background: 'rgba(10, 15, 30, 0.5)',
                  borderRadius: '4px',
                  border: '1px solid #1e293b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <proto.icon size={14} color={proto.confidence > 0.95 ? '#10b981' : '#3b82f6'} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {proto.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: proto.confidence > 0.95 ? '#10b981' : '#3b82f6', fontFamily: 'JetBrains Mono' }}>
                    {(proto.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Insights */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 0.75rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ANALYSIS INSIGHTS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.7rem' }}>
              {[
                { text: 'Bit density is close to balanced', status: 'ok' },
                { text: 'Transition density indicates clock extraction suitability', status: 'ok' },
                { text: 'Multiple valid synchronization patterns detected', status: 'ok' },
                { text: 'CCSDS framing candidate identified', status: 'ok' },
                { text: 'Payload region appears recoverable', status: 'ok' },
              ].map((insight, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={12} color="#10b981" />
                  <span style={{ color: '#cbd5e1' }}>{insight.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stream Statistics */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 0.75rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              STREAM STATISTICS
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.65rem' }}>
              {[
                ['Bytes Analyzed', '6,400'],
                ['Bits Analyzed', '51,200'],
                ['Detected Markers', '4'],
                ['Candidate Frames', '4'],
                ['Payload Bytes', '5,734'],
                ['Analysis Duration', '127 ms'],
                ['Entropy', '0.998'],
                ['Confidence', '96.8%'],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  background: 'rgba(10, 15, 30, 0.5)',
                  borderRadius: '4px'
                }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitstreamPage;
