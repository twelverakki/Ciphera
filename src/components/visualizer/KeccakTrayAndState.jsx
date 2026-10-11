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

  const rootContainerRef = useRef(null);
  const trayScrollRef = useRef(null);
  const traySlotRefs = useRef({});
  const matrixSlotRefs = useRef({});
  const [activeFlyingCoords, setActiveFlyingCoords] = useState(null);

  // Auto-scroll nampan secara halus mengikuti balok lane yang sedang terbang di Step 15 pada layar HP
  useEffect(() => {
    if (currentStep === 15 && currentAbsorbedLane >= 0 && currentAbsorbedLane < 17) {
      const activeSlot = traySlotRefs.current[currentAbsorbedLane];
      const scrollEl = trayScrollRef.current;
      if (activeSlot && scrollEl) {
        const containerRect = scrollEl.getBoundingClientRect();
        const slotRect = activeSlot.getBoundingClientRect();
        if (slotRect.left < containerRect.left + 30 || slotRect.right > containerRect.right - 30) {
          activeSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }
  }, [currentStep, currentAbsorbedLane]);

  // Ukur koordinat terbang presisi dari posisi fisik slot nampan ke matriks 5x5
  useEffect(() => {
    if (currentStep === 15 && currentAbsorbedLane >= 0 && currentAbsorbedLane < 17) {
      const trayEl = traySlotRefs.current[currentAbsorbedLane];
      const matrixEl = matrixSlotRefs.current[currentAbsorbedLane];
      const rootEl = rootContainerRef.current;

      if (trayEl && matrixEl && rootEl) {
        const rootRect = rootEl.getBoundingClientRect();
        const trayRect = trayEl.getBoundingClientRect();
        const matrixRect = matrixEl.getBoundingClientRect();

        setActiveFlyingCoords({
          startX: trayRect.left - rootRect.left,
          startY: trayRect.top - rootRect.top,
          targetX: matrixRect.left - rootRect.left,
          targetY: matrixRect.top - rootRect.top,
          width: trayRect.width,
          height: trayRect.height,
          laneId: currentAbsorbedLane
        });
      }
    } else {
      setActiveFlyingCoords(null);
    }
  }, [currentStep, currentAbsorbedLane]);

  return (
    <div 
      ref={rootContainerRef}
      className="w-full flex flex-col items-center justify-center relative overflow-visible"
    >
      {/* ======================================================= */}
      {/* HEADER SECTION: NAMPAN (STEP 14) ATAU TITLE FASE + BAR  */}
      {/* (STEP 15 SETELAH SELESAI BERPINDAH)                     */}
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
            ref={trayScrollRef}
            initial={{ opacity: 0, y: 35 }}
            animate={{ 
              opacity: currentStep === 15 && currentAbsorbedLane >= 17 ? 0 : 1, 
              y: 0 
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 / speed, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-full sm:overflow-x-auto pb-1 sm:pb-2 sm:scrollbar-thin sm:scrollbar-thumb-slate-300 sm:overscroll-x-contain mb-1.5 sm:mb-2"
          >
            <div className="w-full sm:min-w-fit mx-auto px-1 sm:px-4 flex flex-col items-center">
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs max-w-full sm:w-auto">
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
                      className="w-[34px] h-[34px] xs:w-[38px] xs:h-[38px] sm:w-[44px] sm:h-[44px] rounded-lg sm:rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-hidden flex-shrink-0"
                    >
                      {/* Balok standby menunggu giliran terbang */}
                      {isWaiting && (
                        <GlassLaneBlock
                          shortName={lane.shortName}
                          bitsLabel="64b"
                          fillPercent={100}
                        />
                      )}

                      {/* Placeholder transparan jika sudah terbang atau sedang terbang */}
                      {(isAlreadyFlown || isFlyingNow) && (
                        <span className="font-mono text-[8px] sm:text-[9px] font-bold text-slate-300 select-none">
                          {lane.shortName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BALOK MELUNCUR TERBANG KE MATRIKS 5x5 (DI-RENDER DI ROOT AGAR TIDAK PERNAH TERPOTONG OVERFLOW) */}
      {currentStep === 15 && activeFlyingCoords && (
        <motion.div
          key={`traveling-absorbed-lane-${activeFlyingCoords.laneId}`}
          initial={{
            x: activeFlyingCoords.startX,
            y: activeFlyingCoords.startY,
            scale: 1
          }}
          animate={{
            x: activeFlyingCoords.targetX,
            y: activeFlyingCoords.targetY,
            scale: [1, 1.06, 1]
          }}
          transition={{
            duration: 0.28 / speed,
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: activeFlyingCoords.width || 40,
            height: activeFlyingCoords.height || 40,
            zIndex: 100,
            pointerEvents: 'none'
          }}
        >
          <GlassLaneBlock
            shortName={lanes[activeFlyingCoords.laneId].shortName}
            bitsLabel="64b"
            fillPercent={100}
            className="shadow-md shadow-blue-500/25 ring-1 ring-white/80"
          />
        </motion.div>
      )}

      {/* INDIKATOR ALIRAN DARI ATAS KE WADAH KECCAK */}
      <div className="flex flex-col items-center my-1.5 sm:my-3">
        <div className="w-0.5 h-4 sm:h-6 bg-slate-300"></div>
        <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 animate-bounce" />
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
        className="grid grid-cols-5 gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 w-[260px] xs:w-[280px] sm:w-[330px] aspect-square shadow-inner"
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
