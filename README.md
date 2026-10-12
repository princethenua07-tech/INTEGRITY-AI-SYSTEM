# 🛡️ Sentinel AI - Autonomous Online Exam Proctoring System

An AI-driven, edge-computing online examination proctoring system engineered with Google MediaPipe and TensorFlow.js.

## 🌟 Highlights
- **100% In-Browser Edge AI:** Zero server bandwidth costs, complete student privacy.
- **3D Head Pose & Gaze Deviation:** MediaPipe FaceMesh (478 landmarks) detecting when candidate looks away (Yaw/Pitch > ±18°).
- **Prohibited Object Recognition:** Real-time MobileNetV2 COCO-SSD bounding box detection for smartphones, books, and laptops.
- **Multiple & Missing Face Detection:** Flags if extra persons enter camera frame or candidate leaves.
- **Acoustic Monitoring:** Web Audio API FFT frequency analysis filtering human vocal speech (100Hz–3000Hz).
- **Anti-Cheat Browser Lockdown:** Window blur, tab-switching, fullscreen exit, DevTools inspection, and clipboard copy-paste blockers.
- **Real-Time Heads-Up Display (HUD):** Dynamic 100% Trust Integrity Score with warning popups and audio alerts.
- **Automated Evidence Trail:** Timestamped watermarked photo captures saved directly into the audit report.
- **Built-in Presentation & Viva Guide:** 10 PowerPoint slides and top viva answers built right into the app.
- **PDF Certificate Export:** Generate printable proctoring forensic certificates.

---

## 🚀 How to Run

### Method 1: One-Click Launcher (Windows)
Double-click `start_proctoring.bat`. It will automatically start the server and open `http://localhost:5173/` in your browser!

### Method 2: Manual Terminal
```bash
npm run dev
```
Then open `http://localhost:5173/` in your web browser.

---

## 📁 Project Structure
- `index.html` - Main application dashboard and navigation layout
- `src/main.js` - Main app controller, UI state transitions, and audio-visual pipeline
- `src/visionEngine.js` - MediaPipe FaceLandmarker + TFJS COCO-SSD object detection
- `src/audioDetector.js` - Web Audio API acoustic decibel and speech frequency analyser
- `src/examEngine.js` - Question bank, countdown timer, and scoring calculator
- `src/proctorEngine.js` - Dynamic trust score decrement rules and anti-cheat listeners
- `src/style.css` - Modern glassmorphic cybersecurity dark-theme CSS design system
- `public/models/` - Local MediaPipe `face_landmarker.task` offline checkpoint
- `public/wasm/` - MediaPipe WebAssembly execution engine
- `PRESENTATION_AND_PPT_GUIDE.md` - Complete 10-slide PowerPoint content & Viva Q&A guide
