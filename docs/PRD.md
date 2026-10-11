# 01_Product_Requirements.md (Master Blueprint)

## 1. Project Overview

We are building a highly interactive, 3D web-based visualization of the SHA-3 (Keccak) cryptographic hashing algorithm. The primary goal is to educate and visually demonstrate the "Sponge Construction" mechanism of SHA-3 through an elegant, network-tracking style animation.

Aplikasi ini tidak ditujukan untuk kalkulasi kriptografi skala produksi, melainkan sebuah _visualizer_ interaktif di mana _user_ dapat melihat secara _real-time_ bagaimana sebuah teks input diserap (absorbed), diacak dalam matriks 3D (scrambled), dan diekstrak menjadi output (squeezed).

## 2. Technology Stack

Untuk mencapai visualisasi yang _smooth_ dan performa yang optimal, we strictly mandate the following tech stack:

- **Frontend Framework:** React.js (using Functional Components and Hooks).
- **3D Engine:** React Three Fiber (`@react-three/fiber`) and Drei (`@react-three/drei`).
- **2D UI & Layout:** Tailwind CSS for rapid, modern UI styling.
- **Audio Engine:** `use-sound` (or Howler.js) for handling concurrent, lag-free sound effects synced with visual states.
- **Micro-Interactions (2D):** Framer Motion for smooth state transitions on the HTML elements outside the 3D canvas.

## 3. Art Direction & UI/UX Principles

Tema utama dari aplikasi ini adalah "Elegant Cyberpunk & Enterprise Data Tracking". Visualnya harus terasa eksklusif dan futuristik.

- **Color Palette:** Deep space backgrounds (dark slate/black). Elemen aktif menggunakan _glowing neon accents_ (seperti Cyan, Emerald Green, atau Magenta).
- **3D Elements:** The Keccak state will be represented as a 3D wireframe cube (a 5x5 grid of nodes). Use glowing lines, pulsing points, and glass-like transparency for the 3D materials.
- **Camera Angle:** Gunakan _isometric perspective_ atau _slow-orbiting camera_ menggunakan `OrbitControls` agar _user_ bisa melihat keseluruhan proses pengolahan data dari berbagai sudut.
- **Audio-Visual Synergy:** This is an immersive cinematic experience. Setiap transisi state utama harus didampingi oleh sci-fi/cyberpunk sound effects (digital blips, hums, energy charges) yang sinkron sempurna dengan animasi visual.
- **Typography:** Clean, monospace fonts for data streams and hex outputs to emphasize the technical nature of the app.

## 4. Core System Flow (The Sponge Concept)

The AI agent must architect the logic to visually represent these three distinct phases:

1.  **The Absorb Phase:** Teks dari input user dikonversi menjadi representasi biner/hex, lalu divisualisasikan sebagai partikel data yang mengalir masuk ke dalam 3D matrix.
2.  **The Core Scrambler (Keccak-f Permutations):** Bagian dalam _3D state matrix_ harus bereaksi. Render simulasi visual pertukaran posisi node (Theta, Rho, Pi) dan perubahan warna node (Chi) untuk merepresentasikan pengacakan data yang non-linear.
3.  **The Squeeze Phase:** Setelah simulasi _scrambling_ selesai, aliran energi/data menembak keluar dari node matriks 3D, menyatu dalam sebuah jalur _network_, dan berubah bentuk menjadi final SHA-3 hash output di antarmuka 2D.

## 5. Development Milestones & Instructions for AI

This project is divided into modular steps. Do not attempt to build everything at once.

- **Step 1:** Establish the Tailwind CSS 2D layout and React state management first.
- **Step 2:** Build the static 5x5 3D grid in React Three Fiber.
- **Step 3:** Implement the data flow animation logic inside the canvas.
  Follow the upcoming supplementary instruction files for detailed technical implementation of each step.
