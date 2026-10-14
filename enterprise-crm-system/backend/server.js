/**
 * server.js - Enterprise CRM REST API & RBAC Service
 * Tech Stack: Node.js, Express, MongoDB (with in-memory fallback), REST APIs
 * Features:
 *  1. Lead Tracking & Deal Stages (Kanban Pipeline)
 *  2. Sales Performance Dashboards (Revenue, Win Rate, Stage Analysis)
 *  3. Email & Activity Logs (Audit trail for interactions)
 *  4. Role-Based Access Control (Admin, Manager, Rep)
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { inMemoryStore } = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ==============================================================================
// 1. ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ==============================================================================

function verifyRole(allowedRoles = []) {
  return (req, res, next) => {
    // Role is passed via header or fallback to 'admin' for simple testing
    const userRole = (req.headers['x-user-role'] || 'admin').toLowerCase();
    req.userRole = userRole;

    if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied. Role '${userRole}' does not have permission to execute this operation.`
    });
  };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Enterprise CRM Backend',
    database: 'MongoDB / In-Memory Hybrid Store',
    timestamp: new Date().toISOString()
  });
});

// Get user profiles for role switching in UI
app.get('/api/users', (req, res) => {
  res.json(inMemoryStore.users);
});

// ==============================================================================
// 2. LEAD MANAGEMENT REST APIS
// ==============================================================================

// List leads with optional status filtering
app.get('/api/leads', (req, res) => {
  const { status, search } = req.query;
  let leads = [...inMemoryStore.leads];

  if (status && status !== 'ALL') {
    leads = leads.filter(l => l.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    leads = leads.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.company.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q)
    );
  }

  res.json(leads);
});

// Create new lead
app.post('/api/leads', verifyRole(['admin', 'manager', 'rep']), (req, res) => {
  const { name, company, email, phone, dealValue, assignedTo, source } = req.body;
  if (!name || !company || !email) {
    return res.status(400).json({ error: 'Name, Company, and Email are required fields.' });
  }

  const newLead = {
    id: `l${Date.now()}`,
    name,
    company,
    email,
    phone: phone || '',
    status: 'New',
    dealValue: Number(dealValue) || 0,
    assignedTo: assignedTo || 'Rajesh Kumar',
    source: source || 'Website',
    createdAt: new Date()
  };

  inMemoryStore.leads.unshift(newLead);
  res.status(201).json(newLead);
});

// Update lead status or assigned rep
app.put('/api/leads/:id', verifyRole(['admin', 'manager', 'rep']), (req, res) => {
  const { id } = req.params;
  const leadIndex = inMemoryStore.leads.findIndex(l => l.id === id);
  if (leadIndex === -1) return res.status(404).json({ error: 'Lead not found.' });

  inMemoryStore.leads[leadIndex] = {
    ...inMemoryStore.leads[leadIndex],
    ...req.body
  };

  res.json(inMemoryStore.leads[leadIndex]);
});

// Delete lead (Strictly restricted to Admin and Manager roles)
app.delete('/api/leads/:id', verifyRole(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const initialLength = inMemoryStore.leads.length;
  inMemoryStore.leads = inMemoryStore.leads.filter(l => l.id !== id);

  if (inMemoryStore.leads.length === initialLength) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  res.json({ success: true, message: `Lead ${id} permanently removed.` });
});

// ==============================================================================
// 3. DEAL PIPELINE & STAGE MANAGEMENT
// ==============================================================================

// List deals grouped by pipeline stages
app.get('/api/deals', (req, res) => {
  res.json(inMemoryStore.deals);
});

// Create new deal
app.post('/api/deals', verifyRole(['admin', 'manager', 'rep']), (req, res) => {
  const { title, company, value, stage, probability, closingDate, assignedTo } = req.body;
  if (!title || !company || !value) {
    return res.status(400).json({ error: 'Title, Company, and Value are required fields.' });
  }

  const newDeal = {
    id: `d${Date.now()}`,
    title,
    company,
    value: Number(value) || 0,
    stage: stage || 'Prospect',
    probability: Number(probability) || 20,
    closingDate: closingDate || new Date().toISOString().split('T')[0],
    assignedTo: assignedTo || 'Rajesh Kumar',
    createdAt: new Date()
  };

  inMemoryStore.deals.unshift(newDeal);
  res.status(201).json(newDeal);
});

// Update deal stage (Pipeline drag-and-drop or status shift)
app.put('/api/deals/:id/stage', verifyRole(['admin', 'manager', 'rep']), (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  const deal = inMemoryStore.deals.find(d => d.id === id);

  if (!deal) return res.status(404).json({ error: 'Deal not found.' });

  // Reps cannot mark deals as Closed Won without Manager or Admin authority
  if ((stage === 'Closed Won' || stage === 'Closed Lost') && req.userRole === 'rep') {
    return res.status(403).json({
      error: 'Permission Denied: Sales Reps cannot close deals. Manager or Admin approval required.'
    });
  }

  deal.stage = stage;
  if (stage === 'Closed Won') deal.probability = 100;
  if (stage === 'Closed Lost') deal.probability = 0;
  if (stage === 'Negotiation') deal.probability = 80;
  if (stage === 'Proposal Sent') deal.probability = 60;

  // Log activity trail automatically
  inMemoryStore.activities.unshift({
    id: `a${Date.now()}`,
    type: 'Note',
    entityType: 'deal',
    entityId: deal.id,
    entityTitle: deal.title,
    subject: `Deal stage advanced to ${stage}`,
    notes: `Stage updated by user with role '${req.userRole}'.`,
    createdBy: req.userRole.toUpperCase(),
    createdAt: new Date()
  });

  res.json(deal);
});

// ==============================================================================
// 4. ACTIVITY & EMAIL LOGGING APIS
// ==============================================================================

app.get('/api/activities', (req, res) => {
  res.json(inMemoryStore.activities);
});

app.post('/api/activities', verifyRole(['admin', 'manager', 'rep']), (req, res) => {
  const { type, entityType, entityId, entityTitle, subject, notes } = req.body;
  if (!type || !subject) {
    return res.status(400).json({ error: 'Activity type and subject are required.' });
  }

  const newActivity = {
    id: `a${Date.now()}`,
    type,
    entityType: entityType || 'deal',
    entityId: entityId || '',
    entityTitle: entityTitle || 'General',
    subject,
    notes: notes || '',
    createdBy: req.headers['x-user-name'] || 'User',
    createdAt: new Date()
  };

  inMemoryStore.activities.unshift(newActivity);
  res.status(201).json(newActivity);
});

// ==============================================================================
// 5. SALES PERFORMANCE ANALYTICS
// ==============================================================================

app.get('/api/analytics/sales', (req, res) => {
  const deals = inMemoryStore.deals;
  const leads = inMemoryStore.leads;

  // Total Pipeline Value
  const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);

  // Closed Won Revenue
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);

  // Win Rate Percentage
  const closedDealsCount = deals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost').length;
  const winRate = closedDealsCount > 0 ? ((wonDeals.length / closedDealsCount) * 100).toFixed(1) : 0;

  // Deals by Stage Breakdown
  const stageBreakdown = {
    'Prospect': { count: 0, value: 0 },
    'Proposal Sent': { count: 0, value: 0 },
    'Negotiation': { count: 0, value: 0 },
    'Closed Won': { count: 0, value: 0 },
    'Closed Lost': { count: 0, value: 0 }
  };

  deals.forEach(d => {
    if (stageBreakdown[d.stage]) {
      stageBreakdown[d.stage].count += 1;
      stageBreakdown[d.stage].value += d.value;
    }
  });

  // Sales Rep Performance Leaderboard
  const repPerformance = {};
  deals.forEach(d => {
    const rep = d.assignedTo || 'Unassigned';
    if (!repPerformance[rep]) {
      repPerformance[rep] = { repName: rep, totalDeals: 0, wonDeals: 0, totalRevenue: 0 };
    }
    repPerformance[rep].totalDeals += 1;
    if (d.stage === 'Closed Won') {
      repPerformance[rep].wonDeals += 1;
      repPerformance[rep].totalRevenue += d.value;
    }
  });

  res.json({
    totalLeads: leads.length,
    activeDeals: deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length,
    totalPipelineValue,
    wonRevenue,
    winRate: parseFloat(winRate),
    stageBreakdown,
    repLeaderboard: Object.values(repPerformance)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Enterprise CRM REST Server running on http://localhost:${PORT}`);
  console.log(`🛡️ Role-Based Access Control active: Admin, Manager, Rep`);
});
