import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function FaceProctor({ onDetection }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [models, setModels] = useState({ face: null, obj: null });

  // Store callback to prevent React dependency loops
  const latestDetectionCallback = useRef(onDetection);
  useEffect(() => {
    latestDetectionCallback.current = onDetection;
  }, [onDetection]);

  // 1. Load AI Models
  useEffect(() => {
    let isMounted = true;
    async function load() {
      await tf.ready();
      const [f, o] = await Promise.all([blazeface.load(), cocoSsd.load()]);
      if (isMounted) setModels({ face: f, obj: o });
    }
    load();
    return () => { isMounted = false; };
  }, []);

  // 2. Setup Camera & Optimized Audio
  useEffect(() => {
    let isMounted = true;
    let audioFramesAboveThreshold = 0;
    let lastVoiceViolationTime = 0;

    async function setup() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true, // Request audio
        });

        if (!isMounted) { 
          s.getTracks().forEach(t => t.stop()); 
          return; 
        }

        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;

        // Audio Level Detection Setup
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const analyzer = ctx.createAnalyser();
        ctx.createMediaStreamSource(s).connect(analyzer);
        const data = new Uint8Array(analyzer.frequencyBinCount);

        const checkAudio = () => {
          if (!streamRef.current || !isMounted) return;
          
          analyzer.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          
          const now = Date.now();

          // THRESHOLD: Increased from 45 to 65 to ignore fans and ACs.
          if (avg > 65) {
            audioFramesAboveThreshold++;
            
            // SUSTAINED NOISE: Requires ~1.5 seconds of continuous loud noise to trigger
            // (60 frames per second * 1.5s = ~90 frames)
            if (audioFramesAboveThreshold > 90) {
              
              // COOLDOWN: 10 Seconds gap before throwing another voice warning
              if (now - lastVoiceViolationTime > 10000) {
                latestDetectionCallback.current('voice', 'Continuous talking/noise detected! Please maintain silence.');
                lastVoiceViolationTime = now;
              }
              
              // Reset the frame counter after a trigger
              audioFramesAboveThreshold = 0; 
            }
          } else {
            // If the volume drops below 65 (even for a split second), reset the counter.
            // This ensures brief coughs, sneezes, or dropping a pen don't trigger it.
            audioFramesAboveThreshold = 0;
          }
          
          requestAnimationFrame(checkAudio);
        };
        checkAudio();

      } catch (e) {
        console.error('Proctor setup failed:', e);
      }
    }
    setup();

    return () => {
      isMounted = false;
      if (streamRef.current) { 
        streamRef.current.getTracks().forEach(t => t.stop()); 
        streamRef.current = null; 
      }
      if (audioCtxRef.current) { 
        audioCtxRef.current.close().catch(() => {}); 
        audioCtxRef.current = null; 
      }
    };
  }, []);

  // 3. IMMEDIATE LOOP: Face & Head Tilt Detection
  useEffect(() => {
    if (!models.face) return;
    let isMounted = true;
    
    const streak = { face: 0, gaze: 0 };
    const NEEDED = 2;

    async function scanFace() {
      if (!isMounted) return;

      if (!videoRef.current || videoRef.current.readyState !== 4) {
        setTimeout(scanFace, 100);
        return;
      }

      try {
        const preds = await models.face.estimateFaces(videoRef.current, false);

        // ── FACE MISSING ──
        if (preds.length === 0) {
          streak.gaze = 0;
          streak.face++;
          if (streak.face >= NEEDED) {
            latestDetectionCallback.current('face', 'Face not detected! Please stay in frame.');
          }
        } 
        // ── MULTIPLE FACES ──
        else if (preds.length > 1) {
          streak.face = 0; 
          streak.gaze = 0;
          latestDetectionCallback.current('face', 'Multiple people detected!');
        } 
        // ── HEAD YAW & PITCH ──
        else {
          streak.face = 0;
          const f = preds[0];

          const faceWidth  = f.bottomRight[0] - f.topLeft[0];
          const faceHeight = f.bottomRight[1] - f.topLeft[1];

          const rightEyeX = f.landmarks[0][0];
          const leftEyeX  = f.landmarks[1][0];
          const noseX     = f.landmarks[2][0];
          const noseY     = f.landmarks[2][1];
          
          const eyeMidX   = (rightEyeX + leftEyeX) / 2;
          const eyeMidY   = (f.landmarks[0][1] + f.landmarks[1][1]) / 2;

          const hDeviation = Math.abs(noseX - eyeMidX) / faceWidth;
          const vRatio = (noseY - eyeMidY) / faceHeight;

          const gazeViolation =
            hDeviation > 0.04 ||   // Sideways glance
            vRatio < 0.15  ||      // Looking UP
            vRatio > 0.35;         // Looking DOWN

          if (gazeViolation) {
            streak.gaze++;
            if (streak.gaze >= NEEDED) {
              if (hDeviation > 0.04) {
                latestDetectionCallback.current('gaze', 'Eyes off screen! Side-glance detected.');
              } else {
                latestDetectionCallback.current('gaze', 'Please look directly at the screen (Head tilt detected).');
              }
            }
          } else {
            streak.gaze = 0; 
          }
        }
      } catch (err) {
        console.warn("Face scan frame dropped", err);
      }

      if (isMounted) setTimeout(scanFace, 400);
    }

    scanFace(); 

    return () => { isMounted = false; };
  }, [models.face]);

  // 4. IMMEDIATE LOOP: Phone & Object Detection
  useEffect(() => {
    if (!models.obj) return;
    let isMounted = true;

    async function scanObjects() {
      if (!isMounted) return;

      if (!videoRef.current || videoRef.current.readyState !== 4) {
        setTimeout(scanObjects, 100);
        return;
      }

      try {
        const oPreds = await models.obj.detect(videoRef.current);
        
        const forbiddenObject = oPreds.find(p => 
          ['cell phone', 'remote', 'book', 'tablet'].includes(p.class) && p.score > 0.05
        );

        if (forbiddenObject) {
          latestDetectionCallback.current('phone', `Unpermitted object (${forbiddenObject.class}) detected! Put it away.`);
        }
      } catch (err) {
        console.warn("Object scan frame dropped", err);
      }

      if (isMounted) setTimeout(scanObjects, 500);
    }

    scanObjects();

    return () => { isMounted = false; };
  }, [models.obj]);

  return (
    <div className="proctor-preview">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="640"
        height="480"
        style={{
          width: '120px',
          height: '90px',
          borderRadius: '8px',
          transform: 'scaleX(-1)', 
          border: '2px solid var(--primary-color)',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}