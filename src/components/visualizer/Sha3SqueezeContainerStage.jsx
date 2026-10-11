import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { sha3_256 } from 'js-sha3';
import { soundEngine } from '../../audio/soundEngine';

/**
 * Komponen Balok Byte Glassmorphic Ringkas untuk Wadah Squeezing 4x8
 * Ukuran diperkecil agar pas dan proporsional berdampingan dengan label baris.
 */
function CompactGlassByteBlock({ byteHex, byteIdx, colorTheme }) {
  const themeGradients = {
    amber: 'from-amber-600 via-amber-500 to-amber-400',
    cyan: 'from-cyan-600 via-cyan-500 to-cyan-400',
    emerald: 'from-emerald-600 via-emerald-500 to-emerald-400',
    pink: 'from-pink-600 via-pink-500 to-pink-400'
  };

  const gradientClass = themeGradients[colorTheme] || themeGradients.amber;

  return (
    <div className="w-full h-8 sm:h-9 rounded-lg backdrop-blur-md bg-white/60 border border-white/80 shadow-2xs relative overflow-hidden flex flex-col items-center justify-center select-none font-mono">
      {/* Background Liquid/Gradient Cairan */}
      <div className={`absolute inset-0 bg-gradient-to-t ${gradientClass} rounded-lg z-0`}>
        <div className="w-full h-0.5 bg-white/40 shadow-xs" />
      </div>

      {/* Kilau Kaca Glassmorphic */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/10 to-transparent pointer-events-none z-10" />

      {/* Teks Nilai Hex & Label Byte */}
      <div className="relative z-20 flex flex-col items-center justify-center leading-none">
        <span className="text-[10px] sm:text-[11px] font-black text-white drop-shadow-xs tracking-tight">
          {byteHex}
        </span>
        <span className="text-[6px] sm:text-[7px] font-bold text-white/90 mt-0.5 opacity-90 font-sans">
          b{byteIdx}
        </span>
      </div>
    </div>
  );
}

/**
 * Step 19 & 20: Wadah Squeezing 4x8 & Penampang Kloning Frameless
 * - Step 19: Wadah 4x8 ringkas dengan label Lane di sebelah kiri tiap baris.
 * - Step 20: Angka hex keluar/meluncur nyata dari masing-masing block wadah squeezing
 *   menuju barisan di penampang bawah (2 baris x 2 kolom murni tanpa background).
 */
export function Sha3SqueezeContainerStage({ currentStep = 20, inputText, speed, isMuted }) {
  const [fillProgress, setFillProgress] = useState(0); // 0 s/d 4 (baris terisi di Step 20)
  const [cloneProgress, setCloneProgress] = useState(0); // 0 s/d 32 (byte terkloning di Step 21)
  const [animKey, setAnimKey] = useState(0);

  // Physical Refs untuk mengukur koordinat terbang langsung dari block ke penampang
  const sourceRefs = useRef({});
  const targetRefs = useRef({});
  const [flyOffsets, setFlyOffsets] = useState({});

  // Perhitungan hash resmi SHA-3-256
  const fullHash = useMemo(() => {
    try {
      return sha3_256(inputText ?? '');
    } catch {
      return sha3_256('');
    }
  }, [inputText]);

  // Data 4 Lane yang diperas (32 Byte / 256-Bit)
  const lanes = useMemo(() => {
    const laneConfigs = [
      {
        idx: 0,
        name: 'Lane 0',
        shortName: 'L0',
        coord: '(0,0)',
        label: 'b0..b7',
        colorTheme: 'amber',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        dotColor: 'bg-amber-500',
        startIndex: 0
      },
      {
        idx: 1,
        name: 'Lane 1',
        shortName: 'L1',
        coord: '(1,0)',
        label: 'b8..b15',
        colorTheme: 'cyan',
        badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300',
        dotColor: 'bg-cyan-500',
        startIndex: 8
      },
      {
        idx: 2,
        name: 'Lane 2',
        shortName: 'L2',
        coord: '(2,0)',
        label: 'b16..b23',
        colorTheme: 'emerald',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotColor: 'bg-emerald-500',
        startIndex: 16
      },
      {
        idx: 3,
        name: 'Lane 3',
        shortName: 'L3',
        coord: '(3,0)',
        label: 'b24..b31',
        colorTheme: 'pink',
        badgeBg: 'bg-pink-100 text-pink-900 border-pink-300',
        dotColor: 'bg-pink-500',
        startIndex: 24
      }
    ];

    return laneConfigs.map((cfg) => {
      const hex16 = fullHash.slice(cfg.idx * 16, (cfg.idx + 1) * 16);
      const bytes = [];
      for (let i = 0; i < 8; i++) {
        const byteHex = hex16.slice(i * 2, i * 2 + 2).toUpperCase();
        const globalByteIdx = cfg.startIndex + i;
        bytes.push({
          localIdx: i,
          globalIdx: globalByteIdx,
          hex: byteHex
        });
      }
      return {
        ...cfg,
        hex16,
        bytes
      };
    });
  }, [fullHash]);

  // Ukur delta posisi fisik dari balok atas ke target baris bawah di Step 21
  useEffect(() => {
    if (currentStep === 21) {
      const measure = () => {
        const offsets = {};
        for (let i = 0; i < 32; i++) {
          const src = sourceRefs.current[i];
          const tgt = targetRefs.current[i];
          if (src && tgt) {
            const srcRect = src.getBoundingClientRect();
            const tgtRect = tgt.getBoundingClientRect();
            offsets[i] = {
              x: (srcRect.left + srcRect.width / 2) - (tgtRect.left + tgtRect.width / 2),
              y: (srcRect.top + srcRect.height / 2) - (tgtRect.top + tgtRect.height / 2)
            };
          }
        }
        if (Object.keys(offsets).length > 0) {
          setFlyOffsets(offsets);
        }
      };

      const timer = setTimeout(measure, 40);
      window.addEventListener('resize', measure);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', measure);
      };
    }
  }, [currentStep, animKey]);

  // Animasi pengisian bertahap wadah 4x8 di Step 20
  useEffect(() => {
    if (currentStep === 20) {
      setFillProgress(0);
      let currentRow = 0;
      const intervalDuration = (0.32 / speed) * 1000;

      const interval = setInterval(() => {
        if (currentRow < 4) {
          currentRow += 1;
          setFillProgress(currentRow);
          if (!isMuted) soundEngine.playLandingKlop();
        } else {
          clearInterval(interval);
        }
      }, intervalDuration);

      return () => clearInterval(interval);
    } else {
      setFillProgress(4); // Pastikan sudah terisi penuh saat masuk Step 21
    }
  }, [currentStep, animKey, speed, isMuted]);

  // Animasi kloning angka byte demi byte keluar dari balok atas menuju ke bawah di Step 21
  useEffect(() => {
    if (currentStep === 21) {
      setCloneProgress(0);
      let currentByte = 0;
      const intervalDuration = (0.055 / speed) * 1000;

      // Beri sedikit jeda 60ms agar flyOffsets terukur sempurna
      const startTimer = setTimeout(() => {
        const interval = setInterval(() => {
          if (currentByte < 32) {
            currentByte += 1;
            setCloneProgress(currentByte);
            if (!isMuted && currentByte % 2 === 0) {
              soundEngine.playTypingBlip();
            }
          } else {
            clearInterval(interval);
            if (!isMuted) soundEngine.playLandingKlop();
          }
        }, intervalDuration);

        return () => clearInterval(interval);
      }, 60);

      return () => clearTimeout(startTimer);
    }
  }, [currentStep, animKey, speed, isMuted]);

  const replayCurrentStage = () => {
    if (!isMuted) soundEngine.playWhooshThin();
    setAnimKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-2 select-none relative overflow-visible">
      
      {/* 1. BADGE JUDUL */}
      <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-2xs mb-2.5">
        <span className={`w-2 h-2 rounded-full ${
          (currentStep === 20 ? fillProgress >= 4 : cloneProgress >= 32)
            ? 'bg-amber-600'
            : 'bg-amber-500 animate-pulse'
        }`} />
        <h3 className="text-xs sm:text-sm font-mono font-black tracking-wider text-amber-950 uppercase">
          {currentStep === 20 
            ? 'Wadah Squeezing: 4×8 Byte (256-Bit)' 
            : 'Kloning Hex: 2 Baris × 2 Kolom'}
        </h3>
      </div>

      {/* 2. BAR STATUS SEBARIS DENGAN TOMBOL IKON DI SAMPING */}
      <div className="flex items-center gap-2 w-full mb-3">
        <div className="flex-1 flex flex-col justify-center px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-[11px]">
                {currentStep === 20 ? 'Kapasitas Wadah:' : 'Hex Terklon:'}
              </span>
              <span className="text-amber-600 font-black tracking-wider">
                {currentStep === 20 
                  ? `${fillProgress * 8} / 32 Byte (${fillProgress * 64}-Bit)` 
                  : `${cloneProgress} / 32 Byte (${cloneProgress * 8}-Bit)`}
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${
              (currentStep === 20 ? fillProgress >= 4 : cloneProgress >= 32)
                ? 'text-emerald-600'
                : 'text-amber-600'
            }`}>
              {currentStep === 20
                ? (fillProgress >= 4 ? '✓ 4 Lane Squeezed (256-Bit)' : `Mengisi Baris ${fillProgress + 1} dari 4...`)
                : (cloneProgress >= 32 ? '✓ 32 Byte Terklon Lengkap' : `Kloning Hex Byte ${cloneProgress} dari 32...`)}
            </span>
          </div>

          {/* Progress Bar Wadah */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-cyan-500 to-pink-500 transition-all duration-300"
              style={{ 
                width: `${currentStep === 20 ? (fillProgress / 4) * 100 : (cloneProgress / 32) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Tombol Putar Ulang (Ikon Saja) */}
        <button
          onClick={replayCurrentStage}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
          title="Putar Ulang Tahap Ini"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
        </button>
      </div>

      {/* ======================================================= */}
      {/* 3. WADAH SQUEEZE 4×8 (MIRIP KECCAK 5×5 + LABEL KIRI)    */}
      {/* ======================================================= */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-3.5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 w-full shadow-inner relative overflow-visible"
      >
        {lanes.map((lane) => {
          const isFilled = fillProgress > lane.idx;

          return (
            <div key={`row-${lane.idx}`} className="flex items-center gap-1.5 sm:gap-2 w-full">
              {/* LABEL LANE INDEX DI SEBELAH KIRI */}
              <div className={`w-11 xs:w-14 sm:w-20 h-8 sm:h-9 px-1 sm:px-1.5 rounded-xl border text-[9px] sm:text-[11px] font-mono font-black shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs ${lane.badgeBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${lane.dotColor}`} />
                <span className="hidden xs:inline">{lane.name}</span>
                <span className="xs:hidden">{lane.shortName}</span>
              </div>

              {/* 8 KOTAK HEX KECIL & RAPI DI SEBELAH KANAN */}
              <div className="grid grid-cols-8 gap-1 sm:gap-1.5 flex-1">
                {lane.bytes.map((b) => {
                  const isCloningThis = currentStep === 21 && cloneProgress === b.globalIdx + 1;

                  return (
                    <div
                      key={`slot-${lane.idx}-${b.localIdx}`}
                      ref={(el) => {
                        if (el) sourceRefs.current[b.globalIdx] = el;
                      }}
                      className={`h-8 sm:h-9 rounded-lg border-2 border-dashed flex flex-col items-center justify-center relative select-none transition-all ${
                        isFilled
                          ? 'border-transparent bg-transparent p-0'
                          : 'border-slate-300 bg-slate-100/60 text-slate-400 p-0.5'
                      }`}
                    >
                      {/* Efek Ping Ringan di Balok Atas Saat Angka Meluncur Keluar */}
                      {isCloningThis && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0.8 }}
                          animate={{ scale: 1.35, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="absolute inset-0 rounded-lg bg-white ring-2 ring-blue-400 pointer-events-none z-30"
                        />
                      )}

                      {isFilled ? (
                        <motion.div
                          initial={{ scale: 0.82, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: b.localIdx * 0.025,
                            duration: 0.2,
                            ease: 'easeOut'
                          }}
                          className="w-full h-full"
                        >
                          <CompactGlassByteBlock
                            byteHex={b.hex}
                            byteIdx={b.globalIdx}
                            colorTheme={lane.colorTheme}
                          />
                        </motion.div>
                      ) : (
                        <>
                          <span className="font-mono text-[8px] font-bold text-slate-300 leading-none">··</span>
                          <span className="font-mono text-[6px] text-slate-400 mt-0.5 leading-none">b{b.globalIdx}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ======================================================= */}
      {/* 4. STEP 21: PENAMPANG FRAMELESS (2 BARIS × 2 KOLOM)     */}
      {/* ======================================================= */}
      {currentStep === 21 && (
        <div className="w-full mt-7 flex flex-col items-center select-none relative overflow-visible">
          {/* Matriks 2 Baris x 2 Kolom di desktop / 4 Baris di HP: Deretan Angka Hex Murni */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-2 sm:gap-y-3 w-full">
            {lanes.map((lane) => {
              return (
                <div
                  key={`frameless-lane-${lane.idx}`}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 py-0.5"
                >
                  {lane.bytes.map((b) => {
                    const isRevealed = cloneProgress >= (b.globalIdx + 1);
                    const offset = flyOffsets[b.globalIdx] || { x: 0, y: -160 };

                    return (
                      <div
                        key={`target-slot-${b.globalIdx}`}
                        ref={(el) => {
                          if (el) targetRefs.current[b.globalIdx] = el;
                        }}
                        className="relative flex items-center justify-center w-5 sm:w-6 h-5"
                      >
                        {/* Placeholder transparan untuk mengunci bounding client rect */}
                        <span className="opacity-0 font-mono font-bold text-xs sm:text-sm select-none pointer-events-none">
                          {b.hex}
                        </span>

                        {/* Angka yang benar-benar terbang keluar dari balok wadah atas */}
                        {isRevealed && (
                          <motion.span
                            key={`flying-hex-${b.globalIdx}-${animKey}`}
                            initial={{
                              x: offset.x,
                              y: offset.y,
                              scale: 1.45,
                              opacity: 0.95
                            }}
                            animate={{
                              x: 0,
                              y: 0,
                              scale: 1,
                              opacity: 1
                            }}
                            transition={{
                              duration: 0.42 / speed,
                              ease: [0.22, 1, 0.36, 1]
                            }}
                            className="absolute inset-0 flex items-center justify-center font-mono font-black text-slate-900 text-xs sm:text-sm tracking-wider select-none z-50 pointer-events-none"
                          >
                            {b.hex}
                          </motion.span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Cukup Garis Panjang Saja di Bawah Baris Angkanya */}
          <div className="w-full h-[1.5px] bg-slate-300 mt-2.5" />
        </div>
      )}

    </div>
  );
}
