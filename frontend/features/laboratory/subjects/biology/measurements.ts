export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function punnett(
  dihybrid: boolean,
  testCross: boolean,
  seed: number,
  n = 160,
) {
  const random = seeded(seed);
  const counts = Array(dihybrid ? 4 : 2).fill(0) as number[];
  for (let i = 0; i < n; i++) {
    const dominant = random() < (testCross ? 0.5 : 0.75);
    const second = !dihybrid || random() < (testCross ? 0.5 : 0.75);
    counts[
      dihybrid ? (dominant ? 0 : 2) + (second ? 0 : 1) : dominant ? 0 : 1
    ]++;
  }
  return counts;
}
