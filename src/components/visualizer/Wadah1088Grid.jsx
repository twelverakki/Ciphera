import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

/**
 * Komponen Balok Lane Glassmorphic dengan latar belakang cairan (after)
 * yang meninggi seiring progres scanning (0% -> 100%, 0-bit -> 64-bit).
 */
export function GlassLaneBlock({
  shortName,
  bitsLabel,
  fillPercent = 0,
  className = ""
}) {
  return (
    <div
      className={`w-full h-full rounded-xl backdrop-blur-md bg-white/55 border border-white/70 shadow-xs relative overflow-hidden flex flex-col items-center justify-center select-none font-mono ${className}`}
    >
      {/* Background After: Cairan/fill yang meninggi seiring scanning */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 via-indigo-600 to-blue-500 rounded-b-xl z-0 transition-[height] duration-150 ease-out pointer-events-none"
        style={{ height: `${fillPercent}%` }}
      >
        {fillPercent > 0 && fillPercent < 100 && (
          <div className="w-full h-0.5 bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.95)]" />
        )}
      </div>

      {/* Kilau Kaca Glassmorphic (Glass Sheen Highlight) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/10 to-transparent pointer-events-none z-10" />

      {/* Teks Identitas Lane & Bit Counter */}
      <div className="relative z-20 flex flex-col items-center justify-center leading-none">
        <span
          className={`text-[10px] sm:text-xs font-black tracking-tight transition-colors duration-150 ${
            fillPercent > 35 ? 'text-white drop-shadow-xs' : 'text-slate-800'
          }`}
        >
          {shortName}
        </span>
        <span
          className={`text-[7px] sm:text-[8px] font-bold mt-0.5 transition-colors duration-150 ${
            fillPercent > 35 ? 'text-blue-100 drop-shadow-xs' : 'text-slate-500'
          }`}
        >
          {bitsLabel}
        </span>
      </div>
    </div>
  );
}

export function Wadah1088Grid({
  currentStep,
  speed,
  stepDirection,
  step11Phase,
  currentScanningLane,
  containerSlots,
  offsets,
  replayKey = 0,
  slotTimings,
  slotRefs,
  topLaneRefs,
  bottomLaneRefs
}) {
  // Ditampilkan di Step 10 s/d 13. Di Step 14, Wadah 1088 menghilang/fade out saat nampan bawah terdorong ke atas
  if (currentStep < 10 || currentStep > 13) return null;

  // Di Step 12 (sebelumnya Step 11):
  // Phase 0: Wadah ukuran normal
  // Phase 1+: Wadah membesar simetris ke ukuran 44px
  // Phase 2+: Muncul 2 Nampan Block Lane (Atas & Bawah)
  const isEnlarged = (currentStep === 12 && step11Phase >= 1) || currentStep > 12;
  const showDualLanes = (currentStep === 12 && step11Phase >= 2) || currentStep >= 13;

  // Total 17 Lanes (Lane 1 sampai Lane 17)
  const lanes = Array.from({ length: 17 }, (_, i) => ({
    id: i,
    name: `Lane ${i + 1}`,
    shortName: `L${i + 1}`,
    bits: '64-bit'
  }));

  const laneColRefs = useRef({});
  const [scanPositions, setScanPositions] = useState(null);

  // Ukur koordinat fisik lintasan scanning (Top Tray -> Row 0..7 -> Bottom Tray)
  useEffect(() => {
    if (currentStep >= 12) {
      const measure = () => {
        const topEl = topLaneRefs.current[0];
        const bottomEl = bottomLaneRefs.current[0];
        const colEl = laneColRefs.current[0];
        if (topEl && bottomEl && colEl) {
          const colRect = colEl.getBoundingClientRect();
          const topRect = topEl.getBoundingClientRect();
          const bottomRect = bottomEl.getBoundingClientRect();

          const rows = [];
          for (let r = 0; r < 8; r++) {
            const slotEl = slotRefs.current[r];
            if (slotEl) {
              const sRect = slotEl.getBoundingClientRect();
              rows.push(sRect.top - colRect.top);
            }
          }

          setScanPositions({
            top: topRect.top - colRect.top,
            rows,
            bottom: bottomRect.top - colRect.top
          });
        }
      };

      const timer = setTimeout(measure, 40);
      window.addEventListener('resize', measure);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', measure);
      };
    }
  }, [currentStep, isEnlarged, showDualLanes]);

  // Durasi scanning transit per lane
  const scanDuration = 0.54 / speed;

  // Tracking sub-fase baris (0 s/d 8) untuk kenaikan progres 8-bit tiap hex
  const [scanningRow, setScanningRow] = useState(0);

  useEffect(() => {
    if (currentStep === 13 && currentScanningLane >= 0 && currentScanningLane < 17) {
      setScanningRow(0);
      const rowStepDuration = (scanDuration / 9) * 1000;
      const timers = [];
      for (let r = 1; r <= 8; r++) {
        const t = setTimeout(() => {
          setScanningRow(r);
        }, r * rowStepDuration);
        timers.push(t);
      }
      return () => timers.forEach((t) => clearTimeout(t));
    }
  }, [currentScanningLane, currentStep, speed, scanDuration]);

  // Progres cairan dan bit counter saat meluncur
  const scanningFillPercent = Math.min(100, Math.max(0, scanningRow * 12.5));
  const scanningBitLabel = `${Math.min(64, scanningRow * 8)}b`;

  // Keyframes koordinat vertikal
  const rowKeyframes = scanPositions?.rows?.length === 8
    ? scanPositions.rows
    : [0, 46, 92, 138, 184, 230, 276, 322];

  const yKeyframes = [
    scanPositions?.top ?? -58,
    ...rowKeyframes,
    scanPositions?.bottom ?? 380
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 25 }}
      animate={{ 
        opacity: 1,
        y: isEnlarged ? -10 : 0 
      }}
      transition={{ duration: 0.55 / speed, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col items-center justify-center relative will-change-transform z-30"
    >
      {/* Indikator Aliran dari Nampan Hex ke Wadah (Hanya di Step 10 & 11) */}
      {currentStep < 12 && (
        <div className="flex flex-col items-center py-0.5 z-0 mb-1">
          <div className="w-0.5 h-5 bg-slate-300"></div>
          <ArrowDown className={`w-3.5 h-3.5 text-slate-500 ${currentStep === 11 ? 'animate-bounce text-blue-600' : ''}`} />
        </div>
      )}

      {/* Container Scroll Horizontal untuk Layar HP/Mobile (17 Kolom) */}
      <div className="w-full max-w-full overflow-x-auto pb-2 flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300">
        {/* ========================================================= */}
        {/* NAMPAN ATAS: 17 BLOCK LANE (LANE 1 - 17)                  */}
        {/* Muncul di Step 12 Phase 2, sumber scanning di Step 13      */}
        {/* ========================================================= */}
        {showDualLanes && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-1 sm:gap-1.5 p-2 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3.5 w-auto"
        >
          {lanes.map((lane) => {
              const isWaiting = currentStep === 12 || (currentStep === 13 && currentScanningLane < lane.id);

              return (
                <div
                  key={`top-lane-slot-${lane.id}`}
                  ref={(el) => {
                    if (el) topLaneRefs.current[lane.id] = el;
                  }}
                  className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-hidden"
                >
                  {/* Blok kaca standby sebelum gilirannya scanning */}
                  {isWaiting && (
                    <GlassLaneBlock
                      shortName={lane.shortName}
                      bitsLabel="0b"
                      fillPercent={0}
                    />
                  )}

                  {/* Placeholder transparan jika sudah berangkat / selesai scan */}
                  {!isWaiting && (
                    <span className="font-mono text-[9px] font-bold text-slate-300 select-none">
                      {lane.shortName}
                    </span>
                  )}
                </div>
              );
            })}
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* WADAH 1088 (17 KOLOM x 8 BARIS)                           */}
      {/* Tampilan bersih tanpa border/ring tambahan di Step 13     */}
      {/* ========================================================= */}
      <motion.div 
        layout
        key="grid-1088-lanes"
        transition={{ duration: 0.5 / speed, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: 'center center' }}
        className={`rounded-2xl mx-auto flex items-start justify-center relative overflow-visible gap-1 sm:gap-1.5 ${
          isEnlarged
            ? 'p-2 border border-slate-200 bg-slate-50/90 shadow-inner w-auto'
            : 'w-full max-w-2xl p-2 sm:p-2.5 border-2 border-dashed border-slate-300 bg-slate-50 shadow-inner box-border'
        }`}
      >
        {Array.from({ length: 17 }).map((_, colIdx) => {
          const colSlots = containerSlots.slice(colIdx * 8, colIdx * 8 + 8);
          const isColumnBeingScanned = currentStep === 13 && currentScanningLane === colIdx;

          return (
            <div
              key={`lane-col-${colIdx}`}
              ref={(el) => {
                if (el) laneColRefs.current[colIdx] = el;
              }}
              className={`flex flex-col items-center relative overflow-visible ${
                isEnlarged ? 'w-auto flex-shrink-0' : 'flex-1 min-w-0'
              }`}
            >
              {/* 8 KOTAK HEX PER KOLOM - Bersih & alami tanpa border scanner */}
              <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full">
                {colSlots.map((slot) => {
                  const isFilled = currentStep >= 11;
                  const isAnimatingFly10 = currentStep === 11;
                  const totalMotionDuration = 0.28 / speed;
                  const baseTime = slotTimings[slot.idx] ?? (slot.idx * 0.042);
                  const slotDelay = isAnimatingFly10 ? baseTime / speed : 0;

                  // Koordinat awal tepat dari nampan
                  const offset = offsets[slot.idx];
                  const startX = offset ? offset.x : 0;
                  const startY = offset ? offset.y : -160;

                  return (
                    <div
                      key={`square-slot-${slot.idx}`}
                      ref={(el) => {
                        if (el) slotRefs.current[slot.idx] = el;
                      }}
                      className={`relative rounded-md sm:rounded-lg border border-dashed border-slate-300 bg-white/80 flex items-center justify-center overflow-visible shadow-2xs box-border ${
                        isEnlarged 
                          ? 'w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] flex-shrink-0' 
                          : 'w-full aspect-square min-h-[24px] sm:min-h-[28px]'
                      }`}
                    >
                      <AnimatePresence>
                        {isFilled && (
                          <motion.div
                            key={`slot-fly-${slot.idx}-${isAnimatingFly10 ? 'fly' : 'settled'}-${replayKey}`}
                            initial={
                              isAnimatingFly10
                                ? { 
                                    opacity: 0, 
                                    x: startX, 
                                    y: startY, 
                                    scale: 1 
                                  }
                                : { opacity: 1, x: 0, y: 0, scale: 1 }
                            }
                            animate={{ 
                              opacity: 1, 
                              x: 0, 
                              y: 0, 
                              scale: isAnimatingFly10 ? [1, 1.06, 1] : 1 
                            }}
                            transition={{ 
                              duration: isAnimatingFly10 ? totalMotionDuration : 0.2, 
                              delay: slotDelay,
                              ease: [0.22, 1, 0.36, 1] 
                            }}
                            style={{ 
                              zIndex: isAnimatingFly10 ? 50 : 10,
                              pointerEvents: 'none'
                            }}
                            className={`absolute inset-0 rounded-md sm:rounded-lg font-mono font-black flex items-center justify-center shadow-xs select-none ${
                              isEnlarged ? 'text-[11px] sm:text-xs' : 'text-[9px] sm:text-[11px]'
                            } ${
                              slot.type === 'data'
                                ? 'bg-blue-600 text-white border border-blue-700 ring-1 ring-blue-400/30'
                                : slot.type === 'delimiter'
                                ? 'bg-amber-500 text-white border border-amber-600 ring-1 ring-amber-400/30'
                                : slot.type === 'zero'
                                ? 'bg-slate-200 text-slate-700 border border-slate-300 ring-1 ring-slate-400/30'
                                : slot.type === 'fused'
                                ? 'bg-rose-600 text-white border border-rose-700 ring-1 ring-rose-400/30'
                                : 'bg-emerald-600 text-white border border-emerald-700 ring-1 ring-emerald-400/30'
                            }`}
                          >
                            {slot.val}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* BALOK LANE MELUNCUR (SCANNING & MENGISI DIRI +8-BIT TIAP HEX DARI ATAS KE BAWAH) */}
              {isColumnBeingScanned && (
                <motion.div
                  key={`traveler-${colIdx}`}
                  initial={{ y: yKeyframes[0] }}
                  animate={{ y: yKeyframes }}
                  transition={{
                    duration: scanDuration,
                    ease: [0.25, 0.1, 0.25, 1],
                    times: [0, 0.1, 0.21, 0.32, 0.43, 0.54, 0.65, 0.76, 0.87, 1.0]
                  }}
                  className="absolute left-0 w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] z-50 pointer-events-none"
                >
                  <GlassLaneBlock
                    shortName={lanes[colIdx].shortName}
                    bitsLabel={scanningBitLabel}
                    fillPercent={scanningFillPercent}
                    className="shadow-md shadow-blue-500/25 ring-1 ring-white/80"
                  />
                </motion.div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ========================================================= */}
      {/* NAMPAN BAWAH: 17 SLOT KOSONG (LANE 1 - 17)                */}
      {/* Muncul di Step 12 Phase 2 kosongan                        */}
      {/* Terisi 1 per 1 oleh Block Lane hasil scanning di Step 13  */}
      {/* ========================================================= */}
      {showDualLanes && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-1 sm:gap-1.5 p-2 rounded-2xl bg-white border border-slate-200 shadow-xs mt-3.5 w-auto"
        >
          {lanes.map((lane) => {
            // Sudah mendarat jika currentScanningLane > lane.id
            const hasLanded = currentStep === 13 
              ? currentScanningLane > lane.id 
              : currentStep > 13;

            return (
              <div
                key={`bottom-lane-slot-${lane.id}`}
                ref={(el) => {
                  if (el) bottomLaneRefs.current[lane.id] = el;
                }}
                className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-hidden"
              >
                {/* Belum mendarat: Placeholder transparan putus-putus */}
                {!hasLanded && (
                  <span className="font-mono text-[9px] font-bold text-slate-300 select-none">
                    {lane.shortName}
                  </span>
                )}

                {/* Telah mendarat: Block Lane Glassmorphic solid 64-bit */}
                {hasLanded && (
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="w-full h-full"
                  >
                    <GlassLaneBlock
                      shortName={lane.shortName}
                      bitsLabel="64b"
                      fillPercent={100}
                    />
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
      </div>
    </motion.div>
  );
}
