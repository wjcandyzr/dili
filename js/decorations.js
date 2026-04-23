import * as THREE from 'three';

// Seeded RNG so layouts stay consistent across reloads.
function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Each decoration gets its own material so disposeGroup can safely dispose
// them when the landform is switched.
function sharedMat(opts) {
  return new THREE.MeshStandardMaterial({ flatShading: true, ...opts });
}

// === Tree builders ===

export function makePineTree(height = 3, trunkColor = '#5a3a22') {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.07, height * 0.09, height * 0.35, 6),
    sharedMat({ color: trunkColor, roughness: 1 })
  );
  trunk.position.y = height * 0.17;
  g.add(trunk);

  const greens = ['#2d5a35', '#3a6a40', '#4a7a4a'];
  for (let i = 0; i < 3; i++) {
    const r = height * (0.32 - i * 0.07);
    const h = height * (0.32 - i * 0.04);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 7),
      sharedMat({ color: greens[i], roughness: 1 })
    );
    cone.position.y = height * (0.3 + i * 0.22);
    g.add(cone);
  }
  return g;
}

export function makeBroadleafTree(height = 2.5) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.08, height * 0.1, height * 0.5, 6),
    sharedMat({ color: '#6b4526', roughness: 1 })
  );
  trunk.position.y = height * 0.25;
  g.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(height * 0.45, 0),
    sharedMat({ color: '#4a7a3a', roughness: 1 })
  );
  leaves.position.y = height * 0.75;
  leaves.scale.set(1, 0.9, 1);
  g.add(leaves);
  return g;
}

export function makePalmTree(height = 4) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.05, height * 0.08, height * 0.85, 6),
    sharedMat({ color: '#7a5a3a', roughness: 1 })
  );
  trunk.position.y = height * 0.42;
  trunk.rotation.z = 0.08;
  g.add(trunk);
  // Palm fronds as flattened boxes fanning out
  const frondMat = sharedMat({ color: '#4a8a4a', roughness: 1 });
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.Mesh(
      new THREE.ConeGeometry(height * 0.08, height * 0.6, 4),
      frondMat
    );
    const angle = (i / 7) * Math.PI * 2;
    frond.position.set(
      Math.cos(angle) * height * 0.2,
      height * 0.85,
      Math.sin(angle) * height * 0.2
    );
    frond.rotation.z = Math.cos(angle) * 0.9;
    frond.rotation.x = Math.sin(angle) * 0.9;
    g.add(frond);
  }
  return g;
}

export function makeDeadTree(height = 2) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.06, height * 0.1, height, 5),
    sharedMat({ color: '#3a2a20', roughness: 1 })
  );
  trunk.position.y = height * 0.5;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(height * 0.03, height * 0.05, height * 0.35, 4),
      sharedMat({ color: '#3a2a20', roughness: 1 })
    );
    branch.position.y = height * (0.6 + i * 0.15);
    branch.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.7;
    g.add(branch);
  }
  return g;
}

export function makeCactus(height = 2) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.15, height * 0.15, height * 0.9, 8),
    sharedMat({ color: '#4a7a3a', roughness: 1 })
  );
  body.position.y = height * 0.45;
  g.add(body);
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.1, height * 0.1, height * 0.4, 6),
    sharedMat({ color: '#4a7a3a', roughness: 1 })
  );
  arm.position.set(height * 0.2, height * 0.55, 0);
  arm.rotation.z = -Math.PI / 2;
  g.add(arm);
  return g;
}

// === Rocks ===

export function makeRock(size = 1, color = '#7a7268') {
  const geo = new THREE.DodecahedronGeometry(size, 0);
  // Randomize vertices slightly for variety
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 0.18;
    pos.setXYZ(i,
      pos.getX(i) * (1 + (Math.random() - 0.5) * k),
      pos.getY(i) * (1 + (Math.random() - 0.5) * k),
      pos.getZ(i) * (1 + (Math.random() - 0.5) * k),
    );
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, sharedMat({ color, roughness: 1 }));
}

// === House / Village ===

export function makeHouse(size = 1.5, roofColor = '#a04030', wallColor = '#e8d8b0') {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(size, size * 0.7, size * 0.8),
    sharedMat({ color: wallColor, roughness: 1 })
  );
  wall.position.y = size * 0.35;
  g.add(wall);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(size * 0.75, size * 0.5, 4),
    sharedMat({ color: roofColor, roughness: 1 })
  );
  roof.position.y = size * 0.95;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  return g;
}

// === Cloud / Steam ===

export function makeCloud(size = 6) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: '#ffffff', roughness: 1, transparent: true, opacity: 0.85, flatShading: true,
  });
  for (let i = 0; i < 5; i++) {
    const s = size * (0.5 + Math.random() * 0.5);
    const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), mat);
    puff.position.set(
      (Math.random() - 0.5) * size,
      (Math.random() - 0.5) * size * 0.3,
      (Math.random() - 0.5) * size * 0.5
    );
    puff.scale.y = 0.6;
    g.add(puff);
  }
  return g;
}

// Volcano smoke plume
export function makeSmokePlume(height = 8) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: '#5a4a48', roughness: 1, transparent: true, opacity: 0.7, flatShading: true,
  });
  for (let i = 0; i < 4; i++) {
    const s = 1.2 + i * 0.6;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), mat);
    puff.position.set((Math.random() - 0.5) * 1.5, i * 1.8, (Math.random() - 0.5) * 1.5);
    g.add(puff);
  }
  return g;
}

export function makeIceChunk(size = 1) {
  const geo = new THREE.OctahedronGeometry(size, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) * (1 + (Math.random() - 0.5) * 0.25),
      pos.getY(i) * (1 + (Math.random() - 0.5) * 0.25),
      pos.getZ(i) * (1 + (Math.random() - 0.5) * 0.25),
    );
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, sharedMat({
    color: '#c0dce8', roughness: 0.3, metalness: 0.1,
  }));
}

// Little boat for rivers/seas
export function makeBoat(size = 1.2) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(size * 1.6, size * 0.25, size * 0.5),
    sharedMat({ color: '#5a3a2a', roughness: 1 })
  );
  hull.position.y = size * 0.12;
  g.add(hull);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.04, size * 0.04, size * 0.9, 5),
    sharedMat({ color: '#3a2a20', roughness: 1 })
  );
  mast.position.y = size * 0.7;
  g.add(mast);
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.5, size * 0.7),
    new THREE.MeshStandardMaterial({ color: '#f0ece0', roughness: 1, side: THREE.DoubleSide })
  );
  sail.position.set(0, size * 0.7, 0);
  sail.rotation.y = Math.PI / 2;
  g.add(sail);
  return g;
}

// Flat disk to represent a small pond / oasis / lake patch
export function makePond(radius = 4, color = '#2b6fa0') {
  const geo = new THREE.CircleGeometry(radius, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.8,
  });
  return new THREE.Mesh(geo, mat);
}

// === Scatter helper ===

/**
 * Place decorations on the terrain by sampling heights and applying a filter.
 *
 * opts: {
 *   sampleHeight: (x, z) => number,
 *   count: number,
 *   range: number,                    // square region side [-range/2, range/2]
 *   factory: (rnd, x, y, z) => Object3D | null,
 *   filter?: (x, y, z, rnd) => bool,  // placement rule
 *   seed?: number,
 *   offsetY?: number,
 *   randomRotY?: boolean,
 *   randomScale?: [min, max],
 * }
 */
export function scatter(opts) {
  const {
    sampleHeight, count, range, factory, filter,
    seed = 1, offsetY = 0, randomRotY = true, randomScale,
  } = opts;
  const rnd = mulberry32(seed);
  const group = new THREE.Group();
  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 20;

  while (placed < count && attempts < maxAttempts) {
    attempts++;
    const x = (rnd() - 0.5) * range;
    const z = (rnd() - 0.5) * range;
    const y = sampleHeight(x, z);
    if (filter && !filter(x, y, z, rnd)) continue;
    const obj = factory(rnd, x, y, z);
    if (!obj) continue;
    obj.position.set(x, y + offsetY, z);
    if (randomRotY) obj.rotation.y = rnd() * Math.PI * 2;
    if (randomScale) {
      const s = randomScale[0] + rnd() * (randomScale[1] - randomScale[0]);
      obj.scale.setScalar(s);
    }
    group.add(obj);
    placed++;
  }
  return group;
}

export { mulberry32 };
