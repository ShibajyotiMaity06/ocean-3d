import * as THREE from 'three';
import { GEO_EXTENT } from './dataLoader.js';

// Coordinates (Lon, Lat) outlining the Indian Subcontinent coastline & major features
const INDIA_COASTLINE_GEO = [
  [68.5, 23.8], // Kutch north
  [68.2, 23.0], // Kutch tip
  [69.8, 22.8], // Gulf of Kutch inner
  [69.0, 22.3], // Dwarka / Saurashtra west
  [69.8, 20.8], // Porbandar / Veraval south
  [71.0, 20.7], // Diu
  [72.2, 21.7], // Gulf of Khambhat inner
  [72.8, 21.2], // Surat
  [72.8, 19.0], // Mumbai
  [73.3, 16.9], // Ratnagiri
  [73.8, 15.5], // Goa
  [74.5, 14.2], // Karwar / Bhatkal
  [74.8, 12.9], // Mangalore
  [75.8, 11.2], // Kozhikode
  [76.2, 9.9],  // Kochi
  [77.5, 8.1],  // Kanyakumari (Cape Comorin - southernmost tip)
  [78.1, 8.8],  // Tuticorin / Gulf of Mannar
  [79.3, 9.3],  // Rameswaram
  [79.8, 10.8], // Point Calimere
  [80.3, 13.1], // Chennai
  [80.1, 14.5], // Nellore
  [80.6, 16.0], // Machilipatnam / Krishna delta
  [82.2, 17.0], // Kakinada / Godavari delta
  [83.3, 17.7], // Visakhapatnam
  [85.0, 19.3], // Gopalpur
  [85.8, 19.8], // Puri / Chilika Lake
  [86.9, 20.8], // Paradip / Mahanadi delta
  [88.2, 21.6], // Sagar Island / Sundarbans
  [89.5, 21.8], // Bangladesh Sundarbans
  [91.8, 22.3], // Chittagong
  [92.8, 20.5]  // Myanmar Rakhine coast
];

// Sri Lanka outline
const SRI_LANKA_GEO = [
  [79.8, 9.8],
  [80.2, 9.6],
  [81.3, 8.6],
  [81.8, 7.4],
  [81.3, 6.2],
  [80.5, 5.9],
  [79.9, 6.9],
  [79.8, 8.0],
  [79.8, 9.8]
];

/**
 * Converts Lon/Lat to 3D Scene coordinates (X, Y)
 * @param {number} lon 
 * @param {number} lat 
 * @param {number} planeWidth 
 * @param {number} planeHeight 
 * @param {object} extent 
 * @returns {THREE.Vector3}
 */
export function geoToScene(lon, lat, planeWidth, planeHeight, extent = GEO_EXTENT) {
  const u = (lon - extent.minLon) / (extent.maxLon - extent.minLon);
  const v = (lat - extent.minLat) / (extent.maxLat - extent.minLat);
  const x = (u - 0.5) * planeWidth;
  const y = (v - 0.5) * planeHeight;
  return new THREE.Vector3(x, y, 0);
}

/**
 * Creates 3D coastline vector lines and geographic contextual markers at z=0 (surface)
 * @param {number} planeWidth 
 * @param {number} planeHeight 
 * @returns {THREE.Group}
 */
export function createCoastlineGroup(planeWidth = 60, planeHeight = 50) {
  const group = new THREE.Group();
  group.name = "CoastlineContext";

  // 1. Mainland Indian Coastline
  const mainPoints = INDIA_COASTLINE_GEO.map(([lon, lat]) => 
    geoToScene(lon, lat, planeWidth, planeHeight)
  );
  
  // Create smooth curve through coastline keypoints
  const curve = new THREE.CatmullRomCurve3(mainPoints, false, 'centripetal', 0.15);
  const smoothPoints = curve.getPoints(120);

  const mainGeom = new THREE.BufferGeometry().setFromPoints(smoothPoints);
  
  // Luminous electric cyan line material for deep oceanic scene
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00e5ff,
    linewidth: 2.5,
    transparent: true,
    opacity: 0.95
  });

  const mainLine = new THREE.Line(mainGeom, lineMat);
  group.add(mainLine);

  // 2. Sri Lanka Outline
  const slPoints = SRI_LANKA_GEO.map(([lon, lat]) => 
    geoToScene(lon, lat, planeWidth, planeHeight)
  );
  const slGeom = new THREE.BufferGeometry().setFromPoints(slPoints);
  const slLine = new THREE.LineLoop(slGeom, new THREE.LineBasicMaterial({
    color: 0x00e5ff,
    linewidth: 2,
    transparent: true,
    opacity: 0.85
  }));
  group.add(slLine);

  // 3. Prominent Coastal Ports / Landmark Dots
  const landmarks = [
    { name: "Mumbai", lon: 72.8, lat: 19.0 },
    { name: "Chennai", lon: 80.3, lat: 13.1 },
    { name: "Kochi", lon: 76.2, lat: 9.9 },
    { name: "Visakhapatnam", lon: 83.3, lat: 17.7 },
    { name: "Kolkata / Sundarbans", lon: 88.3, lat: 22.0 },
    { name: "Kanyakumari", lon: 77.5, lat: 8.1 }
  ];

  const dotGeom = new THREE.SphereGeometry(0.35, 12, 12);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });

  landmarks.forEach(lm => {
    const pos = geoToScene(lm.lon, lm.lat, planeWidth, planeHeight);
    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.position.copy(pos);
    dot.position.z += 0.05; // slightly above surface plane
    group.add(dot);
  });

  return group;
}
