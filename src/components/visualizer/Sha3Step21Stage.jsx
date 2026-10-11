import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, CheckCircle2, ArrowRight, RotateCcw, PenLine } from 'lucide-react';
import { sha3_256 } from 'js-sha3';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../audio/soundEngine';

/**
 * Step 21: Hasil Akhir Hashing SHA-3-256 & Uji Efek Avalanche
 * - Menampilkan "Sukses melakukan hashing '[inputText]'"
 * - Deretan 64 hex karakter (256-bit) sebagai center attention dengan font besar,
 *   garis bawah, dan tombol copy.
 * - 2 variasi input modifikasi di bawahnya lengkap dengan hasil hash & persentase kemiripan bit.
 * - 2 Tombol aksi navigasi: "Input Baru" & "Kembali ke Step 1"
 */
export function Sha3Step21Stage({ 
  inputText = '', 
  isMuted, 
  onNewInput, 
  onBackToStep1 
}) {
  const [copied, setCopied] = useState(false);
  const activeInput = inputText ?? '';

  // Selebrasi Klimaks: Digital Lock Sound & Confetti saat tiba di Step 22
  useEffect(() => {
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.65 }
      });
    } catch {
      // safe fallback
    }

    if (!isMuted) {
      const timer = setTimeout(() => {
        soundEngine.playDigitalLock();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isMuted]);

  // 1. Hash Utama dari Input Asli
  const primaryHash = useMemo(() => {
    try {
      return sha3_256(activeInput);
    } catch {
      return sha3_256('');
    }
  }, [activeInput]);

  // 2. Siapkan 2 Modifikasi Input Dinamis (Uji Avalanche)
  const variations = useMemo(() => {
    // Fungsi hitung persentase kemiripan bit (Hamming Similarity)
    const computeSimilarity = (hashA, hashB) => {
      if (!hashA || !hashB || hashA.length !== 64 || hashB.length !== 64) {
        return 50;
      }
      let matchingBits = 0;
      for (let i = 0; i < 64; i++) {
        const n1 = parseInt(hashA[i], 16);
        const n2 = parseInt(hashB[i], 16);
        const xor = n1 ^ n2;
        const diffBits = (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
        matchingBits += (4 - diffBits);
      }
      return Math.round((matchingBits / 256) * 100);
    };

    if (activeInput.length === 0) {
      const var1 = 'a';
      const var2 = ' ';
      const hash1 = sha3_256(var1);
      const hash2 = sha3_256(var2);
      return [
        {
          input: 'a (Input 1 Karakter)',
          hash: hash1,
          similarity: computeSimilarity(primaryHash, hash1)
        },
        {
          input: '␣ (Spasi Tunggal)',
          hash: hash2,
          similarity: computeSimilarity(primaryHash, hash2)
        }
      ];
    }

    // Variasi 1: Balik huruf pertama (Case toggle)
    let var1 = activeInput;
    if (activeInput.length > 0) {
      const c0 = activeInput[0];
      const toggled0 = c0 === c0.toUpperCase() ? c0.toLowerCase() : c0.toUpperCase();
      var1 = toggled0 + activeInput.slice(1);
    }
    // Jika tidak berubah (misal angka), ubah karakter terakhir
    if (var1 === activeInput) {
      var1 = activeInput + '1';
    }

    // Variasi 2: Balik huruf terakhir (Case toggle)
    let var2 = activeInput;
    if (activeInput.length > 1) {
      const lastIdx = activeInput.length - 1;
      const cLast = activeInput[lastIdx];
      const toggledLast = cLast === cLast.toUpperCase() ? cLast.toLowerCase() : cLast.toUpperCase();
      var2 = activeInput.slice(0, lastIdx) + toggledLast;
    } else {
      var2 = activeInput + '!';
    }
    if (var2 === activeInput || var2 === var1) {
      var2 = activeInput + '_test';
    }

    const hash1 = sha3_256(var1);
    const hash2 = sha3_256(var2);

    return [
      {
        input: var1,
        hash: hash1,
        similarity: computeSimilarity(primaryHash, hash1)
      },
      {
        input: var2,
        hash: hash2,
        similarity: computeSimilarity(primaryHash, hash2)
      }
    ];
  }, [activeInput, primaryHash]);

  const handleCopy = () => {
    navigator.clipboard.writeText(primaryHash);
    setCopied(true);
    if (!isMuted) soundEngine.playClick();
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-6 select-none">
      
      {/* 1. BADGE SUKSES MELAKUKAN HASHING */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs mb-6"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <h2 className="text-xs sm:text-sm font-mono font-bold tracking-wide text-emerald-950">
          {activeInput.length === 0 ? 'Sukses melakukan hashing "" (Pesan Kosong / 0-Bit)' : `Sukses melakukan hashing "${activeInput}"`}
        </h2>
      </motion.div>

      {/* 2. CENTER ATTENTION: DERETAN 64 HEX (256-BIT) DENGAN FONT SIZE BESAR & GARIS BAWAH */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-3xl flex flex-col items-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
          {/* Teks Hash 64 Digit Hex */}
          <span className="font-mono font-black text-xl sm:text-2xl md:text-3xl text-slate-900 tracking-wider text-center break-all select-all leading-tight">
            {primaryHash}
          </span>

          {/* Tombol Copy */}
          <button
            onClick={handleCopy}
            className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Salin 64 Karakter Hash Resmi"
          >
            {copied ? (
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            )}
          </button>
        </div>

        {/* Garis Bawah Panjang Center Attention */}
        <div className="w-full h-0.5 bg-slate-300 mt-4 sm:mt-5" />
      </motion.div>

      {/* 3. DUA MODIFIKASI INPUTAN DI BAWAHNYA (UJI EFEK AVALANCHE) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="w-full max-w-3xl flex flex-col gap-3.5"
      >
        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest text-left">
          Uji Efek Avalanche (Perubahan 1 Karakter):
        </span>

        {variations.map((item, idx) => (
          <div
            key={`var-${idx}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs font-mono text-xs"
          >
            {/* Input Modifikasi */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-black text-slate-800 text-sm px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                {item.input}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Hasil Hash Modifikasi (Truncated atau Mono Rapih) */}
            <span className="font-mono text-slate-600 text-[11px] sm:text-xs truncate max-w-xs sm:max-w-md">
              {item.hash}
            </span>

            {/* Persentase Kemiripan */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <span className="text-[10px] text-slate-400 font-semibold">Kemiripan:</span>
              <span className={`font-black text-xs px-2 py-0.5 rounded-lg border ${
                item.similarity <= 55 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {item.similarity}%
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* 4. TOMBOL AKSI AKHIR: INPUT BARU & KEMBALI KE STEP 1 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
        className="flex items-center justify-center gap-3 sm:gap-4 mt-8 w-full"
      >
        <button
          onClick={onNewInput}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs font-mono text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer hover:border-slate-400"
          title="Ketik kata baru di Step 0"
        >
          <PenLine className="w-4 h-4 text-blue-600" />
          <span>Input Baru</span>
        </button>

        <button
          onClick={onBackToStep1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-mono text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer"
          title="Ulangi visualisasi dari Step 1"
        >
          <RotateCcw className="w-4 h-4 text-white" />
          <span>Kembali ke Step 1</span>
        </button>
      </motion.div>

    </div>
  );
}
