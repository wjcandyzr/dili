// 2D value noise + fBm (fractal brownian motion)
// Pure JS, no dependencies. Deterministic via seed.

function hash(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h / 4294967295) * 2 - 1; // [-1, 1]
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function valueNoise2D(x, y, seed = 1) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const v00 = hash(xi, yi, seed);
  const v10 = hash(xi + 1, yi, seed);
  const v01 = hash(xi, yi + 1, seed);
  const v11 = hash(xi + 1, yi + 1, seed);

  const u = smoothstep(xf);
  const v = smoothstep(yf);

  const x1 = v00 + (v10 - v00) * u;
  const x2 = v01 + (v11 - v01) * u;
  return x1 + (x2 - x1) * v;
}

export function fbm(x, y, {
  octaves = 5,
  lacunarity = 2.0,
  gain = 0.5,
  seed = 1,
  frequency = 1.0
} = {}) {
  let amp = 1;
  let freq = frequency;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2D(x * freq, y * freq, seed + i * 131);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm; // approximately [-1, 1]
}

// Ridge noise — yields sharper mountain ridges
export function ridge(x, y, opts = {}) {
  const n = fbm(x, y, opts);
  return 1 - Math.abs(n);
}

// Smooth clamp for plateaus
export function softClamp(v, lo, hi, softness = 0.1) {
  if (v < lo) return lo;
  if (v > hi) {
    const over = v - hi;
    return hi + softness * (1 - Math.exp(-over / softness));
  }
  return v;
}
