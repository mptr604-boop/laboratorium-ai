// Statystyki liczy kod, nie AI. Model dostaje gotowe fakty i na ich podstawie robi hipotezy.
// Wejście: statusy od najstarszego do najnowszego, np. ['OK','DEVICE_FAULT','OK'].
export function errorStats(statuses) {
  const total = statuses.length;
  const faultIndexes = statuses.flatMap((s, i) => (s === 'OK' ? [] : [i]));
  const faults = faultIndexes.length;

  let currentStreak = 0;
  for (let i = total - 1; i >= 0 && statuses[i] !== 'OK'; i--) currentStreak++;

  // Odstęp 1 to seria kolejnych błędów, a nie cykl, więc go pomijamy.
  // Stały odstęp między błędami (np. co trzeci pomiar) sugeruje przyczynę cykliczną: procedurę lub operatora.
  const gaps = faultIndexes.slice(1).map((v, i) => v - faultIndexes[i]);
  const periodic = gaps.length >= 3 && gaps[0] >= 2 && gaps.every(g => g === gaps[0]) ? gaps[0] : null;

  return {
    total,
    faults,
    faultRate: total === 0 ? 0 : Number((faults / total).toFixed(3)),
    currentStreak,
    periodEvery: periodic,
    enoughData: total >= 10,
  };
}
