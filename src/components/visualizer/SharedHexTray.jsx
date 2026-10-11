import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getStep6TimingPlan } from '../../utils/segmentTiming';

export function SharedHexTray({
  currentStep,
  speed,
  stepDirection,
  chars,
  trayItems,
  trayRefs,
  step6Offsets,
  step7Offsets
}) {
  if (currentStep < 5) return null;

  const plan = useMemo(() => getStep6TimingPlan(chars, speed), [chars, speed]);
  const isHuge = trayItems.length > 24;
  const isMany = trayItems.length > 12;

  return (
    <motion.div 
      animate={{
        opacity: currentStep >= 12 ? 0 : 1,
        y: currentStep >= 12 ? -50 : 0,
        scale: currentStep >= 12 ? 0.96 : 1,
        marginBottom: currentStep >= 12 ? -30 : currentStep <= 9 ? 0 : 16,
        pointerEvents: currentStep >= 12 ? 'none' : 'auto'
      }}
      transition={{ duration: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center overflow-visible relative will-change-transform max-w-full px-2 ${
        currentStep <= 9 ? (isHuge ? 'mt-2 z-30' : isMany ? 'mt-3 sm:mt-4 z-30' : 'mt-6 z-30') : 'mb-4 z-20'
      }`}
    >
      {/* NAMPAN TEMPLATE HEX */}
      <motion.div 
        layoutId="shared-hex-tray"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 / speed, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col items-center space-y-1.5 overflow-visible max-w-full ${
          currentStep >= 10 ? 'z-10' : 'z-20'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
            NAMPAN TEMPLATE HEX
          </span>
          {currentStep === 7 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 animate-pulse">
              Audit Node: {chars.length} Byte / {chars.length * 8} Bit
            </span>
          )}
          {currentStep === 11 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-100 text-blue-700 animate-pulse border border-blue-200">
              Sumber Kloning Bitrate
            </span>
          )}
        </div>

        {/* Nampan wadah dengan wrap adaptif agar muat 100% di layar (tidak terpotong kanan-kiri) */}
        <div className={`flex flex-wrap items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm overflow-visible ${
          isHuge 
            ? 'gap-1 p-2 sm:p-2.5 max-w-4xl sm:max-w-5xl' 
            : isMany 
            ? 'gap-1.5 p-2 sm:p-2.5 max-w-3xl' 
            : 'gap-2 sm:gap-2.5 p-2.5 max-w-full'
        }`}>
          {trayItems.map((item, idx) => {
            const isData = item.type === 'data';
            const isFilled = isData ? currentStep >= 6 : currentStep >= 9;

            const isFlying = (isData && currentStep === 6 && stepDirection === 'forward') ||
                             (!isData && currentStep === 9 && stepDirection === 'forward');

            const paddingIdx = idx - chars.length;
            let itemDelay = 0;
            if (isFlying) {
              if (isData) {
                itemDelay = plan.charTimings[idx]?.flyStartTime ?? 0;
              } else {
                itemDelay = (0.35 + paddingIdx * 0.16) / speed;
              }
            }

            let startX = 0;
            let startY = -120;
            if (isData) {
              startX = step6Offsets[item.id]?.x ?? 0;
              startY = step6Offsets[item.id]?.y ?? -120;
            } else {
              startX = step7Offsets[item.id]?.x ?? 0;
              startY = step7Offsets[item.id]?.y ?? -160;
            }

            const totalMotionDuration = isData ? plan.flyDuration : Math.max(0.12, 0.42 / speed);

            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) trayRefs.current[item.id] = el;
                }}
                className={`relative flex-shrink-0 border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-visible ${
                  isHuge
                    ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-md'
                    : isMany 
                    ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg' 
                    : 'w-10 h-10 rounded-xl'
                }`}
              >
                {/* Tag Penghitungan Node Hex di Step 7 */}
                {currentStep === 7 && isData && (
                  <motion.div
                    initial={{ opacity: 0, y: 3, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`absolute -top-3.5 z-50 bg-cyan-600 text-white font-mono font-black px-1 rounded shadow-2xs border border-cyan-400 select-none whitespace-nowrap ${
                      isHuge ? 'text-[7px]' : 'text-[8px]'
                    }`}
                  >
                    #{idx + 1}
                  </motion.div>
                )}

                {/* Placeholder jika slot belum terisi (muncul di Step 8 untuk padding) */}
                {!isFilled && (
                  <span className={`font-mono font-bold text-slate-300 select-none ${
                    isHuge ? 'text-[8px] sm:text-[9px]' : isMany ? 'text-[10px] sm:text-xs' : 'text-xs'
                  }`}>
                    {item.val}
                  </span>
                )}

                {/* BALOK CLONE MELUNCUR KE DALAM NAMPAN ATAU MENGENDAP */}
                {isFilled && (
                  <motion.div
                    key={`tray-clone-${item.id}-${isFlying ? 'fly' : 'settled'}`}
                    initial={
                      isFlying
                        ? { opacity: 0, x: startX, y: startY, scale: 1 }
                        : { opacity: 1, x: 0, y: 0, scale: 1 }
                    }
                    animate={{ 
                      opacity: 1,
                      x: 0,
                      y: 0,
                      scale: isFlying ? [1, 1.08, 1] : 1
                    }}
                    transition={{ 
                      duration: isFlying ? totalMotionDuration : 0.2, 
                      delay: itemDelay,
                      ease: [0.22, 1, 0.36, 1] 
                    }}
                    style={{ zIndex: 100 }}
                    className={`absolute inset-0 font-mono font-black flex items-center justify-center shadow-xs select-none ${
                      isHuge
                        ? 'rounded-md text-[9px] sm:text-[10px]'
                        : isMany 
                        ? 'rounded-lg text-[10px] sm:text-xs' 
                        : 'rounded-xl text-sm'
                    } ${
                      item.type === 'data'
                        ? `bg-blue-600 text-white border border-blue-700 ${
                            currentStep === 7 ? 'ring-2 ring-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]' : ''
                          }`
                        : item.type === 'delimiter'
                        ? 'bg-amber-500 text-white border border-amber-600'
                        : item.type === 'zero'
                        ? `bg-slate-200 text-slate-700 border border-slate-300 ring-2 ring-slate-400/40 ${
                            currentStep === 11 ? 'ring-2 ring-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : ''
                          }`
                        : item.type === 'fused'
                        ? 'bg-gradient-to-r from-emerald-600 to-rose-600 text-white border border-rose-700 shadow-md ring-2 ring-rose-400/60'
                        : 'bg-emerald-600 text-white border border-emerald-700'
                    }`}
                  >
                    {item.val}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
