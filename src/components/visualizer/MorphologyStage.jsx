import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getCharRows, getStep6TimingPlan } from '../../utils/segmentTiming';

export function MorphologyStage({
  currentStep,
  speed,
  stepDirection,
  chars,
  paddingRules,
  lowerHexRefs,
  rowRefs: externalRowRefs,
  scrollContainerRef: externalScrollContainerRef,
  step7RuleHexRefs,
  remainingBytes = 133,
  onToggle1080Test,
  is1080Mode = false
}) {
  const isMultiRow = chars.length > 8;

  // Bagi karakter menjadi baris (maks 8 karakter per baris)
  const charRows = useMemo(() => getCharRows(chars), [chars]);
  const plan = useMemo(() => getStep6TimingPlan(chars, speed), [chars, speed]);

  const internalScrollContainerRef = useRef(null);
  const scrollContainerRef = externalScrollContainerRef || internalScrollContainerRef;
  const internalRowRefs = useRef({});
  const rowRefs = externalRowRefs || internalRowRefs;
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0);

  // Auto-scroll bersegmen di Step 6:
  // Selalu mulai dari Segmen 0, lalu bergulir mulus ke segmen 1, 2, dst. sesuai jadwal peluncuran terpadu
  useEffect(() => {
    if (currentStep === 6 && stepDirection === 'forward' && charRows.length > 1) {
      // 1. Reset awal: pastikan kamera berada tepat di Segmen 0
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setActiveSegmentIdx(0);

      // 2. Jadwalkan pergeseran kamera ke segmen 1, 2, dst. sesuai rowSchedules
      const timers = [];

      plan.rowSchedules.forEach((schedule) => {
        if (schedule.rowIdx === 0) return;

        const timer = setTimeout(() => {
          const targetRowEl = rowRefs.current[schedule.rowIdx];
          const baseRowEl = rowRefs.current[0];
          const scrollEl = scrollContainerRef.current;
          if (targetRowEl && scrollEl) {
            const baseOffset = baseRowEl ? baseRowEl.offsetTop : 0;
            const relativeOffset = Math.max(0, targetRowEl.offsetTop - baseOffset);
            const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
            const targetTop = Math.min(relativeOffset, maxScroll);
            scrollEl.scrollTo({
              top: targetTop,
              behavior: 'smooth'
            });
          }
          setActiveSegmentIdx(schedule.rowIdx);
        }, schedule.scrollTriggerTime * 1000);

        timers.push(timer);
      });

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    } else if (currentStep < 6) {
      setActiveSegmentIdx(0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStep, stepDirection, plan, charRows.length, rowRefs, scrollContainerRef]);

  const scrollToSegment = (idx) => {
    const targetRowEl = rowRefs.current[idx];
    const baseRowEl = rowRefs.current[0];
    const scrollEl = scrollContainerRef.current;
    if (targetRowEl && scrollEl) {
      const baseOffset = baseRowEl ? baseRowEl.offsetTop : 0;
      const relativeOffset = Math.max(0, targetRowEl.offsetTop - baseOffset);
      const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
      const targetTop = Math.min(relativeOffset, maxScroll);
      scrollEl.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
      setActiveSegmentIdx(idx);
    }
  };

  return (
    <>
      {/* ======================================================= */}
      {/* SUB-PHASE A: TAHAP MORFOLOGI HURUF KE HEX (STEP 1 s/d 6)*/}
      {/* FADE DENGAN OPACITY, HEIGHT 0 PADA STEP 7 & 8           */}
      {/* ======================================================= */}
      {currentStep >= 1 && (
        <motion.div 
          layout
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: currentStep >= 7 ? 0 : 1,
            height: currentStep >= 7 ? 0 : 'auto',
            marginBottom: currentStep >= 7 ? 0 : isMultiRow ? 10 : 20,
            overflow: currentStep >= 7 ? 'hidden' : 'visible',
            pointerEvents: currentStep >= 7 ? 'none' : 'auto'
          }}
          transition={{ 
            duration: 0.5 / speed,
            ease: [0.16, 1, 0.3, 1] 
          }}
          className={`flex flex-col items-center justify-center max-w-full pb-2 px-2 w-full overflow-visible ${
            isMultiRow ? 'gap-y-2.5 sm:gap-y-3.5' : ''
          }`}
        >
          {/* BAR INDIKATOR SEGMEN (JIKA > 1 BARIS) */}
          {charRows.length > 1 && (
            <div className="flex items-center gap-2 mb-2 bg-white/90 border border-slate-200/90 rounded-full px-3 py-1 shadow-2xs select-none z-10">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Segmen {activeSegmentIdx + 1} / {charRows.length}
              </span>
              <div className="flex items-center gap-1">
                {charRows.map((_, rIdx) => (
                  <button
                    key={`seg-dot-${rIdx}`}
                    onClick={() => scrollToSegment(rIdx)}
                    title={`Pindah ke Segmen ${rIdx + 1}`}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      activeSegmentIdx === rIdx
                        ? 'bg-blue-600 scale-125'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
              {currentStep === 6 && (
                <span className="text-[10px] font-mono font-bold text-blue-600 animate-pulse ml-1">
                  ● Meluncurkan Byte Hex...
                </span>
              )}
            </div>
          )}

          <div 
            ref={scrollContainerRef}
            onScroll={() => onMorphologyScroll?.()}
            className={`w-full flex flex-col items-center ${
              charRows.length > 2 
                ? 'max-h-[44vh] sm:max-h-[48vh] overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-300' 
                : ''
            } ${isMultiRow ? 'gap-y-2.5 sm:gap-y-3.5' : ''}`}
          >
            {chars.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white border border-dashed border-slate-300 max-w-md mx-auto text-center my-4 shadow-2xs"
              >
                <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold mb-2">
                  Input Kosong (0-Bit / 0 Byte)
                </span>
                <p className="text-xs sm:text-sm text-slate-600 font-mono leading-relaxed">
                  Pesan asli tidak memiliki byte data payload. Sesuai standar SHA-3, pesan kosong dialokasikan langsung ke <strong>136 byte blok bitrate penuh</strong> yang seluruhnya dibentuk oleh formula padding <span className="font-bold text-blue-600">pad10*1</span>.
                </p>
              </motion.div>
            )}

            {charRows.map((rowChars, rowIdx) => (
              <div
                key={`char-row-${rowIdx}`}
                ref={(el) => {
                  if (el) rowRefs.current[rowIdx] = el;
                }}
                className={`flex items-start justify-center max-w-full w-full overflow-visible ${
                  chars.length <= 4 
                    ? 'gap-8 sm:gap-14' 
                    : chars.length <= 8 
                    ? 'gap-4 sm:gap-8' 
                    : 'gap-2 sm:gap-3 md:gap-4'
                }`}
              >
                {rowChars.map((c) => (
                  <motion.div 
                    layout
                    key={`col-${c.idx}`}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center flex-shrink-0"
                  >
                    {/* STEP 1: HURUF ATAU SIMBOL SPASI KHUSUS */}
                    <div className={`flex items-center justify-center select-none ${
                      isMultiRow ? 'h-8 sm:h-9' : chars.length > 4 ? 'h-12 sm:h-14' : 'h-16 sm:h-20'
                    }`}>
                      {c.char === ' ' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/90 border border-amber-300 text-amber-800 font-mono font-black text-xs sm:text-sm shadow-2xs">
                          ␣ <span className="text-[9px] uppercase font-bold tracking-tight">SP</span>
                        </span>
                      ) : (
                        <span className={`font-mono font-black text-blue-900 ${
                          isMultiRow 
                            ? 'text-2xl sm:text-3xl' 
                            : chars.length > 4 
                            ? 'text-4xl sm:text-5xl' 
                            : 'text-5xl sm:text-6xl'
                        }`}>
                          {c.char}
                        </span>
                      )}
                    </div>
                    <span className={`font-mono text-slate-400 mt-0.5 ${
                      isMultiRow ? 'text-[9px] sm:text-[10px]' : 'text-[10px]'
                    }`}>
                      [{c.idx}]
                    </span>

                  {/* BATANG KE ASCII */}
                  {currentStep >= 2 && (
                    <motion.div 
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ originY: 0 }}
                      className={`w-0.5 ${isMultiRow ? 'h-3 my-0.5' : 'h-5 my-1'} bg-blue-300`}
                    />
                  )}

                  {/* STEP 2: ASCII MUNCUL LANGSUNG */}
                  {currentStep >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`font-mono font-extrabold text-blue-700 ${
                        isMultiRow ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
                      }`}
                    >
                      {c.code}
                    </motion.div>
                  )}

                  {/* BATANG KE BINER */}
                  {currentStep >= 3 && (
                    <motion.div 
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ originY: 0 }}
                      className={`w-0.5 ${isMultiRow ? 'h-3 my-0.5' : 'h-5 my-1'} bg-emerald-400`}
                    />
                  )}

                  {/* STEP 3: BINER 8-BIT MUNCUL LANGSUNG */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`font-mono font-extrabold text-slate-900 ${
                        isMultiRow 
                          ? 'text-xs sm:text-sm tracking-tight sm:tracking-normal' 
                          : 'text-xl sm:text-2xl tracking-wider'
                      }`}
                    >
                      {c.bin}
                    </motion.div>
                  )}

                  {/* STEP 4: BINER 8-BIT TERBELAH DUA (4-BIT & 4-BIT) */}
                  {currentStep >= 4 && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col items-center mt-1"
                    >
                      {/* Baris Dua Belahan 4-bit (Total 8-bit) */}
                      <div className={`flex items-center ${isMultiRow ? 'gap-1 sm:gap-1.5' : 'gap-2'}`}>
                        {/* Sub-kolom 1: 4-bit pertama */}
                        <div className={`flex flex-col items-center ${isMultiRow ? 'w-9 sm:w-11' : 'w-12 sm:w-14'}`}>
                          <span className={`font-mono font-bold text-slate-700 bg-slate-100 rounded border border-slate-200 w-full text-center shadow-2xs ${
                            isMultiRow ? 'text-[10px] sm:text-xs px-1 py-0.5' : 'text-xs sm:text-sm px-1.5 py-0.5'
                          }`}>
                            {c.nibble1}
                          </span>
                          {/* Batang vertikal ke Hex 1 di Step 5 */}
                          {currentStep === 5 && (
                            <motion.div 
                              initial={{ scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1 }}
                              transition={{ duration: 0.2 }}
                              style={{ originY: 0 }}
                              className={`w-0.5 ${isMultiRow ? 'h-2 my-0.5' : 'h-3 my-1'} bg-blue-400`} 
                            />
                          )}
                        </div>

                        {/* Sub-kolom 2: 4-bit kedua */}
                        <div className={`flex flex-col items-center ${isMultiRow ? 'w-9 sm:w-11' : 'w-12 sm:w-14'}`}>
                          <span className={`font-mono font-bold text-slate-700 bg-slate-100 rounded border border-slate-200 w-full text-center shadow-2xs ${
                            isMultiRow ? 'text-[10px] sm:text-xs px-1 py-0.5' : 'text-xs sm:text-sm px-1.5 py-0.5'
                          }`}>
                            {c.nibble2}
                          </span>
                          {/* Batang vertikal ke Hex 2 di Step 5 */}
                          {currentStep === 5 && (
                            <motion.div 
                              initial={{ scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1 }}
                              transition={{ duration: 0.2 }}
                              style={{ originY: 0 }}
                              className={`w-0.5 ${isMultiRow ? 'h-2 my-0.5' : 'h-3 my-1'} bg-blue-400`} 
                            />
                          )}
                        </div>
                      </div>

                      {/* STEP 5: BALOK HEX (LURUS VERTIKAL) & STEP 6: PENYATUAN DUA HEX SEBELUM CLONE KE NAMPAN */}
                      {currentStep >= 5 && (
                        <div 
                          ref={(el) => {
                            if (el) lowerHexRefs.current[`lower-hex-${c.idx}`] = el;
                          }}
                          className="relative flex items-center justify-center mt-1"
                        >
                          {(() => {
                            const charTiming = plan.charTimings[c.idx];
                            const mergeDelay = currentStep >= 6 && stepDirection === 'forward' && charTiming ? charTiming.mergeStartTime : 0;
                            const fadeDelay = currentStep >= 6 && stepDirection === 'forward' && charTiming ? charTiming.fadeStartTime : 0;
                            const mergeDur = plan.mergeDuration;

                            return (
                              <motion.div
                                animate={{
                                  opacity: currentStep >= 6 ? 0 : 1,
                                  scale: currentStep === 6 && stepDirection === 'forward' ? [1, 1.1, 1] : 1
                                }}
                                transition={{
                                  scale: { duration: mergeDur, ease: 'easeOut', delay: mergeDelay },
                                  opacity: { duration: 0.22 / speed, delay: fadeDelay }
                                }}
                                className={`flex items-center justify-center ${isMultiRow ? 'gap-3 sm:gap-4' : 'gap-5'}`}
                              >
                                {/* Hex 1 */}
                                <motion.div
                                  animate={{ 
                                    x: currentStep >= 6 ? (isMultiRow ? 6 : 10) : 0,
                                    borderTopRightRadius: currentStep >= 6 ? 0 : isMultiRow ? '0.5rem' : '0.75rem',
                                    borderBottomRightRadius: currentStep >= 6 ? 0 : isMultiRow ? '0.5rem' : '0.75rem'
                                  }}
                                  transition={{ 
                                    x: { duration: mergeDur, ease: [0.16, 1, 0.3, 1], delay: mergeDelay },
                                    borderTopRightRadius: { duration: 0.2 / speed, delay: mergeDelay },
                                    borderBottomRightRadius: { duration: 0.2 / speed, delay: mergeDelay }
                                  }}
                                  className={`rounded-xl bg-blue-600 text-white font-mono font-black flex items-center justify-center shadow-sm select-none ${
                                    isMultiRow ? 'w-7 sm:w-8 h-7 sm:h-8 text-xs sm:text-sm' : 'w-8 sm:w-9 h-8 sm:h-9 text-sm sm:text-base'
                                  }`}
                                >
                                  {c.hex1}
                                </motion.div>

                                {/* Hex 2 */}
                                <motion.div
                                  animate={{ 
                                    x: currentStep >= 6 ? (isMultiRow ? -6 : -10) : 0,
                                    borderTopLeftRadius: currentStep >= 6 ? 0 : isMultiRow ? '0.5rem' : '0.75rem',
                                    borderBottomLeftRadius: currentStep >= 6 ? 0 : isMultiRow ? '0.5rem' : '0.75rem'
                                  }}
                                  transition={{ 
                                    x: { duration: mergeDur, ease: [0.16, 1, 0.3, 1], delay: mergeDelay },
                                    borderTopLeftRadius: { duration: 0.2 / speed, delay: mergeDelay },
                                    borderBottomLeftRadius: { duration: 0.2 / speed, delay: mergeDelay }
                                  }}
                                  className={`rounded-xl bg-blue-600 text-white font-mono font-black flex items-center justify-center shadow-sm select-none ${
                                    isMultiRow ? 'w-7 sm:w-8 h-7 sm:h-8 text-xs sm:text-sm' : 'w-8 sm:w-9 h-8 sm:h-9 text-sm sm:text-base'
                                  }`}
                                >
                                  {c.hex2}
                                </motion.div>
                              </motion.div>
                            );
                          })()}
                        </div>
                      )}
                    </motion.div>
                  )}

                </motion.div>
              ))}
            </div>
          ))}
          </div>
        </motion.div>
      )}

      {/* ======================================================= */}
      {/* SUB-PHASE B1: AUDIT KAPASITAS & PENGHITUNGAN HEX (STEP 7)*/}
      {/* ======================================================= */}
      {currentStep === 7 && (
        <motion.div 
          layout
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center max-w-2xl w-full pb-4 px-2 overflow-visible mb-6"
        >
          {/* Badge Label Audit Step 7 */}
          <div className="flex flex-col items-center mb-5 text-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/90 shadow-2xs mb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-800 uppercase">
                Step 7: Audit Kapasitas Bitrate & Penghitungan Node Hex
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 max-w-lg">
              Program menghitung total node hex yang terisi di nampan untuk mengecek sisa kapasitas bitrate (r = 1088 bit / 136 byte) sebelum menerapkan aturan padding.
            </p>
          </div>

          {/* 3 KARTU METRIK: TERISI, TARGET BITRATE, SISA RUANG */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-4">
            {/* Card 1: Terisi */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                Node Hex di Nampan
              </span>
              <div className="text-lg sm:text-xl font-mono font-black text-blue-600">
                {chars.length} <span className="text-xs text-blue-400 font-bold">Byte</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                {chars.length * 8} Bit Data Pesan
              </span>
            </div>

            {/* Card 2: Target */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                Target Bitrate (r)
              </span>
              <div className="text-lg sm:text-xl font-mono font-black text-slate-800">
                136 <span className="text-xs text-slate-400 font-bold">Byte</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                1088 Bit (17 Lane × 64b)
              </span>
            </div>

            {/* Card 3: Sisa */}
            <div className={`flex flex-col items-center p-3 rounded-2xl border shadow-xs text-center ${
              remainingBytes === 1 
                ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-400/40' 
                : 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/40'
            }`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1 text-slate-500">
                Sisa Ruang Bitrate
              </span>
              <div className={`text-lg sm:text-xl font-mono font-black ${
                remainingBytes === 1 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {remainingBytes} <span className="text-xs font-bold opacity-80">Byte</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                {remainingBytes * 8} Bit Harus Diisi
              </span>
            </div>
          </div>

          {/* STATUS ANALISIS PADDING */}
          <div className={`w-full p-3.5 rounded-2xl border transition-all ${
            remainingBytes === 1
              ? 'bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-rose-300 shadow-sm'
              : 'bg-blue-50/70 border-blue-200 shadow-2xs'
          }`}>
            <div className="flex items-start gap-2.5">
              <span className="text-base select-none mt-0.5">
                {remainingBytes === 1 ? '⚠️' : 'ℹ️'}
              </span>
              <div className="flex flex-col flex-1 text-left">
                <span className={`text-xs font-mono font-extrabold tracking-wide uppercase ${
                  remainingBytes === 1 ? 'text-rose-900' : 'text-blue-900'
                }`}>
                  {remainingBytes === 1
                    ? 'Edge-Case 1080-Bit Terdeteksi: Delimiter & Lock Melebur (0x86)!'
                    : `Formula Standar: Ruang Tersisa ${remainingBytes} Byte`}
                </span>
                <p className="text-[11px] font-mono text-slate-600 mt-1 leading-relaxed">
                  {remainingBytes === 1
                    ? 'Data pesan tepat berukuran 1080 bit (135 byte), menyisakan HANYA 1 byte (8 bit) sebelum batas 1088 bit. Delimiter (0x06: 0000 0110) dan Final Lock (0x80: 1000 0000) bertumpuk pada byte yang sama melalui bitwise OR (0x06 | 0x80 = 0x86). Tidak ada ruang untuk byte 0x00!'
                    : `Sisa ${remainingBytes} byte akan dialokasikan untuk aturan padding pad10*1: Delimiter 0x06 (1 byte) + deretan nol 0x00 (${Math.max(0, remainingBytes - 2)} byte) + Final Lock 0x80 (1 byte).`}
                </p>
              </div>
            </div>
          </div>

          {/* TOMBOL SIMULASI INTERAKTIF 1080 BIT */}
          {onToggle1080Test && (
            <div className="mt-3 flex items-center justify-center">
              <button
                onClick={onToggle1080Test}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  is1080Mode
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-rose-200 border border-rose-400'
                }`}
                title="Uji kasus 1080 bit (135 byte) untuk membuktikan kemunculan byte 0x86"
              >
                <span>{is1080Mode ? '↩️ Kembalikan Teks Semula' : '🧪 Uji Kasus 1080-Bit (135 Karakter → 0x86)'}</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ======================================================= */}
      {/* SUB-PHASE B2: ATURAN PADDING SHA-3 (STEP 8 & 9)         */}
      {/* Step 8: Formulasi adaptif (0x86 atau 06, 00, 80)        */}
      {/* Step 9: Penyatuan hex & meluncur mengisi Nampan          */}
      {/* ======================================================= */}
      {currentStep >= 8 && currentStep <= 9 && (
        <motion.div 
          layout
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center max-w-full pb-4 px-2 w-full overflow-visible mb-6"
        >
          {/* Badge Label Aturan Padding */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs mb-1 ${
              remainingBytes === 1 
                ? 'bg-rose-50 border-rose-200/90 text-rose-800' 
                : 'bg-amber-50 border-amber-200/90 text-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                remainingBytes === 1 ? 'bg-rose-500' : 'bg-amber-500'
              }`}></span>
              <span className="text-xs font-mono font-bold tracking-wider uppercase">
                {currentStep === 8 ? 'Step 8: Formulasi Aturan Padding' : 'Step 9: Penyatuan & Injeksi Byte Padding'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 text-center max-w-md">
              {remainingBytes === 1
                ? 'Standar NIST FIPS 202 (Edge-Case 1080-Bit): Delimiter (0x06) + Final Lock (0x80) melebur menjadi 1 byte tunggal: 0x86'
                : remainingBytes === 2
                ? 'Standar NIST FIPS 202: Tepat tersisa 2 byte untuk Delimiter (0x06) & Lock (0x80). Zero Pad (0x00) ditiadakan.'
                : 'Standar NIST FIPS 202: Delimiter suffix (0x06) + deretan nol (0x00) + bit pengunci akhir (0x80)'}
            </p>
          </div>

          {/* DIAGRAM FUSI 0x06 | 0x80 -> 0x86 (JIKA SISA TEPAT 1 BYTE) */}
          {remainingBytes === 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center mb-5 bg-gradient-to-b from-rose-50/90 to-rose-100/40 border border-rose-200 rounded-2xl p-3 sm:p-4 max-w-lg w-full shadow-xs"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 mb-2">
                Peleburan Bitwise Logika OR (Bit 1080 s/d 1087)
              </span>
              <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono text-xs sm:text-sm">
                <div className="flex flex-col items-center bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-[9px] text-amber-600 font-bold uppercase">Head / Delim (0x06)</span>
                  <span className="font-extrabold text-slate-800">0000 0110</span>
                </div>
                <span className="font-black text-rose-500 text-base sm:text-lg">OR ( | )</span>
                <div className="flex flex-col items-center bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">Tail / Lock (0x80)</span>
                  <span className="font-extrabold text-slate-800">1000 0000</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mt-2.5 bg-rose-200/60 px-3 py-1 rounded-full border border-rose-300/80">
                <span>↓ Menghasilkan Balok Fusi:</span>
                <span className="bg-gradient-to-r from-emerald-600 to-rose-600 text-white px-2 py-0.5 rounded font-mono font-black text-xs shadow-2xs">
                  0x86 (1000 0110)
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1.5 text-center">
                *Pilar Body (0x00) tidak ada karena ruang bitrate r = 1088 bit habis pada byte ke-135 ini.
              </span>
            </motion.div>
          )}

          {/* BANNER JIKA SISA TEPAT 2 BYTE */}
          {remainingBytes === 2 && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center mb-5 bg-amber-50/80 border border-amber-200 rounded-2xl px-4 py-2.5 max-w-lg w-full shadow-xs text-center"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Zero Pad Body (0x00) Ditiadakan (0 Byte)</span>
              </div>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                Ruang sisa 2 byte dialokasikan penuh untuk <strong>Head: Delimiter 0x06 (1 byte)</strong> dan <strong>Tail: Final Lock 0x80 (1 byte)</strong>.
              </p>
            </motion.div>
          )}

          {/* PILAR MORFOLOGI PADDING: 1 PILAR FUSED (0x86), 2 PILAR (SISA 2), ATAU 3 PILAR (SISA > 2) */}
          <div className="flex items-start justify-center gap-8 sm:gap-14 w-full overflow-visible">
            {paddingRules.map((rule, idx) => {
              const isFlying = currentStep === 9 && stepDirection === 'forward';
              const isMerged = currentStep >= 9;

              return (
                <div key={rule.role} className="flex flex-col items-center flex-shrink-0">
                  {/* Header Role & Badge */}
                  <span className={`font-mono font-black text-3xl sm:text-4xl select-none ${rule.textColor}`}>
                    {rule.role}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border mt-1 font-semibold ${rule.badgeBg}`}>
                    {rule.title}
                  </span>

                  {/* Batang ke Biner */}
                  <div className="w-0.5 h-4 bg-slate-300 my-1.5" />

                  {/* Biner 8-Bit Lengkap */}
                  <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 tracking-wider">
                    {rule.bin}
                  </div>

                  {/* Batang ke 4-Bit */}
                  <div className="w-0.5 h-3 bg-slate-300 my-1" />

                  {/* Belahan 4-Bit & 4-Bit */}
                  <div className="flex flex-col items-center mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center w-12 sm:w-14">
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-full text-center shadow-2xs">
                          {rule.nibble1}
                        </span>
                        {/* Batang vertikal ke Hex 1 di Step 8 */}
                        <motion.div 
                          animate={{ opacity: isMerged ? 0 : 1 }}
                          transition={{ duration: 0.2 / speed }}
                          className={`w-0.5 h-3 ${rule.lineColor} my-1`} 
                        />
                      </div>
                      <div className="flex flex-col items-center w-12 sm:w-14">
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-full text-center shadow-2xs">
                          {rule.nibble2}
                        </span>
                        {/* Batang vertikal ke Hex 2 di Step 8 */}
                        <motion.div 
                          animate={{ opacity: isMerged ? 0 : 1 }}
                          transition={{ duration: 0.2 / speed }}
                          className={`w-0.5 h-3 ${rule.lineColor} my-1`} 
                        />
                      </div>
                    </div>

                    {/* Hex Blocks: Di Step 8 terpisah lurus di bawah 4-bit, di Step 9 menyatu & meluncur */}
                    <div 
                      ref={(el) => {
                        if (el) step7RuleHexRefs.current[rule.val] = el;
                      }}
                      className="relative flex items-center justify-center mt-1"
                    >
                      <motion.div
                        animate={{
                          opacity: isFlying ? [1, 1, 0] : 1,
                          scale: isFlying ? [1, 1.1, 1] : 1
                        }}
                        transition={{
                          scale: { duration: 0.38 / speed, ease: 'easeOut' },
                          opacity: { 
                            duration: 0.25 / speed, 
                            delay: isFlying ? (0.38 + 0.32 + idx * 0.16) / speed : 0,
                            times: isFlying ? [0, 0.8, 1] : undefined
                          }
                        }}
                        className="flex items-center justify-center gap-5"
                      >
                        {/* Hex 1 (Lurus di bawah Nibble 1 pada Step 8, menyatu pada Step 9) */}
                        <motion.div
                          animate={{ 
                            x: isMerged ? 10 : 0,
                            borderTopRightRadius: isMerged ? 0 : '0.75rem',
                            borderBottomRightRadius: isMerged ? 0 : '0.75rem'
                          }}
                          transition={{ 
                            x: { duration: 0.38 / speed, ease: [0.16, 1, 0.3, 1] },
                            borderTopRightRadius: { duration: 0.2 / speed },
                            borderBottomRightRadius: { duration: 0.2 / speed }
                          }}
                          className={`w-8 sm:w-9 h-8 sm:h-9 rounded-xl font-mono text-sm sm:text-base font-black flex items-center justify-center shadow-sm select-none ${
                            rule.val === '00' 
                              ? 'bg-slate-200 text-slate-700 border border-slate-300' 
                              : `${rule.hexBg} text-white`
                          }`}
                        >
                          {rule.hex1}
                        </motion.div>

                        {/* Hex 2 (Lurus di bawah Nibble 2 pada Step 8, menyatu pada Step 9) */}
                        <motion.div
                          animate={{ 
                            x: isMerged ? -10 : 0,
                            borderTopLeftRadius: isMerged ? 0 : '0.75rem',
                            borderBottomLeftRadius: isMerged ? 0 : '0.75rem'
                          }}
                          transition={{ 
                            x: { duration: 0.38 / speed, ease: [0.16, 1, 0.3, 1] },
                            borderTopLeftRadius: { duration: 0.2 / speed },
                            borderBottomLeftRadius: { duration: 0.2 / speed }
                          }}
                          className={`w-8 sm:w-9 h-8 sm:h-9 rounded-xl font-mono text-sm sm:text-base font-black flex items-center justify-center shadow-sm select-none ${
                            rule.val === '00' 
                              ? 'bg-slate-200 text-slate-700 border border-slate-300' 
                              : `${rule.hexBg} text-white`
                          }`}
                        >
                          {rule.hex2}
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </>
  );
}
