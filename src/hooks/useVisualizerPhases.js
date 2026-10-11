import { useState, useEffect } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { getStep6TimingPlan } from '../utils/segmentTiming';

export function useVisualizerPhases({
  currentStep,
  stepDirection,
  speed,
  isMuted,
  chars,
  paddingRules,
  containerSlots,
  slotTimings
}) {
  // Step 11:
  // Phase 0: Nampan hex bergeser hilang ke atas (fade out), Wadah 1088 berdiri sendiri
  // Phase 1: Wadah membesar simetris & balok ke 44px (sedikit lebih kompak)
  // Phase 2: Muncul 2 Nampan Block Lane (Nampan Atas terisi L1..L17, Nampan Bawah kosongan)
  const [step11Phase, setStep11Phase] = useState(0); 

  // Step 12: Scanning 17 block lane dari nampan atas menembus kolom wadah 1088 ke nampan bawah (1 per 1)
  // currentScanningLane: index 0..16
  const [currentScanningLane, setCurrentScanningLane] = useState(-1);


  // Suara Sinkron Step 6: Penyatuan 2 Hex & Clone Data ke Nampan (Sinkron Segmented 1:1)
  useEffect(() => {
    if (currentStep === 6 && !isMuted && stepDirection === 'forward') {
      const timers = [];
      const plan = getStep6TimingPlan(chars, speed);

      const tSnap = setTimeout(() => {
        soundEngine.playClick();
      }, (0.08 / speed) * 1000);
      timers.push(tSnap);

      chars.forEach((c) => {
        const tInfo = plan.charTimings[c.idx];
        if (!tInfo) return;

        const t1 = setTimeout(() => soundEngine.playClonePotek(), tInfo.potekTime * 1000);
        const t2 = setTimeout(() => soundEngine.playWhooshThin(), tInfo.whooshTime * 1000);
        const t3 = setTimeout(() => soundEngine.playLandingKlop(), tInfo.landTime * 1000);

        timers.push(t1, t2, t3);
      });

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    }
  }, [currentStep, speed, isMuted, chars, stepDirection]);

  // Suara Sinkron Step 7: Audit Kapasitas & Node Hex Blip
  useEffect(() => {
    if (currentStep === 7 && !isMuted && stepDirection === 'forward') {
      soundEngine.playTypingBlip();
    }
  }, [currentStep, isMuted, stepDirection]);

  // Suara Sinkron Step 8: Formulasi Aturan Padding (Whoosh Elegan)
  useEffect(() => {
    if (currentStep === 8 && !isMuted && stepDirection === 'forward') {
      const timer = setTimeout(() => {
        soundEngine.playWhooshThin();
      }, (0.15 / speed) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isMuted, stepDirection, speed]);

  // Suara Sinkron Step 9 (Sebelumnya Step 8): Penyatuan 2 Hex Aturan & Clone ke Nampan
  useEffect(() => {
    if (currentStep === 9 && !isMuted && stepDirection === 'forward') {
      const timers = [];
      const mergeDuration = 0.38 / speed;
      const interval = 0.16 / speed;
      const potekDuration = 0.12 / speed;
      const flyDuration = 0.28 / speed;

      const tSnap = setTimeout(() => {
        soundEngine.playClick();
      }, (0.2 / speed) * 1000);
      timers.push(tSnap);

      paddingRules.forEach((rule, idx) => {
        const startTime = (mergeDuration + (idx * interval)) * 1000;
        const whooshTime = startTime + (potekDuration * 1000);
        const landTime = startTime + ((potekDuration + flyDuration) * 1000);

        const t1 = setTimeout(() => soundEngine.playClonePotek(), startTime);
        const t2 = setTimeout(() => soundEngine.playWhooshThin(), whooshTime);
        const t3 = setTimeout(() => soundEngine.playLandingKlop(), landTime);

        timers.push(t1, t2, t3);
      });

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    }
  }, [currentStep, speed, isMuted, paddingRules, stepDirection]);

  // Suara Sinkron Step 10: Alokasi Wadah 1088 (Snap Landing Grid)
  useEffect(() => {
    if (currentStep === 10 && !isMuted && stepDirection === 'forward') {
      const timer = setTimeout(() => {
        soundEngine.playLandingKlop();
      }, (0.2 / speed) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isMuted, stepDirection, speed]);

  // Suara Sinkron Step 11 (Sebelumnya Step 10): Clone Nampan -> Wadah
  useEffect(() => {
    if (currentStep === 11 && !isMuted && stepDirection === 'forward') {
      const timers = [];
      const potekDuration = 0.12 / speed;
      const flyDuration = 0.28 / speed;

      containerSlots.forEach((slot) => {
        const baseTime = slotTimings[slot.idx] ?? (slot.idx * 0.042);
        const startTime = (baseTime / speed) * 1000;
        const whooshTime = startTime + (potekDuration * 1000);
        const landTime = startTime + ((potekDuration + flyDuration) * 1000);

        const t1 = setTimeout(() => soundEngine.playClonePotek(), startTime);
        const t2 = setTimeout(() => soundEngine.playWhooshThin(), whooshTime);
        const t3 = setTimeout(() => soundEngine.playLandingKlop(), landTime);

        timers.push(t1, t2, t3);
      });

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    }
  }, [currentStep, speed, isMuted, containerSlots, slotTimings, stepDirection]);

  // Sekuensial Step 12 (Sebelumnya Step 11):
  // Phase 0: Nampan hex fade out
  // Phase 1: Wadah membesar simetris
  // Phase 2: Muncul 2 Nampan Block Lane (Atas & Bawah)
  useEffect(() => {
    if (currentStep === 12) {
      if (stepDirection === 'forward') {
        setStep11Phase(0);

        const t1 = setTimeout(() => {
          setStep11Phase(1);
          if (!isMuted) soundEngine.playWhooshThin();
        }, (0.45 / speed) * 1000);

        const t2 = setTimeout(() => {
          setStep11Phase(2);
          if (!isMuted) soundEngine.playClick();
        }, (1.05 / speed) * 1000);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      } else {
        setStep11Phase(2);
      }
    } else if (currentStep > 12) {
      setStep11Phase(2);
    } else {
      setStep11Phase(0);
    }
  }, [currentStep, stepDirection, speed, isMuted]);

  // Sekuensial Step 13 (Sebelumnya Step 12): Animasi scanning 1 per 1 dari nampan atas mendarat di nampan bawah (17 lanes)
  useEffect(() => {
    if (currentStep === 13) {
      if (stepDirection === 'forward') {
        setCurrentScanningLane(0);
        const timers = [];
        const laneInterval = 0.60 / speed; // Interval antar lane
        const scanDuration = 0.54 / speed; // Durasi transit & fill per lane

        for (let i = 0; i < 17; i++) {
          // Awal meluncur dari nampan atas
          const tStart = setTimeout(() => {
            setCurrentScanningLane(i);
            if (!isMuted) soundEngine.playWhooshThin();
          }, (i * laneInterval) * 1000);
          timers.push(tStart);

          // Tepat saat mendarat di nampan bawah
          const tLand = setTimeout(() => {
            if (!isMuted) soundEngine.playLandingKlop();
          }, (i * laneInterval + scanDuration) * 1000);
          timers.push(tLand);
        }

        // Selesai semua scanning:
        const tEnd = setTimeout(() => {
          setCurrentScanningLane(17);
        }, (17 * laneInterval) * 1000);
        timers.push(tEnd);

        return () => {
          timers.forEach((t) => clearTimeout(t));
        };
      } else {
        setCurrentScanningLane(17);
      }
    } else if (currentStep > 13) {
      setCurrentScanningLane(17);
    } else {
      setCurrentScanningLane(-1);
    }
  }, [currentStep, stepDirection, speed, isMuted]);

  // Suara Sinkron Step 14: Inisialisasi Matriks State Keccak 5×5 (Snap Landing)
  useEffect(() => {
    if (currentStep === 14 && !isMuted && stepDirection === 'forward') {
      const timer = setTimeout(() => {
        soundEngine.playLandingKlop();
      }, (0.2 / speed) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isMuted, stepDirection, speed]);

  // Sekuensial Step 15 (Sebelumnya Step 14): Injeksi Balok Lane dari Nampan ke Wadah Keccak 5x5
  const [currentAbsorbedLane, setCurrentAbsorbedLane] = useState(-1);
  const [isAbsorptionComplete, setIsAbsorptionComplete] = useState(false);

  useEffect(() => {
    if (currentStep === 15) {
      if (stepDirection === 'forward') {
        setCurrentAbsorbedLane(0);
        setIsAbsorptionComplete(false);
        const timers = [];
        const interval = 0.16 / speed;
        const flyDuration = 0.28 / speed;

        for (let i = 0; i < 17; i++) {
          const tStart = setTimeout(() => {
            setCurrentAbsorbedLane(i);
            if (!isMuted) soundEngine.playWhooshThin();
          }, (i * interval) * 1000);
          timers.push(tStart);

          const tLand = setTimeout(() => {
            if (!isMuted) soundEngine.playLandingKlop();
          }, (i * interval + flyDuration) * 1000);
          timers.push(tLand);
        }

        const tDone = setTimeout(() => {
          setCurrentAbsorbedLane(17);
        }, (17 * interval) * 1000);
        timers.push(tDone);

        // Setelah mendarat semua, samarkan nampan dan aktifkan efek suara absorbsi energi
        const tFadeTray = setTimeout(() => {
          setIsAbsorptionComplete(true);
          if (!isMuted) soundEngine.playAbsorbCharge();
        }, (17 * interval + 0.35 / speed) * 1000);
        timers.push(tFadeTray);

        return () => {
          timers.forEach((t) => clearTimeout(t));
        };
      } else {
        setCurrentAbsorbedLane(17);
        setIsAbsorptionComplete(true);
      }
    } else if (currentStep > 15) {
      setCurrentAbsorbedLane(17);
      setIsAbsorptionComplete(true);
    } else {
      setCurrentAbsorbedLane(-1);
      setIsAbsorptionComplete(false);
    }
  }, [currentStep, stepDirection, speed, isMuted]);

  return {
    step11Phase,
    currentScanningLane,
    currentAbsorbedLane,
    isAbsorptionComplete
  };
}
