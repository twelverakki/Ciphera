import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, Pause, Layers, Sparkles, RefreshCw, ChevronRight, ChevronLeft, CheckCircle2, ArrowDownToLine, Eye } from 'lucide-react';
import { sha3_256 } from 'js-sha3';
import { soundEngine } from '../../audio/soundEngine';

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Tabel resmi konstanta rotasi bit Rho Keccak (modulo 64):
 * Nilai rotasi unik untuk setiap lane (x, y)
 */
const KECCAK_RHO_OFFSETS = [
  [0,  36,  3, 41, 18],  // y = 0
  [1,  44, 10, 45,  2],  // y = 1
  [62,  6, 43, 15, 61],  // y = 2
  [28, 55, 25, 21, 56],  // y = 3
  [27, 20, 39,  8, 14]   // y = 4
];

/**
 * Konversi pergeseran bit Keccak ke pergeseran slice 8-kedalaman (Z)
 */
function getRhoShiftZ(x, y) {
  const bits = KECCAK_RHO_OFFSETS[y][x];
  if (bits === 0) return 0;
  const shift = Math.round(bits / 8) % 8;
  return shift === 0 ? 1 : shift;
}

/**
 * Pemetaan resmi Permutasi Pi Keccak:
 * (x, y) -> (y, (2x + 3y) mod 5)
 */
function getPiTarget(x, y) {
  const newX = y;
  const newY = (2 * x + 3 * y) % 5;
  return { newX, newY };
}

/**
 * Komponen balok kubus individual dalam matriks 5x5x8 dengan animasi finite & deterministik
 */
function StateBlock({
  x,
  y,
  z,
  isCapacity,
  laneIndex,
  visible,
  currentStep,
  roundOp,
  opProgress,
  turboRound,
  turboProgress,
  squeezeHighlightLane = 0,
  fullHash = ''
}) {
  const meshRef = useRef();

  // Posisi dasar: z=0 di depan (+Z), z=7 di belakang (-Z)
  const baseX = (x - 2) * 0.92;
  const baseY = (2 - y) * 0.92;
  const baseZ = (3.5 - z) * 0.92;

  // Hitung nilai Byte Hexadecimal untuk balok ini (Step 18)
  const byteIdx = laneIndex * 8 + z;
  const byteHex = useMemo(() => {
    if (!fullHash || fullHash.length < 64) return '00';
    return fullHash.slice(byteIdx * 2, byteIdx * 2 + 2).toUpperCase();
  }, [fullHash, byteIdx]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !visible) return;

    if (currentStep === 17) {
      if (roundOp === 'theta') {
        // Theta: 1 sapuan berhingga kolom 0 s/d 4
        const activeCol = Math.min(4, Math.floor(opProgress * 5));
        if (x === activeCol && opProgress < 1) {
          const pulse = 1 + Math.sin(opProgress * Math.PI * 10) * 0.08;
          meshRef.current.scale.set(pulse, pulse, pulse);
        } else {
          meshRef.current.scale.set(1, 1, 1);
        }
        meshRef.current.position.set(baseX, baseY, baseZ);
      } else if (roundOp === 'rho') {
        // Rho: Rotasi sirkular nyata balok sepanjang sumbu Z
        const shiftAmount = getRhoShiftZ(x, y);
        const shiftedZContinuous = (z + opProgress * shiftAmount) % 8;
        const currentPosZ = (3.5 - shiftedZContinuous) * 0.92;

        meshRef.current.position.set(baseX, baseY, currentPosZ);
        meshRef.current.scale.set(1, 1, 1);
      } else if (roundOp === 'pi') {
        // Pi: Tiang benar-benar berpindah ke koordinat baru (newX, newY)
        const { newX, newY } = getPiTarget(x, y);
        const targetX = (newX - 2) * 0.92;
        const targetY = (2 - newY) * 0.92;

        const curX = THREE.MathUtils.lerp(baseX, targetX, opProgress);
        const curY = THREE.MathUtils.lerp(baseY, targetY, opProgress);
        const arcLift = Math.sin(opProgress * Math.PI) * 0.65;

        meshRef.current.position.set(curX, curY, baseZ + arcLift);
        meshRef.current.scale.set(1, 1, 1);
      } else if (roundOp === 'chi') {
        // Chi: 1 sapuan berhingga baris 0 s/d 4
        const activeRow = Math.min(4, Math.floor(opProgress * 5));
        if (y === activeRow && opProgress < 1) {
          const wave = Math.sin(opProgress * Math.PI * 8) * 0.08;
          meshRef.current.scale.set(1 + wave, 1 + wave, 1 + wave);
        } else {
          meshRef.current.scale.set(1, 1, 1);
        }
        meshRef.current.position.set(baseX, baseY, baseZ);
      } else if (roundOp === 'iota') {
        // Iota: Injeksi ke node (0,0) lalu riak menyebar satu kali
        if (x === 0 && y === 0 && z === 0) {
          const pulse = 1 + Math.sin(Math.min(1, opProgress * 2) * Math.PI) * 0.25;
          meshRef.current.scale.set(pulse, pulse, pulse);
        } else {
          const dist = Math.sqrt(x * x + y * y + z * z);
          const maxDist = Math.sqrt(4 * 4 + 4 * 4 + 7 * 7);
          const rippleFront = opProgress * maxDist * 1.2;

          if (dist <= rippleFront && opProgress < 1) {
            const rippleEffect = Math.sin((rippleFront - dist) * 2) * 0.05;
            meshRef.current.scale.set(1 + Math.max(0, rippleEffect), 1 + Math.max(0, rippleEffect), 1 + Math.max(0, rippleEffect));
          } else {
            meshRef.current.scale.set(1, 1, 1);
          }
        }
        meshRef.current.position.set(baseX, baseY, baseZ);
      }
    } else if (currentStep === 18) {
      // Step 18: Efek Avalanche & Turbo Permutasi Ronde 2 s/d 24
      if (turboProgress < 1) {
        const avalanche = Math.sin(clock.getElapsedTime() * 20 + laneIndex * 1.7 + z * 1.5) * 0.18 * (1 - turboProgress * 0.6);
        meshRef.current.position.set(baseX + avalanche * 0.4, baseY + avalanche * 0.3, baseZ + avalanche * 0.6);
      } else {
        meshRef.current.position.set(baseX, baseY, baseZ);
        meshRef.current.scale.set(1, 1, 1);
      }
    } else if (currentStep === 19) {
      // Step 19: Seluruh 25 tiang (200 balok) tampil di koordinat 3D aslinya
      // Tiang yang terpilih (laneIndex < squeezeHighlightLane) terangkat sedikit dan mengambang dinamis
      if (laneIndex < squeezeHighlightLane) {
        const floatHover = 0.12 + Math.sin(clock.getElapsedTime() * 3 + laneIndex) * 0.03;
        meshRef.current.position.set(baseX, baseY + floatHover, baseZ);
        meshRef.current.scale.set(1.05, 1.05, 1.05);
      } else {
        meshRef.current.position.set(baseX, baseY, baseZ);
        meshRef.current.scale.set(1, 1, 1);
      }
    } else {
      // Step 15: Diam stabil di posisi dasar
      meshRef.current.position.set(baseX, baseY, baseZ);
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  // Semua balok tampil di Step 16, 17, 18
  if (!visible) return null;

  // ========================================================
  // WARNA BERBEDA & PROGRESIF BERDASARKAN OPERASI AKTIF
  // ========================================================
  let blockColor = isCapacity ? '#334155' : '#2563eb';
  let edgeColor = isCapacity ? '#f59e0b' : '#38bdf8';
  let opacity = isCapacity ? 0.72 : 0.85;

  if (currentStep === 17) {
    if (roundOp === 'theta') {
      const activeCol = Math.min(4, Math.floor(opProgress * 5));
      if (x <= activeCol) {
        blockColor = '#9333ea';
        edgeColor = '#e879f9';
        opacity = 0.95;
      } else if (Math.abs(x - activeCol) === 1 || Math.abs(x - activeCol) === 4) {
        blockColor = '#06b6d4';
        edgeColor = '#67e8f9';
        opacity = 0.9;
      } else {
        blockColor = '#312e81';
        edgeColor = '#818cf8';
        opacity = 0.55;
      }
    } else if (roundOp === 'rho') {
      blockColor = laneIndex % 2 === 0 ? '#059669' : '#10b981';
      edgeColor = '#6ee7b7';
      opacity = 0.92;
    } else if (roundOp === 'pi') {
      blockColor = '#e11d48';
      edgeColor = '#fda4af';
      opacity = 0.92;
    } else if (roundOp === 'chi') {
      const activeRow = Math.min(4, Math.floor(opProgress * 5));
      if (y <= activeRow) {
        const isEven = y % 2 === 0;
        blockColor = isEven ? '#84cc16' : '#ea580c';
        edgeColor = isEven ? '#bef264' : '#fdba74';
        opacity = 0.92;
      } else {
        blockColor = '#475569';
        edgeColor = '#94a3b8';
        opacity = 0.6;
      }
    } else if (roundOp === 'iota') {
      if (x === 0 && y === 0 && z === 0) {
        blockColor = '#f59e0b';
        edgeColor = '#ffffff';
        opacity = 1.0;
      } else {
        const dist = Math.sqrt(x * x + y * y + z * z);
        const maxDist = Math.sqrt(4 * 4 + 4 * 4 + 7 * 7);
        const rippleFront = opProgress * maxDist * 1.2;

        if (dist <= rippleFront) {
          blockColor = '#6366f1';
          edgeColor = '#c084fc';
          opacity = 0.88;
        } else {
          blockColor = '#334155';
          edgeColor = '#64748b';
          opacity = 0.65;
        }
      }
    }
  } else if (currentStep === 18) {
    if (turboProgress < 1) {
      // Pusaran partikel avalanche warna-warni saat mengaduk
      const colorPalette = ['#9333ea', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];
      const pIdx = (laneIndex * 3 + z * 2 + turboRound) % colorPalette.length;
      blockColor = colorPalette[pIdx];
      edgeColor = '#ffffff';
      opacity = 0.9;
    } else {
      // Setelah fase 24 ronde berakhir di Step 18: blok berubah menjadi warna default (sponge base state)
      const baseColor = isCapacity ? '#1e293b' : '#334155';
      const baseEdge = isCapacity ? '#334155' : '#475569';
      const baseOpacity = isCapacity ? 0.45 : 0.6;
      blockColor = baseColor;
      edgeColor = baseEdge;
      opacity = baseOpacity;
    }
  } else if (currentStep === 19) {
    // Step 19: Awalnya SEMUA 200 balok berwarna sama (sponge base state).
    // Kemudian 4 lane pertama diwarnai berurutan: Lane 0 -> Lane 1 -> Lane 2 -> Lane 3!
    const baseColor = isCapacity ? '#1e293b' : '#334155';
    const baseEdge = isCapacity ? '#334155' : '#475569';
    const baseOpacity = isCapacity ? 0.45 : 0.6;

    if (laneIndex < 4 && laneIndex < squeezeHighlightLane) {
      const squeezeColors = ['#f59e0b', '#06b6d4', '#10b981', '#ec4899'];
      const squeezeEdges = ['#fde68a', '#a5f3fc', '#a7f3d0', '#fbcfe8'];
      blockColor = squeezeColors[laneIndex];
      edgeColor = squeezeEdges[laneIndex];
      opacity = 0.98;
    } else {
      blockColor = baseColor;
      edgeColor = baseEdge;
      opacity = baseOpacity;
    }
  }

  return (
    <mesh ref={meshRef} position={[baseX, baseY, baseZ]}>
      <boxGeometry args={[0.78, 0.78, 0.78]} />
      <meshStandardMaterial
        color={blockColor}
        transparent={true}
        opacity={opacity}
        roughness={0.18}
        metalness={0.2}
      />
      <Edges
        threshold={15}
        color={edgeColor}
        lineWidth={1.6}
      />

      {/* TAMPILAN NILAI BYTE HEX PADA BALOK YANG DISOROT DI STEP 19 */}
      {currentStep === 19 && laneIndex < 4 && laneIndex < squeezeHighlightLane && (
        <Html
          position={[0, 0, 0.41]}
          center
          transform
          distanceFactor={7.5}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center justify-center select-none pointer-events-none">
            <span className="font-mono font-black text-[12px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-none tracking-tight">
              {byteHex}
            </span>
            <span className="font-mono text-[7px] text-white/85 leading-none mt-0.5 opacity-80">
              b{byteIdx}
            </span>
          </div>
        </Html>
      )}
    </mesh>
  );
}

/**
 * Grup 200 balok State 5x5x8
 */
function StateGridGroup({ activeLayers, currentStep, roundOp, opProgress, turboRound, turboProgress, squeezeHighlightLane, fullHash }) {
  const blocks = useMemo(() => {
    const list = [];
    for (let z = 0; z < 8; z++) {
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const laneIndex = y * 5 + x;
          const isCapacity = laneIndex >= 17;
          list.push({
            id: `${x}-${y}-${z}`,
            x,
            y,
            z,
            laneIndex,
            isCapacity
          });
        }
      }
    }
    return list;
  }, []);

  return (
    <group>
      {/* Floating Tag Di Atas Tiang yang Terpilih di Step 19 */}
      {currentStep === 19 && (
        <group>
          {[
            { idx: 0, x: 0, y: 0, label: 'Lane 0 (0..7)', color: 'border-amber-400/80 bg-slate-900/95 text-amber-300' },
            { idx: 1, x: 1, y: 0, label: 'Lane 1 (8..15)', color: 'border-cyan-400/80 bg-slate-900/95 text-cyan-300' },
            { idx: 2, x: 2, y: 0, label: 'Lane 2 (16..23)', color: 'border-emerald-400/80 bg-slate-900/95 text-emerald-300' },
            { idx: 3, x: 3, y: 0, label: 'Lane 3 (24..31)', color: 'border-pink-400/80 bg-slate-900/95 text-pink-300' },
          ].map((item) => {
            if (item.idx >= squeezeHighlightLane) return null;
            const tagX = (item.x - 2) * 0.92;
            const tagY = (2 - item.y) * 0.92 + 0.65;
            return (
              <Html key={item.idx} position={[tagX, tagY, 0]} center transform distanceFactor={7.5} style={{ pointerEvents: 'none' }}>
                <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-mono font-bold whitespace-nowrap shadow-md select-none ${item.color}`}>
                  {item.label}
                </div>
              </Html>
            );
          })}
        </group>
      )}

      {blocks.map((block) => (
        <StateBlock
          key={block.id}
          x={block.x}
          y={block.y}
          z={block.z}
          laneIndex={block.laneIndex}
          isCapacity={block.isCapacity}
          visible={currentStep >= 17 ? true : block.z < activeLayers}
          currentStep={currentStep}
          roundOp={roundOp}
          opProgress={opProgress}
          turboRound={turboRound}
          turboProgress={turboProgress}
          squeezeHighlightLane={squeezeHighlightLane}
          fullHash={fullHash}
        />
      ))}
    </group>
  );
}

export function KeccakCube3D({ speed, currentStep, isMuted, inputText = '' }) {
  const [activeLayers, setActiveLayers] = useState(currentStep >= 17 ? 8 : 1);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const controlsRef = useRef();

  // Hitung Hash SHA-3-256 Asli untuk visualisasi pemerasan lane
  const fullHash = useMemo(() => {
    try {
      return sha3_256(inputText ?? '');
    } catch {
      return sha3_256('');
    }
  }, [inputText]);

  const squeezedLanes = useMemo(() => [
    {
      idx: 0,
      name: 'Lane 0',
      pos: '(x=0, y=0)',
      colorText: 'text-amber-500',
      bgBadge: 'bg-amber-50 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
      hex: fullHash.slice(0, 16),
      label: 'Byte 0..7 (64-Bit)'
    },
    {
      idx: 1,
      name: 'Lane 1',
      pos: '(x=1, y=0)',
      colorText: 'text-cyan-500',
      bgBadge: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      dotColor: 'bg-cyan-500',
      hex: fullHash.slice(16, 32),
      label: 'Byte 8..15 (64-Bit)'
    },
    {
      idx: 2,
      name: 'Lane 2',
      pos: '(x=2, y=0)',
      colorText: 'text-emerald-500',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
      hex: fullHash.slice(32, 48),
      label: 'Byte 16..23 (64-Bit)'
    },
    {
      idx: 3,
      name: 'Lane 3',
      pos: '(x=3, y=0)',
      colorText: 'text-pink-500',
      bgBadge: 'bg-pink-50 text-pink-800 border-pink-300',
      dotColor: 'bg-pink-500',
      hex: fullHash.slice(48, 64),
      label: 'Byte 24..31 (64-Bit)'
    }
  ], [fullHash]);

  // 5 Operasi Ronde 1 Keccak
  const operations = useMemo(() => [
    {
      id: 'theta',
      symbol: 'θ',
      name: 'Theta',
      title: 'Difusi Paritas Kolom',
      colorBadge: 'bg-purple-100 text-purple-800 border-purple-300',
      colorTheme: 'Ungu Neon (Target) & Cyan (Sumber)',
      desc: '1 sapuan dari Kolom 0 s/d 4: tiap kolom di-XOR dengan paritas 2 kolom tetangganya, menyebarkan bit ke seluruh kolom.'
    },
    {
      id: 'rho',
      symbol: 'ρ',
      name: 'Rho',
      title: 'Rotasi Bit Sumbu Z',
      colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      colorTheme: 'Hijau Zamrud & Mint',
      desc: 'Rotasi sirkular nyata: balok di dalam tiang yang sama berputar melingkar di sumbu Z sesuai konstanta rotasi tiap lane.'
    },
    {
      id: 'pi',
      symbol: 'π',
      name: 'Pi',
      title: 'Permutasi Posisi Balok',
      colorBadge: 'bg-rose-100 text-rose-800 border-rose-300',
      colorTheme: 'Magenta & Rose Menyala',
      desc: 'Balok tiang terangkat dan mendarat permanen di koordinat baru (x, y) → (y, (2x+3y) mod 5), mengacak posisi secara spasial.'
    },
    {
      id: 'chi',
      symbol: 'χ',
      name: 'Chi',
      title: 'Efek Non-Linear Baris',
      colorBadge: 'bg-lime-100 text-lime-800 border-lime-300',
      colorTheme: 'Lime Elektrik & Sunset Orange',
      desc: '1 sapuan dari Baris 0 s/d 4: logika non-linear (AND & NOT) antar 3 node bertetangga mengunci ketahanan kriptografi.'
    },
    {
      id: 'iota',
      symbol: 'ι',
      name: 'Iota',
      title: 'Injeksi Konstanta Ronde',
      colorBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      colorTheme: 'Emas Murni (RC[0]) & Amethyst',
      desc: 'Sinar Round Constant RC[0] menembak node (0, 0, 0), lalu riak gelombang menyapu seluruh 200 kubus menjadi teracak sempurna.'
    }
  ], []);

  const [activeOpIndex, setActiveOpIndex] = useState(0);
  const [opProgress, setOpProgress] = useState(0); // 0.0 s/d 1.0 (Berhingga)
  const [isCyclePlaying, setIsCyclePlaying] = useState(true);

  // Step 17: Akselerasi Ronde 2 s/d 24
  const [turboRound, setTurboRound] = useState(2);
  const [turboProgress, setTurboProgress] = useState(0);

  // Step 18: Sorotan 4 Lane Pertama (256-Bit)
  const [squeezeHighlightLane, setSqueezeHighlightLane] = useState(0); // 0 s/d 4

  useEffect(() => {
    if (currentStep === 19) {
      setSqueezeHighlightLane(0);
      let currentLane = 0;
      const intervalDuration = (0.55 / speed) * 1000;

      const interval = setInterval(() => {
        if (currentLane < 4) {
          currentLane += 1;
          setSqueezeHighlightLane(currentLane);
          if (!isMuted) {
            soundEngine.playLandingKlop();
          }
        } else {
          clearInterval(interval);
        }
      }, intervalDuration);

      return () => clearInterval(interval);
    }
  }, [currentStep, speed, isMuted]);

  const replaySqueezeHighlight = () => {
    if (currentStep === 19) {
      setSqueezeHighlightLane(0);
      if (!isMuted) soundEngine.playWhooshThin();
      let currentLane = 0;
      const intervalDuration = (0.55 / speed) * 1000;

      const interval = setInterval(() => {
        if (currentLane < 4) {
          currentLane += 1;
          setSqueezeHighlightLane(currentLane);
          if (!isMuted) {
            soundEngine.playLandingKlop();
          }
        } else {
          clearInterval(interval);
        }
      }, intervalDuration);
    }
  };

  // Animasi Step 18 (sebelumnya Step 17: Turbo Permutasi 24 Ronde)
  useEffect(() => {
    if (currentStep === 18) {
      if (!isMuted) soundEngine.startScrambleHum();
      setTurboRound(2);
      setTurboProgress(0);
      let roundCounter = 2;
      const intervalDuration = (0.16 / speed) * 1000;

      const interval = setInterval(() => {
        if (roundCounter < 24) {
          roundCounter += 1;
          setTurboRound(roundCounter);
          setTurboProgress((roundCounter - 2) / 22);
          if (!isMuted && roundCounter % 2 === 0) {
            soundEngine.playTypingBlip();
          }
        } else {
          clearInterval(interval);
          setTurboProgress(1);
          soundEngine.stopScrambleHum();
          if (!isMuted) soundEngine.playLandingKlop();
        }
      }, intervalDuration);

      return () => {
        clearInterval(interval);
        soundEngine.stopScrambleHum();
      };
    } else {
      soundEngine.stopScrambleHum();
    }
  }, [currentStep, speed, isMuted]);

  const replayTurbo = () => {
    if (currentStep === 18) {
      if (!isMuted) soundEngine.startScrambleHum();
      setTurboRound(2);
      setTurboProgress(0);
      let roundCounter = 2;
      const intervalDuration = (0.16 / speed) * 1000;

      const interval = setInterval(() => {
        if (roundCounter < 24) {
          roundCounter += 1;
          setTurboRound(roundCounter);
          setTurboProgress((roundCounter - 2) / 22);
          if (!isMuted && roundCounter % 2 === 0) {
            soundEngine.playTypingBlip();
          }
        } else {
          clearInterval(interval);
          setTurboProgress(1);
          soundEngine.stopScrambleHum();
          if (!isMuted) soundEngine.playLandingKlop();
        }
      }, intervalDuration);
    }
  };

  // Animasi Step 17 (sebelumnya Step 16): Berhingga untuk operasi aktif (0% -> 100%)
  useEffect(() => {
    if (currentStep !== 17) return;

    setOpProgress(0);
    let startTimestamp = null;
    let animFrameId = null;
    const duration = (2.6 / speed) * 1000;

    const stepAnim = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / duration);
      setOpProgress(progress);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(stepAnim);
      } else {
        if (!isMuted) soundEngine.playLandingKlop();

        if (isCyclePlaying) {
          setTimeout(() => {
            setActiveOpIndex((prev) => {
              if (prev < operations.length - 1) {
                if (!isMuted) soundEngine.playWhooshThin();
                return prev + 1;
              } else {
                setIsCyclePlaying(false);
                return prev;
              }
            });
          }, (0.9 / speed) * 1000);
        }
      }
    };

    animFrameId = requestAnimationFrame(stepAnim);
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [activeOpIndex, currentStep, speed, isMuted, isCyclePlaying, operations.length]);

  // Step 16 (sebelumnya Step 15): Ekstrusi ke arah BELAKANG sumbu Z (layer 1 s/d 8)
  useEffect(() => {
    if (currentStep === 16) {
      setActiveLayers(1);
      const timers = [];
      const layerDuration = 0.35 / speed;

      for (let layer = 2; layer <= 8; layer++) {
        const t = setTimeout(() => {
          setActiveLayers(layer);
          if (!isMuted) soundEngine.playLandingKlop();
        }, (layer - 1) * layerDuration * 1000);
        timers.push(t);
      }

      return () => timers.forEach((t) => clearTimeout(t));
    } else if (currentStep >= 17) {
      setActiveLayers(8);
    }
  }, [currentStep, speed, isMuted]);

  const replayCurrentOp = () => {
    setOpProgress(0);
    if (!isMuted) soundEngine.playWhooshThin();
  };

  const nextOp = () => {
    if (activeOpIndex < operations.length - 1) {
      setActiveOpIndex((prev) => prev + 1);
      setIsCyclePlaying(false);
      if (!isMuted) soundEngine.playClick();
    }
  };

  const prevOp = () => {
    if (activeOpIndex > 0) {
      setActiveOpIndex((prev) => prev - 1);
      setIsCyclePlaying(false);
      if (!isMuted) soundEngine.playClick();
    }
  };

  const [isFrontView, setIsFrontView] = useState(false);

  const toggleFrontView = () => {
    if (controlsRef.current) {
      if (!isFrontView) {
        controlsRef.current.object.position.set(0, 0, 8.4);
        controlsRef.current.target.set(0, 0, 0);
        setIsFrontView(true);
      } else {
        controlsRef.current.object.position.set(4.8, 3.2, 7.6);
        controlsRef.current.target.set(0, 0, 0);
        setIsFrontView(false);
      }
      controlsRef.current.update();
      if (!isMuted) soundEngine.playClick();
    }
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      if (currentStep === 19) {
        controlsRef.current.object.position.set(0, 0, 8.4);
        controlsRef.current.target.set(0, 0, 0);
        setIsFrontView(true);
      } else {
        controlsRef.current.reset();
        setIsFrontView(false);
      }
      controlsRef.current.update();
    }
    soundEngine.playClick();
  };

  const currentOp = operations[activeOpIndex];
  const isFinished = opProgress >= 1;
  const isAllRound1Finished = activeOpIndex === operations.length - 1 && isFinished;

  return (
    <div className="w-full flex flex-col items-center justify-center relative my-4">
      {/* HEADER TAHAP: STEP 16, STEP 17, ATAU STEP 18 */}
      {currentStep === 16 ? (
        <div className="flex flex-col items-center mb-3 text-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 shadow-2xs mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-mono font-black tracking-wider text-blue-900 uppercase">
              Transformasi 3D: Ekstrusi ke Belakang (5 × 5 × 8 Byte)
            </h3>
          </div>
          <p className="text-[11px] font-mono text-slate-500 max-w-md">
            Wajah depan (Z=1) tetap di depan, lalu menduplikasi diri <strong className="text-blue-600">ke arah belakang</strong> hingga 8 lapisan kedalaman.
            <span className="block mt-0.5 text-slate-400">Klik dan seret untuk memutar kubus bebas 360°.</span>
          </p>
        </div>
      ) : currentStep === 17 ? (
        /* STEP 17: HEADER RONDE 1 PERMUTASI & TABULASI TEKS MINIMALIS */
        <div className="flex flex-col items-center mb-3 text-center w-full max-w-xl px-2">
          {/* 1. BADGE JUDUL (BARIS BLOCK) */}
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 shadow-2xs mb-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-mono font-black tracking-wider text-indigo-900 uppercase">
              Ronde 1 / 24 Permutasi Keccak-f[1600]
            </h3>
          </div>

          {/* 2 & 3 & 4. TABULASI TEKS 5 OPERASI & TOMBOL IKON DI SAMPING */}
          <div className="flex items-center gap-2 w-full">
            {/* TABULASI TEKS 5 OPERASI DENGAN PROGRESS BAR DI BAWAHNYA */}
            <div className="flex-1 flex items-center justify-between p-1.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-2xs">
              {operations.map((op, idx) => {
                const isActive = activeOpIndex === idx;
                const isPast = idx < activeOpIndex;
                const percent = isPast ? 100 : isActive ? Math.round(opProgress * 100) : 0;

                return (
                  <button
                    key={op.id}
                    onClick={() => {
                      setActiveOpIndex(idx);
                      setIsCyclePlaying(false);
                      if (!isMuted) soundEngine.playClick();
                    }}
                    className="flex-1 flex flex-col items-center px-1 py-1 transition-all cursor-pointer group"
                    title={`Operasi ${op.symbol} (${op.name})`}
                  >
                    <span className={`font-mono text-xs sm:text-sm transition-colors ${
                      isActive 
                        ? 'font-black text-indigo-600' 
                        : isPast 
                        ? 'font-bold text-slate-700 hover:text-indigo-500' 
                        : 'font-medium text-slate-400 hover:text-slate-600'
                    }`}>
                      <strong className="text-sm">{op.symbol}</strong>{' '}
                      <span className="text-[11px] font-semibold hidden sm:inline">{op.name}</span>
                    </span>

                    {/* PROGRESS BAR SESUAI OPERASI DI ATASNYA */}
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ${
                          isPast ? 'bg-indigo-400' : isActive ? 'bg-indigo-600' : 'bg-transparent'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* TOMBOL IKON DI SAMPING TAB BAR */}
            <div className="flex items-center gap-1 shrink-0">
              {/* TOMBOL PUTAR ULANG (IKON SAJA) */}
              <button
                onClick={replayCurrentOp}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Putar Ulang Operasi Aktif"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              </button>

              {/* TOMBOL PUTAR/JEDA SIKLUS (IKON SAJA) */}
              <button
                onClick={() => setIsCyclePlaying(!isCyclePlaying)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title={isCyclePlaying ? "Jeda Siklus Otomatis" : "Putar Siklus Otomatis"}
              >
                {isCyclePlaying ? (
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : currentStep === 18 ? (
        /* STEP 18: AKSELERASI 24 RONDE & PROGRESS BAR MINIMALIS */
        <div className="flex flex-col items-center mb-3 text-center w-full max-w-xl px-2">
          {/* 1. BADGE JUDUL (BARIS BLOCK) */}
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs mb-2.5">
            <span className={`w-2 h-2 rounded-full ${turboProgress >= 1 ? 'bg-emerald-600' : 'bg-emerald-500 animate-pulse'}`} />
            <h3 className="text-xs sm:text-sm font-mono font-black tracking-wider text-emerald-900 uppercase">
              Akselerasi Permutasi: 24 Ronde Penuh
            </h3>
          </div>

          {/* 2. BAR STATUS RONDE & PROGRESS DINAMIS DENGAN TOMBOL IKON DI SAMPING */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 flex flex-col justify-center px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Siklus:</span>
                  <span className="text-emerald-600 font-black tracking-wider">
                    Ronde {turboRound.toString().padStart(2, '0')} / 24
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${
                  turboProgress >= 1 ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {turboProgress >= 1 ? '✓ Entropi Maksimal (1600-Bit)' : 'Mengaduk State...'}
                </span>
              </div>

              {/* PROGRESS BAR 24 RONDE */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-100"
                  style={{ width: `${Math.round((turboRound / 24) * 100)}%` }}
                />
              </div>
            </div>

            {/* TOMBOL PUTAR ULANG (IKON SAJA) */}
            <button
              onClick={replayTurbo}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Putar Ulang Akselerasi 24 Ronde"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      ) : (
        /* STEP 18: PEMILIHAN 4 LANE SQUEEZING (256-BIT BITRATE) */
        <div className="flex flex-col items-center mb-3 text-center w-full max-w-xl px-2">
          {/* 1. BADGE JUDUL */}
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-2xs mb-2.5">
            <span className={`w-2 h-2 rounded-full ${squeezeHighlightLane >= 4 ? 'bg-amber-600' : 'bg-amber-500 animate-pulse'}`} />
            <h3 className="text-xs sm:text-sm font-mono font-black tracking-wider text-amber-950 uppercase">
              Pemilihan 4 Lane Squeezing (256-Bit)
            </h3>
          </div>

          {/* 2. BAR STATUS SEBARIS DENGAN TOMBOL IKON DI SAMPING */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 flex flex-col justify-center px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Sorotan:</span>
                  <span className="text-amber-600 font-black tracking-wider">
                    {squeezeHighlightLane === 0 ? 'Semua 25 Lane Netral' : `Lane 0 s/d ${squeezeHighlightLane - 1} (${squeezeHighlightLane * 64}-Bit)`}
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${
                  squeezeHighlightLane >= 4 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {squeezeHighlightLane >= 4 ? '✓ 4 Lane Terpilih dari Sponge' : `Menyorot Lane ${squeezeHighlightLane + 1} dari 4...`}
                </span>
              </div>

              {/* Progress Bar 4 Lane */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-cyan-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${(squeezeHighlightLane / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Tombol Putar Ulang (Ikon Saja) */}
            <button
              onClick={replaySqueezeHighlight}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Putar Ulang Pemilihan 4 Lane"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>
        </div>
      )}

      {/* 3D CANVAS VIEWPORT CONTAINER */}
      <div className="w-full max-w-2xl h-[400px] sm:h-[460px] rounded-3xl bg-slate-900 border border-slate-700/60 shadow-xl relative overflow-hidden">
        {/* Glow Ambient Effect di Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.18)_0,transparent_70%)] pointer-events-none" />

        <Canvas
          camera={{ position: [5.2, 4.0, 7.8], fov: 42 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 15, 10]} intensity={1.4} />
          <pointLight position={[-10, -5, -10]} intensity={0.6} color="#38bdf8" />

          <StateGridGroup
            activeLayers={activeLayers}
            currentStep={currentStep}
            roundOp={currentOp.id}
            opProgress={opProgress}
            turboRound={turboRound}
            turboProgress={turboProgress}
            squeezeHighlightLane={squeezeHighlightLane}
            fullHash={fullHash}
          />

          <OrbitControls
            ref={controlsRef}
            enableDamping={true}
            dampingFactor={0.05}
            autoRotate={isAutoRotate}
            autoRotateSpeed={1.5}
            minDistance={4}
            maxDistance={18}
          />
        </Canvas>

        {/* CONTROLS OVERLAY: FLOATING BUTTONS */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-semibold backdrop-blur-md border border-slate-600 transition-all shadow-xs"
            title="Toggle Putar Otomatis"
          >
            {isAutoRotate ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span>{isAutoRotate ? 'Jeda Putar' : 'Putar'}</span>
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-semibold backdrop-blur-md border border-slate-600 transition-all shadow-xs"
            title="Reset Sudut Kamera"
          >
            <RotateCcw className="w-3 h-3 text-blue-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* FOOTER OVERLAY DI CANVAS */}
        {currentStep === 16 ? (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-800/80 backdrop-blur-md border border-slate-700/80 z-20 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Kedalaman Z (ke Belakang): <strong className="text-white">{activeLayers}</strong> / 8 Slice
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">
                {activeLayers === 8 ? '200 / 200 Blok (Penuh)' : `${activeLayers * 25} Blok Terbuka`}
              </span>
              <input
                type="range"
                min="1"
                max="8"
                value={activeLayers}
                onChange={(e) => setActiveLayers(Number(e.target.value))}
                className="w-24 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        ) : currentStep === 17 ? (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-slate-800/85 backdrop-blur-md border border-slate-700/80 z-20 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Operasi Aktif: <strong className="text-blue-400">{currentOp.symbol} - {currentOp.name}</strong>
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {isAllRound1Finished ? <span className="text-emerald-400 font-bold">Ronde 1 Selesai Penuh!</span> : `Langkah ${activeOpIndex + 1} dari 5`}
            </span>
          </div>
        ) : currentStep === 18 ? (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-slate-800/85 backdrop-blur-md border border-slate-700/80 z-20 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Status: <strong className="text-emerald-400">{turboProgress >= 1 ? '1600-Bit Teracak Maksimal' : `Mengacak Ronde ${turboRound}...`}</strong>
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {turboProgress >= 1 ? 'Selesai 24 Ronde' : `${turboRound} / 24 Ronde`}
            </span>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-slate-800/85 backdrop-blur-md border border-slate-700/80 z-20 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Sorotan Bitrate: <strong className="text-amber-400">{squeezeHighlightLane >= 4 ? '4 Lane (256-Bit) Siap Diperas' : `Menyorot Lane ${squeezeHighlightLane} / 4...`}</strong>
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {squeezeHighlightLane >= 4 ? '21 Lane Lain Tetap di Sponge' : `${squeezeHighlightLane} / 4 Lane`}
            </span>
          </div>
        )}
      </div>

      {/* LEGENDA WARNA KHUSUS STEP 16 */}
      {currentStep === 16 ? (
        <div className="flex items-center gap-4 mt-2.5 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-600 border border-cyan-400 shadow-2xs" />
            <span>Bitrate (17 Lane × 8 = 136 Blok = 1088b)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-700 border border-amber-400 shadow-2xs" />
            <span>Capacity (8 Lane × 8 = 64 Blok = 512b 🔒)</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
