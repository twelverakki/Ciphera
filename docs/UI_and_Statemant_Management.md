# 02_UI_and_State_Management.md (The 2D Dashboard & State)

## 1. Goal

Tujuan dari fase ini adalah membangun struktur UI 2D menggunakan Tailwind CSS dan mengatur React State yang akan mengontrol alur data. The 3D canvas will act as a child component that listens to these state changes.

## 2. Layout Architecture

The layout should feel like a high-tech dashboard. Bagi layar ke dalam beberapa zona utama:

- **Main Container:** Full screen (`h-screen w-screen`), dark background (`bg-slate-950` or `bg-black`), flexbox/grid layout, and hidden scrollbars.
- **Top/Sidebar Control Panel:** Area ini berisi text input field and animation controls (Play, Pause, Step). Gunakan glassmorphism effect (`backdrop-blur-md bg-white/10`) for the panels.
- **Center Stage:** A massive, empty `div` in the center where the `<Canvas>` from React Three Fiber will be injected in the next step.
- **Bottom Bar (Output Zone):** A dedicated section at the bottom to display the final SHA-3 hash output string. Make it visually prominent with a monospace font.

## 3. State Management (React Hooks)

Gunakan `useState` dan `useRef` di _parent component_ untuk melacak perjalanan data. The AI must implement the following core state variables:

- `inputText` (string): Stores the real-time user input.
- `hashOutput` (string): Stores the final SHA-3 result.
- `processStage` (string or enum): Tracks the current visual phase. Values should include: `'IDLE'`, `'ABSORBING'`, `'SCRAMBLING'`, and `'SQUEEZING'`.
- `isAnimating` (boolean): Controls whether the automatic 3D animation is currently running.
- `isMuted` (boolean): Controls global audio. Default to `false` (sound on), tapi pastikan user harus melakukan interaksi pertama (klik/ketik) sebelum browser mengizinkan audio diputar.

## 4. UI Components & Framer Motion

- **Input Field:** Create a sleek `<input>` tag. Setiap kali _user_ mengetik (onChange), the `processStage` should reset, and the system should prepare to visualize the new data.
- **Action Buttons:** "Hash Data" button to trigger the `processStage` progression.
- **Animations:** Use Framer Motion (`<motion.div>`) to animate the UI panels. For example, the Bottom Bar should smoothly slide up from the bottom only when `processStage === 'SQUEEZING'`.
- **Data Conversion Display (Optional but recommended):** Tampilkan konversi teks ke HEX secara _real-time_ di panel UI sebelum datanya "dikirim" ke kanvas 3D.
- **Audio Toggle Button:** Tambahkan sebuah tombol kecil dan elegan (icon speaker) di pojok UI untuk _toggle_ state `isMuted`.
- **Typing SFX:** On the Input Field component, trigger a subtle "digital typing/blip" sound effect via `use-sound` setiap kali event `onChange` terpanggil.

## 5. Development Instructions for AI

1.  Setup the main React component (`App.js` or `Dashboard.jsx`).
2.  Implement the Tailwind layout structure without the 3D elements (use a placeholder colored box for the 3D canvas area for now).
3.  Wire up the state variables to the input fields and buttons.
4.  Ensure Framer Motion transitions work smoothly on the 2D elements.
