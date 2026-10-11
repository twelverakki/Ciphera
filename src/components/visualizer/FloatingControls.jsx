import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';

export function FloatingControls({
  currentStep,
  maxStep,
  stepLabels,
  speed,
  setSpeed,
  isMuted,
  toggleMute,
  handlePrev,
  handleNext,
  onJumpStep
}) {
  const [inputVal, setInputVal] = useState(currentStep.toString());

  useEffect(() => {
    setInputVal(currentStep.toString());
  }, [currentStep]);

  const commitJump = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(maxStep, num));
      if (onJumpStep) onJumpStep(clamped);
      setInputVal(clamped.toString());
    } else {
      setInputVal(currentStep.toString());
    }
  };

  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-6 left-2 sm:left-auto max-w-[calc(100vw-16px)] sm:max-w-none z-50 flex items-center justify-between sm:justify-start space-x-1 sm:space-x-3 bg-white/95 backdrop-blur-md px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200/90 shadow-md">
      {/* BADGE PENEGASAN STEP DENGAN INPUT LANGSUNG & SELECT DROPDOWN */}
      <div className="flex items-center gap-1 sm:gap-2 mr-0.5 sm:mr-1 min-w-0">
        <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-600 text-white font-mono text-[11px] sm:text-xs font-bold shadow-xs shrink-0">
          <span className="select-none">Step</span>
          <input
            data-step-jump="true"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitJump(inputVal);
                e.currentTarget.blur();
              }
            }}
            onBlur={() => commitJump(inputVal)}
            className="w-6 sm:w-7 text-center bg-blue-700 hover:bg-blue-800 focus:bg-white focus:text-blue-900 text-white font-black rounded px-0.5 py-0 border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors select-all cursor-text text-[11px] sm:text-xs"
            title="Ketik nomor step (0-22) lalu Enter untuk lompat langsung"
          />
          <span className="text-blue-200 select-none">/{maxStep}</span>
        </div>

        {/* SELECTOR JUDUL STEP */}
        <select
          value={currentStep}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (onJumpStep) onJumpStep(val);
          }}
          className="text-[11px] sm:text-xs font-mono text-slate-800 font-bold bg-transparent hover:bg-slate-100 py-0.5 sm:py-1 px-1 sm:px-1.5 rounded cursor-pointer border border-transparent hover:border-slate-200 focus:outline-none transition-all max-w-[110px] xs:max-w-[160px] sm:max-w-[260px] md:max-w-[340px] truncate"
          title="Pilih konsep langkah untuk melompat langsung"
        >
          {stepLabels.map((label, idx) => (
            <option key={idx} value={idx} className="font-mono text-slate-800 bg-white">
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* SLIDER KECEPATAN: 0.1x sampai 2.0x (Sembunyi di HP kecil agar tidak sesak) */}
      <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2 border-l border-r border-slate-200 px-2 sm:px-3 shrink-0">
        <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 font-semibold w-8 sm:w-9 text-right">
          {speed.toFixed(1)}x
        </span>
        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-14 sm:w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          title="Atur Kecepatan Animasi (0.1x - 2.0x)"
        />
      </div>

      <div className="flex items-center space-x-0.5 sm:space-x-1 shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="p-1 sm:p-1 rounded-md hover:bg-slate-100 disabled:opacity-25 transition-all text-slate-700 cursor-pointer"
          title="Ke Langkah Sebelumnya"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentStep === maxStep}
          className="p-1 sm:p-1 rounded-md hover:bg-slate-100 disabled:opacity-25 transition-all text-slate-700 cursor-pointer"
          title="Ke Langkah Selanjutnya"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={toggleMute}
          className="p-1 sm:p-1 rounded-md hover:bg-slate-100 text-slate-600 transition-all cursor-pointer ml-0.5 sm:ml-1"
          title={isMuted ? 'Nyalakan Audio' : 'Matikan Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
        </button>
      </div>
    </div>
  );
}
