import React, { useState } from 'react';
import DealPipeline from './components/DealPipeline';
import LeadManager from './components/LeadManager';
import SalesDashboard from './components/SalesDashboard';
import ActivityLogger from './components/ActivityLogger';
import './App.css';

const USERS = [
  { id: 'u1', name: 'Vikram Mehta', email: 'vikram.admin@acmecrm.com', role: 'admin' },
  { id: 'u2', name: 'Neha Sharma', email: 'neha.manager@acmecrm.com', role: 'manager' },
  { id: 'u3', name: 'Rajesh Kumar', email: 'rajesh.rep@acmecrm.com', role: 'rep' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('PIPELINE'); // 'PIPELINE' | 'LEADS' | 'DASHBOARD' | 'ACTIVITIES'
  const [currentUser, setCurrentUser] = useState(USERS[0]); // default to Admin

  return (
    <div className="crm-container">
      {/* TOP HEADER & RBAC BAR */}
      <header className="navbar">
        <div className="brand">
          <span style={{ fontSize: '1.4rem' }}>💼</span>
          <span>ApexCRM <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Enterprise Suite</span></span>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="nav-tabs">
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`tab-btn ${activeTab === 'PIPELINE' ? 'active' : ''}`}
          >
            Deal Pipeline
          </button>
          <button
            onClick={() => setActiveTab('LEADS')}
            className={`tab-btn ${activeTab === 'LEADS' ? 'active' : ''}`}
          >
            Leads & Accounts
          </button>
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`tab-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
          >
            Sales Dashboard
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITIES')}
            className={`tab-btn ${activeTab === 'ACTIVITIES' ? 'active' : ''}`}
          >
            Activity Logs
          </button>
        </nav>

        {/* ROLE-BASED ACCESS CONTROL (RBAC) SIMULATOR */}
        <div className="rbac-controls">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Switch Role:</span>
          <select
            className="form-control"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            value={currentUser.id}
            onChange={(e) => {
              const selected = USERS.find(u => u.id === e.target.value);
              if (selected) setCurrentUser(selected);
            }}
          >
            {USERS.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
          <span className={`role-badge role-${currentUser.role}`}>
            {currentUser.role}
          </span>
        </div>
      </header>

      {/* MAIN VIEW AREA */}
      <main className="main-content">
        {activeTab === 'PIPELINE' && <DealPipeline currentUser={currentUser} />}
        {activeTab === 'LEADS' && <LeadManager currentUser={currentUser} />}
        {activeTab === 'DASHBOARD' && <SalesDashboard currentUser={currentUser} />}
        {activeTab === 'ACTIVITIES' && <ActivityLogger currentUser={currentUser} />}
      </main>
    </div>
  );
}
