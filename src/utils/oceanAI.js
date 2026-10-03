/**
 * OceanView 3D - Samudra AI / OceanGPT Intelligent Oceanographic Assistant
 * 
 * Automatically reads backend / environment API keys from .env:
 * - VITE_GEMINI_API_KEY (Google Gemini 1.5 Flash)
 * - VITE_GROQ_API_KEY (Groq Llama 3.1)
 * - VITE_AI_BACKEND_URL (Custom Backend Server / Proxy)
 * - Seamless automatic fallback to built-in Oceanographic Knowledge Engine
 */

export const SUGGESTED_QUESTIONS = [
  "Why is Arabian Sea saltier than Bay of Bengal?",
  "What is the Thermocline layer and at what depth does it form?",
  "How do INCOIS Argo profiling floats measure 0-2000m CTD data?",
  "What marine life lives in the 1000m+ Midnight Abyss?",
  "Explain the Indian Ocean Dipole (IOD) and Monsoon connection.",
  "What is an Oxygen Minimum Zone (OMZ) in the Indian Ocean?"
];

// Offline Oceanographic Knowledge Base with deep scientific accuracy
const OCEAN_KNOWLEDGE_BASE = {
  salinity: {
    keywords: ["salinity", "salty", "saltier", "psu", "arabian sea", "bay of bengal"],
    response: `### 🌊 Salinity Contrast: Arabian Sea vs. Bay of Bengal

The Northern Indian Ocean exhibits a stark salinity contrast:

1. **Arabian Sea (High Salinity ~36.5 to 37.2 PSU)**:
   - **Excess Evaporation**: Arid desert winds from Arabia and Thar create intense surface evaporation ($E > P$).
   - **Low River Inflow**: Minimal freshwater discharge from surrounding landmasses.
   - **High Density Water Masses**: Forms Arabian Sea High Salinity Water (ASHSW) sinking to sub-surface layers.

2. **Bay of Bengal (Low Salinity ~31.0 to 33.5 PSU)**:
   - **Massive River Runoff**: Receives immense fresh water from the **Ganges, Brahmaputra, Mahanadi, Godavari, and Krishna** rivers (~$1.6 \\times 10^{12} \\text{ m}^3/\\text{year}$).
   - **Heavy Monsoonal Precipitation**: High rainfall directly over the basin ($P > E$).
   - **Strong Barrier Layer**: Fresh surface lens creates intense vertical stratification, trapping solar heat.`
  },

  thermocline: {
    keywords: ["thermocline", "temperature", "mixed layer", "mld", "depth", "pycnocline"],
    response: `### 🌡️ Ocean Thermal Stratification & The Thermocline

In the tropical Indian Ocean, water temperature drops rapidly with depth across three main zones:

* **1. Epipelagic Mixed Layer (0 - 100m)**:
  * Warm, sunlit surface layer ($28.0^\\circ\\text{C} - 29.5^\\circ\\text{C}$) thoroughly mixed by monsoonal surface winds.
* **2. Permanent Thermocline (100 - 800m)**:
  * Zone of steepest temperature gradient where temperature plummets from **$26^\\circ\\text{C}$ to $8^\\circ\\text{C}$**.
  * Acts as a physical density barrier separating warm surface oxygenated water from dense, nutrient-rich deep water.
* **3. Deep Abyssal Water (1000m - 4000m+)**:
  * Near-freezing Antarctic Intermediate Water (AAIW) and Indian Deep Water ($1.8^\\circ\\text{C} - 2.5^\\circ\\text{C}$).`
  },

  argo: {
    keywords: ["argo", "float", "ctd", "incois", "telemetry", "profiling", "buoy", "sensor"],
    response: `### 📡 INCOIS Argo Profiling Float Architecture

**Argo floats** are autonomous robotic ocean sensor platforms operating on a continuous 10-day cycle:

1. **Descent to Drift Depth (Day 1)**: Sinks to **1,000 meters (parking depth)** via internal hydraulic ballast.
2. **Subsurface Drift (Days 1 - 9)**: Drifts with deep oceanic currents for ~9 days collecting Lagrangian circulation data.
3. **Descent to Profile Depth (Day 10)**: Sinks further to **2,000 meters**.
4. **Ascent & Continuous CTD Sampling**: Ascends over 6 hours while continuously measuring **Conductivity (Salinity), Temperature, and Pressure (Depth)**.
5. **Satellite Telemetry**: Transmits full CTD profile data via **Iridium / INSAT satellites** directly to INCOIS Hyderabad servers.`
  },

  marine_life: {
    keywords: ["fish", "fishes", "whale", "shark", "squid", "anglerfish", "abyss", "creature", "marine life"],
    response: `### 🐋 Oceanic Depth Stratification & Marine Wildlife

* **☀️ Sunlit Zone (0 - 200m)**:
  * High photosynthesis ($100\\% \\text{ PAR}$). Home to **Antarctic Blue Whales, Bottlenose Dolphins, Oceanic Sharks, Giant Manta Rays, and Yellowfin Tuna**.
* **🌌 Twilight Zone (200 - 1000m)**:
  * Faint blue light. Inhabited by **Giant Bioluminescent Squid (*Architeuthis*), Crown Medusa Jellyfish, and Myctophid Lanternfish** with light-emitting photophores.
* **🌑 Midnight Abyss (1000 - 4500m)**:
  * Total darkness, crushing hydrostatic pressure ($>200\\text{ atm}$). Specialized organisms include **Deep-Sea Anglerfish** (bioluminescent bacterial lure), **Pelican Gulper Eels**, and **Abyssal Dumbo Octopods**.`
  },

  monsoon: {
    keywords: ["monsoon", "iod", "dipole", "climate", "wind", "somali", "current"],
    response: `### 🌪️ Indian Ocean Dipole (IOD) & Monsoons

1. **Indian Ocean Dipole (IOD)**:
   * **Positive IOD**: Warmer sea surface temperatures (SST) in western Indian Ocean (Arabian Sea) and cooler waters near Sumatra. Leads to **heavy rainfall/flooding in India and East Africa**.
   * **Negative IOD**: Warmer SST in eastern Indian Ocean. Associated with **droughts or weak monsoons in India**.
2. **Semi-Annual Current Reversals**:
   * The North Indian Ocean is the only ocean basin that **completely reverses its surface currents twice a year** driven by the Southwest (Summer) and Northeast (Winter) Monsoons.`
  },

  omz: {
    keywords: ["omz", "oxygen", "hypoxia", "minimum zone", "dead zone"],
    response: `### 🫧 Oxygen Minimum Zones (OMZ) in the Indian Ocean

The Northern Arabian Sea and Bay of Bengal host intense **Oxygen Minimum Zones ($<0.5\\text{ ml/L O}_2$)** between **200m and 800m depth**:

* **High Biological Productivity**: Upwelling fuels massive surface plankton blooms.
* **Intense Respiration**: When organic matter sinks, aerobic bacteria consume virtually all dissolved oxygen decomposing it.
* **Denitrification**: Specialized anaerobic bacteria convert nitrate into nitrous oxide ($N_2O$).`
  }
};

export class OceanAIAssistant {
  constructor() {
    // Read from environment variables
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
    this.backendUrl = import.meta.env.VITE_AI_BACKEND_URL || '';
  }

  /**
   * Generates intelligent answer to user query using backend key or knowledge engine
   */
  async askQuestion(query) {
    const q = query.toLowerCase();

    // 1. If backend URL is provided, call backend
    if (this.backendUrl) {
      try {
        const res = await fetch(this.backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.answer || data.response) return data.answer || data.response;
        }
      } catch (e) {
        console.warn('[Samudra AI] Backend proxy request failed, trying direct/fallback.', e);
      }
    }

    // 2. If Gemini API Key is configured in .env
    if (this.geminiApiKey) {
      try {
        const response = await this.callGeminiAPI(query);
        if (response) return response;
      } catch (err) {
        console.warn('[Samudra AI] Gemini API call failed. Using internal knowledge base.', err);
      }
    }

    // 3. If Groq API Key is configured in .env
    if (this.groqApiKey) {
      try {
        const response = await this.callGroqAPI(query);
        if (response) return response;
      } catch (err) {
        console.warn('[Samudra AI] Groq API call failed. Using internal knowledge base.', err);
      }
    }

    // 4. Built-in High-Fidelity Ocean Knowledge Engine Fallback
    return this.generateInternalKnowledgeResponse(q);
  }

  async callGeminiAPI(query) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    const payload = {
      system_instruction: {
        parts: [{ text: "You are Samudra AI, an expert oceanographer and telemetry AI assistant for the INCOIS Indian Ocean 3D Platform. Provide concise, scientifically accurate, beautifully formatted markdown answers about the Indian Ocean, Arabian Sea, Bay of Bengal, Argo CTD floats, thermoclines, salinity, marine biology, currents, and monsoons." }]
      },
      contents: [{ parts: [{ text: query }] }]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  async callGroqAPI(query) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const payload = {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are Samudra AI, an expert oceanographic assistant for INCOIS Indian Ocean 3D Platform. Give crisp, structured, markdown responses about ocean physical properties, Argo CTD floats, and marine biology.' },
        { role: 'user', content: query }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.groqApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content;
  }

  generateInternalKnowledgeResponse(query) {
    for (const key of Object.keys(OCEAN_KNOWLEDGE_BASE)) {
      const entry = OCEAN_KNOWLEDGE_BASE[key];
      if (entry.keywords.some(k => query.includes(k))) {
        return entry.response;
      }
    }

    return `### 🌊 INCOIS Indian Ocean Telemetry System

Regarding **"${query}"**:

The **North Indian Ocean** (Arabian Sea, Bay of Bengal, and Equatorial Basin) is a unique tropical basin characterized by:
* **Semi-Annual Monsoon Wind Reversals** (Southwest Summer vs Northeast Winter).
* **Strong Thermohaline Gradients**: High salinity in the western Arabian Sea ($>36.5\\text{ PSU}$) vs freshwater river discharge in the Bay of Bengal ($<33.0\\text{ PSU}$).
* **Active In-Situ Sensor Telemetry**: Continuous monitoring via **Argo profiling floats (0-2000m)**, **OMNI moored metocean buoys**, and **autonomous underwater gliders**.

*💡 Try selecting a variable in the left sidebar (Temperature, Salinity) or clicking any orange Argo float marker in 3D to view live CTD depth curves!*`;
  }
}
