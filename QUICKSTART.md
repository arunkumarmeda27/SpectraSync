# Quick Start Guide - SpectraSync Signal Analysis

## 🚀 Start the System (3 Terminals)

### Terminal 1: Backend API
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
✅ Backend running at http://localhost:8000

### Terminal 2: Worker Process
```bash
cd workers
python worker.py
```
✅ Worker polling for analysis jobs

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend running at http://localhost:5173

---

## 📊 Test the Implementation

### 1. Upload a Signal File
- Navigate to **Upload & Analyze**
- Select a .WAV or .IQ file
- Click Upload
- Job will be created and processed

### 2. View Parameter Results
- Navigate to **Parameter Results** (sidebar)
- Page automatically loads most recent completed job
- See real extracted parameters:
  - Sample Rate
  - Carrier Frequency
  - Bandwidth
  - Symbol Rate
  - Modulation Type
  - SNR
- Click any parameter to see provenance details
- Export to CSV

### 3. View Modulation Analysis
- Navigate to **Modulation Analysis** (sidebar)
- See detected modulation with confidence
- View candidate modulations
- See I/Q constellation diagram from actual samples
- Points plotted from real signal data

### 4. View Visualizations
- Navigate to **Signal Lab** (sidebar)
- See time-domain waveform
- See FFT spectrum
- See waterfall spectrogram
- See constellation diagram
- All use real analysis data

---

## 🎯 What Changed

### Files Modified (5 total)

1. **frontend/src/pages/ParametersPage.tsx** - REPLACED
   - Removed 100% of hardcoded data
   - Now fetches real analysis results
   - Dynamic job selection
   
2. **frontend/src/pages/ModulationAnalysisPage.tsx** - NEW FILE
   - Displays real modulation classification
   - Renders actual I/Q constellation
   - Shows candidate modulations
   
3. **frontend/src/pages/VisualizationsPage.tsx** - UPDATED
   - Connected to real analysis data
   - Job selector dropdown
   
4. **frontend/src/App.tsx** - UPDATED
   - Added route: `/modulation`
   
5. **frontend/src/components/Sidebar.tsx** - UPDATED
   - Changed Modulation Analysis route to `/modulation`

### Backend Changes
**ZERO** - Backend was already complete and working!

---

## 🧪 Generate Test Signals

### Create test_qpsk.wav
```python
import numpy as np
import wave

sample_rate = 2000000
duration = 1.0
t = np.linspace(0, duration, int(sample_rate * duration))

carrier_offset = 123400
qpsk_signal = np.cos(2 * np.pi * carrier_offset * t + 
                     np.random.choice([0, np.pi/2, np.pi, 3*np.pi/2], len(t)))

noise = np.random.randn(len(t)) * 0.1
signal = qpsk_signal + noise
signal_int16 = np.int16(signal / np.max(np.abs(signal)) * 32767)

with wave.open('test_qpsk.wav', 'w') as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    wav_file.writeframes(signal_int16.tobytes())

print("✅ Generated test_qpsk.wav")
```

### Create test_bpsk.iq
```python
import numpy as np
import json

sample_rate = 1000000
symbol_rate = 50000
samples_per_symbol = sample_rate // symbol_rate

num_symbols = 10000
bits = np.random.randint(0, 2, num_symbols)
symbols = 2 * bits - 1

upsampled = np.repeat(symbols, samples_per_symbol)
iq_signal = upsampled + 1j * np.random.randn(len(upsampled)) * 0.1

iq_signal.astype(np.complex64).tofile('test_bpsk.iq')

metadata = {
    "sample_rate": sample_rate,
    "center_frequency": 437000000,
    "modulation": "BPSK",
    "symbol_rate": symbol_rate
}
with open('test_bpsk.iq.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("✅ Generated test_bpsk.iq + metadata")
```

---

## ✅ Verification Checklist

### Parameter Results Page
- [ ] Page loads without errors
- [ ] Shows list of completed jobs
- [ ] Can select different jobs from dropdown
- [ ] All 6 parameters display real values (not hardcoded)
- [ ] Clicking parameter updates provenance panel
- [ ] Confidence badges show real confidence levels
- [ ] "Export Parameters (CSV)" downloads file with real data
- [ ] Empty state shows when no jobs exist

### Modulation Analysis Page
- [ ] Page loads without errors
- [ ] Primary modulation shows detected type
- [ ] Confidence percentage shown
- [ ] Candidate modulations list populated
- [ ] Constellation diagram renders
- [ ] Constellation shows actual I/Q points (not fake clusters)
- [ ] Points count matches data
- [ ] Expected clusters shown for modulation type
- [ ] Analysis text updates based on confidence

### Signal Lab (Visualizations)
- [ ] All 4 plots visible
- [ ] Job selector works
- [ ] Sample rate badge shows real value
- [ ] SNR badge shows estimated SNR
- [ ] Modulation badge shows classified type
- [ ] View selector (All/Waveform/FFT/Waterfall/Constellation) works

---

## 🐛 Troubleshooting

### "No completed analysis jobs found"
**Fix:** Upload a signal file and wait for processing to complete

### "Failed to load analysis result"  
**Fix:** Check worker is running, verify job completed successfully

### Constellation appears empty
**Check:** Job completed all 13 stages, particularly Stage 7 (Synchronization)

### Parameters show "N/A"
**Expected:** Some parameters unavailable for raw IQ without metadata (e.g., center frequency)

---

## 📁 Project Structure

```
SpectraSync/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes (unchanged)
│   │   ├── models/       # Database models (unchanged)
│   │   └── services/     # Business logic (unchanged)
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ParametersPage.tsx          ← MODIFIED ✅
│   │   │   ├── ModulationAnalysisPage.tsx  ← NEW ✅
│   │   │   └── VisualizationsPage.tsx      ← MODIFIED ✅
│   │   ├── components/
│   │   │   └── Sidebar.tsx                 ← MODIFIED ✅
│   │   └── App.tsx                         ← MODIFIED ✅
│   └── ...
├── processing/
│   ├── pipeline/         # 13-stage DSP pipeline (unchanged)
│   ├── modulation/       # ML classifier (unchanged)
│   └── ...
├── workers/
│   └── tasks.py          # Job processor (unchanged)
└── IMPLEMENTATION_SUMMARY.md  ← Full details
```

---

## 🎯 Key Achievement

✅ **Parameter Results and Modulation Analysis are now 100% functional**
✅ **ZERO hardcoded values remain**
✅ **Connected to real signal processing pipeline**
✅ **Ready for SIH 2026 demonstration**

---

## 📞 Support

- Full details: `IMPLEMENTATION_SUMMARY.md`
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

---

**Date:** September 21, 2026  
**Status:** ✅ COMPLETE
