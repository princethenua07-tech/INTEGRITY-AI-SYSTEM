// Proctoring Rules Engine, Trust Score Calculation & Integrity Auditing
export class ProctorEngine {
  constructor(options = {}) {
    this.trustScore = 100;
    this.violations = [];
    this.candidate = {
      name: options.name || 'Anonymous Student',
      rollNo: options.rollNo || 'REG-2026-001',
      institution: options.institution || 'Department of Computer Science',
      subject: options.subject || 'Artificial Intelligence & Machine Learning'
    };

    this.tabSwitchCount = 0;
    this.faceMissingCount = 0;
    this.multiFaceCount = 0;
    this.lookingAwayCount = 0;
    this.prohibitedObjectCount = 0;
    this.audioAnomalyCount = 0;
    this.keyboardLockCount = 0;

    this.onScoreUpdate = null;
    this.onViolationAlert = null;
    this.isArmed = false;
    this.maxViolationsBeforeLock = 10;
  }

  setCandidateDetails(details) {
    this.candidate = { ...this.candidate, ...details };
  }

  arm(onScoreUpdate, onViolationAlert) {
    this.onScoreUpdate = onScoreUpdate;
    this.onViolationAlert = onViolationAlert;
    this.isArmed = true;

    this.bindBrowserSecurityListeners();
  }

  recordViolation(event) {
    if (!this.isArmed) return;

    let penalty = 0;
    switch (event.type) {
      case 'PROHIBITED_OBJECT':
        penalty = 20;
        this.prohibitedObjectCount++;
        break;
      case 'MULTIPLE_FACES':
        penalty = 15;
        this.multiFaceCount++;
        break;
      case 'FACE_MISSING':
        penalty = 10;
        this.faceMissingCount++;
        break;
      case 'TAB_SWITCH':
        penalty = 15;
        this.tabSwitchCount++;
        break;
      case 'LOOKING_AWAY':
        penalty = 4;
        this.lookingAwayCount++;
        break;
      case 'AUDIO_ANOMALY':
        penalty = 5;
        this.audioAnomalyCount++;
        break;
      case 'KEYBOARD_LOCK_ATTEMPT':
        penalty = 5;
        this.keyboardLockCount++;
        break;
      default:
        penalty = 3;
    }

    this.trustScore = Math.max(0, this.trustScore - penalty);

    const record = {
      id: this.violations.length + 1,
      timestamp: event.timestamp || new Date().toLocaleTimeString(),
      type: event.type,
      message: event.message,
      penalty,
      scoreAfter: this.trustScore,
      snapshot: event.snapshot || null
    };

    this.violations.push(record);

    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.trustScore, this.getIntegrityStatus());
    }

    if (this.onViolationAlert) {
      this.onViolationAlert(record);
    }
  }

  getIntegrityStatus() {
    if (this.trustScore >= 85) {
      return {
        level: 'CLEAN',
        badge: 'EXEMPLARY / CLEAN',
        color: '#10b981', // Emerald
        verdict: 'No significant anomalies detected. Candidate verified.'
      };
    } else if (this.trustScore >= 60) {
      return {
        level: 'SUSPICIOUS',
        badge: 'SUSPICIOUS / MANUAL REVIEW',
        color: '#f59e0b', // Amber
        verdict: 'Repeated minor deviations detected. Proctor audit recommended.'
      };
    } else {
      return {
        level: 'COMPROMISED',
        badge: 'MALPRACTICE FLAG / REJECTED',
        color: '#ef4444', // Red
        verdict: 'High severity violations occurred. Severe malpractice probability.'
      };
    }
  }

  bindBrowserSecurityListeners() {
    // 1. Tab Switching & Window Blur detection
    window.addEventListener('blur', () => {
      if (this.isArmed) {
        this.recordViolation({
          type: 'TAB_SWITCH',
          message: 'Candidate switched application window or browser tab!'
        });
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (this.isArmed && document.visibilityState === 'hidden') {
        this.recordViolation({
          type: 'TAB_SWITCH',
          message: 'Browser minimized or background tab activated!'
        });
      }
    });

    // 2. Fullscreen escape detection
    document.addEventListener('fullscreenchange', () => {
      if (this.isArmed && !document.fullscreenElement) {
        this.recordViolation({
          type: 'TAB_SWITCH',
          message: 'Candidate exited Fullscreen exam mode!'
        });
      }
    });

    // 3. Prevent Right-Click Context Menu
    document.addEventListener('contextmenu', (e) => {
      if (this.isArmed) {
        e.preventDefault();
        this.recordViolation({
          type: 'KEYBOARD_LOCK_ATTEMPT',
          message: 'Unauthorized right-click inspection attempted'
        });
      }
    });

    // 4. Block Developer Tools & Copy/Paste Shortcut Keys
    document.addEventListener('keydown', (e) => {
      if (!this.isArmed) return;

      // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        this.recordViolation({
          type: 'KEYBOARD_LOCK_ATTEMPT',
          message: `Blocked developer inspection tool shortcut (${e.key})`
        });
        return;
      }

      // Ctrl+C, Ctrl+V, Ctrl+A block inside exam questions
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        this.recordViolation({
          type: 'KEYBOARD_LOCK_ATTEMPT',
          message: `Clipboard copy/paste blocked (${e.ctrlKey ? 'Ctrl+' + e.key.toUpperCase() : ''})`
        });
      }
    });
  }

  disarm() {
    this.isArmed = false;
  }

  getAuditReport(examResult = null) {
    const status = this.getIntegrityStatus();
    return {
      candidate: this.candidate,
      trustScore: this.trustScore,
      status,
      stats: {
        totalViolations: this.violations.length,
        tabSwitches: this.tabSwitchCount,
        lookingAway: this.lookingAwayCount,
        faceMissing: this.faceMissingCount,
        multiFaces: this.multiFaceCount,
        prohibitedObjects: this.prohibitedObjectCount,
        audioAnomalies: this.audioAnomalyCount,
        keyboardLockAttempts: this.keyboardLockCount
      },
      violations: [...this.violations],
      examResult: examResult || null,
      generatedAt: new Date().toLocaleString()
    };
  }
}
