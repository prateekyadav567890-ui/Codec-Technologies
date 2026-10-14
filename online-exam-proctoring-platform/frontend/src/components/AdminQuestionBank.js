import React, { useState, useEffect } from 'react';

/**
 * AdminQuestionBank Component
 * - Create and manage Question Banks
 * - Filter questions by topic and difficulty
 * - Add new MCQ questions with custom marks and negative marking penalties
 */
export default function AdminQuestionBank({ exams = [] }) {
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || 1);
  const [questions, setQuestions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    marks: 2,
    negativeMarks: 0.5,
    topic: 'Computer Science',
    difficulty: 'Medium'
  });

  // Fetch Questions for selected exam
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/exams/${selectedExamId}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions();
    }
  }, [selectedExamId]);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          examId: selectedExamId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Question successfully added to question bank!');
        setShowAddForm(false);
        setFormData({
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: 'A',
          marks: 2,
          negativeMarks: 0.5,
          topic: 'Computer Science',
          difficulty: 'Medium'
        });
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error adding question:', err);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (filterDifficulty === 'ALL') return true;
    return q.difficulty === filterDifficulty;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Question Bank Repository</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage categorized examination questions, difficulty tiers, and marking weights.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? '✕ Close Form' : '+ Add New Question'}
        </button>
      </div>

      {/* ADD QUESTION FORM */}
      {showAddForm && (
        <div className="form-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#60a5fa' }}>Create Question for Bank</h3>
          <form onSubmit={handleSubmitQuestion}>
            <div className="form-group">
              <label className="form-label">Exam Assignment</label>
              <select
                className="form-control"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Question Text</label>
              <textarea
                className="form-control"
                rows="3"
                required
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                placeholder="e.g. Which layer of the OSI model ensures reliable end-to-end communication?"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Option A</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.optionA}
                  onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Option B</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.optionB}
                  onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Option C</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.optionC}
                  onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Option D</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.optionD}
                  onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Correct Option</label>
                <select
                  className="form-control"
                  value={formData.correctOption}
                  onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Topic / Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Difficulty Tier</label>
                <select
                  className="form-control"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marks Awarded (+)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-control"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Negative Penalty (-)</label>
                <input
                  type="number"
                  step="0.25"
                  className="form-control"
                  value={formData.negativeMarks}
                  onChange={(e) => setFormData({ ...formData, negativeMarks: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save to Question Bank</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Exam:</span>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Difficulty:</span>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* QUESTIONS TABLE */}
      <div className="table-container">
        <div className="table-header">
          <span style={{ fontWeight: 600 }}>Active Questions ({filteredQuestions.length})</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secured via PostgreSQL Database</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '45%' }}>Question</th>
              <th style={{ width: '15%' }}>Topic</th>
              <th style={{ width: '10%' }}>Difficulty</th>
              <th style={{ width: '12%' }}>Marks / Neg</th>
              <th style={{ width: '13%' }}>Options</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q, idx) => (
              <tr key={q.id}>
                <td>{idx + 1}</td>
                <td>
                  <strong>{q.question_text}</strong>
                </td>
                <td>
                  <span className="q-badge" style={{ background: '#334155', color: '#cbd5e1' }}>
                    {q.topic}
                  </span>
                </td>
                <td>
                  <span style={{
                    color: q.difficulty === 'Easy' ? '#10b981' : q.difficulty === 'Hard' ? '#ef4444' : '#f59e0b',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}>
                    {q.difficulty}
                  </span>
                </td>
                <td>
                  +{q.marks} / -{q.negative_marks}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  A: {q.option_a?.substring(0, 15)}... | B: {q.option_b?.substring(0, 15)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
