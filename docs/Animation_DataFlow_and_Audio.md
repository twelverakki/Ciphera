# 04_Animation_DataFlow_and_Audio.md (The Engine Logic & Sound Design)

## 1. Goal

This final phase brings the 3D matrix to life. The AI must connect the 2D React state (`processStage`) to trigger complex 3D animations inside the canvas and synchronize them with immersive sound effects.

## 2. Audio Setup & Sound Design (use-sound)

Integrasikan library `use-sound` untuk memutar SFX berdasarkan perubahan `processStage`. Gunakan _placeholder audio files_ (e.g., `/sounds/click.mp3`) with a distinct Sci-Fi/Cyberpunk theme:

- **Typing/Input:** Subtle, high-tech digital blips for every character typed.
- **Absorb Phase:** A rising "energy charge" or digital whoosh sound as data flies into the matrix.
- **Scramble Phase:** A continuous, low-frequency high-tech hum mixed with light mechanical "glitch" or "ticking" sounds simulating data processing.
- **Squeeze Phase:** A satisfying, heavy "digital lock" or "ding" sound when the final hash output appears on the UI.

## 3. Data Particles & The Absorb Phase

- When `processStage === 'ABSORBING'`:
- Generate small glowing 3D spheres (data packets) outside the Keccak matrix.
- Animate them flying rapidly into the center of the 5x5 grid (the Bitrate nodes).
- Use `@react-three/drei`'s `<Trail>` component or Framer Motion 3D to create glowing light trails behind the particles.

## 4. The Keccak Scrambler (Animation Logic)

- When `processStage === 'SCRAMBLING'`:
- **Color Shifting (Chi):** Make the nodes rapidly pulse and transition between colors (e.g., from Cyan to Magenta) to represent non-linear transformations.
- **Position Swapping (Theta/Rho):** Select random groups of nodes and animate them swapping positions along the X, Y, or Z axes. Use smooth interpolation (`lerp`) so the movement feels fluid, not snappy.
- **Network Pathways:** Draw thin, glowing connecting lines (`<Line>` from drei) between nodes that actively light up and fade out as data "moves" between them.

## 5. The Output & The Squeeze Phase

- When `processStage === 'SQUEEZING'`:
- Hentikan animasi _swapping_ secara perlahan.
- Make the active nodes glow exceptionally bright, then shoot a concentrated beam of light (a cylinder or fast-moving particle) towards the camera or the bottom of the screen.
- Trigger the UI state to reveal the `hashOutput` string in the 2D dashboard simultaneously with the "digital lock" sound effect.

## 6. Development Instructions for AI

1.  Implement `use-sound` and map the audio triggers to the React state effects.
2.  Build the particle generation logic for the Absorb phase.
3.  Implement the node manipulation logic (color pulses and position swapping) inside the `useFrame` loop for the Scramble phase.
4.  Ensure the visual timing perfectly matches the sound effects for maximum impact.
