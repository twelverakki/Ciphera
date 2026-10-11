export function getCharRows(chars) {
  if (!chars || chars.length === 0) return [];
  if (chars.length <= 8) return [chars];
  if (chars.length <= 16) {
    const mid = Math.ceil(chars.length / 2);
    return [chars.slice(0, mid), chars.slice(mid)];
  }
  const chunks = [];
  for (let i = 0; i < chars.length; i += 8) {
    chunks.push(chars.slice(i, i + 8));
  }
  return chunks;
}

/**
 * Rencana Timing Terpadu Step 6:
 * Mengkoordinasikan secara presisi:
 * 1. Animasi Hex Merapat & Fade-out di Morfologi
 * 2. Animasi Balok Klon Terbang & Mendarat di Nampan
 * 3. Pergeseran Smooth Scroll Kamera Antar Baris Segmen
 * 4. Efek Suara (Sound FX: Potek, Whoosh, Landing Klop)
 */
export function getStep6TimingPlan(chars, speed = 1) {
  const charRows = getCharRows(chars);
  const safeSpeed = Math.max(0.1, speed);

  const mergeDuration = 0.35 / safeSpeed;   // durasi Hex 1 & Hex 2 merapat
  const charInterval = 0.18 / safeSpeed;    // jeda antar karakter di baris yang sama
  const flyDuration = 0.38 / safeSpeed;     // durasi terbang balok klon ke nampan
  const potekDuration = 0.10 / safeSpeed;   // jeda suara whoosh setelah potek
  const scrollDuration = 0.45 / safeSpeed;  // durasi smooth scroll kamera antar baris
  const postRowPause = 0.20 / safeSpeed;    // jeda santai setelah balok baris mendarat sebelum scroll

  let currentTime = 0.12 / safeSpeed; // jeda awal sebelum baris 0 bergerak
  const rowSchedules = [];
  const charTimings = {};

  charRows.forEach((row, rIdx) => {
    const rowStartTime = currentTime;
    const rowChars = [];

    row.forEach((c, colIdx) => {
      const mergeStartTime = rowStartTime + colIdx * charInterval;
      const flyStartTime = mergeStartTime + mergeDuration;
      const fadeStartTime = flyStartTime + 0.12 / safeSpeed;
      const potekTime = flyStartTime;
      const whooshTime = flyStartTime + potekDuration;
      const landTime = flyStartTime + flyDuration;

      const timing = {
        charIdx: c.idx,
        rowIdx: rIdx,
        colIdx,
        mergeStartTime,
        flyStartTime,
        fadeStartTime,
        landTime,
        potekTime,
        whooshTime
      };

      charTimings[c.idx] = timing;
      rowChars.push(timing);
    });

    const lastCharTiming = rowChars[rowChars.length - 1];
    const rowFinishTime = lastCharTiming ? lastCharTiming.landTime : rowStartTime;

    rowSchedules.push({
      rowIdx: rIdx,
      rowStartTime,
      rowFinishTime,
      scrollTriggerTime: rIdx === 0 ? 0 : rowFinishTime - rowStartTime // diisi di bawah
    });

    // Baris berikutnya mulai setelah baris saat ini mendarat + jeda santai + durasi scroll
    currentTime = rowFinishTime + postRowPause + scrollDuration;
  });

  // Hitung scrollTriggerTime yang tepat untuk setiap baris
  rowSchedules.forEach((schedule, rIdx) => {
    if (rIdx === 0) {
      schedule.scrollTriggerTime = 0;
    } else {
      // Mulai scroll tepat saat rowFinishTime baris sebelumnya + postRowPause
      const prevRow = rowSchedules[rIdx - 1];
      schedule.scrollTriggerTime = prevRow.rowFinishTime + postRowPause;
    }
  });

  return {
    charRows,
    rowSchedules,
    charTimings,
    mergeDuration,
    flyDuration,
    totalDuration: currentTime
  };
}
