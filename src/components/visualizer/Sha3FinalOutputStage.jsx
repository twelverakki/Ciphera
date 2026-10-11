import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, ShieldCheck, Zap, Lock, RefreshCw, ArrowRight, Award } from 'lucide-react';
import { sha3_256 } from 'js-sha3';
import { soundEngine } from '../../audio/soundEngine';

/**
 * Komponen Step 19: Penyatuan Output & Hasil Akhir Hash SHA-3-256
 * Menampilkan hash hex 64 digit resmi, breakdown 4 lane squeezed,
 * demonstrator efek avalanche langsung, serta rekapitulasi end-to-end pipeline.
 */
export function Sha3FinalOutputStage({ inputText, speed, isMuted, onRestart }) {
  const [copied, setCopied] = useState(false);
  const [testInput, setTestInput] = useState('');

  // Perhitungan Hash SHA-3-256 Asli
  const primaryHash = useMemo(() => {
    try {
      return sha3_256(inputText ?? '');
    } catch {
      return sha3_256('');
    }
  }, [inputText]);

  // Efek Suara saat pertama kali masuk ke Step 19
  useEffect(() => {
    if (!isMuted) {
      soundEngine.playDigitalLock();
    }
  }, [isMuted]);

  // Siapkan teks uji coba Avalanche (default: ganti huruf pertama)
  useEffect(() => {
    if (inputText && inputText.length > 0) {
      const firstChar = inputText[0];
      const alteredFirst = firstChar === firstChar.toUpperCase() 
        ? firstChar.toLowerCase() 
        : firstChar.toUpperCase();
      setTestInput(alteredFirst + inputText.slice(1));
    } else {
      setTestInput('a');
    }
  }, [inputText]);

  // Hash teks uji coba untuk perbandingan Avalanche
  const testHash = useMemo(() => {
    try {
      return sha3_256(testInput);
    } catch {
      return '';
    }
  }, [testInput]);

  // Hitung perbedaan bit (Hamming Distance) antara primaryHash & testHash
  const avalancheStats = useMemo(() => {
    if (!primaryHash || !testHash || primaryHash.length !== 64 || testHash.length !== 64) {
      return { diffBits: 128, percent: 50 };
    }
    let diffBits = 0;
    for (let i = 0; i < 64; i++) {
      const n1 = parseInt(primaryHash[i], 16);
      const n2 = parseInt(testHash[i], 16);
      const xor = n1 ^ n2;
      // hitung bit 1 pada xor nibble (4 bit)
      diffBits += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
    }
    const percent = Math.round((diffBits / 256) * 100);
    return { diffBits, percent };
  }, [primaryHash, testHash]);

  // 4 Lane yang diperas pada Step 18 (masing-masing 16 digit hex = 8 byte = 64 bit)
  const laneSegments = useMemo(() => [
    {
      idx: 0,
      name: 'Lane 0',
      pos: '(0,0)',
      hex: primaryHash.slice(0, 16),
      colorText: 'text-amber-500',
      bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      barColor: 'from-amber-400 to-amber-500',
      range: 'Byte 0..7'
    },
    {
      idx: 1,
      name: 'Lane 1',
      pos: '(1,0)',
      hex: primaryHash.slice(16, 32),
      colorText: 'text-cyan-500',
      bgBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      barColor: 'from-cyan-400 to-cyan-500',
      range: 'Byte 8..15'
    },
    {
      idx: 2,
      name: 'Lane 2',
      pos: '(2,0)',
      hex: primaryHash.slice(32, 48),
      colorText: 'text-emerald-500',
      bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'from-emerald-400 to-emerald-500',
      range: 'Byte 16..23'
    },
    {
      idx: 3,
      name: 'Lane 3',
      pos: '(3,0)',
      hex: primaryHash.slice(48, 64),
      colorText: 'text-pink-500',
      bgBadge: 'bg-pink-50 text-pink-700 border-pink-200',
      barColor: 'from-pink-400 to-pink-500',
      range: 'Byte 24..31'
    }
  ], [primaryHash]);

  const handleCopy = () => {
    navigator.clipboard.writeText(primaryHash);
    setCopied(true);
    if (!isMuted) soundEngine.playClick();
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full flex flex-col items-center justify-center relative my-4 max-w-4xl px-2"
    >
      {/* HEADER TAHAP FINAL */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 shadow-xs mb-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs sm:text-sm font-mono font-black tracking-wider text-emerald-950 uppercase">
            Step 19: Output Hash Final SHA-3-256 (FIPS 202)
          </h3>
        </div>
        <p className="text-xs sm:text-sm font-mono text-slate-600 max-w-xl">
          Hasil penyatuan 4 Lane perasan (256-Bit = 32 Byte) menjadi untaian 64 karakter heksadesimal resmi berstandar NIST.
        </p>
      </div>

      {/* GRAND DIGEST DISPLAY CARD */}
      <div className="w-full bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative overflow-hidden mb-6">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Label & Badges */}
          <div className="flex items-center justify-between w-full mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                256-Bit Digest Terkristalisasi
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Input: "{inputText}" ({inputText.length} Byte)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold">
                Output: 64 Hex (32 Byte)
              </span>
            </div>
          </div>

          {/* THE 64-CHARACTER HEX HASH DISPLAY */}
          <div className="w-full p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner my-2 flex flex-col items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
              Nilai Hash Resmi SHA-3-256 (Pisahan 4 Lane @ 16 Hex)
            </span>
            
            <div className="font-mono font-black text-base sm:text-xl md:text-2xl tracking-wider break-all text-center leading-relaxed select-all">
              {laneSegments.map((lane) => (
                <span
                  key={lane.idx}
                  className={`${lane.colorText} transition-all duration-300 hover:brightness-125 mx-1 inline-block`}
                  title={`${lane.name} ${lane.pos}: ${lane.range}`}
                >
                  {lane.hex}
                </span>
              ))}
            </div>
          </div>

          {/* TOMBOL SALIN & METADATA */}
          <div className="flex items-center justify-between w-full mt-4 flex-wrap gap-3">
            {/* Legenda Warna 4 Lane */}
            <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
              {laneSegments.map((lane) => (
                <div key={lane.idx} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm bg-gradient-to-r ${lane.barColor}`} />
                  <span className="text-slate-300">{lane.name}</span>
                </div>
              ))}
            </div>

            {/* Tombol Salin Clipboard */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Salin Hash Hex</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 LANE DETAIL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full mb-6">
        {laneSegments.map((lane) => {
          // Format spasi per byte (tiap 2 hex)
          const formattedBytes = lane.hex.match(/.{1,2}/g)?.join(' ') || lane.hex;
          return (
            <div
              key={lane.idx}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-800">
                  {lane.name} <span className="text-slate-400 font-normal">{lane.pos}</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${lane.bgBadge}`}>
                  {lane.range}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-black text-slate-800 tracking-wider text-center break-all my-1.5">
                {formattedBytes}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>8 Byte × 8 Bit</span>
                <span className="font-bold text-slate-600">64 Bit</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DEMONSTRASI LIVE: EFEK AVALANCHE (AVALANCHE EFFECT) */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs sm:text-sm font-mono font-bold text-slate-900 uppercase">
            Uji Coba Efek Avalanche (Longsoran Kriptografi)
          </h4>
        </div>
        <p className="text-xs font-mono text-slate-600 mb-4">
          Coba ganti 1 huruf pada kolom uji di bawah. Perhatikan bagaimana perubahan 1 bit masukan menghasilkan output 256-bit yang berubah total secara acak (~50% bit flip)!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hash Asli */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">
              Input Asli: "{inputText}"
            </span>
            <span className="text-xs font-mono font-black text-slate-800 break-all select-all">
              {primaryHash}
            </span>
          </div>

          {/* Hash Uji Coba */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Input Pembanding:
              </span>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Ketik teks pembanding..."
                className="text-[11px] font-mono font-bold text-blue-600 border-b border-blue-400 bg-transparent px-1 focus:outline-none w-32 text-right"
              />
            </div>
            <span className="text-xs font-mono font-black text-blue-600 break-all select-all">
              {testHash}
            </span>
          </div>
        </div>

        {/* Skor Avalanche Meter */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-mono text-amber-900">
              Tingkat Perbedaan Bit: <strong>{avalancheStats.diffBits} / 256 Bit ({avalancheStats.percent}%)</strong>
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
            {avalancheStats.percent >= 40 && avalancheStats.percent <= 60 
              ? '✓ Efek Avalanche Sempurna (~50%)' 
              : 'Terdifusi Kuat'}
          </span>
        </div>
      </div>

      {/* 3 PILAR KEAMANAN KRIPTOGRAFI SHA-3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Lock className="w-4 h-4" />
            <h5 className="text-xs font-mono font-bold">Pre-Image Resistance</h5>
          </div>
          <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
            Mustahil menemukan input asli dari output 64-hex secara terbalik. Membutuhkan estimasi 2<sup>256</sup> kalkulasi bruteforce.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <h5 className="text-xs font-mono font-bold">Collision Resistance</h5>
          </div>
          <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
            Mustahil menemukan dua dokumen berbeda yang memiliki hash SHA-3 identik (kekuatan batas ulang tahun 2<sup>128</sup>).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Award className="w-4 h-4" />
            <h5 className="text-xs font-mono font-bold">FIPS 202 Validated</h5>
          </div>
          <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
            Algoritma resmi pemenang kompetisi NIST SHA-3 (Keccak) tahan terhadap serangan length-extension berkat konstruksi sponge.
          </p>
        </div>
      </div>

      {/* REKAPITULASI LENGKAP END-TO-END PIPELINE */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs flex flex-col">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
          Alur Lengkap Transformasi dari Input ke Hash Final
        </span>

        <div className="flex items-center justify-between text-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 min-w-[90px]">
            <span className="text-[9px] font-mono text-slate-400 block">Step 0-4</span>
            <span className="text-[11px] font-mono font-bold text-slate-700 block">Teks → Biner</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block shrink-0" />

          <div className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 min-w-[90px]">
            <span className="text-[9px] font-mono text-slate-400 block">Step 5-10</span>
            <span className="text-[11px] font-mono font-bold text-slate-700 block">Pad10*1 1088b</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block shrink-0" />

          <div className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 min-w-[90px]">
            <span className="text-[9px] font-mono text-slate-400 block">Step 11-14</span>
            <span className="text-[11px] font-mono font-bold text-slate-700 block">Injeksi 5×5</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block shrink-0" />

          <div className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 min-w-[90px]">
            <span className="text-[9px] font-mono text-slate-400 block">Step 15-17</span>
            <span className="text-[11px] font-mono font-bold text-slate-700 block">Kubus 24 Ronde</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block shrink-0" />

          <div className="flex-1 p-2 rounded-xl bg-emerald-50 border border-emerald-300 min-w-[90px]">
            <span className="text-[9px] font-mono text-emerald-600 block">Step 18-19</span>
            <span className="text-[11px] font-mono font-bold text-emerald-700 block">Squeeze 256b</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
