// Application Controller - Sentinel AI Online Proctoring System
import confetti from 'canvas-confetti';
import { AudioDetector } from './audioDetector.js';
import { VisionEngine } from './visionEngine.js';
import { ExamEngine } from './examEngine.js';
import { ProctorEngine } from './proctorEngine.js';

class SentinelApp {
  constructor() {
    this.audioDetector = new AudioDetector();
    this.visionEngine = new VisionEngine();
    this.examEngine = new ExamEngine({ durationMinutes: 15 });
    this.proctorEngine = new ProctorEngine();

    this.mediaStream = null;
    this.currentTab = 'tab-exam';
    this.isExamActive = false;
    this.showLandmarksMesh = true;

    // Dom Elements
    this.dom = {
      // Nav
      tabBtns: document.querySelectorAll('.tab-btn'),
      tabContents: document.querySelectorAll('.tab-content'),
      statusText: document.getElementById('status-text'),
      btnToggleSound: document.getElementById('btn-toggle-sound'),
      soundIcon: document.getElementById('sound-icon'),
      btnToggleFullscreen: document.getElementById('btn-toggle-fullscreen'),

      // Exam Portal Views
      setupView: document.getElementById('exam-setup-view'),
      activeView: document.getElementById('exam-active-view'),
      completedView: document.getElementById('exam-completed-view'),

      // Setup Inputs & Meters
      candidateName: document.getElementById('input-candidate-name'),
      rollNo: document.getElementById('input-roll-no'),
      subject: document.getElementById('input-subject'),
      setupVideo: document.getElementById('setup-video'),
      setupCanvas: document.getElementById('setup-canvas'),
      setupTargetOval: document.getElementById('setup-target-oval'),
      setupMicLevel: document.getElementById('setup-mic-level'),
      setupMicBar: document.getElementById('setup-mic-bar'),
      setupFaceStatus: document.getElementById('setup-face-status'),
      setupFaceBar: document.getElementById('setup-face-bar'),
      btnStartExam: document.getElementById('btn-start-exam'),

      // Active Exam
      qCategory: document.getElementById('q-category'),
      qCounter: document.getElementById('q-counter'),
      qText: document.getElementById('q-text'),
      qOptions: document.getElementById('q-options-container'),
      qPalette: document.getElementById('q-palette-grid'),
      btnPrevQ: document.getElementById('btn-prev-q'),
      btnNextQ: document.getElementById('btn-next-q'),
      btnMarkReview: document.getElementById('btn-mark-review'),
      btnSubmitExam: document.getElementById('btn-submit-exam'),
      examTimer: document.getElementById('exam-timer-display'),

      // Proctor HUD
      hudVideo: document.getElementById('hud-video'),
      hudCanvas: document.getElementById('hud-canvas'),
      hudCameraBox: document.getElementById('hud-camera-container'),
      scoreVal: document.getElementById('score-val'),
      scoreStatusBadge: document.getElementById('score-status-badge'),
      sensorFace: document.getElementById('hud-sensor-face'),
      sensorGaze: document.getElementById('hud-sensor-gaze'),
      sensorObject: document.getElementById('hud-sensor-object'),
      sensorAudio: document.getElementById('hud-sensor-audio'),
      incidentFeed: document.getElementById('incident-feed'),
      incidentCountBadge: document.getElementById('incident-count-badge'),

      // Exam Completed
      finalExamScore: document.getElementById('final-exam-score'),
      finalExamRatio: document.getElementById('final-exam-ratio'),
      finalTrustScore: document.getElementById('final-trust-score'),
      finalTrustBadge: document.getElementById('final-trust-badge'),
      btnViewAudit: document.getElementById('btn-view-audit'),

      // Sandbox / Demo
      sandboxVideo: document.getElementById('sandbox-video'),
      sandboxCanvas: document.getElementById('sandbox-canvas'),
      telemetryFps: document.getElementById('telemetry-fps'),
      telemetryAngles: document.getElementById('telemetry-angles'),
      telemetryGaze: document.getElementById('telemetry-gaze'),
      telemetryFaces: document.getElementById('telemetry-faces'),
      telemetryObjects: document.getElementById('telemetry-objects'),
      telemetryAudio: document.getElementById('telemetry-audio'),
      btnToggleMesh: document.getElementById('btn-toggle-mesh'),
      btnCaptureTestSnap: document.getElementById('btn-capture-test-snap'),

      // Sandbox checklist badges
      badgeTestGaze: document.getElementById('badge-test-gaze'),
      badgeTestPhone: document.getElementById('badge-test-phone'),
      badgeTestMulti: document.getElementById('badge-test-multi'),
      badgeTestAudio: document.getElementById('badge-test-audio'),
      badgeTestTab: document.getElementById('badge-test-tab'),

      // Sim buttons
      simBtnPhone: document.getElementById('sim-btn-phone'),
      simBtnMulti: document.getElementById('sim-btn-multi'),
      simBtnGaze: document.getElementById('sim-btn-gaze'),
      simBtnTab: document.getElementById('sim-btn-tab'),

      // Audit Report
      reportName: document.getElementById('report-name'),
      reportRoll: document.getElementById('report-roll'),
      reportDate: document.getElementById('report-date'),
      reportTrustScore: document.getElementById('report-trust-score'),
      reportStatusBadge: document.getElementById('report-status-badge'),
      reportVerdictText: document.getElementById('report-verdict-text'),
      reportStatTab: document.getElementById('report-stat-tab'),
      reportStatGaze: document.getElementById('report-stat-gaze'),
      reportStatNoFace: document.getElementById('report-stat-noface'),
      reportStatMulti: document.getElementById('report-stat-multi'),
      reportStatPhone: document.getElementById('report-stat-phone'),
      evidenceGallery: document.getElementById('evidence-gallery'),
      btnPrintReport: document.getElementById('btn-print-report'),

      // Toast container
      toastContainer: document.getElementById('toast-container')
    };

    this.init();
  }

  async init() {
    this.bindNavigation();
    this.bindUtilities();
    this.bindSimulators();
    this.bindExamControls();

    // Initialize Camera and AI models
    await this.initHardwareAndAI();
  }

  bindNavigation() {
    this.dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    if (this.dom.btnViewAudit) {
      this.dom.btnViewAudit.addEventListener('click', () => {
        this.switchTab('tab-report');
      });
    }
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    this.dom.tabBtns.forEach(b => {
      if (b.getAttribute('data-tab') === tabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    this.dom.tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Handle video feed target routing
    this.routeCameraFeed(tabId);

    if (tabId === 'tab-report') {
      this.renderAuditReport();
    }
  }

  routeCameraFeed(tabId) {
    if (!this.mediaStream) return;

    if (tabId === 'tab-sandbox') {
      if (this.dom.sandboxVideo && this.dom.sandboxVideo.srcObject !== this.mediaStream) {
        this.dom.sandboxVideo.srcObject = this.mediaStream;
        this.dom.sandboxVideo.play().catch(() => {});
        this.visionEngine.start(
          this.dom.sandboxVideo,
          this.dom.sandboxCanvas,
          (t) => this.handleTelemetry(t),
          (v) => this.handleViolation(v)
        );
      }
    } else if (tabId === 'tab-exam') {
      if (this.isExamActive) {
        if (this.dom.hudVideo && this.dom.hudVideo.srcObject !== this.mediaStream) {
          this.dom.hudVideo.srcObject = this.mediaStream;
          this.dom.hudVideo.play().catch(() => {});
          this.visionEngine.start(
            this.dom.hudVideo,
            this.dom.hudCanvas,
            (t) => this.handleTelemetry(t),
            (v) => this.handleViolation(v)
          );
        }
      } else {
        if (this.dom.setupVideo && this.dom.setupVideo.srcObject !== this.mediaStream) {
          this.dom.setupVideo.srcObject = this.mediaStream;
          this.dom.setupVideo.play().catch(() => {});
          this.visionEngine.start(
            this.dom.setupVideo,
            this.dom.setupCanvas,
            (t) => this.handleTelemetry(t),
            (v) => this.handleViolation(v)
          );
        }
      }
    }
  }

  async initHardwareAndAI() {
    this.dom.statusText.textContent = 'CONNECTING CAMERA...';

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      this.dom.setupVideo.srcObject = this.mediaStream;
      await this.dom.setupVideo.play().catch(() => {});

      // Start Audio Detector
      await this.audioDetector.start(
        this.mediaStream,
        (audioEvent) => this.handleViolation(audioEvent),
        (normLevel) => this.handleAudioLevel(normLevel)
      );

      // Initialize AI Models (MediaPipe + COCO-SSD)
      this.dom.statusText.textContent = 'LOADING AI VISION MODELS...';
      await this.visionEngine.initialize();

      this.dom.statusText.textContent = 'SYSTEM ARMED & CALIBRATED';

      // Start Vision Engine on Setup view
      this.visionEngine.start(
        this.dom.setupVideo,
        this.dom.setupCanvas,
        (t) => this.handleTelemetry(t),
        (v) => this.handleViolation(v)
      );
    } catch (err) {
      console.warn('Hardware permission or camera access error:', err);
      this.dom.statusText.textContent = 'CAMERA SIMULATION MODE';
      this.showToast('ℹ️ Notice', 'Camera permission not granted. Running in interactive simulation mode.');
    }
  }

  handleAudioLevel(level) {
    const pct = Math.round(level * 100);
    if (this.dom.setupMicLevel) this.dom.setupMicLevel.textContent = `${pct}%`;
    if (this.dom.setupMicBar) {
      this.dom.setupMicBar.style.width = `${pct}%`;
      if (pct > 25) {
        this.dom.setupMicBar.classList.add('warning');
      } else {
        this.dom.setupMicBar.classList.remove('warning');
      }
    }

    if (this.dom.sensorAudio) {
      if (pct > 25) {
        this.dom.sensorAudio.innerHTML = `⚠️ Loud (${pct}%)`;
        this.dom.sensorAudio.className = 'status flagged';
      } else {
        this.dom.sensorAudio.innerHTML = `🟢 Normal (${pct}%)`;
        this.dom.sensorAudio.className = 'status';
      }
    }

    if (this.dom.telemetryAudio) {
      this.dom.telemetryAudio.textContent = `${pct}% ${pct > 25 ? '(Voice detected)' : '(Quiet)'}`;
    }

    if (pct > 30 && this.dom.badgeTestAudio) {
      this.markChecklistPassed('audio');
    }
  }

  handleTelemetry(t) {
    // 1. Setup Calibration View
    if (!this.isExamActive) {
      if (t.faceCount === 1) {
        this.dom.setupFaceStatus.textContent = t.isFaceCentered ? 'OPTIMAL' : 'ADJUST POSITION';
        this.dom.setupFaceStatus.style.color = t.isFaceCentered ? 'var(--accent-emerald)' : 'var(--accent-amber)';
        this.dom.setupFaceBar.style.width = t.isFaceCentered ? '100%' : '65%';
        if (t.isFaceCentered) {
          this.dom.setupTargetOval.classList.add('centered');
        } else {
          this.dom.setupTargetOval.classList.remove('centered');
        }
      } else if (t.faceCount === 0) {
        this.dom.setupFaceStatus.textContent = 'NO FACE DETECTED';
        this.dom.setupFaceStatus.style.color = 'var(--accent-rose)';
        this.dom.setupFaceBar.style.width = '10%';
        this.dom.setupTargetOval.classList.remove('centered');
      } else {
        this.dom.setupFaceStatus.textContent = `${t.faceCount} FACES DETECTED`;
        this.dom.setupFaceStatus.style.color = 'var(--accent-rose)';
        this.dom.setupFaceBar.style.width = '30%';
        this.dom.setupTargetOval.classList.remove('centered');
      }
    }

    // 2. Active Exam HUD
    if (this.isExamActive) {
      // Face Count
      if (t.faceCount === 1) {
        this.dom.sensorFace.innerHTML = '🟢 1 Candidate';
        this.dom.sensorFace.className = 'status';
      } else if (t.faceCount === 0) {
        this.dom.sensorFace.innerHTML = '🚨 Absent';
        this.dom.sensorFace.className = 'status flagged';
      } else {
        this.dom.sensorFace.innerHTML = `🚨 ${t.faceCount} People`;
        this.dom.sensorFace.className = 'status flagged';
      }

      // Gaze
      if (t.gazeDirection === 'CENTER') {
        this.dom.sensorGaze.innerHTML = '🟢 CENTER';
        this.dom.sensorGaze.className = 'status';
      } else {
        this.dom.sensorGaze.innerHTML = `⚠️ Looking ${t.gazeDirection}`;
        this.dom.sensorGaze.className = 'status flagged';
      }

      // Prohibited Objects
      if (t.prohibitedObjects && t.prohibitedObjects.length > 0) {
        const item = t.prohibitedObjects[0];
        this.dom.sensorObject.innerHTML = `🚨 ${item.class}`;
        this.dom.sensorObject.className = 'status flagged';
      } else {
        this.dom.sensorObject.innerHTML = '🟢 None';
        this.dom.sensorObject.className = 'status';
      }
    }

    // 3. Sandbox Telemetry Table
    if (this.dom.telemetryFps) this.dom.telemetryFps.textContent = t.fps;
    if (this.dom.telemetryAngles) {
      this.dom.telemetryAngles.textContent = `Yaw: ${t.yaw}° | Pitch: ${t.pitch}° | Roll: ${t.roll}°`;
    }
    if (this.dom.telemetryGaze) {
      this.dom.telemetryGaze.textContent = `${t.gazeDirection} (Deviation: ${Math.abs(t.yaw)}°)`;
      if (t.gazeDirection !== 'CENTER' && t.gazeDirection !== 'ABSENT') {
        this.markChecklistPassed('gaze');
      }
    }
    if (this.dom.telemetryFaces) {
      this.dom.telemetryFaces.textContent = `${t.faceCount} Face(s)`;
      if (t.faceCount > 1) {
        this.markChecklistPassed('multi');
      }
    }
    if (this.dom.telemetryObjects) {
      if (t.prohibitedObjects && t.prohibitedObjects.length > 0) {
        this.dom.telemetryObjects.textContent = t.prohibitedObjects.map(o => `${o.class} (${o.score}%)`).join(', ');
        this.dom.telemetryObjects.style.color = 'var(--accent-rose)';
        this.markChecklistPassed('phone');
      } else {
        this.dom.telemetryObjects.textContent = 'None detected';
        this.dom.telemetryObjects.style.color = 'var(--accent-emerald)';
      }
    }
  }

  handleViolation(event) {
    if (!this.isExamActive && this.currentTab !== 'tab-sandbox') return;

    // Play warning sound chime
    this.audioDetector.playWarningBeep();

    // Pulse red alert on HUD camera
    if (this.dom.hudCameraBox) {
      this.dom.hudCameraBox.classList.add('alert-border');
      setTimeout(() => {
        this.dom.hudCameraBox.classList.remove('alert-border');
      }, 1500);
    }

    // Record into proctor engine
    this.proctorEngine.recordViolation(event);

    // Show warning toast
    this.showToast('🚨 Proctor Alert', `${event.message} (-${event.penalty || 5} pts)`);

    // Add to live incident feed
    this.appendIncidentFeed(event);
  }

  appendIncidentFeed(event) {
    if (!this.dom.incidentFeed) return;

    const time = event.timestamp || new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.className = 'incident-item';
    item.innerHTML = `
      <div class="incident-time">[${time}] - ${event.type}</div>
      <div class="incident-msg">${event.message}</div>
    `;

    // Remove empty placeholder
    if (this.dom.incidentFeed.querySelector('div[style*="text-align: center"]')) {
      this.dom.incidentFeed.innerHTML = '';
    }

    this.dom.incidentFeed.prepend(item);
    if (this.dom.incidentCountBadge) {
      this.dom.incidentCountBadge.textContent = this.proctorEngine.violations.length;
    }
  }

  updateTrustScoreUI(score, status) {
    if (this.dom.scoreVal) {
      this.dom.scoreVal.textContent = score;
      this.dom.scoreVal.style.color = status.color;
    }
    if (this.dom.scoreStatusBadge) {
      this.dom.scoreStatusBadge.textContent = status.badge;
      this.dom.scoreStatusBadge.style.color = status.color;
      this.dom.scoreStatusBadge.style.borderColor = status.color;
      this.dom.scoreStatusBadge.style.background = `${status.color}22`;
    }
  }

  bindExamControls() {
    // Start Exam button
    this.dom.btnStartExam.addEventListener('click', () => {
      this.startExaminationSession();
    });

    // Previous / Next Question buttons
    this.dom.btnPrevQ.addEventListener('click', () => {
      if (this.examEngine.goToPrev()) {
        this.renderCurrentQuestion();
      }
    });

    this.dom.btnNextQ.addEventListener('click', () => {
      if (this.examEngine.goToNext()) {
        this.renderCurrentQuestion();
      }
    });

    // Mark for Review button
    this.dom.btnMarkReview.addEventListener('click', () => {
      const q = this.examEngine.getCurrentQuestion();
      this.examEngine.toggleReview(q.id);
      this.renderCurrentQuestion();
      this.renderPalette();
    });

    // Submit Exam button
    this.dom.btnSubmitExam.addEventListener('click', () => {
      if (confirm('Are you sure you want to finalize and submit your examination?')) {
        this.completeExamination();
      }
    });
  }

  startExaminationSession() {
    const candidateName = this.dom.candidateName.value.trim() || 'Rahul Sharma';
    const rollNo = this.dom.rollNo.value.trim() || 'CS-2026-042';
    const subject = this.dom.subject.value.trim() || 'Artificial Intelligence';

    this.proctorEngine.setCandidateDetails({ name: candidateName, rollNo, subject });

    // Request Fullscreen for security
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    // Switch views
    this.dom.setupView.style.display = 'none';
    this.dom.activeView.style.display = 'block';
    this.isExamActive = true;

    // Attach Camera to HUD Video
    if (this.mediaStream) {
      this.dom.hudVideo.srcObject = this.mediaStream;
      this.dom.hudVideo.play().catch(() => {});
      this.visionEngine.start(
        this.dom.hudVideo,
        this.dom.hudCanvas,
        (t) => this.handleTelemetry(t),
        (v) => this.handleViolation(v)
      );
    }

    // Arm Proctoring Engine
    this.proctorEngine.arm(
      (score, status) => this.updateTrustScoreUI(score, status),
      (record) => {}
    );

    // Start Exam Timer & Questions
    this.examEngine.start(
      (timeStr, secsRemaining) => {
        if (this.dom.examTimer) {
          this.dom.examTimer.textContent = timeStr;
          if (secsRemaining <= 300) {
            this.dom.examTimer.style.color = 'var(--accent-rose)';
          }
        }
      },
      () => {
        this.showToast('⌛ Time Expired', 'Exam duration finished. Auto-submitting.');
        this.completeExamination();
      }
    );

    this.renderCurrentQuestion();
    this.renderPalette();
    this.showToast('🛡️ Exam Commenced', 'Proctoring engine armed. Keep your face centered.');
  }

  renderCurrentQuestion() {
    const q = this.examEngine.getCurrentQuestion();
    const idx = this.examEngine.currentIndex;
    const total = this.examEngine.questions.length;

    this.dom.qCategory.textContent = q.category;
    this.dom.qCounter.textContent = `Question ${idx + 1} of ${total}`;
    this.dom.qText.textContent = q.question;

    // Options Rendering
    this.dom.qOptions.innerHTML = '';
    const selectedAns = this.examEngine.answers[q.id];

    q.options.forEach(opt => {
      const card = document.createElement('div');
      card.className = `option-card ${selectedAns === opt.id ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="option-key">${opt.id}</div>
        <div class="option-label">${opt.text}</div>
      `;
      card.addEventListener('click', () => {
        this.examEngine.selectAnswer(q.id, opt.id);
        this.renderCurrentQuestion();
        this.renderPalette();
      });
      this.dom.qOptions.appendChild(card);
    });

    // Update Mark for Review button state
    if (this.examEngine.reviewed.has(q.id)) {
      this.dom.btnMarkReview.style.background = 'rgba(245, 158, 11, 0.2)';
      this.dom.btnMarkReview.style.borderColor = 'var(--accent-amber)';
      this.dom.btnMarkReview.style.color = '#fbbf24';
      this.dom.btnMarkReview.innerHTML = '★ Marked for Review';
    } else {
      this.dom.btnMarkReview.style.background = '';
      this.dom.btnMarkReview.style.borderColor = '';
      this.dom.btnMarkReview.style.color = '';
      this.dom.btnMarkReview.innerHTML = '⭐ Mark for Review';
    }

    // Prev / Next button states
    this.dom.btnPrevQ.disabled = idx === 0;
    this.dom.btnNextQ.disabled = idx === total - 1;
  }

  renderPalette() {
    this.dom.qPalette.innerHTML = '';
    this.examEngine.questions.forEach((q, i) => {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = i + 1;

      if (i === this.examEngine.currentIndex) {
        btn.classList.add('active');
      }

      if (this.examEngine.reviewed.has(q.id)) {
        btn.classList.add('review');
      } else if (this.examEngine.answers[q.id]) {
        btn.classList.add('answered');
      }

      btn.addEventListener('click', () => {
        this.examEngine.goToIndex(i);
        this.renderCurrentQuestion();
        this.renderPalette();
      });

      this.dom.qPalette.appendChild(btn);
    });
  }

  completeExamination() {
    this.isExamActive = false;
    this.proctorEngine.disarm();
    const result = this.examEngine.submitExam();

    // Trigger celebratory confetti
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Update Completed Screen
    this.dom.activeView.style.display = 'none';
    this.dom.completedView.style.display = 'block';

    this.dom.finalExamScore.textContent = `${result.scorePercentage}%`;
    this.dom.finalExamRatio.textContent = `${result.correctCount} of ${result.totalQuestions} Questions Correct`;

    const integrity = this.proctorEngine.getIntegrityStatus();
    this.dom.finalTrustScore.textContent = `${this.proctorEngine.trustScore}%`;
    this.dom.finalTrustScore.style.color = integrity.color;
    this.dom.finalTrustBadge.textContent = integrity.badge;
    this.dom.finalTrustBadge.style.color = integrity.color;

    this.showToast('✅ Exam Completed', 'Responses submitted. Proctoring report ready.');
  }

  renderAuditReport() {
    const report = this.proctorEngine.getAuditReport(this.examEngine.getResultSummary());

    this.dom.reportName.textContent = report.candidate.name;
    this.dom.reportRoll.textContent = `Roll: ${report.candidate.rollNo} • Subject: ${report.candidate.subject}`;
    this.dom.reportDate.textContent = `Audit Generated: ${report.generatedAt}`;

    this.dom.reportTrustScore.textContent = `${report.trustScore}%`;
    this.dom.reportTrustScore.style.color = report.status.color;

    this.dom.reportStatusBadge.textContent = report.status.badge;
    this.dom.reportStatusBadge.style.color = report.status.color;
    this.dom.reportStatusBadge.style.borderColor = report.status.color;

    this.dom.reportVerdictText.textContent = report.status.verdict;

    // Stats
    this.dom.reportStatTab.textContent = report.stats.tabSwitches;
    this.dom.reportStatGaze.textContent = report.stats.lookingAway;
    this.dom.reportStatNoFace.textContent = report.stats.faceMissing;
    this.dom.reportStatMulti.textContent = report.stats.multiFaces;
    this.dom.reportStatPhone.textContent = report.stats.prohibitedObjects;

    // Evidence Gallery
    this.dom.evidenceGallery.innerHTML = '';
    const itemsWithSnapshots = report.violations.filter(v => v.snapshot);

    if (itemsWithSnapshots.length === 0) {
      this.dom.evidenceGallery.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 0; color: var(--text-faint); font-size: 14px;">
          📷 No photographic violation evidence captured. Session completely clean!
        </div>
      `;
    } else {
      itemsWithSnapshots.forEach(item => {
        const card = document.createElement('div');
        card.className = 'evidence-card';
        card.innerHTML = `
          <img src="${item.snapshot}" alt="${item.type}" class="evidence-img">
          <div class="evidence-info">
            <div class="evidence-title">🚨 ${item.type} (-${item.penalty} PTS)</div>
            <div style="color: var(--text-main); font-size: 12px; margin-top: 2px;">${item.message}</div>
            <div class="evidence-time">Logged at ${item.timestamp} | Integrity: ${item.scoreAfter}%</div>
          </div>
        `;
        this.dom.evidenceGallery.appendChild(card);
      });
    }
  }

  bindSimulators() {
    // Quick simulator buttons for viva testing
    if (this.dom.simBtnPhone) {
      this.dom.simBtnPhone.addEventListener('click', () => {
        this.handleViolation({
          type: 'PROHIBITED_OBJECT',
          message: 'Smart Mobile Phone detected on candidate desk',
          penalty: 20,
          snapshot: this.visionEngine.captureSnapshot('PROHIBITED_PHONE')
        });
        this.markChecklistPassed('phone');
      });
    }

    if (this.dom.simBtnMulti) {
      this.dom.simBtnMulti.addEventListener('click', () => {
        this.handleViolation({
          type: 'MULTIPLE_FACES',
          message: 'Multiple people detected in candidate webcam view',
          penalty: 15,
          snapshot: this.visionEngine.captureSnapshot('MULTIPLE_FACES')
        });
        this.markChecklistPassed('multi');
      });
    }

    if (this.dom.simBtnGaze) {
      this.dom.simBtnGaze.addEventListener('click', () => {
        this.handleViolation({
          type: 'LOOKING_AWAY',
          message: 'Candidate looking away from exam screen (Yaw deviation: +38°)',
          penalty: 4,
          snapshot: this.visionEngine.captureSnapshot('GAZE_DEVIATION')
        });
        this.markChecklistPassed('gaze');
      });
    }

    if (this.dom.simBtnTab) {
      this.dom.simBtnTab.addEventListener('click', () => {
        this.handleViolation({
          type: 'TAB_SWITCH',
          message: 'Exam window minimized or unauthorized tab activated',
          penalty: 15,
          snapshot: this.visionEngine.captureSnapshot('TAB_SWITCH')
        });
        this.markChecklistPassed('tab');
      });
    }

    if (this.dom.btnCaptureTestSnap) {
      this.dom.btnCaptureTestSnap.addEventListener('click', () => {
        const snap = this.visionEngine.captureSnapshot('MANUAL_AUDIT');
        if (snap) {
          const win = window.open();
          win.document.write(`<img src="${snap}" style="max-width:100%; height:auto;" />`);
        }
      });
    }

    if (this.dom.btnPrintReport) {
      this.dom.btnPrintReport.addEventListener('click', () => {
        window.print();
      });
    }
  }

  markChecklistPassed(type) {
    let badge = null;
    if (type === 'gaze') badge = this.dom.badgeTestGaze;
    if (type === 'phone') badge = this.dom.badgeTestPhone;
    if (type === 'multi') badge = this.dom.badgeTestMulti;
    if (type === 'audio') badge = this.dom.badgeTestAudio;
    if (type === 'tab') badge = this.dom.badgeTestTab;

    if (badge && !badge.classList.contains('verified')) {
      badge.textContent = 'VERIFIED ✓';
      badge.classList.add('verified');
      badge.style.background = 'rgba(16, 185, 129, 0.25)';
      badge.style.borderColor = 'var(--accent-emerald)';
      badge.style.color = '#34d399';
    }
  }

  bindUtilities() {
    // Sound chime toggle
    this.dom.btnToggleSound.addEventListener('click', () => {
      this.audioDetector.isBeepEnabled = !this.audioDetector.isBeepEnabled;
      this.dom.soundIcon.textContent = this.audioDetector.isBeepEnabled ? '🔊' : '🔇';
      this.showToast('Audio Alert', this.audioDetector.isBeepEnabled ? 'Alarm sound unmuted' : 'Alarm sound muted');
    });

    // Fullscreen toggle
    this.dom.btnToggleFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  showToast(title, desc) {
    if (!this.dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon">⚠️</div>
      <div>
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${desc}</div>
      </div>
    `;

    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new SentinelApp();
});
