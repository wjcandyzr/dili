import * as THREE from 'three';

/**
 * Three view modes: '3d' | 'contour' | 'section'
 */
export class ViewManager {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.mode = '3d';
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = 'view-overlay';
    this.scene.add(this.overlayGroup);
    this.originalMaterials = new WeakMap();
    this.contourMaterial = null;
  }

  _getTerrainMesh(terrainGroup) {
    return terrainGroup.children.find(c => c.name === 'terrain');
  }

  clearOverlay() {
    while (this.overlayGroup.children.length) {
      const c = this.overlayGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
      this.overlayGroup.remove(c);
    }
  }

  setMode(mode, terrainGroup) {
    this.mode = mode;
    this.clearOverlay();
    if (!terrainGroup) return;

    const terrain = this._getTerrainMesh(terrainGroup);
    if (!terrain) return;

    if (mode === '3d') {
      this._restoreOriginal(terrain);
      terrainGroup.visible = true;
      this.controls.enabled = true;
      this._tweenCamera(new THREE.Vector3(55, 45, 55), new THREE.Vector3(0, 0, 0));
    } else if (mode === 'contour') {
      this._applyContourMaterial(terrain);
      terrainGroup.visible = true;
      this.controls.enabled = true;
      this._tweenCamera(new THREE.Vector3(0, 90, 0.1), new THREE.Vector3(0, 0, 0));
    } else if (mode === 'section') {
      this._restoreOriginal(terrain);
      this._drawSection(terrain);
      this.controls.enabled = true;
      this._tweenCamera(new THREE.Vector3(0, 15, 80), new THREE.Vector3(0, 5, 0));
    }
  }

  _restoreOriginal(mesh) {
    const saved = this.originalMaterials.get(mesh);
    if (saved) {
      mesh.material = saved;
      this.originalMaterials.delete(mesh);
    }
  }

  _applyContourMaterial(mesh) {
    if (!this.originalMaterials.has(mesh)) {
      this.originalMaterials.set(mesh, mesh.material);
    }
    const bounds = mesh.parent.userData.bounds || { minH: -5, maxH: 15 };
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMin: { value: bounds.minH },
        uMax: { value: bounds.maxH },
        uLines: { value: 12 },
      },
      vertexShader: `
        varying float vHeight;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vHeight = worldPos.y;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying float vHeight;
        uniform float uMin;
        uniform float uMax;
        uniform float uLines;
        void main() {
          float t = clamp((vHeight - uMin) / (uMax - uMin), 0.0, 1.0);
          // Gradient base color
          vec3 low = vec3(0.25, 0.45, 0.75);
          vec3 mid = vec3(0.55, 0.75, 0.45);
          vec3 high = vec3(0.95, 0.95, 0.85);
          vec3 col = mix(low, mid, smoothstep(0.0, 0.5, t));
          col = mix(col, high, smoothstep(0.5, 1.0, t));
          // Contour lines
          float f = fract(t * uLines);
          float line = smoothstep(0.02, 0.0, min(f, 1.0 - f));
          col = mix(col, vec3(0.05, 0.05, 0.1), line);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    mesh.material = mat;
    this.contourMaterial = mat;
  }

  _drawSection(terrainMesh) {
    // Sample heights along x axis at z=0, draw a red line on the surface
    const size = terrainMesh.parent.userData.bounds.size || 100;
    const samples = 200;
    const points = [];
    const heightFn = (x, z) => {
      // fallback: raycast downward from above onto mesh
      const raycaster = new THREE.Raycaster(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
      const hits = raycaster.intersectObject(terrainMesh, false);
      return hits.length ? hits[0].point.y : 0;
    };
    for (let i = 0; i <= samples; i++) {
      const x = -size / 2 + (i / samples) * size;
      const y = heightFn(x, 0);
      points.push(new THREE.Vector3(x, y + 0.3, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: '#ff3355', linewidth: 3 });
    const line = new THREE.Line(geo, mat);
    this.overlayGroup.add(line);

    // Draw a 2D profile panel to the side
    this._drawProfilePanel(points, size);
  }

  _drawProfilePanel(points, size) {
    // Draw profile as a plane with a line overlay above the terrain
    const panelWidth = size;
    const panelHeight = 20;
    const panelZ = -size / 2 - 8;
    const panelY = 8;

    // backdrop
    const bgGeo = new THREE.PlaneGeometry(panelWidth + 4, panelHeight + 4);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.92, transparent: true });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.set(0, panelY, panelZ);
    this.overlayGroup.add(bg);

    // axis
    const axisMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-panelWidth / 2, panelY - panelHeight / 2, panelZ + 0.01),
      new THREE.Vector3(panelWidth / 2, panelY - panelHeight / 2, panelZ + 0.01),
      new THREE.Vector3(-panelWidth / 2, panelY - panelHeight / 2, panelZ + 0.01),
      new THREE.Vector3(-panelWidth / 2, panelY + panelHeight / 2, panelZ + 0.01),
    ]);
    const axis = new THREE.LineSegments(axisGeo, axisMat);
    this.overlayGroup.add(axis);

    // scale points onto panel
    let yMin = Infinity, yMax = -Infinity;
    for (const p of points) { if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y; }
    const yRange = (yMax - yMin) || 1;
    const panelPoints = points.map(p => {
      const px = p.x;
      const py = panelY - panelHeight / 2 + ((p.y - yMin) / yRange) * panelHeight * 0.9;
      return new THREE.Vector3(px, py, panelZ + 0.02);
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(panelPoints);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xc0392b });
    const line = new THREE.Line(lineGeo, lineMat);
    this.overlayGroup.add(line);
  }

  _tweenCamera(targetPos, lookAt, duration = 600) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();
    const animate = () => {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      this.camera.position.lerpVectors(startPos, targetPos, e);
      this.controls.target.lerpVectors(startTarget, lookAt, e);
      this.controls.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }
}
