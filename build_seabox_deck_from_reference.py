import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    from io import BytesIO
    template_path = 'SIH2026-IDEA-Presentation-Format.pptx'
    with open(template_path, 'rb') as f:
        template_bytes = BytesIO(f.read())
    prs = Presentation(template_bytes)
    
    # Theme Colors
    NAVY_DARK   = RGBColor(10, 37, 64)       # #0A2540
    OCEAN_BLUE  = RGBColor(0, 119, 182)     # #0077B6
    CYAN_ACCENT = RGBColor(0, 180, 216)     # #00B4D8
    LIGHT_BG    = RGBColor(246, 249, 252)   # #F6F9FC
    CARD_BORDER = RGBColor(209, 224, 238)   # #D1E0EE
    TEXT_DARK   = RGBColor(30, 41, 59)       # #1E293B
    TEXT_MUTED  = RGBColor(71, 85, 105)     # #475569
    WHITE       = RGBColor(255, 255, 255)
    GREEN_ACC   = RGBColor(16, 149, 100)     # #109564
    RED_ACC     = RGBColor(225, 29, 72)      # #E11D48
    GOLD_ACC    = RGBColor(217, 119, 6)      # #D97706
    
    def prepare_slide(slide, title_text):
        for shp in slide.shapes:
            if "Oval" in shp.name and shp.has_text_frame:
                shp.text_frame.text = "JAVA AND\nSCRIPTS"
                for p in shp.text_frame.paragraphs:
                    p.font.name = 'Calibri'
                    p.font.size = Pt(9.5)
                    p.font.bold = True
                    p.alignment = PP_ALIGN.CENTER
                    p.font.color.rgb = NAVY_DARK
            elif shp.name == 'Title 1' and shp.has_text_frame:
                shp.text_frame.text = title_text
                for p in shp.text_frame.paragraphs:
                    p.font.name = 'Trebuchet MS'
                    p.font.size = Pt(21)
                    p.font.bold = True
                    p.font.color.rgb = NAVY_DARK
            elif shp.name == 'TextBox 8' and shp.has_text_frame:
                shp.text_frame.clear()
                shp.left = Inches(0)
                shp.top = Inches(0)
                shp.width = Inches(0.01)
                shp.height = Inches(0.01)

    # -------------------------------------------------------------------------
    # SLIDE 1: Title & Team Details
    # -------------------------------------------------------------------------
    slide1 = prs.slides[0]
    for shp in slide1.shapes:
        if shp.name == 'Subtitle 3' and shp.has_text_frame:
            shp.text_frame.text = "SMART INDIA HACKATHON 2026"
            for p in shp.text_frame.paragraphs:
                p.font.name = 'Trebuchet MS'
                p.font.size = Pt(22)
                p.font.bold = True
                p.font.color.rgb = OCEAN_BLUE
        elif shp.name == 'Title 7' and shp.has_text_frame:
            shp.text_frame.text = "SEABOX : 3D Ocean Data Visualization Platform"
            for p in shp.text_frame.paragraphs:
                p.font.name = 'Trebuchet MS'
                p.font.size = Pt(26)
                p.font.bold = True
                p.font.color.rgb = NAVY_DARK
        elif shp.name == 'TextBox 9' and shp.has_text_frame:
            tf = shp.text_frame
            tf.clear()
            
            lines = [
                ("Problem Statement ID - ", "SIH26067", True),
                ("Problem Statement Title - ", "3D Ocean Data Visualization Platform for Model & In-Situ Data", True),
                ("Theme - ", "Smart Automation", False),
                ("PS Category - ", "Software", False),
                ("Team ID - ", "57893", False),
                ("Team Name - ", "JAVA AND SCRIPTS", True),
                ("Institution - ", "Dr. Lankapalli Bullayya College of Engineering", False),
                ("Team Members :", "", True),
                ("  1. N Shyam Sundar Chowdary (323136410076) [Leader]", "", False),
                ("  2. L Harshita Prasad (323136410065)", "", False),
                ("  3. Radha (323136410100)", "", False),
                ("  4. Shibajyoti Maity (323136410111)", "", False),
                ("  5. S Pavan Kumar (323136410112)", "", False),
                ("  6. V Yaswanth (323136410127)", "", False)
            ]
            for idx, (label, val, highlight) in enumerate(lines):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.space_after = Pt(2.5)
                r1 = p.add_run()
                r1.text = label
                r1.font.name = 'Calibri'
                r1.font.size = Pt(12.5 if "Team Members" not in label and "  " not in label else 11)
                r1.font.bold = True
                r1.font.color.rgb = NAVY_DARK
                
                if val:
                    r2 = p.add_run()
                    r2.text = val
                    r2.font.name = 'Calibri'
                    r2.font.size = Pt(12.5)
                    r2.font.bold = highlight
                    r2.font.color.rgb = OCEAN_BLUE if highlight else TEXT_DARK

    # -------------------------------------------------------------------------
    # SLIDE 2: Understanding The Problem, Our Solution, Unique Solutions & QR Code
    # (Reference: Page 2 of Maitri AI)
    # -------------------------------------------------------------------------
    slide2 = prs.slides[1]
    prepare_slide(slide2, "SEABOX : Problem Statement & Proposed Solution")
    
    # Left Card: Understanding The Problem (5 Points)
    c1 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.2), Inches(4.3), Inches(5.5))
    c1.fill.solid(); c1.fill.fore_color.rgb = LIGHT_BG; c1.line.color.rgb = CARD_BORDER; c1.line.width = Pt(1)
    tf1 = c1.text_frame; tf1.word_wrap = True; tf1.margin_top = Inches(0.15); tf1.margin_left = Inches(0.15); tf1.margin_right = Inches(0.15)
    
    p = tf1.paragraphs[0]
    p.text = "Understanding The Problem"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = RED_ACC; p.space_after = Pt(6)
    
    prob_items = [
        ("Data Inaccessibility: ", "INCOIS handles terabytes of 4D HYCOM model data + thousands of Argo floats across the Indian Ocean (0–2000m) without unified 3D access."),
        ("2D Desktop Fragmentation: ", "Legacy tools (Panoply, ODV, ncview) only display flat 2D horizontal slices or isolated 1D profile graphs."),
        ("Zero Subsurface Correlation: ", "Inability to simultaneously correlate multi-depth numerical models with real-time in-situ floats in 3D continuous space."),
        ("Operational Overhead: ", "Heavy software dependencies, lack of web access, and slow manual format conversions hinder research productivity."),
        ("Delayed Decision Making: ", "Marine forecasters, naval acoustic teams, and fisheries (PFZ) operators cannot quickly inspect thermocline and depth stratification.")
    ]
    for b_txt, n_txt in prob_items:
        p = tf1.add_paragraph(); p.space_after = Pt(4)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(9.5); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(9); r2.font.color.rgb = TEXT_DARK

    # Middle Card: Our Solution (4 Points)
    c2 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.05), Inches(1.2), Inches(4.3), Inches(5.5))
    c2.fill.solid(); c2.fill.fore_color.rgb = LIGHT_BG; c2.line.color.rgb = CARD_BORDER; c2.line.width = Pt(1)
    tf2 = c2.text_frame; tf2.word_wrap = True; tf2.margin_top = Inches(0.15); tf2.margin_left = Inches(0.15); tf2.margin_right = Inches(0.15)
    
    p = tf2.paragraphs[0]
    p.text = "Our Solution"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(6)
    
    sol_items = [
        ("Zero-Install 3D WebGL Engine: ", "Runs at 60 FPS in any modern browser, rendering the continuous ocean water column from 0 to 2000m depth."),
        ("In-Situ Float Co-Visualization: ", "Simultaneously renders 3D Argo profiling floats with interactive surface tethers and instant vertical CTD profiles."),
        ("Dynamic Multi-Tier Depth Slicing: ", "Instant toggling between depth levels (0m, 100m, 200m, 500m, 1000m, 2000m) with 1x–50x vertical exaggeration."),
        ("Dual-Variable Scientific Colormaps: ", "Live switching between Sea Water Temperature (°C) and Salinity (PSU) with Viridis transfer telemetry."),
        ("Autonomous Web Architecture: ", "Standalone client-side execution ensures lightning-fast exploration without heavy backend compute bottlenecks.")
    ]
    for b_txt, n_txt in sol_items:
        p = tf2.add_paragraph(); p.space_after = Pt(4)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(9.5); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(9); r2.font.color.rgb = TEXT_DARK

    # Right Column: Unique Solutions (USPs) & Working Prototype Callout
    c3 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.5), Inches(1.2), Inches(3.2), Inches(3.2))
    c3.fill.solid(); c3.fill.fore_color.rgb = LIGHT_BG; c3.line.color.rgb = CARD_BORDER; c3.line.width = Pt(1)
    tf3 = c3.text_frame; tf3.word_wrap = True; tf3.margin_top = Inches(0.12); tf3.margin_left = Inches(0.12); tf3.margin_right = Inches(0.12)
    
    p = tf3.paragraphs[0]
    p.text = "Our Unique Solutions (USPs)"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(11.5); p.font.bold = True; p.font.color.rgb = GOLD_ACC; p.space_after = Pt(4)
    
    usps = [
        "• Real-time 3D subsurface volumetric rendering for instant oceanographic insights.",
        "• Zero-dependency web architecture tuned for low-bandwidth marine research.",
        "• Seamless fusion of gridded numerical models (HYCOM) and in-situ floats (Argo).",
        "• Automated vertical CTD profile curves & thermocline diagnostics."
    ]
    for u in usps:
        p = tf3.add_paragraph(); p.space_after = Pt(3)
        p.text = u; p.font.name = 'Calibri'; p.font.size = Pt(8.8); p.font.color.rgb = NAVY_DARK

    # Prototype Box with Badge & QR Code
    c_proto = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.5), Inches(4.55), Inches(3.2), Inches(2.15))
    c_proto.fill.solid(); c_proto.fill.fore_color.rgb = WHITE; c_proto.line.color.rgb = GREEN_ACC; c_proto.line.width = Pt(1.5)
    
    # Badge Banner inside
    badge = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.5), Inches(4.55), Inches(3.2), Inches(0.35))
    badge.fill.solid(); badge.fill.fore_color.rgb = GREEN_ACC; badge.line.fill.background()
    p_b = badge.text_frame.paragraphs[0]
    p_b.text = "75%+ PROTOTYPE COMPLETED & TESTED!"
    p_b.font.name = 'Trebuchet MS'; p_b.font.size = Pt(8.5); p_b.font.bold = True; p_b.font.color.rgb = WHITE; p_b.alignment = PP_ALIGN.CENTER
    
    if os.path.exists('assets_generated/qr_code_prototype.png'):
        slide2.shapes.add_picture('assets_generated/qr_code_prototype.png', Inches(9.6), Inches(4.98), Inches(1.3), Inches(1.3))
        
    tb_pr = slide2.shapes.add_textbox(Inches(10.95), Inches(4.95), Inches(1.7), Inches(1.65))
    tf_pr = tb_pr.text_frame; tf_pr.word_wrap = True
    p = tf_pr.paragraphs[0]
    p.text = "Scan for PROTOTYPE"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(9.5); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE
    
    p2 = tf_pr.add_paragraph(); p2.space_before = Pt(2)
    p2.text = "• Live WebGL 3D Ocean\n• Real-Time Float Profiler\n• GitHub Repo Link:\ngithub.com/shibajyotimaity/\nSEABOX-OceanView3D"
    p2.font.name = 'Calibri'; p2.font.size = Pt(7.5); p2.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------------------
    # SLIDE 3: Technical Approach, Methodology, Tech Stack, UI & Implementation Flow
    # (Reference: Page 3 of Maitri AI)
    # -------------------------------------------------------------------------
    slide3 = prs.slides[2]
    prepare_slide(slide3, "Technical Approach & Architecture")
    
    # Left Box: Methodology (5 Detailed Pipeline Steps)
    c_meth = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.2), Inches(4.5), Inches(3.6))
    c_meth.fill.solid(); c_meth.fill.fore_color.rgb = LIGHT_BG; c_meth.line.color.rgb = CARD_BORDER; c_meth.line.width = Pt(1)
    tf_m = c_meth.text_frame; tf_m.word_wrap = True; tf_m.margin_top = Inches(0.12); tf_m.margin_left = Inches(0.15); tf_m.margin_right = Inches(0.15)
    
    p = tf_m.paragraphs[0]
    p.text = "Methodology"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(4)
    
    meth_steps = [
        ("1. Data Ingestion & Extraction: ", "Ingest INCOIS HYCOM 3D gridded NetCDF4 fields (0–2000m) & live Argo CTD profiles via automated Python pipelines."),
        ("2. Signal Preprocessing & Slicing: ", "Clean missing data, apply depth-level interpolation, and serialize multi-depth arrays into indexed binary JSON streams."),
        ("3. Volumetric WebGL GPU Meshing: ", "Map hydrodynamic scalar fields into Three.js custom vertex shaders with dynamic Viridis transfer functions at 60 FPS."),
        ("4. In-Situ Float Synchronization: ", "Project 3D Argo float positions, calculate vertical depth vectors, and bind interactive CTD curve profile modals."),
        ("5. Decision & Scientific Analytics: ", "Orbit controls, instant depth slice switches, 1x–50x exaggeration sliders, and automated lat/lon hover raycasting.")
    ]
    for b_txt, n_txt in meth_steps:
        p = tf_m.add_paragraph(); p.space_after = Pt(2.5)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(8.8); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(8.3); r2.font.color.rgb = TEXT_DARK

    # Bottom Left: Tech Stack
    c_tech = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(4.9), Inches(4.5), Inches(1.8))
    c_tech.fill.solid(); c_tech.fill.fore_color.rgb = LIGHT_BG; c_tech.line.color.rgb = CARD_BORDER; c_tech.line.width = Pt(1)
    tf_t = c_tech.text_frame; tf_t.word_wrap = True; tf_t.margin_top = Inches(0.1); tf_t.margin_left = Inches(0.15); tf_t.margin_right = Inches(0.15)
    
    p = tf_t.paragraphs[0]
    p.text = "Tech Stack"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(3)
    
    t_items = [
        ("• Frontend: ", "Three.js (WebGL 3D Engine), HTML5 Canvas, Vanilla JS ES6+, Vite, CSS3 Glassmorphism."),
        ("• Backend & Ingestion: ", "Python (Xarray, NetCDF4, NumPy), REST JSON Streaming, GeoJSON Coastlines."),
        ("• Scientific Data: ", "INCOIS Indian Ocean Model, HYCOM Hydrodynamics, Global Argo GDAC.")
    ]
    for b_txt, n_txt in t_items:
        p = tf_t.add_paragraph(); p.space_after = Pt(1.5)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(8.8); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(8.3); r2.font.color.rgb = TEXT_DARK

    # Right Area: User Interface / Dashboards (Screenshots)
    c_ui = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.25), Inches(1.2), Inches(7.45), Inches(3.6))
    c_ui.fill.solid(); c_ui.fill.fore_color.rgb = WHITE; c_ui.line.color.rgb = CARD_BORDER; c_ui.line.width = Pt(1)
    
    tb_ui = slide3.shapes.add_textbox(Inches(5.35), Inches(1.25), Inches(7.2), Inches(0.35))
    p = tb_ui.text_frame.paragraphs[0]
    p.text = "User Interface: Interactive 3D Hydrodynamic Dashboard"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = NAVY_DARK
    
    if os.path.exists('assets_generated/ui_dashboard_main.png'):
        slide3.shapes.add_picture('assets_generated/ui_dashboard_main.png', Inches(5.35), Inches(1.65), Inches(4.3), Inches(2.75))
    if os.path.exists('assets_generated/ui_depth_200m.png'):
        slide3.shapes.add_picture('assets_generated/ui_depth_200m.png', Inches(9.75), Inches(1.65), Inches(2.85), Inches(2.75))

    # Bottom Right: Implementation Flow
    c_flow = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.25), Inches(4.9), Inches(7.45), Inches(1.8))
    c_flow.fill.solid(); c_flow.fill.fore_color.rgb = LIGHT_BG; c_flow.line.color.rgb = CARD_BORDER; c_flow.line.width = Pt(1)
    tf_f = c_flow.text_frame; tf_f.word_wrap = True; tf_f.margin_top = Inches(0.1); tf_f.margin_left = Inches(0.15); tf_f.margin_right = Inches(0.15)
    
    p = tf_f.paragraphs[0]
    p.text = "Implementation Flow"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(2)
    
    flows = [
        ("Phase 1: Ingestion & Parsing ", "-> Automatic fetch of INCOIS NetCDF / Argo FTP feeds."),
        ("Phase 2: Array Preprocessing & Slicing ", "-> Memory-mapped depth matrices (0–2000m)."),
        ("Phase 3: WebGL GPU Rendering ", "-> Subsurface 3D column, Viridis colormaps, Argo markers."),
        ("Phase 4: Analytics & Interaction ", "-> CTD profile curves, depth chips, 1x–50x exaggeration.")
    ]
    for b_txt, n_txt in flows:
        p = tf_f.add_paragraph(); p.space_after = Pt(1.5)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(8.8); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(8.3); r2.font.color.rgb = TEXT_DARK

    # -------------------------------------------------------------------------
    # SLIDE 4: Impact and Benefits, Operational, Economic & Strategic, Pie Chart
    # (Reference: Page 4 of Maitri AI)
    # -------------------------------------------------------------------------
    slide4 = prs.slides[3]
    prepare_slide(slide4, "IMPACT AND BENEFITS")
    
    # Left Column: Potential Impact on Ocean Scientists & Forecasters
    c4_1 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.2), Inches(4.3), Inches(5.5))
    c4_1.fill.solid(); c4_1.fill.fore_color.rgb = LIGHT_BG; c4_1.line.color.rgb = CARD_BORDER; c4_1.line.width = Pt(1)
    tf4_1 = c4_1.text_frame; tf4_1.word_wrap = True; tf4_1.margin_top = Inches(0.15); tf4_1.margin_left = Inches(0.15); tf4_1.margin_right = Inches(0.15)
    
    p = tf4_1.paragraphs[0]
    p.text = "Potential Impact on Ocean Scientists"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12.5); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(5)
    
    impacts = [
        ("• Rapid Thermocline Detection: ", "Identifies mixed-layer depth, internal waves, and marine heatwaves in real-time 3D space."),
        ("• In-Situ Float Validation: ", "Directly cross-validates numerical model outputs against physical Argo CTD measurements."),
        ("• Zero-Friction Workflow: ", "Eliminates multi-software context switching, reducing researcher analysis time by over 70%."),
        ("• Collaborative Research: ", "Browser-native access allows instant data sharing between INCOIS, IMD, NIOT, and universities."),
        ("• Enhanced Situational Awareness: ", "Provides operational forecasters with immediate volumetric ocean state views.")
    ]
    for b_txt, n_txt in impacts:
        p = tf4_1.add_paragraph(); p.space_after = Pt(4)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(9.5); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(9); r2.font.color.rgb = TEXT_DARK

    # Middle Column: Economic and Strategic Gains
    c4_2 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.05), Inches(1.2), Inches(4.1), Inches(5.5))
    c4_2.fill.solid(); c4_2.fill.fore_color.rgb = LIGHT_BG; c4_2.line.color.rgb = CARD_BORDER; c4_2.line.width = Pt(1)
    tf4_2 = c4_2.text_frame; tf4_2.word_wrap = True; tf4_2.margin_top = Inches(0.15); tf4_2.margin_left = Inches(0.15); tf4_2.margin_right = Inches(0.15)
    
    p = tf4_2.paragraphs[0]
    p.text = "Economic and Strategic Gains"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12.5); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(5)
    
    gains = [
        ("Mission Cost Savings: ", "Prevents expensive redundant proprietary GIS licenses, saving crores in institutional software costs."),
        ("Blue Economy & Fisheries (PFZ): ", "Optimizes potential fishing zone advisories, saving diesel and search time for 40+ lakh fishermen."),
        ("Naval Strategic Security: ", "Aids Indian Navy acoustic depth channel and sonar shadow zone planning through 3D stratification maps."),
        ("Sovereign Cloud Deployment: ", "Open-source web architecture deployable on National Knowledge Network and sovereign servers.")
    ]
    for b_txt, n_txt in gains:
        p = tf4_2.add_paragraph(); p.space_after = Pt(4)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(9.5); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(9); r2.font.color.rgb = TEXT_DARK

    # Right Top Box: Mission & Operational Benefits
    c4_3 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.3), Inches(1.2), Inches(3.4), Inches(2.2))
    c4_3.fill.solid(); c4_3.fill.fore_color.rgb = LIGHT_BG; c4_3.line.color.rgb = CARD_BORDER; c4_3.line.width = Pt(1)
    tf4_3 = c4_3.text_frame; tf4_3.word_wrap = True; tf4_3.margin_top = Inches(0.1); tf4_3.margin_left = Inches(0.12); tf4_3.margin_right = Inches(0.12)
    
    p = tf4_3.paragraphs[0]
    p.text = "Mission & Operational Benefits"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(11.5); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(3)
    
    m_benefits = [
        ("• Risk Reduction: ", "Minimizes errors in maritime storm surge & cyclone intensity forecasts."),
        ("• Continuous Monitoring: ", "Automated pipeline keeps ocean models and float data constantly synchronized.")
    ]
    for b_txt, n_txt in m_benefits:
        p = tf4_3.add_paragraph(); p.space_after = Pt(2.5)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(9); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(8.5); r2.font.color.rgb = TEXT_DARK

    # Right Bottom Box: Pie Chart
    c4_4 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.3), Inches(3.55), Inches(3.4), Inches(3.15))
    c4_4.fill.solid(); c4_4.fill.fore_color.rgb = WHITE; c4_4.line.color.rgb = CARD_BORDER; c4_4.line.width = Pt(1)
    
    if os.path.exists('assets_generated/impact_pie_chart.png'):
        slide4.shapes.add_picture('assets_generated/impact_pie_chart.png', Inches(9.4), Inches(3.6), Inches(3.2), Inches(3.0))

    # -------------------------------------------------------------------------
    # SLIDE 5: Feasibility and Viability, Before/After Bar Graph, What-Ifs, Challenges
    # (Reference: Page 5 of Maitri AI)
    # -------------------------------------------------------------------------
    slide5 = prs.slides[4]
    prepare_slide(slide5, "FEASIBILITY AND VIABILITY")
    
    # Top Left: Analysis of Feasibility (01 to 06 Numbered Points)
    c5_1 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.2), Inches(6.0), Inches(2.7))
    c5_1.fill.solid(); c5_1.fill.fore_color.rgb = LIGHT_BG; c5_1.line.color.rgb = CARD_BORDER; c5_1.line.width = Pt(1)
    tf5_1 = c5_1.text_frame; tf5_1.word_wrap = True; tf5_1.margin_top = Inches(0.12); tf5_1.margin_left = Inches(0.15); tf5_1.margin_right = Inches(0.15)
    
    p = tf5_1.paragraphs[0]
    p.text = "Analysis of the feasibility of the idea:"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(3)
    
    feas_items = [
        ("01. Proven WebGL Base: ", "Standard Three.js WebGL 2.0 supported on 99.4% of modern desktop & mobile browsers."),
        ("02. Hardware Compatibility: ", "Client-side GPU acceleration runs smoothly on budget laptops and tablets."),
        ("03. Scalability: ", "Expandable from Temperature & Salinity to ocean currents, dissolved oxygen, and chlorophyll."),
        ("04. Training/Data Ingestion: ", "Directly parses standardized CF-1.8 compliant NetCDF4 and Argo GDAC formats."),
        ("05. Operational Reliability: ", "Zero-install standalone client architecture ensures uninterrupted uptime."),
        ("06. Resource Efficiency: ", "Lightweight memory disposal hooks maintain stable 60 FPS without memory leaks.")
    ]
    for b_txt, n_txt in feas_items:
        p = tf5_1.add_paragraph(); p.space_after = Pt(1.5)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(8.8); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(8.3); r2.font.color.rgb = TEXT_DARK

    # Top Right: Before vs After Bar Chart
    c5_2 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.2), Inches(5.9), Inches(2.7))
    c5_2.fill.solid(); c5_2.fill.fore_color.rgb = WHITE; c5_2.line.color.rgb = CARD_BORDER; c5_2.line.width = Pt(1)
    
    if os.path.exists('assets_generated/before_after_barchart.png'):
        slide5.shapes.add_picture('assets_generated/before_after_barchart.png', Inches(6.85), Inches(1.25), Inches(5.8), Inches(2.6))

    # Bottom Left: WHAT IFs....? (5 Scenario Cards)
    c5_3 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(4.05), Inches(6.0), Inches(2.65))
    c5_3.fill.solid(); c5_3.fill.fore_color.rgb = LIGHT_BG; c5_3.line.color.rgb = CARD_BORDER; c5_3.line.width = Pt(1)
    tf5_3 = c5_3.text_frame; tf5_3.word_wrap = True; tf5_3.margin_top = Inches(0.12); tf5_3.margin_left = Inches(0.15); tf5_3.margin_right = Inches(0.15)
    
    p = tf5_3.paragraphs[0]
    p.text = "WHAT IFs....?"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = GOLD_ACC; p.space_after = Pt(3)
    
    whatifs = [
        ("• Network bandwidth is low? ", "-> Progressive LOD chunking & indexed binary arrays enable instant loading."),
        ("• Float data has missing cycles? ", "-> Automated NaN spline interpolation & sensor quality flags maintain fidelity."),
        ("• Low-end hardware is used? ", "-> Dynamic vertex instancing & shader LOD ensure fluid 60 FPS."),
        ("• Massive high-res grids load? ", "-> Web Workers handle background decompression without freezing UI."),
        ("• Users need GIS tool export? ", "-> Built-in GeoTIFF / GeoJSON and standard image export bridges.")
    ]
    for b_txt, n_txt in whatifs:
        p = tf5_3.add_paragraph(); p.space_after = Pt(2)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(8.8); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(8.3); r2.font.color.rgb = TEXT_DARK

    # Bottom Right: Strategies to Overcome Challenges
    c5_4 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(4.05), Inches(5.9), Inches(2.65))
    c5_4.fill.solid(); c5_4.fill.fore_color.rgb = LIGHT_BG; c5_4.line.color.rgb = CARD_BORDER; c5_4.line.width = Pt(1)
    tf5_4 = c5_4.text_frame; tf5_4.word_wrap = True; tf5_4.margin_top = Inches(0.12); tf5_4.margin_left = Inches(0.15); tf5_4.margin_right = Inches(0.15)
    
    p = tf5_4.paragraphs[0]
    p.text = "Strategies to Overcome Challenges"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(3)
    
    strats = [
        ("1. WebGL Memory & Frame-Rate Constraints", "Challenge: Rendering multi-layer 3D grids can strain GPU memory.\nStrategy: Implement shared geometry buffer attributes, frustum culling, and texture compression."),
        ("2. Ingestion Latency of Large NetCDF Datasets", "Challenge: Parsing multi-GB raw ocean model files in real-time.\nStrategy: Pre-process depth levels into lightweight indexed binary arrays using Python Xarray."),
        ("3. Multi-Sensor Coordinate Alignment", "Challenge: In-situ floats and numerical model grids use different spatial resolutions.\nStrategy: Unified lat/lon bounding projections with automated depth interpolation.")
    ]
    for title, desc in strats:
        p = tf5_4.add_paragraph(); p.space_after = Pt(2)
        r1 = p.add_run(); r1.text = title + "\n"; r1.font.name = 'Calibri'; r1.font.size = Pt(8.8); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = desc; r2.font.name = 'Calibri'; r2.font.size = Pt(8); r2.font.color.rgb = TEXT_DARK

    # -------------------------------------------------------------------------
    # SLIDE 6: Feature Comparison Matrix & Research References
    # (Reference: Page 6 of Maitri AI)
    # -------------------------------------------------------------------------
    slide6 = prs.slides[5]
    prepare_slide(slide6, "FEATURE COMPARISON & RESEARCH REFERENCES")
    
    # Top/Left: Comprehensive Comparison Table (Matching Page 6 Matrix)
    # Table dimensions: 6 rows x 3 columns
    rows = 7
    cols = 3
    left = Inches(0.6)
    top = Inches(1.2)
    width = Inches(7.4)
    height = Inches(5.5)
    
    table_shape = slide6.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table
    table.columns[0].width = Inches(1.7)
    table.columns[1].width = Inches(2.85)
    table.columns[2].width = Inches(2.85)
    
    headers = ["Feature", "SEABOX 3D Proposed Platform", "Existing Conventional Solutions (ODV/Panoply)"]
    for c_idx, h_text in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = h_text
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY_DARK if c_idx != 1 else OCEAN_BLUE
        for p in cell.text_frame.paragraphs:
            p.font.name = 'Trebuchet MS'
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = WHITE
            p.alignment = PP_ALIGN.CENTER
            
    matrix_data = [
        ("Methodology", "Volumetric 3D Subsurface WebGL Engine with multi-layer continuous rendering.", "Flat 2D Slices & 1D static profile plots without 3D depth context."),
        ("In-Situ Integration", "Simultaneous Real-time Float Co-Visualization with interactive 3D tethers.", "Disjoint manual CSV/ODV file imports with no synchronized spatial mapping."),
        ("Depth Exploration", "Interactive Dynamic Depth Slicing (0–2000m) with 1x–50x exaggeration.", "Static pre-rendered cross-sections; cumbersome manual depth filtering."),
        ("Platform Accessibility", "Zero-Install 100% Browser-Native (works on PCs, tablets, laptops).", "Heavy OS-specific desktop installations with complex library dependencies."),
        ("Performance / Latency", "GPU-Accelerated 60 FPS Rendering (<1 sec depth layer switch).", "High CPU latency (>5–15 mins per multi-depth cross-comparison)."),
        ("Workflow Efficiency", "Unified All-in-One Dashboard replacing 4+ disjoint GIS & NetCDF tools.", "Fragmented workflows requiring constant data format conversions.")
    ]
    for r_idx, (f_name, seabox_val, conv_val) in enumerate(matrix_data):
        row_num = r_idx + 1
        
        # Col 0: Feature Name
        c0 = table.cell(row_num, 0)
        c0.text = f_name
        c0.fill.solid(); c0.fill.fore_color.rgb = LIGHT_BG
        p = c0.text_frame.paragraphs[0]
        p.font.name = 'Calibri'; p.font.size = Pt(9); p.font.bold = True; p.font.color.rgb = NAVY_DARK
        
        # Col 1: SEABOX
        c1 = table.cell(row_num, 1)
        c1.text = seabox_val
        c1.fill.solid(); c1.fill.fore_color.rgb = RGBColor(235, 245, 255)
        p = c1.text_frame.paragraphs[0]
        p.font.name = 'Calibri'; p.font.size = Pt(8.5); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE
        
        # Col 2: Conventional
        c2 = table.cell(row_num, 2)
        c2.text = conv_val
        c2.fill.solid(); c2.fill.fore_color.rgb = WHITE
        p = c2.text_frame.paragraphs[0]
        p.font.name = 'Calibri'; p.font.size = Pt(8.3); p.font.color.rgb = TEXT_MUTED

    # Right Card: Research, Academic References & Working Repository
    c_refs = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.2), Inches(1.2), Inches(4.5), Inches(5.5))
    c_refs.fill.solid(); c_refs.fill.fore_color.rgb = LIGHT_BG; c_refs.line.color.rgb = CARD_BORDER; c_refs.line.width = Pt(1)
    tf_r = c_refs.text_frame; tf_r.word_wrap = True; tf_r.margin_top = Inches(0.15); tf_r.margin_left = Inches(0.15); tf_r.margin_right = Inches(0.15)
    
    p = tf_r.paragraphs[0]
    p.text = "RESEARCH & REFERENCES"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(12.5); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE; p.space_after = Pt(4)
    
    p = tf_r.add_paragraph()
    p.text = "Research and Datasets references"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(10.5); p.font.bold = True; p.font.color.rgb = NAVY_DARK; p.space_after = Pt(3)
    
    ref_list = [
        ("INCOIS Ocean State Forecast: ", "Indian National Centre for Ocean Information Services, MoES, Govt. of India.\nhttps://incois.gov.in"),
        ("Argo Float Global Data Assembly: ", "Roemmich, D. et al., 'The Argo Program: Observing the Global Ocean with Profiling Floats'.\nhttps://argo.ucsd.edu | https://incois.gov.in/OOS/argo.jsp"),
        ("HYCOM Hydrodynamic Model: ", "Bleck, R., 'An oceanic general circulation model in isopycnic coordinates'.\nhttps://www.hycom.org"),
        ("Scientific Colormaps (Viridis): ", "van der Walt, S. et al., IEEE Computing in Science & Eng.\nhttps://bids.github.io/colormap/"),
        ("WebGL 2.0 & Three.js 3D Engine: ", "Khronos Group WebGL Standards & Three.js Hydrodynamics.\nhttps://www.khronos.org/webgl/ | https://threejs.org")
    ]
    for b_txt, n_txt in ref_list:
        p = tf_r.add_paragraph(); p.space_after = Pt(3)
        r1 = p.add_run(); r1.text = b_txt; r1.font.name = 'Calibri'; r1.font.size = Pt(8.8); r1.font.bold = True; r1.font.color.rgb = NAVY_DARK
        r2 = p.add_run(); r2.text = n_txt; r2.font.name = 'Calibri'; r2.font.size = Pt(8); r2.font.color.rgb = TEXT_DARK
        
    p = tf_r.add_paragraph(); p.space_before = Pt(4); p.space_after = Pt(2)
    p.text = "Project Codebase & Prototype Link:"
    p.font.name = 'Trebuchet MS'; p.font.size = Pt(10); p.font.bold = True; p.font.color.rgb = OCEAN_BLUE
    
    p = tf_r.add_paragraph()
    p.text = "• GitHub: https://github.com/shibajyotimaity/SEABOX-OceanView3D\n• Live App: http://localhost:5173/ (OceanView 3D / SeaBox)"
    p.font.name = 'Calibri'; p.font.size = Pt(8.5); p.font.bold = True; p.font.color.rgb = NAVY_DARK

    # Remove Slide 7 if present (Instruction Slide)
    if len(prs.slides) > 6:
        rId = prs.slides._sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[6]
        print("Removed Slide 7.")

    target_files = [
        'SEABOX-SIH2026-Idea-Presentation.pptx',
        'SEABOX-SIH2026-Maitri-Format.pptx',
        'SIH2026-IDEA-Presentation-Format (1).pptx',
        'SIH2026-IDEA-Presentation-Format.pptx'
    ]
    for fn in target_files:
        try:
            prs.save(fn)
            print(f"Saved: {fn}")
        except Exception as e:
            print(f"Could not save {fn}: {e}")
    print("Successfully built SEABOX presentation from Maitri AI reference!")

if __name__ == '__main__':
    build_presentation()
