/**
 * ==============================================================================
 * OceanView 3D - INCOIS / MoES SIH26067 Oceanographic Telemetry System
 * 
 * Features:
 * - 🇮🇳 Realistic 3D Indian Subcontinent Landmass & Topography
 * - 🌊 60 FPS Hydrodynamic Circulation & Current Vector Flow Field
 * - 📡 INCOIS Argo Profiling Float Markers & CTD Vertical Profile Analytics
 * - 🤖 Samudra AI / OceanGPT Intelligent Assistant (Gemini / Groq / Knowledge Engine)
 * ==============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getViridisColor, getViridisCssGradient } from './utils/viridis.js';
import { fetchTileData, fetchArgoPositions, SUPPORTED_DEPTHS, GEO_EXTENT } from './utils/dataLoader.js';
import { createCoastlineGroup, geoToScene } from './utils/coastline.js';
import { renderArgoProfileChart } from './utils/chartRenderer.js';
import { CurrentVectorField } from './utils/currentVectorField.js';
import { OceanAIAssistant } from './utils/oceanAI.js';

// Application State
const state = {
  variable: 'temperature',
  selectedDepth: 0,
  verticalExaggeration: 15.0,
  columnStackMode: true,
  showArgo: true,
  showCoastline: true,
  showCurrents: true,
  autoRotate: false,
  activeDate: '2025-09-20',
  selectedFloat: null
};

// Scene Dimensions
const PLANE_WIDTH = 60;
const PLANE_HEIGHT = 50;
const BASE_Z_SCALE = 0.02;

// Three.js Globals
let scene, camera, renderer, controls;
let depthMeshGroup, coastlineGroup, argoMarkersGroup, boundingBoxGroup, currentVectorField;
const sliceDataCache = new Map();
const sliceMeshes = new Map();
let argoFloatsData = [];
const argoMeshes = [];

// AI Assistant
const oceanAI = new OceanAIAssistant();

// Raycasting & Telemetry
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9999, -9999);

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

// AI Chatbot DOM
const aiChatLauncher = document.getElementById('ai-chat-launcher');
const aiChatWindow = document.getElementById('ai-chat-window');
const btnAiClose = document.getElementById('btn-ai-close');
const aiMessagesList = document.getElementById('ai-messages-list');
const aiChatForm = document.getElementById('ai-chat-form');
const aiUserInput = document.getElementById('ai-user-input');
const aiChips = document.querySelectorAll('.ai-chip');

/**
 * 1. Initialize Scene, Camera, Lighting & 3D India Cartography
 */
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b16);
  scene.fog = new THREE.FogExp2(0x070b16, 0.002);

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 1200);
  camera.up.set(0, 0, 1);
  camera.position.set(25, -78, 48);
  camera.lookAt(0, 0, -8);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasContainer.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.minDistance = 15;
  controls.maxDistance = 300;
  controls.maxPolarAngle = Math.PI / 2 + 0.35;
  controls.target.set(0, 0, -10);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.1);
  dirLight1.position.set(50, -50, 80);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 0.6);
  dirLight2.position.set(-60, 40, -40);
  scene.add(dirLight2);

  // Container Groups
  depthMeshGroup = new THREE.Group();
  depthMeshGroup.name = "DepthSlicesGroup";
  scene.add(depthMeshGroup);

  argoMarkersGroup = new THREE.Group();
  argoMarkersGroup.name = "ArgoMarkersGroup";
  scene.add(argoMarkersGroup);

  // Realistic Solid India Cartography with Topography
  coastlineGroup = createCoastlineGroup(PLANE_WIDTH, PLANE_HEIGHT);
  scene.add(coastlineGroup);

  // Dynamic 60 FPS Flow Vector Arrows
  currentVectorField = new CurrentVectorField(scene, PLANE_WIDTH, PLANE_HEIGHT);

  createBoundingBoxGuides();

  if (cbGradient) {
    cbGradient.style.background = getViridisCssGradient();
  }

  // Event Listeners
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('click', onCanvasClick);
}

function createBoundingBoxGuides() {
  boundingBoxGroup = new THREE.Group();
  boundingBoxGroup.name = "BoundingVolumeGuides";

  const halfW = PLANE_WIDTH / 2;
  const halfH = PLANE_HEIGHT / 2;
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

function updateBoundingGuides() {
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
 * 2. Render Indian Ocean Depth Slices
 */
async function loadAndRenderAllSlices() {
  depthMeshGroup.clear();
  sliceMeshes.clear();

  let globalMin = Infinity;
  let globalMax = -Infinity;

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

  if (state.variable === 'temperature') {
    globalMin = Math.max(1.5, globalMin);
    globalMax = Math.min(32.0, globalMax);
  } else {
    globalMin = Math.max(32.5, globalMin);
    globalMax = Math.min(37.5, globalMax);
  }

  updateColorbarUI(globalMin, globalMax);

  loadedSlices.forEach(({ depth, tileData }) => {
    const mesh = createDepthSliceMesh(depth, tileData, globalMin, globalMax);
    sliceMeshes.set(depth, mesh);
    depthMeshGroup.add(mesh);
  });

  updateSlicePositions();
  updateSliceOpacities();
}

function createDepthSliceMesh(depth, tileData, vMin, vMax) {
  const GRID_SIZE = 36;
  const geometry = new THREE.PlaneGeometry(
    PLANE_WIDTH,
    PLANE_HEIGHT,
    GRID_SIZE - 1,
    GRID_SIZE - 1
  );

  const colors = [];
  const valRange = vMax - vMin || 1.0;
  const posAttribute = geometry.attributes.position;
  const vertexCount = posAttribute.count;

  for (let k = 0; k < vertexCount; k++) {
    const row = Math.floor(k / GRID_SIZE);
    const col = k % GRID_SIZE;
    const latIdx = (GRID_SIZE - 1) - row;
    const lonIdx = col;

    const val = (tileData.values && tileData.values[latIdx] && tileData.values[latIdx][lonIdx] !== undefined)
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

function updateSlicePositions() {
  sliceMeshes.forEach((mesh, depth) => {
    mesh.position.z = -depth * BASE_Z_SCALE * state.verticalExaggeration;
  });

  updateBoundingGuides();
  updateArgoMarkerPositions();
}

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
 * 3. In-Situ Argo Profiling Float Markers & Tethers
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

    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      emissive: 0xff6200,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.2
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    group.add(sphere);

    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    group.add(halo);

    const tetherGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 10)
    ]);
    const tetherMat = new THREE.LineDashedMaterial({
      color: 0xffaa00,
      dashSize: 0.8,
      gapSize: 0.6,
      transparent: true,
      opacity: 0.5
    });
    const tether = new THREE.Line(tetherGeom, tetherMat);
    tether.name = 'tether';
    group.add(tether);

    argoMarkersGroup.add(group);
    argoMeshes.push(sphere);
  });

  updateArgoMarkerPositions();
}

function updateArgoMarkerPositions() {
  argoMarkersGroup.children.forEach(group => {
    const floatItem = group.userData.floatData;
    if (!floatItem) return;

    const scenePos = geoToScene(floatItem.lon, floatItem.lat, PLANE_WIDTH, PLANE_HEIGHT);
    const z = -floatItem.currentDepth * BASE_Z_SCALE * state.verticalExaggeration;

    group.position.set(scenePos.x, scenePos.y, z);

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
 * 4. Raycasting & Tooltips
 */
function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

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

  const activeMesh = sliceMeshes.get(state.selectedDepth);
  if (activeMesh) {
    const planeIntersects = raycaster.intersectObject(activeMesh, false);
    if (planeIntersects.length > 0) {
      const hit = planeIntersects[0];
      const localPoint = hit.point;

      const u = (localPoint.x + PLANE_WIDTH / 2) / PLANE_WIDTH;
      const v = (localPoint.y + PLANE_HEIGHT / 2) / PLANE_HEIGHT;

      const lon = GEO_EXTENT.minLon + u * (GEO_EXTENT.maxLon - GEO_EXTENT.minLon);
      const lat = GEO_EXTENT.minLat + v * (GEO_EXTENT.maxLat - GEO_EXTENT.minLat);

      const tileData = activeMesh.userData.tileData;
      let valStr = '';
      if (tileData && tileData.values) {
        const GRID_SIZE = 36;
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

function onCanvasClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const floatIntersects = raycaster.intersectObjects(argoMeshes, false);

  if (floatIntersects.length > 0) {
    const hitSphere = floatIntersects[0].object;
    const floatData = hitSphere.parent.userData.floatData;
    openArgoFloatModal(floatData);
  }
}

function openArgoFloatModal(floatData) {
  state.selectedFloat = floatData;
  modalFloatId.textContent = `INCOIS ARGO #${floatData.id}`;
  modalFloatPos.textContent = `${floatData.lat.toFixed(2)}°N, ${floatData.lon.toFixed(2)}°E`;
  modalFloatDepth.textContent = `${floatData.currentDepth} m`;
  modalFloatStatus.textContent = `${floatData.status} (Cycle #${floatData.cycleNumber})`;
  modalFloatPlatform.textContent = floatData.platform || 'Apex CTD Profiler';

  argoModalBackdrop.classList.remove('hidden');

  requestAnimationFrame(() => {
    renderArgoProfileChart(argoChartCanvas, floatData.profile);
  });
}

function closeArgoFloatModal() {
  argoModalBackdrop.classList.add('hidden');
  state.selectedFloat = null;
}

/**
 * 5. UI Controls & Samudra AI Chatbot Wiring
 */
function setupUIEvents() {
  variableSelect.addEventListener('change', (e) => {
    state.variable = e.target.value;
    statusVar.textContent = (state.variable === 'temperature') ? 'Temperature (°C)' : 'Salinity (PSU)';
    loadAndRenderAllSlices();
  });

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

  exaggerationSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.verticalExaggeration = val;
    exaggerationVal.textContent = `${val.toFixed(1)}x`;
    statusExag.textContent = `${val.toFixed(1)}x`;
    updateSlicePositions();
  });

  columnModeToggle.addEventListener('change', (e) => {
    state.columnStackMode = e.target.checked;
    updateSliceOpacities();
  });

  argoToggle.addEventListener('change', (e) => {
    state.showArgo = e.target.checked;
    argoMarkersGroup.visible = state.showArgo;
  });

  coastlineToggle.addEventListener('change', (e) => {
    state.showCoastline = e.target.checked;
    coastlineGroup.visible = state.showCoastline;
  });

  rotationToggle.addEventListener('change', (e) => {
    state.autoRotate = e.target.checked;
    controls.autoRotate = state.autoRotate;
    controls.autoRotateSpeed = 1.2;
  });

  resetCamBtn.addEventListener('click', () => {
    camera.position.set(25, -78, 48);
    camera.lookAt(0, 0, -8);
    controls.target.set(0, 0, -10);
    controls.update();
  });

  modalCloseBtn.addEventListener('click', closeArgoFloatModal);

  // --------------------------------------------------------------------------
  // SAMUDRA AI CHATBOT INTERACTION
  // --------------------------------------------------------------------------
  aiChatLauncher.addEventListener('click', () => {
    aiChatWindow.classList.toggle('hidden');
    if (!aiChatWindow.classList.contains('hidden')) {
      aiUserInput.focus();
    }
  });

  btnAiClose.addEventListener('click', () => {
    aiChatWindow.classList.add('hidden');
  });

  // Suggestion Chips
  aiChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      handleUserChatMessage(q);
    });
  });

  // Form Submit
  aiChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = aiUserInput.value.trim();
    if (!q) return;
    aiUserInput.value = '';
    handleUserChatMessage(q);
  });
}

function appendChatMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `ai-msg ai-msg-${sender}`;
  
  // Format simple markdown into HTML
  let formatted = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>');

  if (formatted.includes('<li>')) {
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  msgDiv.innerHTML = `<div class="msg-bubble"><p>${formatted}</p></div>`;
  aiMessagesList.appendChild(msgDiv);
  aiMessagesList.scrollTop = aiMessagesList.scrollHeight;
}

async function handleUserChatMessage(query) {
  appendChatMessage('user', query);

  // Typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-msg ai-msg-bot';
  typingDiv.id = 'ai-typing-indicator';
  typingDiv.innerHTML = `<div class="msg-bubble"><p><em>🌊 Samudra AI is analyzing oceanographic data...</em></p></div>`;
  aiMessagesList.appendChild(typingDiv);
  aiMessagesList.scrollTop = aiMessagesList.scrollHeight;

  try {
    const answer = await oceanAI.askQuestion(query);
    const typing = document.getElementById('ai-typing-indicator');
    if (typing) typing.remove();
    appendChatMessage('bot', answer);
  } catch (err) {
    const typing = document.getElementById('ai-typing-indicator');
    if (typing) typing.remove();
    appendChatMessage('bot', '⚠️ An error occurred while retrieving telemetry. Please try again.');
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (state.selectedFloat) {
    renderArgoProfileChart(argoChartCanvas, state.selectedFloat.profile);
  }
}

/**
 * 6. Animation Loop (60 FPS)
 */
function animate(time) {
  requestAnimationFrame(animate);

  frameCount++;
  if (time - lastFpsTime >= 1000) {
    currentFps = Math.round((frameCount * 1000) / (time - lastFpsTime));
    statusFps.textContent = `${currentFps}`;
    frameCount = 0;
    lastFpsTime = time;
  }

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

  if (currentVectorField) {
    currentVectorField.update(time);
  }

  controls.update();
  renderer.render(scene, camera);
}

/**
 * 7. Bootstrap
 */
async function main() {
  initScene();
  setupUIEvents();
  await loadAndRenderAllSlices();
  await loadAndRenderArgoFloats();
  animate(performance.now());
}

main().catch(err => console.error('Initialization error:', err));
