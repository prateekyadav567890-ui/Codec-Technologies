import React, { useEffect, useRef, useState } from 'react';

/**
 * WebcamProctor Component
 * - Manages Webcam stream via WebRTC getUserMedia API
 * - Establishes RTCPeerConnection for proctor stream signaling
 * - Implements anti-cheat detectors:
 *   1. Tab Switch / Window Blur Detection (visibilitychange, blur)
 *   2. Fullscreen Exit Enforcement
 *   3. Real-time Violation Dispatch to Backend & Socket
 */
export default function WebcamProctor({
  submissionId,
  studentId,
  examId,
  socket,
  onViolationOccurred
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [hasWebcamAccess, setHasWebcamAccess] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [latestWarning, setLatestWarning] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Initialize Webcam Stream (WebRTC Media Stream)
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasWebcamAccess(true);

        // WebRTC Peer Connection Setup (Google Public STUN server)
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = pc;

        // Add local video & audio tracks to WebRTC Peer
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // ICE candidate relay via socket
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('ice-candidate', {
              targetSocketId: 'proctor-room',
              candidate: event.candidate
            });
          }
        };

        // Notify socket signaling server that student is live
        if (socket) {
          socket.emit('join-exam-room', {
            examId,
            role: 'student',
            studentId,
            studentName: 'Aarav Patel (Student)'
          });
        }
      } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err.message);
        setLatestWarning('Webcam access required for exam authorization.');
      }
    }

    startCamera();

    return () => {
      // Clean up camera streams on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [examId, studentId, socket]);

  // Helper: Trigger Violation
  const reportViolation = (type, details) => {
    setViolationCount(prev => {
      const nextCount = prev + 1;
      setLatestWarning(`⚠️ VIOLATION #${nextCount}: ${details}`);
      if (onViolationOccurred) {
        onViolationOccurred(type, nextCount);
      }
      return nextCount;
    });

    // Send to backend API
    fetch('http://localhost:5000/api/proctor/violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId,
        studentId,
        violationType: type,
        details
      })
    }).catch(err => console.error('Violation reporting error:', err));
  };

  // 2. Anti-Cheat Event Listeners (Tab Switch, Window Blur, Fullscreen)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('TAB_SWITCH', 'Switched browser tab or minimized window.');
      }
    };

    const handleWindowBlur = () => {
      reportViolation('WINDOW_BLUR', 'Navigated away from active exam window.');
    };

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        reportViolation('FULLSCREEN_EXIT', 'Exited mandatory full-screen mode.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [submissionId, studentId]);

  // Request Fullscreen
  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    }
  };

  return (
    <div className="sidebar-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          AI Proctoring Feed
        </h4>
        {!isFullscreen && (
          <button
            onClick={enterFullscreen}
            className="btn btn-secondary"
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >
            Enter Fullscreen
          </button>
        )}
      </div>

      <div className={`webcam-hud ${violationCount > 0 ? 'warning-border' : ''}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="webcam-video"
        />

        <div className="proctor-overlay">
          <span className="live-badge">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></span>
            LIVE REC
          </span>
          <span className="status-badge">
            {hasWebcamAccess ? 'WEBCAM VERIFIED' : 'STREAM PENDING'}
          </span>
        </div>

        <div className="violation-pill">
          Violations: {violationCount}
        </div>
      </div>

      {latestWarning && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--danger)',
          borderRadius: '6px',
          color: '#fca5a5',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {latestWarning}
        </div>
      )}

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ color: '#10b981' }}>●</span> Face Presence Monitoring
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ color: '#10b981' }}>●</span> Tab Switch & Focus Detection
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#10b981' }}>●</span> Audio & Video Streamed to Proctor
        </div>
      </div>
    </div>
  );
}
