import React, { useState, useEffect } from 'react';
import { getSalesAnalytics } from '../api';

export default function SalesDashboard({ currentUser }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      const data = await getSalesAnalytics(currentUser);
      setStats(data);
    }
    loadStats();
  }, [currentUser]);

  if (!stats) return <div style={{ padding: '2rem' }}>Loading sales telemetry...</div>;

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Sales Performance Dashboard</h2>
          <p className="page-subtitle">
            Real-time pipeline metrics, team quota attainment, and stage conversion analytics.
          </p>
        </div>
      </div>

      {/* TOP KPI METRICS */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Pipeline Value</span>
          <div className="stat-value" style={{ color: '#4f46e5' }}>
            {formatMoney(stats.totalPipelineValue)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Across {stats.activeDeals} active sales negotiations
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Closed Won Revenue</span>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {formatMoney(stats.wonRevenue)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Booked contract value
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Win Rate Percentage</span>
          <div className="stat-value" style={{ color: stats.winRate >= 50 ? '#10b981' : '#f59e0b' }}>
            {stats.winRate}%
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Won deals vs. closed loss ratio
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Prospects & Leads</span>
          <div className="stat-value" style={{ color: '#0f172a' }}>
            {stats.totalLeads}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Inbound qualified leads
          </span>
        </div>
      </div>

      {/* PIPELINE BY STAGE BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: '#1e293b' }}>
            Pipeline Distribution by Stage
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(stats.stageBreakdown || {}).map(([stageName, stageData]) => {
              const percent = stats.totalPipelineValue > 0 
                ? Math.round((stageData.value / stats.totalPipelineValue) * 100) 
                : 0;

              return (
                <div key={stageName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{stageName} ({stageData.count})</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(stageData.value)} ({percent}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: stageName === 'Closed Won' ? '#10b981' : stageName === 'Closed Lost' ? '#ef4444' : '#4f46e5',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SALES REP PERFORMANCE LEADERBOARD */}
        <div className="stat-card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: '#1e293b' }}>
            Sales Representative Leaderboard
          </h3>
          <table className="custom-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th>Representative</th>
                <th>Deals</th>
                <th>Won</th>
                <th>Revenue Booked</th>
              </tr>
            </thead>
            <tbody>
              {stats.repLeaderboard.map((rep, idx) => (
                <tr key={idx}>
                  <td><strong>👤 {rep.repName}</strong></td>
                  <td>{rep.totalDeals}</td>
                  <td><span style={{ color: '#10b981', fontWeight: 700 }}>{rep.wonDeals}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatMoney(rep.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
