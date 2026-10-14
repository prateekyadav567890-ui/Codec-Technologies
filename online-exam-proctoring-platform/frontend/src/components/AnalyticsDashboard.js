import React, { useState, useEffect } from 'react';

/**
 * AnalyticsDashboard Component
 * - Shows automated evaluation scorecards
 * - Topic-wise strength & weakness analytics
 * - Proctoring audit trail (timestamps of tab switches & alerts)
 * - Exam-wide aggregate metrics for examiners
 */
export default function AnalyticsDashboard({
  lastResult,
  examId = 1,
  onRetakeExam
}) {
  const [examAnalytics, setExamAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState(lastResult ? 'STUDENT_RESULT' : 'EXAM_OVERVIEW');

  useEffect(() => {
    async function fetchExamStats() {
      try {
        const res = await fetch(`http://localhost:5000/api/analytics/exam/${examId}`);
        const data = await res.json();
        setExamAnalytics(data);
      } catch (err) {
        console.error('Error fetching exam analytics:', err);
      }
    }

    fetchExamStats();
  }, [examId]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Evaluation & Result Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Automated grading evaluation, topic performance matrices, and proctoring audit trails.
          </p>
        </div>
        <div className="nav-links">
          {lastResult && (
            <button
              onClick={() => setActiveTab('STUDENT_RESULT')}
              className={`nav-btn ${activeTab === 'STUDENT_RESULT' ? 'active' : ''}`}
            >
              My Scorecard
            </button>
          )}
          <button
            onClick={() => setActiveTab('EXAM_OVERVIEW')}
            className={`nav-btn ${activeTab === 'EXAM_OVERVIEW' ? 'active' : ''}`}
          >
            Exam-Wide Analytics
          </button>
        </div>
      </div>

      {/* VIEW 1: INDIVIDUAL STUDENT SCORECARD */}
      {activeTab === 'STUDENT_RESULT' && lastResult && (
        <div>
          {/* TOP METRIC CARDS */}
          <div className="analytics-grid">
            <div className="stat-card">
              <span className="stat-title">Calculated Score</span>
              <div className="stat-value" style={{ color: lastResult.percentage >= 40 ? '#10b981' : '#ef4444' }}>
                {lastResult.score} / {lastResult.totalPossible}
              </div>
              <span className="stat-subtitle">
                Accuracy: <strong>{lastResult.percentage}%</strong> ({lastResult.percentage >= 40 ? 'PASSED ✓' : 'FAILED ✗'})
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Question Breakdown</span>
              <div className="stat-value" style={{ color: '#38bdf8' }}>
                {lastResult.correctCount} Correct
              </div>
              <span className="stat-subtitle">
                {lastResult.wrongCount} Wrong | {lastResult.unattemptedCount} Skipped
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Proctor Integrity Score</span>
              <div className="stat-value" style={{ color: lastResult.violationCount === 0 ? '#10b981' : '#f59e0b' }}>
                {lastResult.violationCount === 0 ? 'Clean (100%)' : `${lastResult.violationCount} Alerts`}
              </div>
              <span className="stat-subtitle">
                Status: <strong style={{ textTransform: 'uppercase' }}>{lastResult.status}</strong>
              </span>
            </div>
          </div>

          {/* QUESTION REVIEW TABLE */}
          {lastResult.evaluationDetails && (
            <div className="table-container">
              <div className="table-header">
                <span style={{ fontWeight: 600 }}>Automated Evaluation Breakdown</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Server-Side Scoring</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Topic</th>
                    <th>Your Choice</th>
                    <th>Answer Key</th>
                    <th>Status</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {lastResult.evaluationDetails.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.questionText}</td>
                      <td>
                        <span className="q-badge">{item.topic}</span>
                      </td>
                      <td>
                        <strong>{item.selectedOption || '— (Skipped)'}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#10b981' }}>{item.correctOption}</strong>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: item.status === 'correct' ? '#10b981' : item.status === 'incorrect' ? '#ef4444' : '#94a3b8'
                        }}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{
                        fontWeight: 700,
                        color: item.marksAwarded > 0 ? '#10b981' : item.marksAwarded < 0 ? '#ef4444' : '#94a3b8'
                      }}>
                        {item.marksAwarded > 0 ? `+${item.marksAwarded}` : item.marksAwarded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {onRetakeExam && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button onClick={onRetakeExam} className="btn btn-primary">
                Return to Exam Portal
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: EXAM-WIDE AGGREGATE METRICS */}
      {activeTab === 'EXAM_OVERVIEW' && examAnalytics && (
        <div>
          <div className="analytics-grid">
            <div className="stat-card">
              <span className="stat-title">Total Submissions</span>
              <div className="stat-value">{examAnalytics.totalSubmissions}</div>
              <span className="stat-subtitle">Across registered students</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Batch Average Score</span>
              <div className="stat-value" style={{ color: '#38bdf8' }}>
                {examAnalytics.averageScore}
              </div>
              <span className="stat-subtitle">Highest Score: {examAnalytics.highestScore}</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Pass Rate</span>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {examAnalytics.passPercentage}%
              </div>
              <span className="stat-subtitle">Passing threshold: 4.0 Marks</span>
            </div>
          </div>

          {/* RECENT PROCTORING VIOLATION AUDIT LOG */}
          <div className="table-container">
            <div className="table-header">
              <span style={{ fontWeight: 600 }}>Proctoring Incident Audit Trail</span>
              <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>Live AI Anti-Cheat Logs</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student ID</th>
                  <th>Incident Type</th>
                  <th>Audit Details</th>
                  <th>Action Triggered</th>
                </tr>
              </thead>
              <tbody>
                {examAnalytics.recentViolations && examAnalytics.recentViolations.length > 0 ? (
                  examAnalytics.recentViolations.map((v, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {new Date(v.timestamp).toLocaleTimeString()}
                      </td>
                      <td>Student #{v.student_id}</td>
                      <td>
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#fca5a5',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {v.violation_type}
                        </span>
                      </td>
                      <td>{v.details}</td>
                      <td style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Logged & Flagged</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No proctoring violations recorded. Clean session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
