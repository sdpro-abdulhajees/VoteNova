import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';

function FaceVerify({ onVoteCast }) {
  const videoRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [livenessRunning, setLivenessRunning] = useState(false);
  const rafRef = useRef(null);
  const [calibratedEAR, setCalibratedEAR] = useState(null);
  const [sameFaceOk, setSameFaceOk] = useState(false);
  const sameFaceOkRef = useRef(false);
  const baseDescriptorRef = useRef(null);
  const lastBlinkAtRef = useRef(0);
  const blinkCountRef = useRef(0);
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
      await faceapi.nets.tinyFaceDetector.loadFromUri(`${MODELS_BASE}/tiny_face_detector`);
      await faceapi.nets.faceLandmark68Net.loadFromUri(`${MODELS_BASE}/face_landmark_68`);
      await faceapi.nets.faceRecognitionNet.loadFromUri(`${MODELS_BASE}/face_recognition`);
      setModelsLoaded(true);
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
    return v && v.readyState >= 2; // HAVE_CURRENT_DATA
  };

  const getEAR = (landmarks) => { return 0; };

  const runLiveness = async () => {
    if (!modelsLoaded) return setMessage('Models not loaded');
    await ensureMediaPipe();
    if (!isVideoReady()) return setMessage('Camera not ready');

    // 1) Pre-match against registered user before liveness
    try {
      const snapshot = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!snapshot?.descriptor) {
        setMessage('No face detected. Center your face and try again.');
        return;
      }
      baseDescriptorRef.current = Array.from(snapshot.descriptor);
      const pre = await axios.post('http://localhost:5000/api/auth/verify', {
        email,
        descriptor: baseDescriptorRef.current
      });
      if (!pre.data?.success) {
        setMessage(pre.data?.message || 'Face not matched.');
        return;
      }
    } catch (e) {
      setMessage(e.response?.data?.message || e.response?.data?.error || 'Face match failed');
      return;
    }

    // 2) Start liveness with continuous same-face guard
    setBlinkCount(0);
    blinkCountRef.current = 0;
    setMessage('Please blink 3 times');
    setLivenessRunning(true);
    setSameFaceOk(true);
    sameFaceOkRef.current = true;

    let closed = false; let closedStreak = 0; let openStreak = 0;
    const CLOSED_FRAMES = 2; const OPEN_FRAMES = 2; const minBlinkIntervalMs = 300;

    const loop = () => {
      if (!isVideoReady()) { rafRef.current = requestAnimationFrame(loop); return; }
      const mp = mpLandmarkerRef.current;
      const res = mp.detectForVideo(videoRef.current, performance.now());
      const blends = res.faceBlendshapes?.[0]?.categories || [];
      const left = blends.find(c => c.categoryName === 'eyeBlinkLeft')?.score || 0;
      const right = blends.find(c => c.categoryName === 'eyeBlinkRight')?.score || 0;
      const isClosed = left > 0.6 && right > 0.6;

      if (isClosed) { closedStreak += 1; openStreak = 0; if (!closed && closedStreak >= CLOSED_FRAMES) closed = true; }
      else {
        openStreak += 1; closedStreak = 0; const now = performance.now();
        if (closed && openStreak >= OPEN_FRAMES && (now - lastBlinkAtRef.current) > minBlinkIntervalMs) {
          const next = blinkCountRef.current + 1; blinkCountRef.current = next; setBlinkCount(next);
          setMessage(next >= 3 ? 'Liveness passed' : `Blink detected! ${3 - next} left`);
          closed = false; lastBlinkAtRef.current = now;
        }
      }

      // Re-verify same person during liveness with quick descriptor checks
      if (blinkCountRef.current < 3 && isVideoReady()) {
        faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor()
          .then(cur => {
            if (!cur?.descriptor) return;
            if (!baseDescriptorRef.current) baseDescriptorRef.current = Array.from(cur.descriptor);
            else {
              const ref = baseDescriptorRef.current;
              const arr = Array.from(cur.descriptor);
              const dist = Math.sqrt(ref.reduce((s,v,i)=> s + ((v - arr[i]) ** 2), 0));
              if (dist > 0.6) {
                setMessage('Different face detected. Restart liveness.');
                setLivenessRunning(false);
                cancelAnimationFrame(rafRef.current);
              }
            }
          }).catch(()=>{});
      }

      if (blinkCountRef.current < 3) { rafRef.current = requestAnimationFrame(loop); }
      else { setLivenessRunning(false); cancelAnimationFrame(rafRef.current); }
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  const verifyUser = async () => {
    if (!modelsLoaded) return setMessage('Models not loaded');
    if (!email) return setMessage('Enter your registered email');
    if (blinkCount < 3) return setMessage('Complete liveness first (3 blinks)');

    if (!isVideoReady()) return setMessage('Camera not ready');
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setMessage('No face detected! Try again.');
      return;
    }

    try {
      // Send { email, descriptor } to backend for verification
      const res = await axios.post('http://localhost:5000/api/auth/verify', {
        email,
        descriptor: Array.from(detections.descriptor),
      });

      if (res.data && res.data.success) {
        setVerified(true);
        setMessage('Face verified! You can now vote.');
      } else {
        setMessage(res.data?.message || 'Face not matched.');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Verification failed');
    }
  };

  // Dummy voting UI after verified. You can replace with your logic
  const [voteStatus, setVoteStatus] = useState('');

  const castVote = async (candidate) => {
    try {
      const res = await axios.post('http://localhost:5000/api/vote', {
        email,
        candidate
      });
      setVoteStatus(`Vote for "${candidate}" recorded!`);

      // Redirect to thank you page after successful vote
      setTimeout(() => {
        if (onVoteCast) {
          onVoteCast(candidate);
        }
      }, 1500); // Brief delay to show success message

    } catch (err) {
      setVoteStatus(err.response?.data?.error || 'Vote failed');
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay className="vn-video" />

      <div className="vn-form-row">
        <input
          className="vn-input"
          type="email"
          placeholder="Registered email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={verified}
        />
      </div>

      {!verified && (
        <div className="vn-actions">
          <button className="vn-btn secondary" onClick={runLiveness} disabled={!modelsLoaded || livenessRunning || blinkCount>=3}>{blinkCount>=3 ? 'Liveness passed' : (livenessRunning ? 'Detecting blinks...' : 'Start liveness')}</button>
          <button className="vn-btn" onClick={verifyUser} disabled={!modelsLoaded || blinkCount<3}>
            Verify & Continue
          </button>
          <span className={`vn-status ${message?.toLowerCase().includes('verified') ? 'success' : message?.toLowerCase().includes('not') || message?.toLowerCase().includes('fail') || message?.toLowerCase().includes('error') ? 'error' : ''}`}>{message}</span>
        </div>
      )}

      {verified && (
        <div>
          <div className="vn-divider" />
          <h3 style={{ marginTop: '0.5rem' }}>Cast Your Vote</h3>
          <div className="vn-vote-grid">
            <button className="vn-btn" onClick={() => castVote('Candidate A')}>Candidate A</button>
            <button className="vn-btn" onClick={() => castVote('Candidate B')}>Candidate B</button>
          </div>
          <div style={{ marginTop: '0.5rem' }} className={`vn-status ${voteStatus ? 'success' : ''}`}>{voteStatus}</div>
        </div>
      )}
    </div>
  );
}

export default FaceVerify;
