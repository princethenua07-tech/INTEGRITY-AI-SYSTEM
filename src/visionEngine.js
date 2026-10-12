// AI Computer Vision Engine: MediaPipe FaceLandmarker + TFJS COCO-SSD Object Detection
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

export class VisionEngine {
  constructor() {
    this.faceLandmarker = null;
    this.objectDetector = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.isRunning = false;
    this.lastVideoTime = -1;
    this.showLandmarks = true;

    // Detection state metrics
    this.metrics = {
      faceCount: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      gazeDirection: 'CENTER', // 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
      prohibitedObjects: [],
      fps: 0,
      isFaceCentered: true,
      lightingScore: 100
    };

    // Callback listeners
    this.onTelemetryUpdate = null;
    this.onViolation = null;

    // Timers & grace periods for anti-jitter
    this.awayTimer = 0;
    this.noFaceTimer = 0;
    this.multiFaceTimer = 0;
    this.phoneTimer = 0;

    // Timing helper
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = performance.now();
    this.lastObjectDetectTime = 0;
  }

  async initialize() {
    console.log('Initializing AI Vision models...');
    try {
      // 1. Initialize MediaPipe Face Landmarker
      // Try local files first, fallback to CDN if needed
      let visionWasm;
      try {
        visionWasm = await FilesetResolver.forVisionTasks('./wasm');
      } catch (e) {
        console.warn('Local wasm load fallback to CDN:', e);
        visionWasm = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      this.faceLandmarker = await FaceLandmarker.createFromOptions(visionWasm, {
        baseOptions: {
          modelAssetPath: './models/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 3
      });
      console.log('✅ MediaPipe Face Landmarker loaded successfully');

      // 2. Initialize TensorFlow COCO-SSD (runs async in background)
      try {
        await tf.ready();
        this.objectDetector = await cocoSsd.load({
          base: 'lite_mobilenet_v2'
        });
        console.log('✅ COCO-SSD Object Detector loaded successfully');
      } catch (objErr) {
        console.warn('COCO-SSD initial load note:', objErr);
      }

      return true;
    } catch (err) {
      console.error('Fatal AI Vision init error:', err);
      throw err;
    }
  }

  start(videoElement, canvasElement, onTelemetry, onViolation) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');
    this.onTelemetryUpdate = onTelemetry;
    this.onViolation = onViolation;
    this.isRunning = true;
    this.lastFrameTime = performance.now();

    this.processLoop();
  }

  processLoop = async () => {
    if (!this.isRunning || !this.videoElement) return;

    const now = performance.now();
    this.frameCount++;
    if (now - this.fpsTimer >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = now;
    }

    if (this.videoElement.readyState >= 2 && this.faceLandmarker) {
      if (this.canvasElement.width !== this.videoElement.videoWidth) {
        this.canvasElement.width = this.videoElement.videoWidth || 640;
        this.canvasElement.height = this.videoElement.videoHeight || 480;
      }

      const videoTime = this.videoElement.currentTime;
      if (videoTime !== this.lastVideoTime) {
        this.lastVideoTime = videoTime;
        const results = this.faceLandmarker.detectForVideo(this.videoElement, now);
        this.analyzeFaceResults(results);
      }

      // Check objects every 500ms using COCO-SSD
      if (this.objectDetector && now - this.lastObjectDetectTime > 500) {
        this.lastObjectDetectTime = now;
        this.detectProhibitedObjects();
      }

      this.renderCanvas();

      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({ ...this.metrics });
      }
    }

    requestAnimationFrame(this.processLoop);
  };

  analyzeFaceResults(results) {
    const faces = results.faceLandmarks || [];
    this.metrics.faceCount = faces.length;

    // Check 1: Missing Face
    if (faces.length === 0) {
      this.noFaceTimer++;
      this.metrics.gazeDirection = 'ABSENT';
      // Grace period ~2.5s (about 75 frames at 30fps)
      if (this.noFaceTimer === 75) {
        this.triggerViolation('FACE_MISSING', 'Candidate face not detected in frame');
      }
      return;
    } else {
      this.noFaceTimer = 0;
    }

    // Check 2: Multiple Faces
    if (faces.length > 1) {
      this.multiFaceTimer++;
      if (this.multiFaceTimer === 20) {
        this.triggerViolation(
          'MULTIPLE_FACES',
          `Multiple people detected (${faces.length} faces visible)`
        );
      }
    } else {
      this.multiFaceTimer = 0;
    }

    // Analyze primary face (index 0)
    const landmarks = faces[0];
    this.calculateHeadPoseAndGaze(landmarks);
  }

  calculateHeadPoseAndGaze(lm) {
    // Key landmark indices in MediaPipe Face Mesh:
    // 1: Nose tip
    // 33: Left eye outer corner
    // 263: Right eye outer corner
    // 10: Top forehead
    // 152: Bottom chin
    // 234: Left face cheek edge
    // 454: Right face cheek edge

    const nose = lm[1];
    const leftEye = lm[33];
    const rightEye = lm[263];
    const forehead = lm[10];
    const chin = lm[152];
    const leftCheek = lm[234];
    const rightCheek = lm[454];

    // Horizontal ratio (Yaw estimation)
    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    const eyeDist = Math.abs(rightEye.x - leftEye.x) || 0.1;
    const yawOffset = (nose.x - eyeCenter) / eyeDist;
    // Map to degrees roughly: centered is 0, left is negative, right is positive
    const yawDegrees = yawOffset * 100;
    this.metrics.yaw = Math.round(yawDegrees);

    // Vertical ratio (Pitch estimation)
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const faceHeight = Math.abs(chin.y - forehead.y) || 0.1;
    const pitchOffset = (nose.y - eyeCenterY) / faceHeight;
    // Expected center ratio is around 0.35 - 0.40
    const pitchDegrees = (pitchOffset - 0.38) * 120;
    this.metrics.pitch = Math.round(pitchDegrees);

    // Roll estimation
    const rollAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    this.metrics.roll = Math.round(rollAngle);

    // Determine Direction
    let direction = 'CENTER';
    // Thresholds: Yaw > 18 deg or Pitch > 16 deg
    if (yawDegrees > 18) {
      direction = 'RIGHT'; // Candidate looking to their right
    } else if (yawDegrees < -18) {
      direction = 'LEFT'; // Candidate looking to their left
    } else if (pitchDegrees > 18) {
      direction = 'DOWN'; // Looking down at desk/phone
    } else if (pitchDegrees < -18) {
      direction = 'UP';
    }

    this.metrics.gazeDirection = direction;

    // Check if looking away sustained
    if (direction !== 'CENTER') {
      this.awayTimer++;
      // If candidate looks away for > 2.5 seconds (approx 75 frames)
      if (this.awayTimer === 75) {
        this.triggerViolation(
          'LOOKING_AWAY',
          `Suspicious gaze deviation detected: Looking ${direction}`
        );
      }
    } else {
      this.awayTimer = Math.max(0, this.awayTimer - 2);
    }

    // Centeredness check for calibration
    const isCentered = nose.x > 0.35 && nose.x < 0.65 && nose.y > 0.3 && nose.y < 0.7;
    this.metrics.isFaceCentered = isCentered;
  }

  async detectProhibitedObjects() {
    if (!this.objectDetector || !this.videoElement) return;

    try {
      const predictions = await this.objectDetector.detect(this.videoElement);
      const prohibited = [];

      for (const p of predictions) {
        const cls = p.class.toLowerCase();
        // Target high-risk exam malpractice items
        if (cls === 'cell phone' || cls === 'phone' || cls === 'mobile phone') {
          prohibited.push({ class: 'Cell Phone', score: Math.round(p.score * 100), bbox: p.bbox });
        } else if (cls === 'book') {
          prohibited.push({ class: 'Book / Notes', score: Math.round(p.score * 100), bbox: p.bbox });
        } else if (cls === 'laptop' || cls === 'tv' || cls === 'remote') {
          prohibited.push({ class: 'Secondary Device', score: Math.round(p.score * 100), bbox: p.bbox });
        }
      }

      this.metrics.prohibitedObjects = prohibited;

      if (prohibited.length > 0) {
        this.phoneTimer++;
        if (this.phoneTimer >= 2) {
          const item = prohibited[0];
          this.triggerViolation(
            'PROHIBITED_OBJECT',
            `Prohibited item detected: ${item.class} (${item.score}% confidence)`
          );
          this.phoneTimer = 0;
        }
      } else {
        this.phoneTimer = 0;
      }
    } catch (e) {
      // Async frame skip
    }
  }

  triggerViolation(type, message) {
    if (this.onViolation) {
      const snapshot = this.captureSnapshot(type);
      this.onViolation({
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
        snapshot,
        telemetry: { ...this.metrics }
      });
    }
  }

  captureSnapshot(label = 'AUDIT') {
    if (!this.videoElement || this.videoElement.videoWidth === 0) return null;
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 480;
    snapCanvas.height = 360;
    const sCtx = snapCanvas.getContext('2d');

    // Draw video frame
    sCtx.drawImage(this.videoElement, 0, 0, 480, 360);

    // Add Proctored Watermark HUD overlay
    sCtx.fillStyle = 'rgba(10, 15, 29, 0.75)';
    sCtx.fillRect(0, 0, 480, 40);
    sCtx.fillRect(0, 320, 480, 40);

    sCtx.fillStyle = '#ef4444';
    sCtx.font = 'bold 14px "JetBrains Mono", monospace';
    sCtx.fillText(`[EVIDENCE RECORD] VIOLATION: ${label}`, 12, 25);

    sCtx.fillStyle = '#94a3b8';
    sCtx.font = '12px "JetBrains Mono", monospace';
    sCtx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 12, 345);
    sCtx.fillText(`SENTINEL AI PROCTOR ENGINE`, 270, 345);

    return snapCanvas.toDataURL('image/jpeg', 0.85);
  }

  renderCanvas() {
    const ctx = this.canvasCtx;
    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    ctx.clearRect(0, 0, w, h);

    // Draw Prohibited Objects bounding boxes
    if (this.metrics.prohibitedObjects.length > 0) {
      for (const item of this.metrics.prohibitedObjects) {
        const [bx, by, bw, bh] = item.bbox;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(bx, by - 26, bw, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText(`🚨 ${item.class.toUpperCase()} ${item.score}%`, bx + 6, by - 8);
      }
    }

    // Draw HUD Crosshair & Gaze Vector
    const cx = w / 2;
    const cy = h / 2;

    // Center target indicator
    ctx.strokeStyle = this.metrics.gazeDirection === 'CENTER' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Gaze Arrow Indicator if looking away
    if (this.metrics.gazeDirection !== 'CENTER' && this.metrics.gazeDirection !== 'ABSENT') {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`⚠️ GAZE: ${this.metrics.gazeDirection}`, 16, 32);

      // Draw directional vector
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let targetX = cx;
      let targetY = cy;
      if (this.metrics.gazeDirection === 'LEFT') targetX = cx - 70;
      if (this.metrics.gazeDirection === 'RIGHT') targetX = cx + 70;
      if (this.metrics.gazeDirection === 'DOWN') targetY = cy + 70;
      if (this.metrics.gazeDirection === 'UP') targetY = cy - 70;
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
    }
  }

  stop() {
    this.isRunning = false;
  }
}
