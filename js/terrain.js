import * as THREE from 'three';

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
    segments = 180,
    heightFn,
    colorStops,
    heightRange,
    water = null,
    flatShading = true,
    extras = [],
  } = config;

  const group = new THREE.Group();

  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2); // lay flat on XZ plane

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  let yMin = Infinity;
  let yMax = -Infinity;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightFn(x, z);
    pos.setY(i, y);
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }

  const [minH, maxH] = heightRange || [yMin, yMax];
  const range = maxH - minH || 1;

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, (y - minH) / range));
    const c = sampleGradient(colorStops, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading,
    roughness: 0.95,
    metalness: 0.0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'terrain';
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  group.add(mesh);

  if (water) {
    const waterGeo = new THREE.PlaneGeometry(size * 1.05, size * 1.05);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: water.color || '#2a7ab8',
      transparent: true,
      opacity: 0.72,
      roughness: 0.25,
      metalness: 0.1,
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
