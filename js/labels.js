import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createLabel({ pos, text, note }, onClick) {
  const el = document.createElement('div');
  el.className = 'terrain-label';
  el.innerHTML = `
    <div class="label-pin"></div>
    <div class="label-text">${text}</div>
  `;
  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (onClick) onClick({ text, note });
  });
  const obj = new CSS2DObject(el);
  obj.position.set(pos[0], pos[1], pos[2]);
  obj.userData = { text, note };
  return obj;
}

export class LabelGroup {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'labels';
    this.scene.add(this.group);
    this.visible = true;
  }

  clear() {
    while (this.group.children.length) {
      const c = this.group.children[0];
      if (c.element && c.element.parentNode) {
        c.element.parentNode.removeChild(c.element);
      }
      this.group.remove(c);
    }
  }

  setLabels(labels, onClick) {
    this.clear();
    for (const l of labels) {
      this.group.add(createLabel(l, onClick));
    }
    this.setVisible(this.visible);
  }

  setVisible(v) {
    this.visible = v;
    this.group.visible = v;
  }

  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }
}
