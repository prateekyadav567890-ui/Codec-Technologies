import React, { useState, useEffect, useRef } from 'react';
import WebcamProctor from './WebcamProctor';

/**
 * ExamPortal Component
 * - Displays active timed exam interface
 * - Question palette & navigation
 * - Countdown timer with auto-submit
 * - Client-side state tracking for chosen answers and flagged questions
 * - Delegates live proctoring to WebcamProctor
 */
export default function ExamPortal({
  exam,
  studentId,
  socket,
  onExamCompleted
}) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'A' | 'B' | ... }
  const [flagged, setFlagged] = useState({}); // { [questionId]: true | false }
  const [timeRemaining, setTimeRemaining] = useState(exam ? exam.duration_minutes * 60 : 600);
  const [submissionId, setSubmissionId] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  // 1. Fetch Exam Questions and Start Session
  useEffect(() => {
    async function initExam() {
      try {
        setIsLoading(true);
        // Start exam session on backend to get verified submissionId
        const startRes = await fetch(`http://localhost:5000/api/exams/${exam.id}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        });
        const startData = await startRes.json();
        setSubmissionId(startData.submissionId);

        // Fetch exam questions
        const examRes = await fetch(`http://localhost:5000/api/exams/${exam.id}`);
        const examData = await examRes.json();
        setQuestions(examData.questions || []);
      } catch (err) {
        console.error('Error starting exam:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (exam) {
      initExam();
    }
  }, [exam, studentId]);

  // 2. Countdown Timer Loop
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(true); // Auto-submit when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [questions, answers, violationCount, submissionId]);

  // Format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Select Option
  const handleSelectOption = (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionKey
    }));
  };

  // Clear Response
  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[currentQ.id];
      return updated;
    });
  };

  // Toggle Flag for Review
  const handleToggleFlag = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setFlagged(prev => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  };

  // Submit Exam
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    setShowSubmitModal(false);
    clearInterval(timerRef.current);

    try {
      const res = await fetch(`http://localhost:5000/api/exams/${exam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          studentId,
          answers,
          violationCount,
          isAutoSubmit
        })
      });
      const result = await res.json();
      if (onExamCompleted) {
        onExamCompleted(result);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error submitting exam. Please check backend connection.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Loading secure exam environment...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Configuring question bank and initializing webcam proctor.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || {};
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="exam-layout">
      {/* LEFT COLUMN: ACTIVE QUESTION & CONTROLS */}
      <div className="question-card">
        <div className="question-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="q-badge">Question {currentIndex + 1} of {questions.length}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Topic: {currentQ.topic || 'General'}</span>
          </div>
          <div className="marks-badge">
            Marks: <strong style={{ color: '#10b981' }}>+{currentQ.marks || 2}</strong> | Negative: <strong style={{ color: '#ef4444' }}>-{currentQ.negative_marks || 0.5}</strong>
          </div>
        </div>

        <div className="question-text">
          {currentQ.question_text}
        </div>

        <div className="options-grid">
          {[
            { key: 'A', text: currentQ.option_a },
            { key: 'B', text: currentQ.option_b },
            { key: 'C', text: currentQ.option_c },
            { key: 'D', text: currentQ.option_d }
          ].map(opt => (
            <div
              key={opt.key}
              className={`option-item ${answers[currentQ.id] === opt.key ? 'selected' : ''}`}
              onClick={() => handleSelectOption(opt.key)}
            >
              <div className="option-key">{opt.key}</div>
              <div style={{ fontSize: '0.95rem' }}>{opt.text}</div>
            </div>
          ))}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="question-actions">
          <div className="btn-group">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="btn btn-secondary"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="btn btn-secondary"
            >
              Next →
            </button>
          </div>

          <div className="btn-group">
            <button
              onClick={handleClearResponse}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              Clear Choice
            </button>
            <button
              onClick={handleToggleFlag}
              className={`btn ${flagged[currentQ.id] ? 'btn-warning' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem' }}
            >
              {flagged[currentQ.id] ? '★ Marked for Review' : '☆ Mark for Review'}
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn btn-success"
            >
              Submit Exam ✓
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: TIMER, WEBCAM PROCTOR, AND QUESTION PALETTE */}
      <div className="exam-sidebar">
        {/* TIMER CARD */}
        <div className="sidebar-card">
          <div className="timer-container">
            <span className="timer-label">Time Remaining</span>
            <div className={`timer-clock ${timeRemaining < 120 ? 'urgent' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
            {timeRemaining < 120 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                ⚠️ Warning: Less than 2 minutes left!
              </span>
            )}
          </div>
        </div>

        {/* LIVE WEBCAM PROCTOR HUD */}
        <WebcamProctor
          submissionId={submissionId}
          studentId={studentId}
          examId={exam.id}
          socket={socket}
          onViolationOccurred={(type, count) => setViolationCount(count)}
        />

        {/* QUESTION PALETTE */}
        <div className="sidebar-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Question Palette
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {answeredCount}/{questions.length} Answered
            </span>
          </div>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isFlagged = !!flagged[q.id];
              const isCurrent = idx === currentIndex;

              let statusClass = 'unanswered';
              if (isFlagged) statusClass = 'flagged';
              else if (isAnswered) statusClass = 'answered';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`palette-btn ${statusClass} ${isCurrent ? 'current' : ''}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--success)' }}></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--warning)' }}></span>
              <span>Review Flag</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}></span>
              <span>Unvisited</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ outline: '2px solid #60a5fa' }}></span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ marginBottom: '1rem', color: '#60a5fa' }}>Confirm Final Submission</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Are you sure you want to end your examination? You have answered{' '}
              <strong style={{ color: '#fff' }}>{answeredCount}</strong> out of{' '}
              <strong style={{ color: '#fff' }}>{questions.length}</strong> questions.
            </p>
            {violationCount > 0 && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                ⚠️ Notice: {violationCount} proctoring violation(s) were logged during your session.
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
              >
                Return to Exam
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                className="btn btn-success"
              >
                Yes, Final Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
