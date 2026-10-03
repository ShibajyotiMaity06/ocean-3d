/**
 * OceanView 3D - Data Loader Module
 * 
 * Supports reading pre-saved HYCOM/Argo JSON files from:
 *   - ./data/tiles/{variable}_d{depth}_{date}.json
 *   - ./data/argo/positions_{date}.json
 * 
 * Includes an automated robust fallback procedural synthetic generator
 * if static files are not found (404 / demo mode), ensuring 100% crash-free operation.
 */

// Supported standard depths (meters)
export const SUPPORTED_DEPTHS = [0, 100, 200, 500, 1000, 2000];

// Geographic bounding box for North Indian Ocean (Arabian Sea, Bay of Bengal, Equatorial)
export const GEO_EXTENT = {
  minLon: 60.0,
  maxLon: 95.0,
  minLat: 2.0,
  maxLat: 26.0
};

// Hand-rolled smooth 2D layered noise for synthetic fallback
function smoothNoise2D(x, y, seed = 1.0) {
  const n1 = Math.sin(x * 0.18 + seed * 1.3) * Math.cos(y * 0.18 + seed * 0.9);
  const n2 = Math.sin(x * 0.37 - y * 0.28 + seed * 2.1) * 0.5;
  const n3 = Math.cos(x * 0.72 + y * 0.65 + seed * 3.7) * 0.25;
  const n4 = Math.sin(Math.sqrt(x * x + y * y) * 0.22 - seed) * 0.2;
  return (n1 + n2 + n3 + n4) / 1.95; // roughly in [-1, 1]
}

/**
 * Procedurally generates a 40x40 synthetic ocean slice grid.
 * @param {string} variable - 'temperature' or 'salinity'
 * @param {number} depth - Depth in meters (0, 100, 200, 500, 1000, 2000)
 * @param {string} date - Date string
 * @returns {object} Tile data object
 */
export function generateSyntheticTile(variable = 'temperature', depth = 0, date = '2023-03-21') {
  const GRID_SIZE = 40;
  const lats = [];
  const lons = [];
  const values = [];

  const latStep = (GEO_EXTENT.maxLat - GEO_EXTENT.minLat) / (GRID_SIZE - 1);
  const lonStep = (GEO_EXTENT.maxLon - GEO_EXTENT.minLon) / (GRID_SIZE - 1);

  for (let i = 0; i < GRID_SIZE; i++) {
    lats.push(Number((GEO_EXTENT.minLat + i * latStep).toFixed(3)));
  }
  for (let j = 0; j < GRID_SIZE; j++) {
    lons.push(Number((GEO_EXTENT.minLon + j * lonStep).toFixed(3)));
  }

  // Realistic Oceanographic physics for North Indian Ocean
  // 1. Temperature: Surface ~28°C-30°C in tropics, dropping down to ~2.5°C at 2000m (thermocline)
  // 2. Salinity: Arabian Sea (west) high ~36.5 PSU (high evaporation), Bay of Bengal (east) ~33.0 PSU (Ganges/Brahmaputra runoff)

  let baseVal, rangeVal;
  if (variable === 'temperature') {
    // Thermocline curve: Surface (28C) -> 100m (23C) -> 200m (16C) -> 500m (10C) -> 1000m (6C) -> 2000m (2.5C)
    const thermoclineFactor = Math.exp(-depth / 420);
    const deepTemp = 2.2 + (2000 - depth) * 0.001;
    baseVal = 2.5 + 26.0 * thermoclineFactor;
    rangeVal = 3.5 * Math.max(0.15, thermoclineFactor);
  } else {
    // Salinity (PSU): 33.0 to 37.0 PSU
    // Surface has strong East-West gradient; deep water homogenizes around 34.7 PSU
    const surfaceFactor = Math.max(0.1, 1.0 - depth / 1200);
    baseVal = 34.8;
    rangeVal = 2.0 * surfaceFactor;
  }

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < GRID_SIZE; i++) {
    const row = [];
    const lat = lats[i];
    for (let j = 0; j < GRID_SIZE; j++) {
      const lon = lons[j];

      // Normalized coordinates
      const nx = j / (GRID_SIZE - 1);
      const ny = i / (GRID_SIZE - 1);

      // Multi-scale noise
      const noise = smoothNoise2D(j * 0.7, i * 0.7, (depth + 1) * 0.015);

      let val;
      if (variable === 'temperature') {
        // Warmer near equator (ny close to 0) and in equatorial warm pool
        const latGradient = (1.0 - ny * 0.35) * 1.5;
        // Mesoscale warm/cold eddies
        const eddy = Math.sin(nx * 8.0 + ny * 6.0) * 0.8 * (1.0 - depth / 2500);
        val = baseVal + (noise * rangeVal) + latGradient * (depth < 500 ? 1 : 0.2) + eddy;
        val = Math.max(1.5, Math.min(32.5, val));
      } else {
        // Salinity: Western side (Arabian Sea, nx < 0.4) is more saline; Eastern side (Bay of Bengal, nx > 0.6) has fresh runoff
        const lonSalinityGradient = (0.5 - nx) * 1.8 * (1.0 - depth / 1500);
        val = baseVal + (noise * rangeVal * 0.6) + lonSalinityGradient;
        val = Math.max(32.5, Math.min(37.5, val));
      }

      val = Number(val.toFixed(2));
      if (val < min) min = val;
      if (val > max) max = val;
      row.push(val);
    }
    values.push(row);
  }

  return {
    variable,
    depth,
    date,
    lats,
    lons,
    values,
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2))
  };
}

/**
 * Generates synthetic Argo float array positioned across the Indian Ocean
 * @param {string} date 
 * @returns {Array<object>}
 */
export function generateSyntheticArgoFloats(date = '2023-03-21') {
  const floatSeeds = [
    { id: "2902150", lat: 14.5, lon: 67.8, depth: 420 },
    { id: "2902151", lat: 18.2, lon: 70.1, depth: 850 },
    { id: "2902152", lat: 11.0, lon: 65.5, depth: 150 },
    { id: "2902153", lat: 7.5, lon: 72.3, depth: 1200 },
    { id: "2902154", lat: 16.8, lon: 86.4, depth: 310 },
    { id: "2902155", lat: 13.2, lon: 83.9, depth: 680 },
    { id: "2902156", lat: 9.4, lon: 88.2, depth: 1450 },
    { id: "2902157", lat: 5.1, lon: 80.5, depth: 950 },
    { id: "2902158", lat: 21.0, lon: 66.8, depth: 180 },
    { id: "2902159", lat: 19.5, lon: 87.5, depth: 520 },
    { id: "2902160", lat: 8.8, lon: 76.2, depth: 75 },
    { id: "2902161", lat: 12.0, lon: 74.0, depth: 290 },
    { id: "2902162", lat: 15.0, lon: 89.5, depth: 1100 },
    { id: "2902163", lat: 4.2, lon: 63.5, depth: 1380 },
    { id: "2902164", lat: 17.5, lon: 72.8, depth: 480 },
    { id: "2902165", lat: 6.8, lon: 85.0, depth: 820 },
    { id: "2902166", lat: 10.5, lon: 92.0, depth: 610 },
    { id: "2902167", lat: 22.8, lon: 68.2, depth: 110 }
  ];

  return floatSeeds.map((f, idx) => {
    // Generate realistic CTD profile (Conductivity-Temperature-Depth)
    const profileDepths = [0, 20, 50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];
    const surfaceTemp = 28.5 + Math.sin(f.lat * 0.3) * 1.5;
    const surfaceSal = f.lon < 75 ? 36.2 : 33.6; // Arabian Sea vs Bay of Bengal

    const profile = profileDepths.map(d => {
      const thermocline = Math.exp(-d / 380);
      const temp = 2.4 + (surfaceTemp - 2.4) * thermocline + (Math.random() * 0.2 - 0.1);
      const sal = 34.7 + (surfaceSal - 34.7) * Math.exp(-d / 600) + (Math.random() * 0.1 - 0.05);
      return {
        depth: d,
        temp: Number(temp.toFixed(2)),
        salinity: Number(sal.toFixed(2))
      };
    });

    return {
      id: f.id,
      name: `INCOIS Argo #${f.id}`,
      wmo: f.id,
      lat: f.lat,
      lon: f.lon,
      currentDepth: f.depth,
      date: date,
      platform: "Apex Profiling Float",
      status: "Active Telemetry",
      cycleNumber: 42 + idx * 7,
      profile: profile
    };
  });
}

/**
 * Fetches tile JSON from public directory or falls back to synthetic data.
 * @param {string} variable - 'temperature' | 'salinity'
 * @param {number} depth - 0, 100, 200, 500, 1000, 2000
 * @param {string} date - '2023-03-21'
 * @returns {Promise<object>}
 */
export async function fetchTileData(variable, depth, date = '2023-03-21') {
  const url = `./data/tiles/${variable}_d${depth}_${date}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[DataLoader] Tile not found: ${url} (HTTP ${res.status}). Using synthetic fallback.`);
      return generateSyntheticTile(variable, depth, date);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[DataLoader] Fetch failed for ${url}. Using synthetic fallback.`, err);
    return generateSyntheticTile(variable, depth, date);
  }
}

/**
 * Fetches Argo float positions or falls back to synthetic floats.
 * @param {string} date 
 * @returns {Promise<Array<object>>}
 */
export async function fetchArgoPositions(date = '2023-03-21') {
  const url = `./data/argo/positions_${date}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[DataLoader] Argo positions not found: ${url} (HTTP ${res.status}). Using synthetic fallback.`);
      return generateSyntheticArgoFloats(date);
    }
    const data = await res.json();
    // Ensure profile structure is populated
    return data.map((item, idx) => {
      if (!item.profile) {
        const synth = generateSyntheticArgoFloats(date)[idx % 18];
        return { ...synth, ...item };
      }
      return item;
    });
  } catch (err) {
    console.warn(`[DataLoader] Argo fetch failed for ${url}. Using synthetic fallback.`, err);
    return generateSyntheticArgoFloats(date);
  }
}
