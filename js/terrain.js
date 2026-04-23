import * as THREE from 'three';
import { fbm } from './noise.js';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function sampleGradient(stops, t) {
  if (t <= stops[0].h) return hexToRgb(stops[0].color);
  if (t >= stops[stops.length - 1].h) return hexToRgb(stops[stops.length - 1].color);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.h && t <= b.h) {
      const u = (t - a.h) / (b.h - a.h);
      const ca = hexToRgb(a.color);
      const cb = hexToRgb(b.color);
      return {
        r: ca.r + (cb.r - ca.r) * u,
        g: ca.g + (cb.g - ca.g) * u,
        b: ca.b + (cb.b - ca.b) * u,
      };
    }
  }
  return hexToRgb(stops[0].color);
}

/**
 * config: {
 *   size: 100,
 *   segments: 200,
 *   heightFn: (x, z) => number,
 *   colorStops: [{ h: 0..1, color: '#rrggbb' }],
 *   heightRange: [min, max], // used to normalize for coloring
 *   water: { level, color } | null,
 *   flatShading: true,
 * }
 */
export function buildTerrain(config) {
  const {
    size = 100,
    segments = 280,
    heightFn,
    colorStops,
    heightRange,
    water = null,
    flatShading = false,
    extras = [],
    aoStrength = 0.35,
    microDetail = 0.18,       // amplitude of fine surface noise
    microFrequency = 0.35,    // spatial frequency of fine detail
    microSeed = 91,
  } = config;

  const group = new THREE.Group();

  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const posArr = pos.array;          // direct typed array access
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  let yMin = Infinity;
  let yMax = -Infinity;

  // Height + micro detail — write directly into typed array.
  for (let i = 0; i < count; i++) {
    const base = i * 3;
    const x = posArr[base];
    const z = posArr[base + 2];
    let y = heightFn(x, z);
    if (microDetail > 0) {
      y += fbm(x * microFrequency, z * microFrequency, {
        octaves: 3, gain: 0.5, seed: microSeed,
      }) * microDetail;
    }
    posArr[base + 1] = y;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }

  const [minH, maxH] = heightRange || [yMin, yMax];
  const range = maxH - minH || 1;

  // Precompute gradient lookup table for fast coloring (256 entries).
  const lutSize = 256;
  const lut = new Float32Array(lutSize * 3);
  for (let i = 0; i < lutSize; i++) {
    const t = i / (lutSize - 1);
    const c = sampleGradient(colorStops, t);
    lut[i * 3] = c.r;
    lut[i * 3 + 1] = c.g;
    lut[i * 3 + 2] = c.b;
  }

  // Ambient occlusion approximation: compare each vertex height to the
  // average of its 4 orthogonal neighbors. Crevices (below average) get darkened.
  const W = segments + 1;
  const cellSize = size / segments;
  for (let j = 0; j < W; j++) {
    for (let i = 0; i < W; i++) {
      const idx = j * W + i;
      const y = posArr[idx * 3 + 1];

      // 4-neighbor relative height average (cheaper than 8 neighbors)
      let sum = 0;
      let n = 0;
      if (i > 0)     { sum += posArr[(idx - 1) * 3 + 1]; n++; }
      if (i < W - 1) { sum += posArr[(idx + 1) * 3 + 1]; n++; }
      if (j > 0)     { sum += posArr[(idx - W) * 3 + 1]; n++; }
      if (j < W - 1) { sum += posArr[(idx + W) * 3 + 1]; n++; }
      const avg = n ? sum / n : y;
      const rel = (avg - y) / cellSize;           // >0 when vertex is lower than surroundings
      const ao = rel > 0 ? Math.min(1, rel * 0.9) : 0;

      const t = (y - minH) / range;
      const tt = t < 0 ? 0 : t > 1 ? 1 : t;
      const li = (tt * (lutSize - 1)) | 0;
      const lb = li * 3;
      const darken = 1 - ao * aoStrength;

      const cb = idx * 3;
      colors[cb]     = lut[lb]     * darken;
      colors[cb + 1] = lut[lb + 1] * darken;
      colors[cb + 2] = lut[lb + 2] * darken;
    }
  }

  pos.needsUpdate = true;
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.6,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'terrain';
  group.add(mesh);

  if (water) {
    const waterGeo = new THREE.PlaneGeometry(size * 1.05, size * 1.05);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: water.color || '#2a7ab8',
      transparent: true,
      opacity: 0.78,
      roughness: 0.15,
      metalness: 0.25,
      envMapIntensity: 1.0,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = water.level ?? 0;
    waterMesh.name = 'water';
    group.add(waterMesh);
  }

  for (const extra of extras) {
    if (extra) group.add(extra);
  }

  group.userData.bounds = { size, yMin, yMax, minH, maxH };
  // Expose sampleHeight so decorations can be placed on the real surface.
  group.userData.sampleHeight = (x, z) => {
    let y = heightFn(x, z);
    if (microDetail > 0) {
      y += fbm(x * microFrequency, z * microFrequency, {
        octaves: 3, gain: 0.5, seed: microSeed,
      }) * microDetail;
    }
    return y;
  };
  return group;
}

export function disposeGroup(group) {
  group.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
}

// Helper: build a lava/magma disc for volcano crater
export function makeLava(radius, y) {
  const geo = new THREE.CircleGeometry(radius, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: '#ff6a1a' });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y;
  return m;
}

// Helper: build a branching river as thin tubes along XZ
export function makeRiverPath(points, width = 0.6) {
  const group = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    const len = Math.hypot(dx, dz);
    const geo = new THREE.PlaneGeometry(width, len);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: '#4aa3d9', transparent: true, opacity: 0.85 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 0.05, (a[2] + b[2]) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    group.add(m);
  }
  return group;
}
