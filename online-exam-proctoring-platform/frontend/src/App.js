import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import ExamPortal from './components/ExamPortal';
import AdminQuestionBank from './components/AdminQuestionBank';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import './App.css';

// Initialize Socket.io connection for WebRTC signaling
const socket = io('http://localhost:5000', {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

export default function App() {
  const [activeTab, setActiveTab] = useState('EXAMS'); // 'EXAMS' | 'IN_EXAM' | 'PROCTOR_VIEW' | 'QUESTIONS' | 'ANALYTICS'
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    id: 2,
    name: 'Aarav Patel',
    role: 'student'
  });
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Fetch Available Exams
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('http://localhost:5000/api/exams');
        const data = await res.json();
        setExams(data || []);
      } catch (err) {
        console.warn('API offline or loading:', err.message);
      }
    }
    loadExams();

    // Listen for live proctor alerts across socket
    socket.on('live-proctor-alert', (alertData) => {
      setLiveAlerts(prev => [alertData, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.off('live-proctor-alert');
    };
  }, []);

  const handleStartExam = (exam) => {
    setSelectedExam(exam);
    setActiveTab('IN_EXAM');
  };

  const handleExamCompleted = (result) => {
    setLastResult(result);
    setActiveTab('ANALYTICS');
  };

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand">
          <span style={{ fontSize: '1.4rem' }}>🛡️</span>
          <span>ProctorShield <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>CBT Exam Portal</span></span>
        </div>

        <nav className="nav-links">
          <button
            onClick={() => setActiveTab(selectedExam ? 'IN_EXAM' : 'EXAMS')}
            className={`nav-btn ${activeTab === 'EXAMS' || activeTab === 'IN_EXAM' ? 'active' : ''}`}
          >
            Exam Portal
          </button>
          <button
            onClick={() => setActiveTab('PROCTOR_VIEW')}
            className={`nav-btn ${activeTab === 'PROCTOR_VIEW' ? 'active' : ''}`}
          >
            Live Proctor Console
          </button>
          <button
            onClick={() => setActiveTab('QUESTIONS')}
            className={`nav-btn ${activeTab === 'QUESTIONS' ? 'active' : ''}`}
          >
            Question Bank
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`nav-btn ${activeTab === 'ANALYTICS' ? 'active' : ''}`}
          >
            Result Analytics
          </button>
        </nav>

        <div className="user-badge">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <span>{currentUser.name}</span>
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>({currentUser.role})</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="content-area">
        {/* VIEW 1: EXAM SELECTION LOBBY */}
        {activeTab === 'EXAMS' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2>Available Examinations</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Select an examination to launch the secure, timed browser test environment.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {exams.map(exam => (
                <div key={exam.id} className="stat-card" style={{ gap: '1rem', justifyContent: 'space-between' }}>
                  <div>
                    <span className="q-badge" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                      {exam.subject}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>{exam.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {exam.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      <span>⏳ Duration: <strong>{exam.duration_minutes} Mins</strong></span>
                      <span>🎯 Total: <strong>{exam.total_marks} Marks</strong></span>
                      <span>Pass: <strong>{exam.pass_marks} Marks</strong></span>
                    </div>

                    <button
                      onClick={() => handleStartExam(exam)}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Enter Secure Exam →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE TIMED EXAM WITH WEBCAM PROCTOR */}
        {activeTab === 'IN_EXAM' && selectedExam && (
          <ExamPortal
            exam={selectedExam}
            studentId={currentUser.id}
            socket={socket}
            onExamCompleted={handleExamCompleted}
          />
        )}

        {/* VIEW 3: LIVE PROCTOR CONSOLE (EXAMINER VIEW) */}
        {activeTab === 'PROCTOR_VIEW' && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Examiner Live WebRTC Monitor</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Real-time peer-to-peer audio/video streaming & telemetry proctoring feed.
                </p>
              </div>
              <span className="live-badge" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                ● WEBRTC DISPATCH ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              {/* VIDEO GRID */}
              <div className="sidebar-card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  Candidate Surveillance Matrix (WebRTC Feed)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div style={{ position: 'relative', background: '#000', borderRadius: '8px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📹</div>
                      <p><strong>Aarav Patel (Candidate #2)</strong></p>
                      <p style={{ fontSize: '0.8rem' }}>WebRTC Peer Stream Synced via Socket.io</p>
                      <span className="status-badge" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        SECURE AUDIO/VIDEO PEER CONNECTION
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE ALERTS AUDIT FEED */}
              <div className="sidebar-card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  Live Telemetry Incident Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {liveAlerts.length > 0 ? (
                    liveAlerts.map((alt, i) => (
                      <div key={i} style={{ padding: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>
                          <span>{alt.violationType}</span>
                          <span>{new Date(alt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>
                          {alt.details}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No active violations reported. System monitoring candidate focus.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ADMIN QUESTION BANK */}
        {activeTab === 'QUESTIONS' && (
          <AdminQuestionBank exams={exams} />
        )}

        {/* VIEW 5: RESULT ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <AnalyticsDashboard
            lastResult={lastResult}
            examId={selectedExam?.id || 1}
            onRetakeExam={() => setActiveTab('EXAMS')}
          />
        )}
      </main>
    </div>
  );
}
