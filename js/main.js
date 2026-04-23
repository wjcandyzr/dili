import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import { landforms, getLandform } from './landforms.js';
import { buildTerrain, disposeGroup } from './terrain.js';
import { LabelGroup } from './labels.js';
import { ViewManager } from './views.js';

// === DOM ===
const canvasWrap = document.getElementById('canvas-wrap');
const landformList = document.getElementById('landform-list');
const infoPanel = document.getElementById('info-panel');
const notePopup = document.getElementById('note-popup');
const viewButtons = document.querySelectorAll('.view-btn');
const autoRotateToggle = document.getElementById('auto-rotate');
const toggleLabels = document.getElementById('toggle-labels');

// === Three.js setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d1b2a');
scene.fog = new THREE.Fog('#0d1b2a', 120, 260);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(55, 45, 55);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = false;
canvasWrap.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
canvasWrap.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 2, 0);
controls.minDistance = 15;
controls.maxDistance = 180;
controls.maxPolarAngle = Math.PI * 0.49;

// Lighting — warm sun + cool sky fill gives natural terrain shading
const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x4a4535, 0.75);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2d6, 1.35);
sun.position.set(40, 60, 30);
scene.add(sun);

const fill = new THREE.DirectionalLight(0x7aa6d6, 0.35);
fill.position.set(-30, 25, -20);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffd9a8, 0.2);
rim.position.set(0, 20, -60);
scene.add(rim);

// === State ===
let currentTerrain = null;
const labelMgr = new LabelGroup(scene);
const viewMgr = new ViewManager(scene, camera, controls);

function showNote({ text, note }) {
  notePopup.innerHTML = `<strong>${text}</strong><p>${note}</p><button class="close">×</button>`;
  notePopup.classList.add('visible');
  notePopup.querySelector('.close').addEventListener('click', () => {
    notePopup.classList.remove('visible');
  });
}

function renderInfoPanel(lf) {
  const d = lf.description;
  infoPanel.innerHTML = `
    <h2>${lf.icon} ${lf.name}</h2>
    <div class="info-grid">
      <section>
        <h3>定义</h3>
        <p>${d.definition}</p>
      </section>
      <section>
        <h3>形成原因</h3>
        <p>${d.formation}</p>
      </section>
      <section>
        <h3>典型代表</h3>
        <p>${d.examples}</p>
      </section>
      <section>
        <h3>主要特征</h3>
        <ul>
          ${d.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </section>
    </div>
  `;
}

function loadLandform(id) {
  const lf = getLandform(id);
  if (!lf) return;

  // Switch active state in sidebar
  landformList.querySelectorAll('.landform-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  // Dispose old terrain
  if (currentTerrain) {
    scene.remove(currentTerrain);
    disposeGroup(currentTerrain);
    currentTerrain = null;
  }

  // Build new terrain
  currentTerrain = buildTerrain(lf.terrain);
  scene.add(currentTerrain);

  // Add decorations (trees, rocks, houses, clouds, etc.)
  if (lf.decorate) {
    const sampleHeight = currentTerrain.userData.sampleHeight;
    const decor = lf.decorate(sampleHeight);
    decor.name = 'decorations';
    currentTerrain.add(decor);
  }

  // Reset view to 3D whenever switching landform
  viewMgr.setMode('3d', currentTerrain);
  viewButtons.forEach(b => b.classList.toggle('active', b.dataset.view === '3d'));

  // Labels
  labelMgr.setLabels(lf.labels, showNote);

  // Info panel
  renderInfoPanel(lf);

  // Close any lingering note popup
  notePopup.classList.remove('visible');
}

// === Sidebar build ===
function buildSidebar() {
  landformList.innerHTML = '';
  for (const lf of landforms) {
    const el = document.createElement('button');
    el.className = 'landform-item';
    el.dataset.id = lf.id;
    el.innerHTML = `<span class="icon">${lf.icon}</span><span class="name">${lf.name}</span>`;
    el.addEventListener('click', () => loadLandform(lf.id));
    landformList.appendChild(el);
  }
}

// === View buttons ===
viewButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    viewButtons.forEach(b => b.classList.toggle('active', b === btn));
    viewMgr.setMode(btn.dataset.view, currentTerrain);
  });
});

// === Auto rotate ===
autoRotateToggle.addEventListener('change', (e) => {
  controls.autoRotate = e.target.checked;
  controls.autoRotateSpeed = 0.8;
});

// === Label toggle ===
toggleLabels.addEventListener('change', (e) => {
  labelMgr.setVisible(e.target.checked);
});

// === Resize ===
function resize() {
  const w = canvasWrap.clientWidth;
  const h = canvasWrap.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// === Animation loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// === Bootstrap ===
buildSidebar();
resize();
loadLandform('mountain');
animate();
