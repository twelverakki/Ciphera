# 🛡️ SHA-3 (Keccak) 3D Sponge Visualizer

Aplikasi visualisasi 3D interaktif untuk mendemonstrasikan mekanisme **Sponge Construction** pada fungsi hash kriptografis **SHA-3 (Keccak)**. Proyek ini dibangun untuk memenuhi **Tugas Mid Semester - Keamanan Sistem Informasi**.

---

## 🌟 Fitur Utama

1. **Visualisasi Sponge Construction 3D:**
   - **Absorb Phase:** Partikel data (ASCII → HEX → Binary) mengalir dan di-XOR ke node **Bitrate ($r$)** dengan jejak cahaya (*Trail*).
   - **Scramble Phase (Keccak-f):** Simulasi permutasi 24 ronde:
     - $\theta$ (*Theta*) & $\rho$ (*Rho*): Pertukaran posisi node secara dinamis menggunakan *smooth interpolation* (`lerp`).
     - $\chi$ (*Chi*): Efek perubahan warna node (*Cyan* ↔ *Magenta*) melambangkan transformasi non-linear.
     - $\pi$ (*Pi*) & $\iota$ (*Iota*): Jalur koneksi jaringan (*dynamic connection lines*) yang saling berdenyut aktif.
   - **Squeeze Phase:** Lonjakan intensitas cahaya node dan pancaran berkas sinar berenergi tinggi (*energy beam*) menembak ke depan menuju panel output, membuka string hash SHA-3 final.

2. **Diferensiasi Node Matriks 5×5 (1600-Bit State):**
   - **Bitrate ($r = 1088$ bit):** 17 node inti/tengah yang aktif menyerap data input.
   - **Capacity ($c = 512$ bit):** 8 node sudut/terluar yang menjaga keamanan dan kebal dari *length-extension attack*.

3. **Audio-Visual Synergy (Procedural Sci-Fi Sound Engine):**
   - Suara sintetis digital tanpa ketergantungan file MP3 eksternal (menggunakan Web Audio API):
     - *Digital blips* saat mengetik input teks.
     - *Rising energy charge / whoosh* saat fase Absorb.
     - *Low-frequency quantum hum & glitch ticks* saat fase Scramble.
     - *Digital lock & bass chime* saat fase Squeeze selesai.
   - Tombol toggle Mute/Unmute audio di bar navigasi atas.

4. **Kontrol Interaktif & Mode Presentasi:**
   - **Start Visualizer:** Menjalankan alur sponge secara otomatis dari awal hingga akhir.
   - **Next Step:** Menjalankan fase secara bertahap (*step-by-step*) untuk kebutuhan presentasi kuliah.
   - **3D Camera Orbit:** Pengguna dapat memutar, memperbesar (*zoom*), dan menggeser matriks 3D dengan mouse.
   - **Modal Konsep Teori:** Penjelasan teoritis lengkap mengenai SHA-3, NIST standard, dan 5 operasi permutasi Keccak-f.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite
- **3D Engine:** Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **2D Styling & HUD:** Tailwind CSS (Cyberpunk dark theme, glassmorphism, neon glows)
- **Animasi 2D:** Framer Motion
- **Kriptografi:** `js-sha3` (SHA3-256 standard)
- **Audio:** Web Audio API Procedural Synthesizer

---

## 🚀 Cara Menjalankan

1. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
2. **Buka di Browser:**
   Akses `http://localhost:3000` (atau port yang tertera di terminal).

3. **Build untuk Produksi:**
   ```bash
   npm run build
   ```

---

## 📚 Struktur Proyek

```
├── docs/                               # Dokumen spesifikasi teknis
│   ├── PRD.md
│   ├── UI_and_Statemant_Management.md
│   ├── 3D_Core_Engine.md
│   └── Animation_DataFlow_and_Audio.md
├── src/
│   ├── audio/
│   │   └── soundEngine.js              # Synthesizer Web Audio API
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── KeccakScene.jsx         # Scene Three.js, Camera & Controls
│   │   │   ├── KeccakMatrix.jsx        # Grid 5x5 Keccak State & Permutasi
│   │   │   ├── KeccakNode.jsx          # Objek 3D Node (Bitrate vs Capacity)
│   │   │   ├── ConnectionLines.jsx     # Jalur energi antar node
│   │   │   ├── DataParticles.jsx       # Partikel data masuk (Absorb)
│   │   │   └── EnergyBeam.jsx          # Berkas sinar ekstraksi (Squeeze)
│   │   ├── Dashboard.jsx               # HUD 2D, panel input & bottom bar
│   │   └── EducationalModal.jsx        # Dialog teori edukasi kriptografi
│   ├── utils/
│   │   └── cryptoUtils.js              # Utilitas konversi Hex/Bin & SHA-3
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                       # Tema cyberpunk & glassmorphism
├── package.json
└── tailwind.config.js
```
