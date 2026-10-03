/** Small deterministic PRNG for repeatable tests. */
export function rng(seed: number) {
  let x = seed || 1
  return () => ((x ^= x << 13), (x ^= x >>> 17), (x ^= x << 5), (x >>> 0) / 4294967296)
}
