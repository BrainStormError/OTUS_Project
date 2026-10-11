export type AvatarTone = {
  hue: number;
  saturation: number;
  lightness: number;
};

export type AvatarSpot = AvatarTone & {
  cx: number;
  cy: number;
  radius: number;
};

export type AvatarParams = {
  base: AvatarTone;
  spots: [AvatarSpot, AvatarSpot];
};

// Integer rolling hash (FNV-1a) so the same seed always maps to the same
// integer on every engine; no floating point is involved in the seed.
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 0x01000193);
  }
  return hash >>> 0;
}

// mulberry32: a tiny deterministic PRNG built on Math.imul and shifts.
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

// Derives the blob's base tone and two spot geometries from the seed with
// integer-only math, so a given tag always yields the identical avatar.
export function avatarParams(seed: string): AvatarParams {
  const random = createRandom(hashSeed(seed));
  const baseHue = between(random, 0, 359);
  const base: AvatarTone = {
    hue: baseHue,
    saturation: between(random, 44, 60),
    lightness: between(random, 60, 74),
  };
  const spots = [0, 1].map((index): AvatarSpot => {
    const hue = (baseHue + between(random, 60, 180) + index * between(random, 90, 150)) % 360;
    return {
      hue,
      saturation: between(random, 52, 72),
      lightness: between(random, 56, 72),
      cx: between(random, 10, 54),
      cy: between(random, 10, 54),
      radius: between(random, 18, 34),
    };
  }) as [AvatarSpot, AvatarSpot];
  return { base, spots };
}
