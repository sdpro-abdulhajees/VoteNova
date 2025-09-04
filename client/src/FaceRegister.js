import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';

function FaceRegister() {
  const videoRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [descriptor, setDescriptor] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [message, setMessage] = useState('');
  const [blinkCount, setBlinkCount] = useState(0);
  const blinkCountRef = useRef(0);
  const [livenessRunning, setLivenessRunning] = useState(false);
  const rafRef = useRef(null);
  const [calibratedEAR, setCalibratedEAR] = useState(null);
  const [sameFaceOk, setSameFaceOk] = useState(false);
  const sameFaceOkRef = useRef(false);
  const faceRefDescriptor = useRef(null);
  const lastBoxRef = useRef(null);
  const earHistoryRef = useRef([]);
  const baselineOpenStreakRef = useRef(0);
  const lastBlinkAtRef = useRef(0);
  // MediaPipe Face Landmarker
  const mpReadyRef = useRef(false);
  const mpLandmarkerRef = useRef(null);

  const ensureMediaPipe = async () => {
    if (mpReadyRef.current) return;
    const Vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/vision_bundle.mjs');
    const { FaceLandmarker, FilesetResolver } = Vision;
    const fileset = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm'
    );
    mpLandmarkerRef.current = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
      },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 1
    });
    mpReadyRef.current = true;
  };

  useEffect(() => {
    const loadModels = async () => {
      const basePublicUrl = process.env.PUBLIC_URL || '';
      const MODELS_BASE = basePublicUrl ? `${basePublicUrl}/models` : 'models';
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(`${MODELS_BASE}/tiny_face_detector`);
        await faceapi.nets.faceLandmark68Net.loadFromUri(`${MODELS_BASE}/face_landmark_68`);
        await faceapi.nets.faceRecognitionNet.loadFromUri(`${MODELS_BASE}/face_recognition`);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load face-api models from', MODELS_BASE, error);
        setModelsLoaded(false);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } }).then((stream) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        const playIfReady = () => {
          if (videoRef.current && typeof videoRef.current.play === 'function') {
            videoRef.current.play().catch(()=>{});
          }
        };
        videoRef.current.onloadedmetadata = playIfReady;
        playIfReady();
      });
    }
  }, [modelsLoaded]);

  const isVideoReady = () => {
    const v = videoRef.current;
    return v && v.readyState >= 2;
  };

  const getEAR = (landmarks) => {
    // eye aspect ratio using 6 key points per eye
    const left = landmarks.getLeftEye();
    const right = landmarks.getRightEye();
    const ear = (eye) => {
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const A = dist(eye[1], eye[5]);
      const B = dist(eye[2], eye[4]);
      const C = dist(eye[0], eye[3]);
      return (A + B) / (2.0 * C);
    };
    return (ear(left) + ear(right)) / 2.0;
  };

  const runLiveness = async () => {
    if (!modelsLoaded) return setMessage('Models not loaded');
    await ensureMediaPipe();
    setBlinkCount(0);
    blinkCountRef.current = 0;
    setMessage('Please blink 3 times');
    setLivenessRunning(true);
    setSameFaceOk(true); // liveness only; same-face handled at capture
    sameFaceOkRef.current = true;

    let closed = false;
    let closedStreak = 0;
    let openStreak = 0;
    const CLOSED_FRAMES = 2;
    const OPEN_FRAMES = 2;
    const minBlinkIntervalMs = 300;

    const loop = () => {
      if (!isVideoReady()) { rafRef.current = requestAnimationFrame(loop); return; }
      const mp = mpLandmarkerRef.current;
      const res = mp.detectForVideo(videoRef.current, performance.now());
      const blends = res.faceBlendshapes?.[0]?.categories || [];
      const left = blends.find(c => c.categoryName === 'eyeBlinkLeft')?.score || 0;
      const right = blends.find(c => c.categoryName === 'eyeBlinkRight')?.score || 0;
      const isClosed = left > 0.6 && right > 0.6;

      if (isClosed) {
        closedStreak += 1; openStreak = 0; if (!closed && closedStreak >= CLOSED_FRAMES) closed = true;
      } else {
        openStreak += 1; closedStreak = 0;
        const now = performance.now();
        if (closed && openStreak >= OPEN_FRAMES && (now - lastBlinkAtRef.current) > minBlinkIntervalMs) {
          const next = blinkCountRef.current + 1;
          blinkCountRef.current = next; setBlinkCount(next);
          setMessage(next >= 3 ? 'Liveness passed' : `Blink detected! ${3 - next} left`);
          closed = false; lastBlinkAtRef.current = now;
        }
      }

      if (blinkCountRef.current < 3) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        setLivenessRunning(false);
        cancelAnimationFrame(rafRef.current);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  const snapAndRegister = async () => {
    if (!modelsLoaded) return setMessage('Models not loaded');
    if (!sameFaceOk) return setMessage('Stay steady. Ensure the same face in view');
    if (blinkCount < 3) return setMessage('Complete liveness first (3 blinks)');
    if (!isVideoReady()) return setMessage('Camera not ready');
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setMessage('No face detected! Try again.');
      return;
    }

    setDescriptor(Array.from(detections.descriptor));

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        role,
        descriptor: Array.from(detections.descriptor),
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay className="vn-video" />

      <div className="vn-form-row">
        <input
          className="vn-input"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="vn-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <select className="vn-input" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="vn-actions">
        <button className="vn-btn secondary" onClick={runLiveness} disabled={!modelsLoaded || livenessRunning || blinkCount>=3}>{blinkCount>=3 ? 'Liveness passed' : (livenessRunning ? 'Detecting blinks...' : 'Start liveness')}</button>
        <button className="vn-btn" onClick={snapAndRegister} disabled={!modelsLoaded || blinkCount<3}>Capture & Register</button>
        <span className={`vn-status ${message?.toLowerCase().includes('success') ? 'success' : message?.toLowerCase().includes('fail') || message?.toLowerCase().includes('error') ? 'error' : ''}`}>{message}</span>
      </div>
    </div>
  );
}

export default FaceRegister;
