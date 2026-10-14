import React, { useState, useEffect } from 'react';
import { getActivities, logActivity } from '../api';

export default function ActivityLogger({ currentUser }) {
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Email',
    entityTitle: 'Enterprise Cloud Migration',
    subject: '',
    notes: ''
  });

  const loadActivities = async () => {
    const list = await getActivities(currentUser);
    setActivities(list);
  };

  useEffect(() => {
    loadActivities();
  }, [currentUser]);

  const handleLogActivity = async (e) => {
    e.preventDefault();
    await logActivity(currentUser, {
      ...formData,
      entityType: 'deal',
      entityId: 'general'
    });
    setShowAddForm(false);
    setFormData({
      type: 'Email',
      entityTitle: 'Enterprise Cloud Migration',
      subject: '',
      notes: ''
    });
    await loadActivities();
  };

  const filtered = activities.filter(a => filterType === 'ALL' || a.type === filterType);

  const getIcon = (type) => {
    switch (type) {
      case 'Email': return '✉️';
      case 'Call': return '📞';
      case 'Meeting': return '🤝';
      default: return '📝';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customer Interactions & Activity Logs</h2>
          <p className="page-subtitle">
            Chronological audit trail of customer emails, calls, discovery meetings, and deal notes.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? '✕ Close Form' : '+ Log Interaction'}
        </button>
      </div>

      {showAddForm && (
        <div className="form-card">
          <h3 style={{ marginBottom: '1rem', color: '#4f46e5' }}>Record Customer Communication</h3>
          <form onSubmit={handleLogActivity}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Activity Type</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Email">Email Communication</option>
                  <option value="Call">Phone Call</option>
                  <option value="Meeting">Client Meeting</option>
                  <option value="Note">Internal Strategy Note</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Associated Account / Deal</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. CloudWave Technologies"
                  value={formData.entityTitle}
                  onChange={(e) => setFormData({ ...formData, entityTitle: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject / Purpose</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Shared updated pricing matrix with Procurement"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Key Discussion Notes</label>
              <textarea
                rows="3"
                className="form-control"
                placeholder="Key takeaways, client objections, next steps..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary">Save to Log</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['ALL', 'Email', 'Call', 'Meeting', 'Note'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
          >
            {type === 'ALL' ? 'All Activities' : `${getIcon(type)} ${type}s`}
          </button>
        ))}
      </div>

      {/* ACTIVITY TIMELINE */}
      <div className="timeline">
        {filtered.map(act => (
          <div key={act.id} className="timeline-item">
            <div className="timeline-icon">{getIcon(act.type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>
                  {act.subject}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(act.createdAt).toLocaleDateString()} at {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '0.825rem', color: '#4f46e5', fontWeight: 600, marginBottom: '0.35rem' }}>
                📌 {act.entityTitle} &nbsp;|&nbsp; Logged by: {act.createdBy}
              </div>
              {act.notes && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {act.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
