import React, { useState, useEffect } from 'react';
import { getLeads, createLead, deleteLead } from '../api';

export default function LeadManager({ currentUser }) {
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    dealValue: '',
    assignedTo: currentUser?.name || 'Rajesh Kumar',
    source: 'Website'
  });

  const loadLeads = async () => {
    const list = await getLeads(currentUser, statusFilter, searchTerm);
    setLeads(list);
  };

  useEffect(() => {
    loadLeads();
  }, [currentUser, statusFilter, searchTerm]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    await createLead(currentUser, {
      ...formData,
      dealValue: Number(formData.dealValue)
    });
    setShowAddForm(false);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      dealValue: '',
      assignedTo: currentUser?.name || 'Rajesh Kumar',
      source: 'Website'
    });
    await loadLeads();
  };

  const handleDeleteLead = async (id) => {
    setErrorMessage('');
    try {
      await deleteLead(currentUser, id);
      await loadLeads();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Lead Acquisition & Tracking</h2>
          <p className="page-subtitle">
            Capture, score, and qualify inbound prospective customer inquiries.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? '✕ Close Form' : '+ New Lead'}
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

      {/* ADD LEAD FORM */}
      {showAddForm && (
        <div className="form-card">
          <h3 style={{ marginBottom: '1rem', color: '#4f46e5' }}>Create Prospective Lead</h3>
          <form onSubmit={handleCreateLead}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Aditi Rao"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
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
                <label className="form-label">Business Email</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="e.g. aditi@cloudwave.io"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Estimated Deal Size (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 500000"
                  value={formData.dealValue}
                  onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lead Source</label>
                <select
                  className="form-control"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="Website">Website Form</option>
                  <option value="LinkedIn">LinkedIn Campaign</option>
                  <option value="Inbound Call">Inbound Call</option>
                  <option value="Referral">Customer Referral</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Save Lead</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH TOOLS */}
      <div className="card-table">
        <div className="table-tools">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search leads, companies..."
              className="form-control"
              style={{ width: '280px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Showing {leads.length} records
          </span>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Contact Name</th>
              <th>Company</th>
              <th>Status</th>
              <th>Estimated Value</th>
              <th>Source</th>
              <th>Assigned Rep</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>
                  <strong>{lead.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lead.email}</div>
                </td>
                <td>{lead.company}</td>
                <td>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: lead.status === 'Qualified' ? '#dcfce7' : lead.status === 'Contacted' ? '#e0e7ff' : '#f1f5f9',
                    color: lead.status === 'Qualified' ? '#15803d' : lead.status === 'Contacted' ? '#4338ca' : '#475569'
                  }}>
                    {lead.status}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {formatMoney(lead.dealValue)}
                </td>
                <td>{lead.source}</td>
                <td>👤 {lead.assignedTo}</td>
                <td>
                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#b91c1c' }}
                    title={currentUser.role === 'rep' ? 'Restricted: Reps cannot delete leads' : 'Delete Lead'}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
