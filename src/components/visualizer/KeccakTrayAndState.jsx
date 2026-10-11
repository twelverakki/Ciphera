import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { GlassLaneBlock } from './Wadah1088Grid';

export function KeccakTrayAndState({
  currentStep,
  speed,
  stepDirection,
  currentAbsorbedLane,
  isAbsorptionComplete,
  keccak5x5Slots
}) {
  // Hanya aktif di Step 14 & Step 15 (Step 16 digantikan oleh Kubus 3D)
  if (currentStep < 14 || currentStep > 15) return null;

  const lanes = Array.from({ length: 17 }, (_, i) => ({
    id: i,
    name: `Lane ${i + 1}`,
    shortName: `L${i + 1}`,
    bits: '64-bit'
  }));

  const traySlotRefs = useRef({});
  const matrixSlotRefs = useRef({});
  const [flyOffsets, setFlyOffsets] = useState({});

  // Ukur koordinat terbang dari Nampan ke 17 slot Bitrate di Matriks 5x5
  useEffect(() => {
    if (currentStep >= 14) {
      const updateOffsets = () => {
        const newOffsets = {};
        for (let i = 0; i < 17; i++) {
          const trayEl = traySlotRefs.current[i];
          const matrixEl = matrixSlotRefs.current[i];
          if (trayEl && matrixEl) {
            const trayRect = trayEl.getBoundingClientRect();
            const matrixRect = matrixEl.getBoundingClientRect();
            newOffsets[i] = {
              x: matrixRect.left + matrixRect.width / 2 - (trayRect.left + trayRect.width / 2),
              y: matrixRect.top + matrixRect.height / 2 - (trayRect.top + trayRect.height / 2)
            };
          }
        }
        if (Object.keys(newOffsets).length > 0) {
          setFlyOffsets(newOffsets);
        }
      };

      const timer = setTimeout(updateOffsets, 50);
      window.addEventListener('resize', updateOffsets);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateOffsets);
      };
    }
  }, [currentStep]);

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      {/* ======================================================= */}
      {/* HEADER SECTION: NAMPAN (STEP 13) ATAU TITLE FASE + BAR  */}
      {/* (STEP 14 SETELAH SELESAI BERPINDAH)                     */}
      {/* ======================================================= */}
      <AnimatePresence mode="wait">
        {isAbsorptionComplete ? (
          /* TITLE FASE KECCAK SIMPEL & BAR PERSENTASE -/25 */
          <motion.div
            key="keccak-title-header"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 / speed, ease: 'easeOut' }}
            className="flex flex-col items-center mb-2 w-full max-w-sm sm:max-w-md px-2"
          >
            {/* Title Fase Simpel & Bagus */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-xs" />
              <h3 className="text-sm sm:text-base font-mono font-black tracking-wider text-slate-800 uppercase">
                Keccak State Absorption
              </h3>
            </div>

            {/* Bar Persentase -/25 */}
            <div className="w-full bg-slate-200/80 rounded-full h-3.5 p-0.5 border border-slate-300 relative overflow-hidden shadow-inner">
              <motion.div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full shadow-xs"
                initial={{ width: '0%' }}
                animate={{ width: `${(17 / 25) * 100}%` }}
                transition={{ duration: 0.6 / speed, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {/* Keterangan Bar & Kesiapan 24 Ronde */}
            <div className="flex justify-between items-center w-full mt-1.5 px-0.5 text-[11px] font-mono font-bold">
              <span className="text-slate-600">
                Tahap Permutasi: <span className="text-blue-600 font-black">24 Ronde</span> Siap Dimulai
              </span>
              <span className="text-emerald-600 font-black">
                State: 17/25 Bitrate (68%)
              </span>
            </div>
          </motion.div>
        ) : (
          /* NAMPAN BALOK LANE (STEP 14 & SAAT PROSES TERBANG DI STEP 15) */
          <motion.div
            key="keccak-tray-header"
            initial={{ opacity: 0, y: 35 }}
            animate={{ 
              opacity: currentStep === 15 && currentAbsorbedLane >= 17 ? 0 : 1, 
              y: 0 
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 / speed, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-1 sm:gap-1.5 p-2 rounded-2xl bg-white border border-slate-200 shadow-xs w-auto mb-2"
          >
            {lanes.map((lane) => {
              const isAlreadyFlown = currentStep === 15 && currentAbsorbedLane > lane.id;
              const isFlyingNow = currentStep === 15 && currentAbsorbedLane === lane.id;
              const isWaiting = !isAlreadyFlown && !isFlyingNow;

              return (
                <div
                  key={`top-absorbed-slot-${lane.id}`}
                  ref={(el) => {
                    if (el) traySlotRefs.current[lane.id] = el;
                  }}
                  className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-visible"
                >
                  {/* Balok standby menunggu giliran terbang */}
                  {isWaiting && (
                    <GlassLaneBlock
                      shortName={lane.shortName}
                      bitsLabel="64b"
                      fillPercent={100}
                    />
                  )}

                  {/* Balok sedang meluncur terbang menuju matriks 5x5 */}
                  {isFlyingNow && (
                    <motion.div
                      initial={{ x: 0, y: 0, scale: 1 }}
                      animate={{
                        x: flyOffsets[lane.id]?.x ?? 0,
                        y: flyOffsets[lane.id]?.y ?? 140,
                        scale: [1, 1.06, 1]
                      }}
                      transition={{
                        duration: 0.28 / speed,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      className="absolute inset-0 z-50 pointer-events-none"
                    >
                      <GlassLaneBlock
                        shortName={lane.shortName}
                        bitsLabel="64b"
                        fillPercent={100}
                        className="shadow-md shadow-blue-500/25 ring-1 ring-white/80"
                      />
                    </motion.div>
                  )}

                  {/* Placeholder transparan jika sudah terbang */}
                  {(isAlreadyFlown || isFlyingNow) && (
                    <span className="font-mono text-[9px] font-bold text-slate-300 select-none">
                      {lane.shortName}
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* INDIKATOR ALIRAN DARI ATAS KE WADAH KECCAK */}
      <div className="flex flex-col items-center my-3">
        <div className="w-0.5 h-6 bg-slate-300"></div>
        <ArrowDown className="w-4 h-4 text-blue-600 animate-bounce" />
      </div>

      {/* ======================================================= */}
      {/* WADAH KECCAK STATE 5×5 (1600-BIT)                       */}
      {/* Tanpa frame outer, hanya wadahnya saja yang ber-border */}
      {/* ======================================================= */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 / speed, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-5 gap-2 p-3 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 w-[300px] sm:w-[330px] aspect-square shadow-inner"
      >
        {keccak5x5Slots.map((slot) => {
          const isCapacity = slot.type === 'capacity';
          const isAbsorbed = currentStep === 15 
            ? currentAbsorbedLane > slot.idx 
            : currentStep > 15;

          return (
            <div
              key={`keccak-slot-${slot.x}-${slot.y}`}
              ref={(el) => {
                if (el && !isCapacity) matrixSlotRefs.current[slot.idx] = el;
              }}
              className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative select-none transition-all overflow-hidden ${
                isCapacity
                  ? 'border-slate-300 bg-slate-100/70 text-slate-400 p-1'
                  : isAbsorbed
                  ? 'border-transparent bg-transparent p-0'
                  : 'border-blue-400/80 bg-blue-50/50 text-blue-600 p-1'
              }`}
            >
              {isCapacity ? (
                <>
                  <span className="text-xs">🔒</span>
                  <span className="text-[8px] font-mono font-black mt-0.5 text-slate-500">c=512</span>
                </>
              ) : isAbsorbed ? (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="w-full h-full"
                >
                  <GlassLaneBlock
                    shortName={slot.laneName}
                    bitsLabel="64b"
                    fillPercent={100}
                  />
                </motion.div>
              ) : (
                <>
                  <span className="text-[10px] font-mono font-black">{slot.laneName}</span>
                  <span className="text-[7px] font-mono font-bold opacity-75">Bitrate</span>
                </>
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
