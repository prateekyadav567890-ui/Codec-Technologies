import React, { useState, useEffect } from 'react';
import { getDeals, createDeal, updateDealStage } from '../api';

const STAGES = ['Prospect', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];

export default function DealPipeline({ currentUser }) {
  const [deals, setDeals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    value: '',
    stage: 'Prospect',
    probability: 25,
    assignedTo: currentUser?.name || 'Rajesh Kumar'
  });

  const loadDeals = async () => {
    const list = await getDeals(currentUser);
    setDeals(list);
  };

  useEffect(() => {
    loadDeals();
  }, [currentUser]);

  const handleStageChange = async (dealId, nextStage) => {
    setErrorMessage('');
    try {
      await updateDealStage(currentUser, dealId, nextStage);
      await loadDeals();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    await createDeal(currentUser, {
      ...formData,
      value: Number(formData.value)
    });
    setShowAddForm(false);
    setFormData({
      title: '',
      company: '',
      value: '',
      stage: 'Prospect',
      probability: 25,
      assignedTo: currentUser?.name || 'Rajesh Kumar'
    });
    await loadDeals();
  };

  // Format currency in INR / Standard format
  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Deal Pipeline & Stages</h2>
          <p className="page-subtitle">
            Visual sales pipeline. Shift deals through qualification, proposal, and negotiation.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? '✕ Close Form' : '+ New Deal'}
        </button>
      </div>

      {errorMessage && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {showAddForm && (
        <div className="form-card">
          <h3 style={{ marginBottom: '1rem', color: '#4f46e5' }}>Create New Sales Deal</h3>
          <form onSubmit={handleCreateDeal}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Deal Title</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Enterprise Cloud Migration"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company / Account</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. CloudWave Technologies"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Deal Value (₹)</label>
                <input
                  type="number"
                  required
                  className="form-control"
                  placeholder="e.g. 850000"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Stage</label>
                <select
                  className="form-control"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Save Deal</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* KANBAN BOARD */}
      <div className="kanban-board">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);
          const currentStageIndex = STAGES.indexOf(stage);

          return (
            <div key={stage} className="kanban-col">
              <div className="col-header">
                <span className="col-title">{stage} ({stageDeals.length})</span>
                <span className="col-total">{formatMoney(stageTotal)}</span>
              </div>

              {stageDeals.map(deal => (
                <div key={deal.id} className="deal-card">
                  <div className="deal-title">{deal.title}</div>
                  <div className="deal-company">{deal.company}</div>
                  <div className="deal-value">{formatMoney(deal.value)}</div>

                  <div className="deal-footer">
                    <span>👤 {deal.assignedTo}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {currentStageIndex > 0 && (
                        <button
                          onClick={() => handleStageChange(deal.id, STAGES[currentStageIndex - 1])}
                          className="stage-nav-btn"
                          title="Move to previous stage"
                        >
                          ◀
                        </button>
                      )}
                      {currentStageIndex < STAGES.length - 1 && (
                        <button
                          onClick={() => handleStageChange(deal.id, STAGES[currentStageIndex + 1])}
                          className="stage-nav-btn"
                          title="Advance to next stage"
                        >
                          ▶
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
