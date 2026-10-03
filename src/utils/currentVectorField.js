/**
 * OceanView 3D - Hydrodynamic Circulation & 3D Current Vector Flow Field (60 FPS)
 * Dynamic directional green arrows flowing across Arabian Sea, around Sri Lanka, and into Bay of Bengal.
 */

import * as THREE from 'three';

export class CurrentVectorField {
  constructor(scene, width = 60, height = 50) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.group = new THREE.Group();
    this.group.name = "OceanCurrentVectorGroup";
    this.scene.add(this.group);

    this.arrows = [];
    this.initVectorArrows();
  }

  initVectorArrows() {
    const arrowGeom = new THREE.ConeGeometry(0.32, 1.2, 5);
    arrowGeom.rotateX(Math.PI / 2);

    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });

    const flowCoords = [
      // Arabian Sea Clockwise Gyre
      { x: -18, y: 12, angle: 0.4 },
      { x: -14, y: 8,  angle: 0.6 },
      { x: -10, y: 3,  angle: 0.8 },
      { x: -6,  y: -2, angle: 1.1 },
      { x: -2,  y: -8, angle: 1.5 },
      // South of Sri Lanka & Equatorial Eastward Jet
      { x: 3,   y: -14, angle: 0.1 },
      { x: 8,   y: -15, angle: 0.0 },
      { x: 14,  y: -14, angle: -0.1 },
      { x: 20,  y: -12, angle: -0.2 },
      // Bay of Bengal Cyclonic Gyre
      { x: 10,  y: -5,  angle: -0.6 },
      { x: 15,  y: 0,   angle: -0.9 },
      { x: 18,  y: 6,   angle: -1.2 },
      { x: 20,  y: 12,  angle: -1.5 },
      { x: 16,  y: 16,  angle: 2.7 },
      { x: 10,  y: 12,  angle: 2.3 },
      { x: 6,   y: 6,   angle: 1.9 }
    ];

    flowCoords.forEach(f => {
      const arrow = new THREE.Mesh(arrowGeom, arrowMat);
      arrow.position.set(f.x, f.y, 0.22);
      arrow.rotation.z = f.angle;

      this.group.add(arrow);
      this.arrows.push({ mesh: arrow, baseAngle: f.angle });
    });
  }

  update(time) {
    const t = time * 0.001;
    this.arrows.forEach((a, idx) => {
      const pulse = 1.0 + Math.sin(t * 3.0 + idx) * 0.12;
      a.mesh.scale.set(pulse, pulse, 1.0);
    });
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
