# 03_3D_Core_Engine.md (The Static Keccak Matrix)

## 1. Goal

The objective of this phase is to initialize the React Three Fiber `<Canvas>` and render the static 3D representation of the SHA-3 (Keccak) internal state. Tidak ada animasi perpindahan data di tahap ini; we are purely building the physical 3D environment.

## 2. Canvas & Scene Setup

- **The Canvas:** Inject the `<Canvas>` component into the "Center Stage" container built in Step 2.
- **Camera:** Use a PerspectiveCamera positioned at an isometric angle (e.g., `position={[10, 10, 10]}`).
- **Controls:** Include `<OrbitControls>` from `@react-three/drei` so the user can rotate, pan, and zoom around the matrix freely. Set `enableDamping={true}` for smooth interactions.
- **Lighting:** Create a dark, moody cyberpunk atmosphere.
    - Use a dim `<ambientLight>` (low intensity, cool color like dark blue).
    - Add `<pointLight>` or `<spotLight>` to highlight the center of the matrix.

## 3. Building the 5x5 3D Matrix (The State Array)

SHA-3 operates on a 5x5 matrix of lanes. The AI must render this logically:

- Create a reusable `<Node />` component (a Sphere or a rounded Cube).
- Use nested loops or a predefined array to render a 5x5 grid on the X and Z axes.
- **Spacing:** Ensure there is adequate empty space between the nodes so network pathways (lines) can be added later.
- **The Core (Bitrate vs. Capacity):** Visually differentiate the nodes. For example, the outer nodes could represent the _capacity_ (dimmer, transparent, or wireframe), while the inner nodes represent the _bitrate_ (ready to absorb data).

## 4. Materials & Shaders

- Use `<meshStandardMaterial>` or `<meshPhysicalMaterial>`.
- Apply high `transmission`, `roughness: 0.1`, and `thickness` to create a glass-like aesthetic for the nodes.
- Enable `emissive` properties so the nodes appear to glow from within, utilizing the neon cyan/emerald color palette.

## 5. Development Instructions for AI

1.  Setup the `<Canvas>` inside the Dashboard layout.
2.  Implement lighting and `OrbitControls`.
3.  Write the logic to render the 5x5 grid of nodes symmetrically centered at `[0,0,0]`.
4.  Stop here and ensure the 3D grid renders flawlessly in the browser before moving to the animation phase.
