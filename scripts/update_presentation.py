import os
import pptx
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def delete_slide(prs, index):
    slide_id = prs.slides._sldIdLst[index]
    rId = slide_id.rId
    prs.part.drop_rel(rId)
    del prs.slides._sldIdLst[index]

def set_slide_title(slide, title_text):
    for shape in slide.shapes:
        if shape.name == "TextBox 2" and shape.has_text_frame:
            tf = shape.text_frame
            tf.word_wrap = True
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title_text
            p.font.name = "Arial"
            p.font.size = Pt(21)
            p.font.bold = True
            p.font.color.rgb = RGBColor(15, 23, 42) # Modern dark slate
            return

def style_card_shape(shape):
    # Set soft modern fill and border
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(248, 250, 252) # Soft clean light slate
    shape.line.color.rgb = RGBColor(226, 232, 240) # Subtle modern border
    shape.line.width = Pt(1)

def populate_card(shape, card_title, items, is_pipeline=False):
    if not shape.has_text_frame:
        return
    
    style_card_shape(shape)
    
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.24)
    tf.margin_right = Inches(0.24)
    tf.margin_top = Inches(0.22)
    tf.margin_bottom = Inches(0.22)
    tf.clear()

    # Title Paragraph
    p_title = tf.paragraphs[0]
    p_title.text = card_title
    p_title.font.name = "Arial"
    p_title.font.size = Pt(15)
    p_title.font.bold = True
    p_title.font.color.rgb = RGBColor(2, 132, 199) # Crisp ocean blue accent
    p_title.space_after = Pt(10)

    for item in items:
        p = tf.add_paragraph()
        p.space_after = Pt(7) if not is_pipeline else Pt(5)
        
        if isinstance(item, str):
            run = p.add_run()
            run.text = item
            run.font.name = "Arial"
            run.font.size = Pt(11.5) if is_pipeline else Pt(12)
            if item.strip() in ["▼", "➔", "↳"]:
                p.alignment = PP_ALIGN.CENTER
                run.font.bold = True
                run.font.size = Pt(13)
                run.font.color.rgb = RGBColor(0, 180, 216)
            elif item.startswith("⚡") or item.startswith("✔"):
                run.font.bold = True
                run.font.color.rgb = RGBColor(15, 23, 42)
            else:
                run.font.color.rgb = RGBColor(51, 65, 85)
        elif isinstance(item, tuple) or isinstance(item, list):
            prefix, body = item[0], item[1]
            run_p = p.add_run()
            run_p.text = prefix + (" " if not prefix.endswith(" ") else "")
            run_p.font.name = "Arial"
            run_p.font.size = Pt(11.5) if len(items) >= 5 else Pt(12)
            run_p.font.bold = True
            run_p.font.color.rgb = RGBColor(15, 23, 42)
            
            run_b = p.add_run()
            run_b.text = body
            run_b.font.name = "Arial"
            run_b.font.size = Pt(11.5) if len(items) >= 5 else Pt(12)
            run_b.font.bold = False
            run_b.font.color.rgb = RGBColor(71, 85, 105)

def update_presentation():
    pptx_path = "SIH2026-IDEA-Presentation-Format.pptx"
    prs = pptx.Presentation(pptx_path)

    # Ensure exactly 6 slides
    while len(prs.slides) > 6:
        delete_slide(prs, len(prs.slides) - 1)
    
    print(f"Presentation has {len(prs.slides)} slides.")

    # -------------------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------------------
    s1 = prs.slides[0]
    for shape in s1.shapes:
        if shape.name == "Title 7" and shape.has_text_frame:
            shape.text_frame.text = "SMART INDIA HACKATHON 2026"
            shape.text_frame.paragraphs[0].font.bold = True
            shape.text_frame.paragraphs[0].font.size = Pt(28)
            shape.text_frame.paragraphs[0].font.color.rgb = RGBColor(11, 44, 94)

    # -------------------------------------------------------------------------
    # SLIDE 2: Problem Statement & Proposed Solution
    # -------------------------------------------------------------------------
    s2 = prs.slides[1]
    set_slide_title(s2, "Problem Statement & Proposed Solution")
    
    s2_left_items = [
        ("• The Core Challenge:", "INCOIS produces terabytes of numerical ocean models (HYCOM) and robotic float data (Argo). Currently, scientists must use separate, slow 2D tools (Panoply, ODV) with no 3D sub-surface view."),
        ("• Operational Bottleneck:", "Correlating deep-sea temperatures with Argo floats takes 2–4 hours per cyclone or fishing advisory, requiring manual data conversion."),
        ("• Real-World Impact:", "Over 28 crore coastal citizens and 40+ lakh fishermen rely on these daily ocean forecasts.")
    ]
    populate_card(s2.shapes[3], "Problem Statement", s2_left_items)

    s2_right_items = [
        "⚡ Proposed Solution: OceanView 3D",
        "\"A fast, browser-native 3D ocean visualization engine that renders the ocean from 0m to 2000m depth at 60 FPS.\"",
        ("✔ 3D Depth Slicing:", "6 standard depth levels (0m, 100m, 200m, 500m, 1000m, 2000m) with glowing layer highlights."),
        ("✔ Dynamic Vertical Exaggeration (1x–50x):", "Expands ocean depth to make sub-surface temperature layers clear and easy to read."),
        ("✔ Temperature & Salinity Modes:", "Instant one-click switching with scientific 256-level Viridis colormaps."),
        ("✔ 3D Argo Float Integration:", "18 active floats placed at true 3D depths with instant pop-up profile charts.")
    ]
    populate_card(s2.shapes[4], "Proposed Solution & Key Features", s2_right_items)

    # -------------------------------------------------------------------------
    # SLIDE 3: Technical Approach & Architecture Flowchart
    # -------------------------------------------------------------------------
    s3 = prs.slides[2]
    set_slide_title(s3, "Technical Approach & Architecture")

    s3_left_items = [
        ("• WebGL & Three.js:", "Direct GPU vertex coloring for smooth 60 FPS rendering on student laptops."),
        ("• Custom 2D Canvas Chart:", "Lightweight, built-in depth profile chart (0–2000m) with zero heavy external libraries."),
        ("• Vector Coastline & Landmarks:", "High-precision Indian coastline and key port markers (Mumbai, Chennai, Kochi, Vizag, Kolkata)."),
        ("• Real-Time Hover Telemetry:", "Dual-layer raycasting showing exact coordinates (Lat/Lon) and live ocean values on mouse hover.")
    ]
    populate_card(s3.shapes[3], "Tech Stack & Implementation", s3_left_items)

    s3_right_items = [
        "[1] RAW OCEAN DATA INGESTION",
        "     ↳ HYCOM 1/12° Numerical Models + In-Situ Argo Float Data",
        "▼",
        "[2] LIGHTWEIGHT TILING PIPELINE",
        "     ↳ Compact <120KB JSON data slices with offline fallback",
        "▼",
        "[3] THREE.JS 3D RENDERING ENGINE",
        "     ↳ GPU BufferGeometry, Viridis Colormap & 1x-50x Z-Stacking",
        "▼",
        "[4] USER DASHBOARD & TELEMETRY",
        "     ↳ 60 FPS 3D navigation, live mouse hover & Canvas CTD popups"
    ]
    populate_card(s3.shapes[4], "System Architecture Flowchart", s3_right_items, is_pipeline=True)

    # -------------------------------------------------------------------------
    # SLIDE 4: Impact & Benefits
    # -------------------------------------------------------------------------
    s4 = prs.slides[3]
    set_slide_title(s4, "Impact & Key Benefits")

    s4_left_items = [
        ("• 99% Faster Workflows:", "Cuts multi-depth data analysis from 2–4 hours down to <5 seconds in a single browser window."),
        ("• 95% Less Bandwidth:", "Sliced JSON tiles (<120KB) load instantly even on slow 2G/3G mobile networks."),
        ("• Saves ₹15–25 Lakhs per Lab:", "Eliminates expensive recurring licenses for proprietary desktop software."),
        ("• Zero Installation Needed:", "Runs directly in any modern web browser without installing Python or Fortran tools.")
    ]
    populate_card(s4.shapes[3], "Efficiency & Cost Savings", s4_left_items)

    s4_right_items = [
        ("• 40+ Lakh Fishermen:", "Pinpoints exact fish-rich feeding layers (50–100m depth), saving ₹3,000–₹10,000 in boat diesel per trip."),
        ("• Indian Navy & Maritime Security:", "Maps sub-surface acoustic shadow zones for safer submarine navigation."),
        ("• Cyclone & Disaster Teams (IMD/INCOIS):", "Tracks deep ocean heat content to predict storm intensification before landfall."),
        ("• UN SDG Alignment:", "Supports Life Below Water (SDG 14) and Climate Action (SDG 13).")
    ]
    populate_card(s4.shapes[4], "Target Beneficiaries", s4_right_items)

    # -------------------------------------------------------------------------
    # SLIDE 5: Comparative Analysis & Challenges
    # -------------------------------------------------------------------------
    s5 = prs.slides[4]
    set_slide_title(s5, "Comparative Analysis & Challenges")

    s5_left_items = [
        ("• vs Panoply / ODV:", "Legacy tools are desktop-only and 2D; OceanView 3D is browser-native, instant, and true 3D."),
        ("• vs CesiumJS / Leaflet:", "Standard GIS tools are made for flat land surfaces; they cannot slice 3D sub-surface ocean layers or dynamic depth scales."),
        ("• vs Heavy 3D Apps:", "Zero bundle bloat; custom canvas charts ensure smooth 60 FPS performance on basic laptops.")
    ]
    populate_card(s5.shapes[3], "Comparison with Existing Tools", s5_left_items)

    s5_right_items = [
        ("• Challenge 1: Ocean is 3000km wide but only 2km deep", ""),
        ("  ↳ Solution:", "Dynamic 1x–50x vertical exaggeration slider with depth guides."),
        ("• Challenge 2: Slow internet at sea/harbor", ""),
        ("  ↳ Solution:", "Ultra-compact JSON tiles (<120KB, smaller than one WhatsApp photo)."),
        ("• Challenge 3: Server or network downtime", ""),
        ("  ↳ Solution:", "Built-in procedural ocean physics generator for 100% offline reliability."),
        ("• Challenge 4: Scaling to thousands of floats", ""),
        ("  ↳ Solution:", "GPU InstancedMesh rendering requiring just 1 draw call.")
    ]
    populate_card(s5.shapes[4], "Challenges & Solutions", s5_right_items)

    # -------------------------------------------------------------------------
    # SLIDE 6: Future Scope & Conclusion
    # -------------------------------------------------------------------------
    s6 = prs.slides[5]
    set_slide_title(s6, "Future Scope & Conclusion")

    s6_left_items = [
        ("• 1. AI Fish Habitat Predictor:", "Machine Learning model that highlights profitable fishing zones in glowing gold."),
        ("• 2. 'OceanCopilot' Voice AI:", "Voice assistant giving fishing and depth advisories in 8 Indian languages (Telugu, Tamil, Hindi, etc.)."),
        ("• 3. 3D Current Streamlines:", "Glowing GPU particle flow lines showing ocean currents (u, v, w) and water eddies."),
        ("• 4. Live INCOIS OpenDAP Pipeline:", "Automated daily backend sync from INCOIS THREDDS data servers."),
        ("• 5. Seafloor 3D Bathymetry:", "Real 3D seabed terrain showing underwater ridges and trenches.")
    ]
    populate_card(s6.shapes[3], "Future Scope & AI Roadmap", s6_left_items)

    s6_right_items = [
        ("• Working Prototype Built & Tested:", "Fully functional 3D engine with 6 depth slices, 18 Argo floats, interactive charts, and coastline."),
        ("• High National Value:", "Directly solves INCOIS Problem SIH26067, saving diesel for fishermen, aiding defense, and protecting coastal lives."),
        ("• Ready for Grand Finale:", "Clean, modular code ready for live deployment."),
        "⚡ Thank you! We are now open for Questions & Answers."
    ]
    populate_card(s6.shapes[4], "Conclusion & Readiness", s6_right_items)

    try:
        prs.save("SIH2026-IDEA-Presentation-6Slides.pptx")
        print("[SUCCESS] Saved to SIH2026-IDEA-Presentation-6Slides.pptx")
    except Exception as e:
        print(f"Error saving to 6Slides: {e}")

    try:
        prs.save("SIH2026-IDEA-Presentation-Format.pptx")
        print("[SUCCESS] Saved to SIH2026-IDEA-Presentation-Format.pptx")
    except Exception as e:
        print(f"[NOTE] 'SIH2026-IDEA-Presentation-Format.pptx' is currently open in PowerPoint. Please close PowerPoint to overwrite it, or open 'SIH2026-IDEA-Presentation-6Slides.pptx' directly.")

if __name__ == "__main__":
    update_presentation()

