// TypeScript types for real backend visualization data

export interface WaveformVisualization {
  time: number[];
  i_samples: number[];
  q_samples: number[];
  total_samples: number;
  sample_rate: number;
}

export interface FftVisualization {
  frequencies: number[];
  magnitudes_db: number[];
  fft_size: number;
  window: string;
  sample_rate: number;
  peak_frequency_hz?: number;
  peak_power_dbfs?: number;
}

export interface SpectrogramVisualization {
  times: number[];
  frequencies: number[];
  power_matrix_db: number[][];
  min_db?: number;
  max_db?: number;
  nperseg?: number;
  noverlap?: number;
  window?: string;
}

export interface ConstellationVisualization {
  i: number[];
  q: number[];
  num_points: number;
}

export interface EyeDiagramVisualization {
  traces_i: number[][];
  traces_q: number[][];
  time_axis: number[];
  samples_per_symbol: number;
  num_traces: number;
}

export interface AnalysisVisualizationData {
  waveform: WaveformVisualization;
  fft: FftVisualization;
  psd?: {
    frequencies: number[];
    power_db: number[];
    mean_psd_db?: number;
  };
  spectrogram: SpectrogramVisualization;
  constellation: ConstellationVisualization;
  eye_diagram?: EyeDiagramVisualization;
}

export interface ParameterEstimate {
  parameter: string;
  value: number;
  unit: string;
  confidence: number;
  confidence_label: string;
  source: string;
  method?: string;
  uncertainty?: number;
}

export interface AnalysisParameters {
  sample_rate: ParameterEstimate;
  carrier_frequency: ParameterEstimate;
  bandwidth: ParameterEstimate;
  symbol_rate?: ParameterEstimate;
  snr: ParameterEstimate;
}

export interface ModulationCandidate {
  modulation: string;
  confidence: number;
}

export interface FullAnalysisResult {
  job_id: number;
  status: string;
  primary_modulation: string;
  confidence: number;
  parameters: AnalysisParameters;
  modulation: {
    primary_modulation: string;
    primary_confidence: number;
    candidates: ModulationCandidate[];
  };
  synchronization: Record<string, unknown>;
  demodulation: Record<string, unknown>;
  visualizations: AnalysisVisualizationData;
  bitstream?: Record<string, unknown>;
  stages?: Array<Record<string, unknown>>;
}
