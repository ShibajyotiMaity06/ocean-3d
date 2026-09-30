/**
 * ==============================================================================
 * OceanView 3D - INCOIS / MoES SIH26067 Oceanographic Telemetry System
 * 
 * NOTE: This prototype uses synthetic placeholder data / preprocessed HYCOM & Argo
 * local tiles standing in for live backend HYCOM / Argovis API integration 
 * (scheduled for the grand finale production build).
 * ==============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getViridisColor, getViridisCssGradient } from './utils/viridis.js';
import { fetchTileData, fetchArgoPositions, SUPPORTED_DEPTHS, GEO_EXTENT } from './utils/dataLoader.js';
import { createCoastlineGroup, geoToScene } from './utils/coastline.js';
import { renderArgoProfileChart } from './utils/chartRenderer.js';

// Application State
const state = {
  variable: 'temperature',
  selectedDepth: 0,
  verticalExaggeration: 15.0,
  columnStackMode: true,
  showArgo: true,
  showCoastline: true,
  autoRotate: false,
  activeDate: '2023-03-21',
  selectedFloat: null
};

// Scene Dimensions
const PLANE_WIDTH = 60;
const PLANE_HEIGHT = 50;
const BASE_Z_SCALE = 0.02; // z = -depth * BASE_Z_SCALE * exaggeration

// Three.js Globals
let scene, camera, renderer, controls;
let depthMeshGroup, coastlineGroup, argoMarkersGroup, boundingBoxGroup;
const sliceDataCache = new Map(); // key: `${variable}_${depth}` -> tileData
const sliceMeshes = new Map();     // key: depth -> THREE.Mesh
let argoFloatsData = [];
const argoMeshes = [];

// Raycasting & Telemetry
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9999, -9999);
let hoveredFloat = null;

// Performance Monitoring (FPS)
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 60;

// DOM Elements
const canvasContainer = document.getElementById('canvas-container');
const variableSelect = document.getElementById('variable-select');
const depthChips = document.querySelectorAll('.depth-chip');
const selectedDepthChipVal = document.getElementById('selected-depth-chip-val');
const exaggerationSlider = document.getElementById('exaggeration-slider');
const exaggerationVal = document.getElementById('exaggeration-val');
const columnModeToggle = document.getElementById('column-mode-toggle');
const argoToggle = document.getElementById('argo-toggle');
const coastlineToggle = document.getElementById('coastline-toggle');
const rotationToggle = document.getElementById('rotation-toggle');
const resetCamBtn = document.getElementById('reset-cam-btn');

// Colorbar DOM
const cbTitle = document.getElementById('colorbar-title');
const cbMax = document.getElementById('cb-max');
const cbMid = document.getElementById('cb-mid');
const cbMin = document.getElementById('cb-min');
const cbGradient = document.getElementById('colorbar-gradient');

// Argo Modal DOM
const argoModalBackdrop = document.getElementById('argo-modal-backdrop');
const modalFloatId = document.getElementById('modal-float-id');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalFloatPos = document.getElementById('modal-float-pos');
const modalFloatDepth = document.getElementById('modal-float-depth');
const modalFloatStatus = document.getElementById('modal-float-status');
const modalFloatPlatform = document.getElementById('modal-float-platform');
const argoChartCanvas = document.getElementById('argo-chart-canvas');

// Status Bar DOM
const statusVar = document.getElementById('status-var');
const statusDepth = document.getElementById('status-depth');
const statusExag = document.getElementById('status-exag');
const statusHover = document.getElementById('status-hover');
const statusFps = document.getElementById('status-fps');

/**
 * 1. Initialize Three.js Scene, Camera, Lighting & Controls
 */
function initScene() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b16);
  scene.fog = new THREE.FogExp2(0x070b16, 0.002);

  // Camera setup (Z is vertical / depth axis)
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 1000);
  camera.up.set(0, 0, 1); // Z is vertical upwards, negative Z is depth
  
  // Oblique viewpoint looking down into water column
  camera.position.set(40, -75, 45);
  camera.lookAt(0, 0, -10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasContainer.appendChild(renderer.domElement);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.minDistance = 15;
  controls.maxDistance = 250;
  controls.maxPolarAngle = Math.PI / 2 + 0.35; // allow looking slightly from below
  controls.target.set(0, 0, -12);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 0.85);
  dirLight1.position.set(50, -50, 80);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 0.55);
  dirLight2.position.set(-60, 40, -40);
  scene.add(dirLight2);

  // Container Groups
  depthMeshGroup = new THREE.Group();
  depthMeshGroup.name = "DepthSlicesGroup";
  scene.add(depthMeshGroup);

  argoMarkersGroup = new THREE.Group();
  argoMarkersGroup.name = "ArgoMarkersGroup";
  scene.add(argoMarkersGroup);

  // Coastline Context Line
  coastlineGroup = createCoastlineGroup(PLANE_WIDTH, PLANE_HEIGHT);
  scene.add(coastlineGroup);

  // Bounding Volume Wireframe & Depth Guides
  createBoundingBoxGuides();

  // Set initial gradient style
  if (cbGradient) {
    cbGradient.style.background = getViridisCssGradient();
  }

  // Event Listeners
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('click', onCanvasClick);
}

/**
 * Creates 3D depth water column corner guides and reference lines
 */
function createBoundingBoxGuides() {
  boundingBoxGroup = new THREE.Group();
  boundingBoxGroup.name = "BoundingVolumeGuides";

  const halfW = PLANE_WIDTH / 2;
  const halfH = PLANE_HEIGHT / 2;
  const corners = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH]
  ];

  // Surface boundary rectangle
  const surfacePoints = [
    new THREE.Vector3(-halfW, -halfH, 0.05),
    new THREE.Vector3(halfW, -halfH, 0.05),
    new THREE.Vector3(halfW, halfH, 0.05),
    new THREE.Vector3(-halfW, halfH, 0.05),
    new THREE.Vector3(-halfW, -halfH, 0.05)
  ];
  const surfaceGeom = new THREE.BufferGeometry().setFromPoints(surfacePoints);
  const surfaceLine = new THREE.Line(surfaceGeom, new THREE.LineBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.6
  }));
  boundingBoxGroup.add(surfaceLine);

  scene.add(boundingBoxGroup);
  updateBoundingGuides();
}

/**
 * Updates vertical corner pillars matching current exaggeration
 */
function updateBoundingGuides() {
  // Remove existing pillars
  const toRemove = [];
  boundingBoxGroup.children.forEach(c => {
    if (c.name === 'pillar') toRemove.push(c);
  });
  toRemove.forEach(c => boundingBoxGroup.remove(c));

  const halfW = PLANE_WIDTH / 2;
  const halfH = PLANE_HEIGHT / 2;
  const maxZ = -2000 * BASE_Z_SCALE * state.verticalExaggeration;

  const corners = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH]
  ];

  corners.forEach(([x, y]) => {
    const pts = [
      new THREE.Vector3(x, y, 0),
      new THREE.Vector3(x, y, maxZ)
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geom, new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1.5,
      gapSize: 1.0,
      transparent: true,
      opacity: 0.45
    }));
    line.computeLineDistances();
    line.name = 'pillar';
    boundingBoxGroup.add(line);
  });
}

/**
 * 2 & 3. Depth-Slice Rendering with Viridis Colormap & Dynamic Z Stacking
 */
async function loadAndRenderAllSlices() {
  // Clear any existing mesh planes
  depthMeshGroup.clear();
  sliceMeshes.clear();

  // Find global min and max for active variable across all depths for consistent scientific scaling
  let globalMin = Infinity;
  let globalMax = -Infinity;

  // Load all 6 depths
  const slicePromises = SUPPORTED_DEPTHS.map(async (depth) => {
    const cacheKey = `${state.variable}_${depth}`;
    let tileData = sliceDataCache.get(cacheKey);
    if (!tileData) {
      tileData = await fetchTileData(state.variable, depth, state.activeDate);
      sliceDataCache.set(cacheKey, tileData);
    }
    if (tileData.min < globalMin) globalMin = tileData.min;
    if (tileData.max > globalMax) globalMax = tileData.max;
    return { depth, tileData };
  });

  const loadedSlices = await Promise.all(slicePromises);

  // If temperature, clamp standard visual range (e.g. 2.0 to 31.0 °C); if salinity (33.0 to 37.0 PSU)
  if (state.variable === 'temperature') {
    globalMin = Math.max(1.5, globalMin);
    globalMax = Math.min(32.0, globalMax);
  } else {
    globalMin = Math.max(32.5, globalMin);
    globalMax = Math.min(37.5, globalMax);
  }

  // Update Colorbar UI
  updateColorbarUI(globalMin, globalMax);

  // Build 3D mesh for each depth slice
  loadedSlices.forEach(({ depth, tileData }) => {
    const mesh = createDepthSliceMesh(depth, tileData, globalMin, globalMax);
    sliceMeshes.set(depth, mesh);
    depthMeshGroup.add(mesh);
  });

  // Update plane Z positions according to vertical exaggeration
  updateSlicePositions();
  updateSliceOpacities();
}

/**
 * Creates a THREE.PlaneGeometry mesh with per-vertex colors
 */
function createDepthSliceMesh(depth, tileData, vMin, vMax) {
  const GRID_SIZE = 40;
  // PlaneGeometry with 39 segments = 40 vertices in X and Y
  const geometry = new THREE.PlaneGeometry(
    PLANE_WIDTH,
    PLANE_HEIGHT,
    GRID_SIZE - 1,
    GRID_SIZE - 1
  );

  const colors = [];
  const valRange = vMax - vMin || 1.0;

  // PlaneGeometry vertices are arranged from top-left (y positive) to bottom-right (y negative)
  // Grid values are indexed values[i][j] where i is lat index (south to north: 0 to 39)
  const posAttribute = geometry.attributes.position;
  const vertexCount = posAttribute.count;

  for (let k = 0; k < vertexCount; k++) {
    // Determine row (lat) and col (lon)
    const row = Math.floor(k / GRID_SIZE); // 0 to 39 (from top lat 26N down to 2N in plane geometry)
    const col = k % GRID_SIZE;             // 0 to 39 (from west lon 60E to east 95E)

    // Match grid latitude: in Three.js Plane, row 0 is top (maxLat), row 39 is bottom (minLat)
    const latIdx = (GRID_SIZE - 1) - row;
    const lonIdx = col;

    const val = (tileData.values[latIdx] && tileData.values[latIdx][lonIdx] !== undefined)
      ? tileData.values[latIdx][lonIdx]
      : (vMin + vMax) / 2;

    const norm = Math.max(0, Math.min(1, (val - vMin) / valRange));
    const rgb = getViridisColor(norm);

    colors.push(rgb.r, rgb.g, rgb.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const isSelected = (depth === state.selectedDepth);
  const opacity = isSelected ? 0.95 : (state.columnStackMode ? 0.28 : 0.0);

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `DepthSlice_${depth}`;
  mesh.userData = { depth, tileData, vMin, vMax };

  // Add subtle edge wireframe outline to highlight plane boundary
  const edgeGeom = new THREE.EdgesGeometry(geometry);
  const edgeMat = new THREE.LineBasicMaterial({
    color: isSelected ? 0x00e5ff : 0x0284c7,
    transparent: true,
    opacity: isSelected ? 0.95 : 0.45
  });
  const edgeLine = new THREE.LineSegments(edgeGeom, edgeMat);
  edgeLine.name = 'edge';
  mesh.add(edgeLine);

  return mesh;
}

/**
 * Live updates Z spacing of depth slices and float markers based on exaggeration slider
 */
function updateSlicePositions() {
  sliceMeshes.forEach((mesh, depth) => {
    mesh.position.z = -depth * BASE_Z_SCALE * state.verticalExaggeration;
  });

  updateBoundingGuides();
  updateArgoMarkerPositions();
}

/**
 * Updates opacity of active vs background slices
 */
function updateSliceOpacities() {
  sliceMeshes.forEach((mesh, depth) => {
    const isSelected = (depth === state.selectedDepth);
    const targetOpacity = isSelected ? 0.95 : (state.columnStackMode ? 0.28 : 0.0);
    mesh.material.opacity = targetOpacity;
    mesh.material.needsUpdate = true;
    mesh.visible = isSelected || state.columnStackMode;

    const edge = mesh.getObjectByName('edge');
    if (edge) {
      edge.material.color.setHex(isSelected ? 0x00e5ff : 0x0284c7);
      edge.material.opacity = isSelected ? 0.95 : (state.columnStackMode ? 0.45 : 0.0);
    }
  });
}

/**
 * Updates scientific colorbar values and labels
 */
function updateColorbarUI(min, max) {
  if (state.variable === 'temperature') {
    cbTitle.textContent = 'TEMP (°C)';
    cbMax.textContent = `${max.toFixed(1)}°`;
    cbMid.textContent = `${((max + min) / 2).toFixed(1)}°`;
    cbMin.textContent = `${min.toFixed(1)}°`;
  } else {
    cbTitle.textContent = 'SALINITY';
    cbMax.textContent = `${max.toFixed(1)}`;
    cbMid.textContent = `${((max + min) / 2).toFixed(1)}`;
    cbMin.textContent = `${min.toFixed(1)}`;
  }
}

/**
 * 5. Synthetic Argo Float Markers & Interactive CTD Profile Popups
 */
async function loadAndRenderArgoFloats() {
  argoMarkersGroup.clear();
  argoMeshes.length = 0;

  argoFloatsData = await fetchArgoPositions(state.activeDate);

  const sphereGeom = new THREE.SphereGeometry(0.85, 20, 20);
  const haloGeom = new THREE.RingGeometry(1.05, 1.45, 24);

  argoFloatsData.forEach((floatItem, idx) => {
    const group = new THREE.Group();
    group.name = `ArgoFloat_${floatItem.id}`;
    group.userData = { floatData: floatItem, index: idx };

    // Orange Sphere Marker (#FF8C00)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      emissive: 0xff6200,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.2
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    group.add(sphere);

    // Glowing Halo Ring around marker
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    group.add(halo);

    // Vertical line tether connecting float depth to surface (z=0)
    const tetherGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 10)
    ]);
    const tetherMat = new THREE.LineDashedMaterial({
      color: 0xffaa00,
      dashSize: 0.8,
      gapSize: 0.6,
      transparent: true,
      opacity: 0.4
    });
    const tether = new THREE.Line(tetherGeom, tetherMat);
    tether.name = 'tether';
    group.add(tether);

    argoMarkersGroup.add(group);
    argoMeshes.push(sphere); // for raycasting
  });

  updateArgoMarkerPositions();
}

/**
 * Recalculates Argo marker 3D coordinates based on Lon, Lat, Depth, and Exaggeration
 */
function updateArgoMarkerPositions() {
  argoMarkersGroup.children.forEach(group => {
    const floatItem = group.userData.floatData;
    if (!floatItem) return;

    const scenePos = geoToScene(floatItem.lon, floatItem.lat, PLANE_WIDTH, PLANE_HEIGHT);
    const z = -floatItem.currentDepth * BASE_Z_SCALE * state.verticalExaggeration;

    group.position.set(scenePos.x, scenePos.y, z);

    // Update tether line from float depth to surface z=0
    const tether = group.getObjectByName('tether');
    if (tether) {
      const surfaceZOffset = -z;
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, surfaceZOffset)
      ];
      tether.geometry.setFromPoints(pts);
      tether.computeLineDistances();
    }
  });
}

/**
 * Raycasting: Hover detection & Lat/Lon/Value status readout
 */
function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 1. Check Argo float markers hover
  const floatIntersects = raycaster.intersectObjects(argoMeshes, false);
  if (floatIntersects.length > 0) {
    const hitSphere = floatIntersects[0].object;
    const floatData = hitSphere.parent.userData.floatData;
    document.body.style.cursor = 'pointer';
    statusHover.innerHTML = `📍 <span style="color:#ff8c00; font-weight:bold;">ARGO #${floatData.id}</span> | Lat: ${floatData.lat.toFixed(2)}°N, Lon: ${floatData.lon.toFixed(2)}°E | Depth: ${floatData.currentDepth}m`;
    return;
  } else {
    document.body.style.cursor = 'default';
  }

  // 2. Check depth plane intersection for real-time geographic Lat/Lon & Value telemetry
  const activeMesh = sliceMeshes.get(state.selectedDepth);
  if (activeMesh) {
    const planeIntersects = raycaster.intersectObject(activeMesh, false);
    if (planeIntersects.length > 0) {
      const hit = planeIntersects[0];
      const localPoint = hit.point;

      // Inverse map from scene space ([-30, 30], [-25, 25]) to GeoExtent (Lon: [60, 95], Lat: [2, 26])
      const u = (localPoint.x + PLANE_WIDTH / 2) / PLANE_WIDTH;
      const v = (localPoint.y + PLANE_HEIGHT / 2) / PLANE_HEIGHT;

      const lon = GEO_EXTENT.minLon + u * (GEO_EXTENT.maxLon - GEO_EXTENT.minLon);
      const lat = GEO_EXTENT.minLat + v * (GEO_EXTENT.maxLat - GEO_EXTENT.minLat);

      // Sample grid value
      const tileData = activeMesh.userData.tileData;
      let valStr = '';
      if (tileData && tileData.values) {
        const GRID_SIZE = 40;
        const latIdx = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(v * (GRID_SIZE - 1))));
        const lonIdx = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(u * (GRID_SIZE - 1))));
        const val = tileData.values[latIdx]?.[lonIdx];
        if (val !== undefined) {
          const unit = state.variable === 'temperature' ? '°C' : 'PSU';
          valStr = ` | <strong style="color:var(--accent);">${val.toFixed(2)} ${unit}</strong>`;
        }
      }

      statusHover.innerHTML = `Lat: <strong>${lat.toFixed(2)}°N</strong>, Lon: <strong>${lon.toFixed(2)}°E</strong>${valStr}`;
      return;
    }
  }

  statusHover.textContent = 'Move cursor over ocean slices or Argo floats...';
}

/**
 * Click handler for opening Argo Float profile card
 */
function onCanvasClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const floatIntersects = raycaster.intersectObjects(argoMeshes, false);

  if (floatIntersects.length > 0) {
    const hitSphere = floatIntersects[0].object;
    const floatData = hitSphere.parent.userData.floatData;
    openArgoFloatModal(floatData);
  }
}

/**
 * Displays Argo Float CTD Profile modal and renders 2D profile chart
 */
function openArgoFloatModal(floatData) {
  state.selectedFloat = floatData;
  modalFloatId.textContent = `INCOIS ARGO #${floatData.id}`;
  modalFloatPos.textContent = `${floatData.lat.toFixed(2)}°N, ${floatData.lon.toFixed(2)}°E`;
  modalFloatDepth.textContent = `${floatData.currentDepth} m`;
  modalFloatStatus.textContent = `${floatData.status} (Cycle #${floatData.cycleNumber})`;
  modalFloatPlatform.textContent = floatData.platform || 'Apex CTD Profiler';

  argoModalBackdrop.classList.remove('hidden');

  // Render canvas chart
  requestAnimationFrame(() => {
    renderArgoProfileChart(argoChartCanvas, floatData.profile);
  });
}

function closeArgoFloatModal() {
  argoModalBackdrop.classList.add('hidden');
  state.selectedFloat = null;
}

/**
 * 4. UI Controls & Event Bindings
 */
function setupUIEvents() {
  // Variable Dropdown
  variableSelect.addEventListener('change', (e) => {
    state.variable = e.target.value;
    statusVar.textContent = (state.variable === 'temperature') ? 'Temperature (°C)' : 'Salinity (PSU)';
    loadAndRenderAllSlices();
  });

  // Depth Chips
  depthChips.forEach(chip => {
    chip.addEventListener('click', () => {
      depthChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const depth = parseInt(chip.dataset.depth, 10);
      state.selectedDepth = depth;

      selectedDepthChipVal.textContent = depth === 0 ? '0 m (Surface)' : `${depth} m`;
      statusDepth.textContent = `${depth} m`;

      updateSliceOpacities();
    });
  });

  // Vertical Exaggeration Slider
  exaggerationSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.verticalExaggeration = val;
    exaggerationVal.textContent = `${val.toFixed(1)}x`;
    statusExag.textContent = `${val.toFixed(1)}x`;
    updateSlicePositions();
  });

  // Water Column Stack Toggle
  columnModeToggle.addEventListener('change', (e) => {
    state.columnStackMode = e.target.checked;
    updateSliceOpacities();
  });

  // Argo Toggle
  argoToggle.addEventListener('change', (e) => {
    state.showArgo = e.target.checked;
    argoMarkersGroup.visible = state.showArgo;
  });

  // Coastline Toggle
  coastlineToggle.addEventListener('change', (e) => {
    state.showCoastline = e.target.checked;
    coastlineGroup.visible = state.showCoastline;
  });

  // Auto Rotation Toggle
  rotationToggle.addEventListener('change', (e) => {
    state.autoRotate = e.target.checked;
    controls.autoRotate = state.autoRotate;
    controls.autoRotateSpeed = 1.2;
  });

  // Reset Camera View
  resetCamBtn.addEventListener('click', () => {
    camera.position.set(40, -75, 45);
    camera.lookAt(0, 0, -10);
    controls.target.set(0, 0, -12);
    controls.update();
  });

  // Modal Close Button
  modalCloseBtn.addEventListener('click', closeArgoFloatModal);
}

/**
 * Handle Window Resize
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (state.selectedFloat) {
    renderArgoProfileChart(argoChartCanvas, state.selectedFloat.profile);
  }
}

/**
 * Animation Loop & Live FPS Monitoring
 */
function animate(time) {
  requestAnimationFrame(animate);

  // FPS Counter
  frameCount++;
  if (time - lastFpsTime >= 1000) {
    currentFps = Math.round((frameCount * 1000) / (time - lastFpsTime));
    statusFps.textContent = `${currentFps}`;
    frameCount = 0;
    lastFpsTime = time;
  }

  // Float Marker Subtle Pulsing Effect
  if (argoMarkersGroup.visible) {
    const pulseScale = 1.0 + Math.sin(time * 0.004) * 0.12;
    argoMarkersGroup.children.forEach(group => {
      const halo = group.children[1];
      if (halo) {
        halo.scale.set(pulseScale, pulseScale, 1);
        halo.rotation.z += 0.01;
      }
    });
  }

  controls.update();
  renderer.render(scene, camera);
}

/**
 * App Bootstrap
 */
async function main() {
  console.log('Initializing OceanView 3D (INCOIS SIH26067)...');
  initScene();
  setupUIEvents();
  await loadAndRenderAllSlices();
  await loadAndRenderArgoFloats();
  animate(performance.now());
  console.log('✓ OceanView 3D initialized successfully.');
}

main().catch(err => {
  console.error('Fatal initialization error in OceanView 3D:', err);
});
