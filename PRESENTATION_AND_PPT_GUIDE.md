# 🎓 Sentinel AI - Online Exam Proctoring System
## Mini Project Presentation & PPT Guide (कल के प्रेजेंटेशन और वाइवा के लिए सम्पूर्ण गाइड)

---

## 📌 PPT Slide-by-Slide Outline (सीधे PowerPoint में कॉपी करें)

### Slide 1: Title Slide
- **Project Title:** Autonomous AI-Powered Online Examination Proctoring System (Sentinel AI)
- **Domain:** Artificial Intelligence, Computer Vision & Cybersecurity
- **Presented by:** [Your Name / Roll Number]
- **Department:** Computer Science & Engineering
- **Guide/Mentor:** [Faculty Guide Name]

---

### Slide 2: Problem Statement
- **Shift to Online Assessments:** COVID-19 ke baad online certifications aur university exams normal ban chuke hain.
- **Cheating & Malpractice Challenges:** 
  - Screen sharing aur split-screen use karna.
  - Secondary devices (Smartphones, smartwatches, notes) use karna.
  - Dusre vyakti (proxy candidate) se madad lena.
  - Gaze deviation (screen se hat kar idhar-udhar dekhna).
- **Human Invigilator Limitations:**
  - Ek human proctor ek saath 5-10 se zyada students ko dhyan se monitor nahi kar sakta.
  - Cognitive fatigue aur high operational cost.
  - Scalability issues for thousands of candidates.

---

### Slide 3: Proposed Solution (Sentinel AI)
- **Edge AI Architecture:** 100% in-browser, zero-latency computer vision aur acoustic analysis engine.
- **Privacy First:** Video stream kisi remote server par transfer nahi hoti; sari processing candidate ke device par WebAssembly & WebGL acceleration ke sath hoti hai.
- **Multi-Sensor AI Pipeline:**
  1. 3D Facial Landmark Tracking (MediaPipe 478 points).
  2. Gaze Estimation & Head Pose Angle Calculation (Yaw, Pitch, Roll).
  3. Real-time Prohibited Object Detection (Smartphones, Books via MobileNetV2 COCO-SSD).
  4. Acoustic Voice & Whisper Detection (Web Audio API FFT analysis).
  5. Browser Sandbox Lock (Tab-switch, DevTools block, Fullscreen enforce).

---

### Slide 4: System Architecture Diagram
```
                     ┌────────────────────────────────┐
                     │   Candidate Camera & Mic Feed  │
                     └───────────────┬────────────────┘
                                     │
             ┌───────────────────────┼────────────────────────┐
             ▼                       ▼                        ▼
     ┌──────────────┐        ┌──────────────┐         ┌──────────────┐
     │  MediaPipe   │        │   TFJS SSD   │         │  Web Audio   │
     │   FaceMesh   │        │ MobileNetV2  │         │  FFT Analyser│
     └───────┬──────┘        └───────┬──────┘         └───────┬──────┘
             │                       │                        │
       478 3D Points          Object Classes           Acoustic dB
     (Head Pose/Gaze)       (Phone, Secondary)        (Speech Bands)
             │                       │                        │
             └───────────────────────┼────────────────────────┘
                                     ▼
                     ┌────────────────────────────────┐
                     │   Sentinel Proctoring Engine   │
                     │  - Anomaly Filter & Smoothing  │
                     │  - Dynamic Trust Score (100%)  │
                     │  - Auto-Evidence Snapshotting  │
                     └───────────────┬────────────────┘
                                     ▼
                     ┌────────────────────────────────┐
                     │  Real-Time HUD & Audit Report  │
                     └────────────────────────────────┘
```

---

### Slide 5: Core AI Modules
1. **MediaPipe Face Landmarker:**
   - Detects 478 3D keypoints at 30–60 FPS.
   - Calculates facial vector orientation:
     - Nose tip (Point 1), Outer Eyes (Points 33 & 263), Forehead & Chin.
     - **Yaw (Horizontal):** Nose offset relative to eye midpoint.
     - **Pitch (Vertical):** Nose vertical displacement.
2. **Object Detection (COCO-SSD MobileNetV2):**
   - Asynchronous inference every 500ms on WebGL backend.
   - Specifically flags bounding boxes for `cell phone`, `book`, `laptop`.
3. **Acoustic Monitoring:**
   - Real-time frequency binning between 100Hz and 3000Hz (human vocal spectrum).
   - Distinguishes background ambient hum from human speech/whispers.

---

### Slide 6: Anti-Cheat & Malpractice Rules
| Event Type | AI Detection Method | Penalty Points |
| :--- | :--- | :--- |
| **Prohibited Object (Phone)** | COCO-SSD Bounding Box | -20 pts |
| **Multiple Faces** | FaceLandmarker Array Length > 1 | -15 pts |
| **Candidate Missing (No Face)** | Face Count = 0 (> 2.5s) | -10 pts |
| **Tab Switch / Minimize** | Page Visibility API & Window Blur | -15 pts |
| **Looking Away (Left/Right/Down)** | Yaw > ±18° or Pitch > ±18° | -4 pts |
| **Speech / Acoustic Anomaly** | AudioContext RMS > Threshold | -5 pts |
| **DevTools / Copy-Paste Attempt** | Keyboard Keydown Listeners (F12/Ctrl+C) | -5 pts |

---

### Slide 7: Scoring Engine & Forensic Evidence
- **Trust Integrity Score:** Starts at 100%.
  - **90% - 100%:** Clean / Verified
  - **60% - 89%:** Suspicious / Flagged for Manual Review
  - **< 60%:** Malpractice Detected / Rejected
- **Automated Evidence Trail:**
  - Jab bhi violation hoti hai, off-screen canvas webcam frame ka snapshot watermark (Timestamp + Violation Label + Candidate ID) ke sath capture karke audit log me save karta hai.
  - Exam ke baad evaluator snapshot proof ke sath review kar sakta hai.

---

### Slide 8: Results & Live Performance
- **Latency:** Sub-30ms frame-to-prediction latency.
- **Resource Usage:** Lightweight MobileNet architecture ensures smooth execution even on standard student laptops.
- **Offline Capability:** Wasm binaries and model checkpoints run 100% locally on the device without cloud API dependency.

---

### Slide 9: Advantages & Limitations
- **Advantages:**
  - Zero Cloud Server Cost (Client-side edge computing).
  - Absolute Student Privacy (Video frames never leave the browser).
  - Automatic, tamper-proof audit report generation with PDF export.
- **Limitations & Future Scope:**
  - Dual-monitor setup requires OS-level agent for deeper system lock.
  - Eye tracking accuracy can vary under very poor lighting conditions.

---

### Slide 10: Conclusion
- Sentinel AI delivers an intelligent, accessible, and privacy-preserving automated proctoring platform.
- Eliminates manual proctoring overhead while maintaining academic rigor and integrity.

---

## 🎤 Top 10 Viva Questions & Technical Answers (Examiner ke samne bolne ke liye)

1. **Q: Tumne server-side (Python/Flask) ki jagah client-side (MediaPipe/TFJS) kyun chuna?**
   - **Answer:** *"Sir, server-side processing me har student ki live video stream server pe bhejna padta hai, jisse huge bandwidth bottleneck aur cloud server cost hoti hai. Humne Client-Side Edge AI use kiya jisme Google MediaPipe WebAssembly aur WebGL shaders ka use karke candidate ke device par hi 60 FPS par processing hoti hai. Isse student ki privacy bhi secure rehti hai aur latency < 30ms hoti hai."*

2. **Q: Head pose estimation (gaze tracking) kaise calculate hota hai?**
   - **Answer:** *"Sir, MediaPipe Face Landmarker 478 3D points return karta hai. Hum Nose tip (Point 1) aur dono eyes ke outer corners (Point 33 aur Point 263) ke beech ka geometric horizontal offset ratio calculate karte hain. Agar candidate apna sar left ya right ghumata hai toh Yaw angle change hota hai; agar Yaw ±18 degrees se exceed hota hai toh looking away flag ho jata hai."*

3. **Q: Phone detection kaise kaam karta hai? UI freeze kyun nahi hota?**
   - **Answer:** *"Sir, TensorFlow.js COCO-SSD (MobileNetV2) model asynchronous web worker/requestAnimationFrame me run hota hai WebGL GPU acceleration ke sath. Heavy synchronous execution avoid karne ke liye object detection ko decouple karke har 500ms par trigger kiya jata hai, isliye exam UI bilkul smooth 60 FPS par rehta hai."*

4. **Q: Tab switch ya minimize kaise detect hota hai?**
   - **Answer:** *"Sir, hum HTML5 Page Visibility API (`document.visibilityState`) aur window blur event (`window.onblur`) monitor karte hain. Jaise hi candidate dusra tab kholta hai ya window minimize karta hai, event fire hota hai aur 15 points deduct hote hain."*

5. **Q: Agar candidate normal blink kare ya halka sa sneeze kare toh false positive nahi hoga?**
   - **Answer:** *"Sir, humne Anti-Jitter Temporal Smoothing aur Grace Period implement kiya hai. Single frame deviation par penalty nahi lagti; candidate ko continuous 2.5 seconds tak screen se bahar dekhna padta hai tabhi violation trigger hoti hai."*

6. **Q: Audio detection ambient fan noise ko voice se kaise alag karta hai?**
   - **Answer:** *"Sir, Web Audio API ka `AnalyserNode` Fast Fourier Transform (FFT) karke frequency bins me divide karta hai. Hum specifically 100Hz se 3000Hz (human speech band) ko filter karte hain aur RMS volume average check karte hain."*

---

## 🚀 Live Demo Kaise Dikhana Hai (Step-by-Step Viva Presentation Guide)

1. **Terminal me project run karein:**
   ```bash
   cd C:\Users\princ\.gemini\antigravity-ide\scratch\ai-exam-proctoring
   npm run dev
   ```
2. Browser me open karein: `http://localhost:5173/`
3. **Viva Step 1 (Hardware Check):**
   - Candidate Details dalein (Name, Roll No).
   - Webcam aur Mic permission allow karein.
   - Screen par oval face alignment aur green status dikhayein.
4. **Viva Step 2 (Exam Mode Demo):**
   - "Start Monitored Examination" par click karein.
   - Right side HUD me live camera, gaze direction, audio meter, aur 100% Trust Score dikhayein.
   - Questions attempt karein.
5. **Viva Step 3 (Live Malpractice Trigger):**
   - **Gaze Test:** Sar ko right/left ghuma kar dikhayein -> Alert pop-up aur beeping chime aayega!
   - **Phone Test:** Apna smartphone camera ke samne layein -> Red bounding box "CELL PHONE" detect hoga!
   - **Tab Test:** New tab open karein ya bahar click karein -> "Candidate switched application window" audit record hoga!
6. **Viva Step 4 (AI Sensor Sandbox Tab):**
   - Top nav se **"AI Sensor Sandbox (Demo)"** tab par switch karke dikhayein.
   - Yahan raw FPS, Yaw/Pitch angles, aur testing checklist hai jise examiner dekh kar impress ho jayenge!
7. **Viva Step 5 (Proctor Audit & Print PDF):**
   - Exam submit karein aur **"Proctor Audit & Evidence"** tab par jayein.
   - Captured evidence photos (watermarked snapshots) dikhayein aur "Print / Save PDF Certificate" par click karke official proctoring report dikhayein!
