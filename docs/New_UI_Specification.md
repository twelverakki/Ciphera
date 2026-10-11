# 🎨 Spesifikasi Rancangan UI Baru: SHA-3 (Keccak) Interactive Presentation Deck

*Dokumen ini merupakan hasil kesepakatan final perancangan UI/UX berbasis sesi wawancara mendalam (/grill-me).*

---

## 1. 🌟 Visi & Konsep Desain Utama
- **Gaya Desain:** **Light Studio / Paper Academic**
  Tampilan bersih, cerah, rapi, dan elegan layaknya website laboratorium riset interaktif modern (MIT / Apple Keynote / Stripe Paper style).
- **Format Layar:** **Slide Presentation Deck (100% Immersive Cinema)**
  Layar difokuskan sepenuhnya pada satu kartu presentasi utama di tengah tanpa ada header bar yang mengganggu.
- **Target Audiens:** Teman awam dan dosen/penilai. Pengalaman menonton seperti *interactive masterclass slide*.

---

## 2. 🎨 Skema Warna & Tipografi

### A. Palet Warna (Light Academic Palette)
- **Latar Belakang Layar:** `#f8fafc` (Alabaster / Off-white bersih) dengan pola grid titik-titik mikro halus (*subtle academic dot grid*).
- **Kartu Presentasi Utama:** `#ffffff` (Putih murni dengan soft diffused shadow `0 20px 50px rgba(0,0,0,0.06)` dan border lembut `border-slate-200`).
- **Teks Utama (Tipografi):** `#0f172a` (Charcoal gelap dengan kontras keterbacaan tinggi).
- **Aksen 1 (Data & Bit):** `#2563eb` (Royal Research Blue) & `#0284c7` (Sky).
- **Aksen 2 (Padding & Peringatan):** `#d97706` (Warm Amber).
- **Aksen 3 (Oven Riak Keccak-f):** `#7c3aed` (Deep Violet) & `#059669` (Emerald).
- **Aksen 4 (Hasil Roti / Verifikasi):** `#059669` (Emerald Green).

### B. Tipografi
- **Font Judul & Narasi:** `Inter` / `Plus Jakarta Sans` / `Rajdhani` (Sangat bersih dan mudah dibaca).
- **Font Kode / Bit / Hex:** `JetBrains Mono` (Monospace presisi untuk data biner dan 64 hex hash).

---

## 3. 📐 Tata Letak & Anatomi Komponen (Deck Architecture)

```
+-------------------------------------------------------------------------+
|                                                                         |
|                     [ KARTU SLIDE PRESENTASI UTAMA ]                    |
|  +-------------------------------------------------------------------+  |
|  | [Tag Nomor Slide: 04 / 31]                  [Judul Akademis]      |  |
|  |                                                                   |  |
|  |                   PANGGUNG VISUALISASI UTAMA                      |  |
|  |         (Objek data fisik bertransformasi secara fluid)           |  |
|  |                                                                   |  |
|  |   +-----------------------------------------------------------+   |  |
|  |   | 💡 FLOATING CAPTION ANALOGI AWAM                          |   |  |
|  |   | "Isi kardus kita tuangkan ke spons..."                    |   |  |
|  |   +-----------------------------------------------------------+   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
| [< Prev]     [ SLIDE THUMBNAIL STRIP (KEYNOTE STYLE 1-31) ]     [Next >]|
|              [||] Play/Pause Slideshow     [Vol] Audio                  |
+-------------------------------------------------------------------------+
```

### Rincian Komponen:
1. **Slide-Integrated Input (Slide #1):**
   - Tidak ada header tetap di atas. Kolom input teks berukuran besar dan elegan diletakkan langsung di **Slide #1** sebagai bahan mentah.
2. **Kartu Slide Utama (Full Visual + Floating Caption):**
   - Mengambil ~80% area pandang tengah layar.
   - Area visual sangat lapang dan fokus.
   - Narasi analogi ramah awam tampil sebagai *floating caption* di bagian bawah kartu dengan gaya kartu kutipan modern.
3. **Slide Thumbnail Strip (Keynote / PowerPoint Style):**
   - Berada di bawah kartu slide utama.
   - Menampilkan deretan 31 kartu kecil (thumbnail) yang bisa di-scroll dan diklik langsung untuk melompat ke slide mana pun.
   - Tombol panah besar `[< Prev]` dan `[Next >]` di samping untuk berpindah slide santai.
   - Kontrol Play/Pause slideshow otomatis dan toggle suara.
   - Mendukung navigasi tombol keyboard: Panah Kiri (`ArrowLeft`), Panah Kanan (`ArrowRight`), dan `Space`.
4. **Spotlight Final Digest (Slide #31):**
   - Output hash final 64-karakter disajikan secara megah di slide terakhir (Slide #31) lengkap dengan tombol salin dan segel sertifikasi integritas.

---

## 4. 🎬 Metamorfosis 31 Slide Bersambung
1. **Slide 1:** Teks Input Muncul (Input langsung di slide).
2. **Slide 2:** Ekstraksi Biner (Stretching teks & akar bit biner menjulur ke bawah).
3. **Slide 3:** Portal Hex & Kotak Padding 1088-bit padat.
4. **Slide 4:** Penuangan ke Spons 5x5 (17 Bitrate menyerap, 8 Capacity tersegel).
5. **Slide 5–28:** Oven Pengadukan 24 Ronde (**Efek Riak Gelombang Air/Energi** memancar dari pusat, tanpa putaran memusingkan).
6. **Slide 29:** Pemerasan Spons (Tuas hidrolik memeras 4 aliran cairan 64-bit ke corong kaca).
7. **Slide 30:** Perakitan Kapsul Hex (Cairan membeku jadi 64 kapsul padat).
8. **Slide 31:** Spotlight Hasil Roti (Plat permanen 64 karakter hex SHA3-256).
