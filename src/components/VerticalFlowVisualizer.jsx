import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { useVisualizerPhases } from '../hooks/useVisualizerPhases';
import { FloatingControls } from './visualizer/FloatingControls';
import { MorphologyStage } from './visualizer/MorphologyStage';
import { SharedHexTray } from './visualizer/SharedHexTray';
import { Wadah1088Grid } from './visualizer/Wadah1088Grid';
import { KeccakTrayAndState } from './visualizer/KeccakTrayAndState';
import { KeccakCube3D } from './visualizer/KeccakCube3D';
import { Sha3SqueezeContainerStage } from './visualizer/Sha3SqueezeContainerStage';
import { Sha3Step21Stage } from './visualizer/Sha3Step21Stage';
import { getStep6TimingPlan } from '../utils/segmentTiming';

export function VerticalFlowVisualizer() {
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0); // Kecepatan 0.1x sampai 2.0x
  const [currentStep, setCurrentStep] = useState(0); 
  const [stepDirection, setStepDirection] = useState('forward'); 

  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const morphStageRef = useRef(null);

  // Parse karakter kata
  const chars = useMemo(() => {
    return Array.from(inputText).map((c, idx) => {
      const code = c.charCodeAt(0);
      const hex = code.toString(16).padStart(2, '0').toUpperCase();
      const bin = code.toString(2).padStart(8, '0');
      return {
        char: c,
        code,
        hex,
        bin,
        nibble1: bin.slice(0, 4),
        nibble2: bin.slice(4, 8),
        hex1: hex[0],
        hex2: hex[1],
        idx
      };
    });
  }, [inputText]);

  const maxStep = 22;

  // Hitung jumlah byte data pesan dan sisa ruang bitrate (r = 1088 bit = 136 byte)
  const dataByteCount = chars.length;
  const remainingBytes = 136 - (dataByteCount % 136);
  const is1080Mode = chars.length === 135;

  const handleToggle1080Test = () => {
    if (inputText.length === 135) {
      setInputText('');
    } else {
      // Buat string tepat 135 karakter (1080 bit)
      setInputText('A'.repeat(135));
    }
    soundEngine.playClick();
  };

  // Aturan Padding SHA-3 Adaptif (pad10*1)
  const paddingRules = useMemo(() => {
    if (remainingBytes === 1) {
      // Edge-case 1080 Bit (Sisa 1 Byte): Delimiter (0x06) + Final Lock (0x80) -> 0x86
      return [
        {
          role: 'Fused',
          title: 'Single-Byte Pad (0x86)',
          bin: '10000110',
          nibble1: '1000',
          nibble2: '0110',
          hex1: '8',
          hex2: '6',
          val: '86',
          id: 'tray-pad-86',
          type: 'fused',
          textColor: 'text-rose-600',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          hexBg: 'bg-gradient-to-r from-emerald-600 to-rose-600 border-rose-600',
          lineColor: 'bg-rose-500'
        }
      ];
    }
    
    const headRule = {
      role: 'Head',
      title: 'Delimiter (0x06)',
      bin: '00000110',
      nibble1: '0000',
      nibble2: '0110',
      hex1: '0',
      hex2: '6',
      val: '06',
      id: 'tray-deliv',
      type: 'delimiter',
      textColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      hexBg: 'bg-amber-500 border-amber-600',
      lineColor: 'bg-amber-400'
    };

    const tailRule = {
      role: 'Tail',
      title: 'Final Lock (0x80)',
      bin: '10000000',
      nibble1: '1000',
      nibble2: '0000',
      hex1: '8',
      hex2: '0',
      val: '80',
      id: 'tray-lock',
      type: 'lock',
      textColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      hexBg: 'bg-emerald-600 border-emerald-700',
      lineColor: 'bg-emerald-400'
    };

    if (remainingBytes === 2) {
      // Sisa tepat 2 byte: HANYA HEAD & TAIL (BODY 0x00 DITIADAKAN KARENA 0 BYTE)
      return [headRule, tailRule];
    }

    return [
      headRule,
      {
        role: 'Body',
        title: `Zero Pad (0x00) × ${remainingBytes - 2}`,
        bin: '00000000',
        nibble1: '0000',
        nibble2: '0000',
        hex1: '0',
        hex2: '0',
        val: '00',
        id: 'tray-zero',
        type: 'zero',
        textColor: 'text-slate-600',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        hexBg: 'bg-slate-200 text-slate-800 border-slate-300 ring-1 ring-slate-400/40',
        lineColor: 'bg-slate-400'
      },
      tailRule
    ];
  }, [remainingBytes]);

  // Deretan Balok di Nampan Hex:
  // Step 5 s/d 7: HANYA Data Pesan (Belum ada slot padding)
  // Step 8+: Slot padding muncul (0x86 jika sisa 1; 06 & 80 jika sisa 2; 06, 00, 80 jika sisa > 2)
  const trayItems = useMemo(() => {
    const list = [];
    chars.forEach((c) => {
      list.push({ id: `tray-data-${c.idx}`, val: c.hex, type: 'data', char: c.char });
    });

    if (currentStep >= 8) {
      if (remainingBytes === 1) {
        list.push({ id: 'tray-pad-86', val: '86', type: 'fused' });
      } else if (remainingBytes === 2) {
        list.push({ id: 'tray-deliv', val: '06', type: 'delimiter' });
        list.push({ id: 'tray-lock', val: '80', type: 'lock' });
      } else {
        list.push({ id: 'tray-deliv', val: '06', type: 'delimiter' });
        list.push({ id: 'tray-zero', val: '00', type: 'zero' });
        list.push({ id: 'tray-lock', val: '80', type: 'lock' });
      }
    }
    return list;
  }, [chars, currentStep, remainingBytes]);

  // Wadah Penuh 136 Blok Kotak Persegi (17 Kolom x 8 Baris = 136 Blok)
  const totalByteSlots = 136;
  const containerSlots = useMemo(() => {
    const slots = [];
    if (remainingBytes === 1) {
      const dataLen = Math.min(chars.length, 135);
      for (let i = 0; i < totalByteSlots; i++) {
        if (i < dataLen) {
          slots.push({ idx: i, val: chars[i].hex, type: 'data' });
        } else if (i === 135) {
          slots.push({ idx: i, val: '86', type: 'fused' });
        }
      }
    } else if (remainingBytes === 2) {
      const dataLen = Math.min(chars.length, 134);
      for (let i = 0; i < totalByteSlots; i++) {
        if (i < dataLen) {
          slots.push({ idx: i, val: chars[i].hex, type: 'data' });
        } else if (i === 134) {
          slots.push({ idx: i, val: '06', type: 'delimiter' });
        } else if (i === 135) {
          slots.push({ idx: i, val: '80', type: 'lock' });
        }
      }
    } else {
      const dataLen = Math.min(chars.length, 134);
      for (let i = 0; i < totalByteSlots; i++) {
        if (i < dataLen) {
          slots.push({ idx: i, val: chars[i].hex, type: 'data' });
        } else if (i === dataLen) {
          slots.push({ idx: i, val: '06', type: 'delimiter' });
        } else if (i === totalByteSlots - 1) {
          slots.push({ idx: i, val: '80', type: 'lock' });
        } else {
          slots.push({ idx: i, val: '00', type: 'zero' });
        }
      }
    }
    return slots;
  }, [chars, remainingBytes]);

  // Wadah Keccak State 5x5 (25 Slots: 17 Bitrate + 8 Capacity)
  const keccak5x5Slots = useMemo(() => {
    const slots = [];
    let bitrateCounter = 0;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = y * 5 + x;
        const isCapacity = idx >= 17;
        slots.push({
          x,
          y,
          idx,
          type: isCapacity ? 'capacity' : 'bitrate',
          laneName: isCapacity ? 'Cap' : `L${bitrateCounter++}`
        });
      }
    }
    return slots;
  }, []);

  // Jadwal Peluncuran Kumulatif Tiap Slot di Step 10
  const slotTimings = useMemo(() => {
    const timings = [];
    let currentCumulativeTime = 0;

    containerSlots.forEach((slot, i) => {
      timings.push(currentCumulativeTime);
      const isZeroToZero = slot.type === 'zero' && containerSlots[i + 1]?.type === 'zero';
      const interval = isZeroToZero ? 0.042 : 0.160;
      currentCumulativeTime += interval;
    });

    return timings;
  }, [containerSlots]);

  // Hook Manajemen Multi-Phase & Audio Sync
  const { 
    step11Phase, 
    currentScanningLane, 
    currentAbsorbedLane, 
    isAbsorptionComplete 
  } = useVisualizerPhases({
    currentStep,
    stepDirection,
    speed,
    isMuted,
    chars,
    paddingRules,
    containerSlots,
    slotTimings
  });

  // Physical Refs untuk Pengukuran Bounding Rect Animasi Terbang
  const lowerHexRefs = useRef({});
  const rowRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const step7RuleHexRefs = useRef({});
  const trayRefs = useRef({});
  const slotRefs = useRef({});
  const topLaneRefs = useRef({});
  const bottomLaneRefs = useRef({});
  const [offsets, setOffsets] = useState({});
  const [step6Offsets, setStep6Offsets] = useState({});
  const [step7Offsets, setStep7Offsets] = useState({});

  // 1. Ukur koordinat Step 5 Kata -> Nampan untuk Step 6 (Presisi bersegmen multi-baris)
  const updateStep6Offsets = useCallback(() => {
    const newOffsets = {};
    const plan = getStep6TimingPlan(chars, 1);
    const scrollEl = scrollContainerRef.current;
    const maxScroll = scrollEl ? Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight) : 0;
    const currentScrollTop = scrollEl ? scrollEl.scrollTop : 0;

    const baseRowEl = rowRefs.current[0];
    const baseOffset = baseRowEl ? baseRowEl.offsetTop : 0;

    chars.forEach((c, idx) => {
      const trayId = `tray-data-${idx}`;
      const srcEl = lowerHexRefs.current[`lower-hex-${idx}`];
      const trayEl = trayRefs.current[trayId];

      if (srcEl && trayEl) {
        const srcRect = srcEl.getBoundingClientRect();
        const trayRect = trayEl.getBoundingClientRect();

        const timing = plan.charTimings[idx];
        const r = timing ? timing.rowIdx : 0;

        let targetScroll = 0;
        if (r > 0 && rowRefs.current[r]) {
          const relativeOffset = Math.max(0, rowRefs.current[r].offsetTop - baseOffset);
          targetScroll = Math.min(relativeOffset, maxScroll);
        }

        // Posisi fisik presisi di viewport saat baris r aktif di layar:
        const effectiveSrcTop = srcRect.top + currentScrollTop - targetScroll;

        newOffsets[trayId] = {
          x: (srcRect.left + srcRect.width / 2) - (trayRect.left + trayRect.width / 2),
          y: (effectiveSrcTop + srcRect.height / 2) - (trayRect.top + trayRect.height / 2)
        };
      }
    });

    if (Object.keys(newOffsets).length > 0) {
      setStep6Offsets(newOffsets);
    }
  }, [chars]);

  useEffect(() => {
    if (currentStep >= 5) {
      const timer1 = setTimeout(updateStep6Offsets, 30);
      const timer2 = setTimeout(updateStep6Offsets, 120);
      window.addEventListener('resize', updateStep6Offsets);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        window.removeEventListener('resize', updateStep6Offsets);
      };
    }
  }, [currentStep, updateStep6Offsets]);

  // 2. Ukur koordinat Aturan Padding -> Nampan untuk Step 9 (Sebelumnya Step 8)
  useEffect(() => {
    if (currentStep >= 8) {
      const updateStep8Offsets = () => {
        const newOffsets = {};
        paddingRules.forEach((rule) => {
          const srcEl = step7RuleHexRefs.current[rule.val];
          const trayEl = trayRefs.current[rule.id];

          if (srcEl && trayEl) {
            const srcRect = srcEl.getBoundingClientRect();
            const trayRect = trayEl.getBoundingClientRect();
            newOffsets[rule.id] = {
              x: srcRect.left + srcRect.width / 2 - (trayRect.left + trayRect.width / 2),
              y: srcRect.top + srcRect.height / 2 - (trayRect.top + trayRect.height / 2)
            };
          }
        });
        if (Object.keys(newOffsets).length > 0) {
          setStep7Offsets(newOffsets);
        }
      };

      const timer = setTimeout(updateStep8Offsets, 30);
      window.addEventListener('resize', updateStep8Offsets);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateStep8Offsets);
      };
    }
  }, [currentStep, paddingRules]);

  const [replayKey, setReplayKey] = useState(0);

  // 3. Ukur koordinat Nampan -> Wadah 1088 untuk Step 11 (Sebelumnya Step 10, Multi-timer presisi)
  useEffect(() => {
    if (currentStep >= 10) {
      const updateOffsets = () => {
        const newOffsets = {};
        containerSlots.forEach((slot) => {
          let srcKey = 'tray-zero';
          if (slot.type === 'data') srcKey = `tray-data-${slot.idx}`;
          else if (slot.type === 'delimiter') srcKey = 'tray-deliv';
          else if (slot.type === 'lock') srcKey = 'tray-lock';
          else if (slot.type === 'fused') srcKey = 'tray-pad-86';

          const srcEl = trayRefs.current[srcKey];
          const slotEl = slotRefs.current[slot.idx];

          if (srcEl && slotEl) {
            const srcRect = srcEl.getBoundingClientRect();
            const slotRect = slotEl.getBoundingClientRect();
            newOffsets[slot.idx] = {
              x: (srcRect.left + srcRect.width / 2) - (slotRect.left + slotRect.width / 2),
              y: (srcRect.top + srcRect.height / 2) - (slotRect.top + slotRect.height / 2)
            };
          }
        });
        if (Object.keys(newOffsets).length > 0) {
          setOffsets(newOffsets);
        }
      };

      // Ukur bertahap: awal render, pertengahan transisi, dan saat layout telah 100% menetap
      const t1 = setTimeout(updateOffsets, 30);
      const t2 = setTimeout(updateOffsets, 150);
      const t3 = setTimeout(updateOffsets, 450);
      window.addEventListener('resize', updateOffsets);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener('resize', updateOffsets);
      };
    }
  }, [currentStep, containerSlots, replayKey]);

  // Navigation Handlers
  const scrollToStep = (idx) => {
    setCurrentStep((prev) => {
      const targetIdx = Math.max(0, Math.min(maxStep, idx));
      if (targetIdx === prev) {
        setReplayKey((k) => k + 1);
        soundEngine.playClick();
        return prev;
      }
      setStepDirection(targetIdx > prev ? 'forward' : 'backward');
      soundEngine.playClick();

      if (targetIdx === 0) {
        inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        morphStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return targetIdx;
    });
  };

  const handleNext = () => {
    setCurrentStep((prev) => {
      if (prev >= maxStep) return prev;
      setStepDirection('forward');
      soundEngine.playClick();
      if (prev === 0) {
        morphStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return prev + 1;
    });
  };

  const handlePrev = () => {
    setCurrentStep((prev) => {
      if (prev <= 0) return prev;
      setStepDirection('backward');
      soundEngine.playClick();
      if (prev - 1 === 0) {
        inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return prev - 1;
    });
  };

  // Debounced Wheel Navigation (Terkunci ketat: 1 gesture wheel = tepat 1 step)
  const lastWheelTimeRef = useRef(0);
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      // Kunci cooldown 850ms agar inertial wheel / trackpad momentum tidak meloncat 2 step
      if (now - lastWheelTimeRef.current < 850) return;

      if (Math.abs(e.deltaY) > 35) {
        lastWheelTimeRef.current = now;
        if (e.deltaY > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [maxStep]);

  // Keyboard navigation (Aktif di seluruh step 0 s/d 21)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Jika di input kontrol floating jump step, jangan blok ketikan angka
      if (e.target.dataset?.stepJump) return;

      // Jika di input kata utama, onKeyDown lokal input yang memproses
      if (e.target.dataset?.mainInput) return;

      // Navigasi di seluruh langkah 0 s/d 21
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
    if (!nextMuted) soundEngine.playClick();
  };

  const stepLabels = [
    '0. Pesan Asli (Plaintext)',
    '1. Pemisahan Byte Pesan',
    '2. Encoding ASCII Desimal',
    '3. Representasi Biner 8-Bit',
    '4. Pembelahan Nibble (4-Bit)',
    '5. Konversi Nibble ke Heksadesimal',
    '6. Agregasi Byte Hex Pesan',
    '7. Audit Kapasitas & Penghitungan Node Hex',
    '8. Formulasi Aturan Padding (pad10*1)',
    '9. Penyatuan & Injeksi Byte Padding',
    '10. Alokasi Blok Bitrate (r = 1088 Bit)',
    '11. Padding Ekspansi Bitrate (136 Byte)',
    '12. Partisi Bitrate ke 17 Lane (64-Bit)',
    '13. Serialisasi 17 Lane Bitrate',
    '14. Inisialisasi Matriks State Keccak 5×5',
    '15. Fase Absorpsi: Injeksi Bitrate ke State',
    '16. Geometri State 3D Keccak-f[1600]',
    '17. Permutasi Ronde 1 (θ, ρ, π, χ, ι)',
    '18. Eksekusi Penuh 24 Ronde Permutasi',
    '19. Ekstraksi 4 Lane Squeezing (256 Bit)',
    '20. Wadah Output Squeezing (32 Byte)',
    '21. Rekonstruksi Stream Hex Digest (256 Bit)',
    '22. Hash Final & Uji Efek Avalanche'
  ];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] min-h-screen bg-[#f8fafc] text-slate-900 overflow-y-auto overflow-x-hidden scroll-smooth"
    >
      {/* FLOATING CONTROLS POJOK */}
      <FloatingControls
        currentStep={currentStep}
        maxStep={maxStep}
        stepLabels={stepLabels}
        speed={speed}
        setSpeed={setSpeed}
        isMuted={isMuted}
        toggleMute={toggleMute}
        handlePrev={handlePrev}
        handleNext={handleNext}
        onJumpStep={scrollToStep}
      />

      <div className="mx-auto flex flex-col items-center max-w-7xl w-full">
        
        {/* FRAME 1: INPUT KATA ASLI (STEP 0) - SETINGGI LAYAR PENUH (100vh) */}
        <section 
          ref={inputSectionRef} 
          className="h-screen min-h-screen flex flex-col items-center justify-center w-full text-center relative px-4"
        >
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-3">
            Bahan Mentah
          </span>

          <input
            data-main-input="true"
            type="text"
            value={inputText}
            maxLength={135}
            onChange={(e) => {
              setInputText(e.target.value);
              soundEngine.playTypingBlip();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                e.currentTarget.blur();
                handleNext();
              } else if (e.key === 'ArrowRight' && (e.currentTarget.selectionStart === e.currentTarget.value.length || e.currentTarget.selectionStart === null)) {
                e.preventDefault();
                e.currentTarget.blur();
                handleNext();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                handlePrev();
              } else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
                e.preventDefault();
                handlePrev();
              }
            }}
            placeholder="Ketik kata..."
            className={`w-auto min-w-[160px] sm:min-w-[200px] max-w-full text-center font-mono font-black text-slate-900 bg-transparent border-b-2 border-slate-300 focus:border-blue-600 focus:outline-none transition-all tracking-wider py-2 ${
              inputText.length > 14 
                ? 'text-2xl sm:text-3xl md:text-4xl' 
                : inputText.length > 7 
                ? 'text-3xl sm:text-4xl md:text-5xl' 
                : 'text-4xl sm:text-6xl md:text-7xl'
            }`}
          />

          {/* INDIKATOR JUMLAH KARAKTER & BIT INPUT */}
          <div className="flex items-center gap-2 mt-4">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/90 text-blue-700 font-mono text-xs font-bold shadow-2xs">
              {inputText.length} Karakter ({inputText.length * 8} Bit)
            </span>
          </div>

          <span className="text-xs font-mono text-slate-400 mt-3">
            Tekan <strong className="text-blue-600 font-bold">Enter</strong> atau <strong className="text-slate-600 font-bold">Arrow Down / Right</strong> untuk mulai mencincang kata ini
          </span>

          {/* Indikator Aliran Scroll di Bawah Frame 1 */}
          <div className="absolute bottom-8 flex flex-col items-center">
            <div className="w-0.5 h-10 bg-blue-300"></div>
            <ArrowDown className="w-4 h-4 text-blue-600 animate-bounce mt-1" />
          </div>
        </section>

        {/* FRAME 2: PANGGUNG VISUALIZER (STEP 1 s/d 22) - SETINGGI LAYAR PENUH (100vh) */}
        <section 
          ref={morphStageRef} 
          className={`min-h-screen flex flex-col items-center justify-center w-full px-4 relative ${
            chars.length > 8 ? 'py-3 sm:py-5' : 'py-8'
          }`}
        >
          {/* STEP 1 s/d 9: TAHAP MORFOLOGI HURUF, AUDIT & ATURAN PADDING */}
          <MorphologyStage
            currentStep={currentStep}
            speed={speed}
            stepDirection={stepDirection}
            chars={chars}
            paddingRules={paddingRules}
            lowerHexRefs={lowerHexRefs}
            rowRefs={rowRefs}
            scrollContainerRef={scrollContainerRef}
            step7RuleHexRefs={step7RuleHexRefs}
            remainingBytes={remainingBytes}
            onToggle1080Test={handleToggle1080Test}
            is1080Mode={is1080Mode}
          />

          {/* STEP 5 s/d 12: NAMPAN TEMPLATE HEX PERSISTEN */}
          <SharedHexTray
            currentStep={currentStep}
            speed={speed}
            stepDirection={stepDirection}
            chars={chars}
            trayItems={trayItems}
            trayRefs={trayRefs}
            step6Offsets={step6Offsets}
            step7Offsets={step7Offsets}
          />

          {/* STEP 10 s/d 13: WADAH 1088, DUAL TRAYS & SCANNING BALOK LANE */}
          <Wadah1088Grid
            currentStep={currentStep}
            speed={speed}
            stepDirection={stepDirection}
            step11Phase={step11Phase}
            currentScanningLane={currentScanningLane}
            containerSlots={containerSlots}
            offsets={offsets}
            replayKey={replayKey}
            slotTimings={slotTimings}
            slotRefs={slotRefs}
            topLaneRefs={topLaneRefs}
            bottomLaneRefs={bottomLaneRefs}
          />

          {/* STEP 14 & 15: NAMPAN KECCAK & INJEKSI STATE 5x5 */}
          <KeccakTrayAndState
            currentStep={currentStep}
            speed={speed}
            stepDirection={stepDirection}
            currentAbsorbedLane={currentAbsorbedLane}
            isAbsorptionComplete={isAbsorptionComplete}
            keccak5x5Slots={keccak5x5Slots}
          />

          {/* STEP 16 s/d 19: TRANSFORMASI 2D KE KUBUS 3D, RONDE 1, 24 RONDE & SQUEEZING */}
          {currentStep >= 16 && currentStep <= 19 && (
            <KeccakCube3D
              currentStep={currentStep}
              speed={speed}
              isMuted={isMuted}
              inputText={inputText}
            />
          )}

          {/* STEP 20 & 21: WADAH SQUEEZING 4x8 & PENAMPANG CLONE 2x2 */}
          {(currentStep === 20 || currentStep === 21) && (
            <Sha3SqueezeContainerStage
              currentStep={currentStep}
              inputText={inputText}
              speed={speed}
              isMuted={isMuted}
            />
          )}

          {/* STEP 22: HASIL AKHIR & UJI AVALANCHE */}
          {currentStep === 22 && (
            <Sha3Step21Stage
              inputText={inputText}
              isMuted={isMuted}
              onNewInput={() => scrollToStep(0)}
              onBackToStep1={() => scrollToStep(1)}
            />
          )}

        </section>

      </div>
    </div>
  );
}
