/**
 * api.js - Centralized API Service for Enterprise CRM
 * Supports live REST backend with seamless fallback to client-side demo data for Vercel.
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Seed demo data for live Vercel deployments
export const SEED_DATA = {
  users: [
    { id: 'u1', name: 'Vikram Mehta', email: 'vikram.admin@acmecrm.com', role: 'admin' },
    { id: 'u2', name: 'Neha Sharma', email: 'neha.manager@acmecrm.com', role: 'manager' },
    { id: 'u3', name: 'Rajesh Kumar', email: 'rajesh.rep@acmecrm.com', role: 'rep' }
  ],
  leads: [
    { id: 'l1', name: 'Aditi Rao', company: 'CloudWave Technologies', email: 'aditi@cloudwave.io', phone: '+91 98765 43210', status: 'Qualified', dealValue: 850000, assignedTo: 'Rajesh Kumar', source: 'LinkedIn' },
    { id: 'l2', name: 'Siddharth Verma', company: 'NextGen Retail Solutions', email: 'siddharth@nextgen.com', phone: '+91 98234 56789', status: 'Contacted', dealValue: 420000, assignedTo: 'Neha Sharma', source: 'Website' },
    { id: 'l3', name: 'Kavita Patel', company: 'Apex Logistics Hub', email: 'kavita@apexlogistics.in', phone: '+91 97123 45678', status: 'New', dealValue: 1200000, assignedTo: 'Rajesh Kumar', source: 'Inbound Call' },
    { id: 'l4', name: 'Manish Joshi', company: 'Zenith Health Systems', email: 'manish@zenithhealth.org', phone: '+91 99012 34567', status: 'Qualified', dealValue: 650000, assignedTo: 'Neha Sharma', source: 'Referral' }
  ],
  deals: [
    { id: 'd1', title: 'Enterprise Cloud Migration 2026', company: 'CloudWave Technologies', value: 850000, stage: 'Negotiation', probability: 80, assignedTo: 'Rajesh Kumar', closingDate: '2026-11-15' },
    { id: 'd2', title: 'Omnichannel POS Upgrade', company: 'NextGen Retail Solutions', value: 420000, stage: 'Proposal Sent', probability: 60, assignedTo: 'Neha Sharma', closingDate: '2026-11-30' },
    { id: 'd3', title: 'Fleet Automation ERP Suite', company: 'Apex Logistics Hub', value: 1200000, stage: 'Prospect', probability: 25, assignedTo: 'Rajesh Kumar', closingDate: '2026-12-20' },
    { id: 'd4', title: 'HIPAA Patient Portal Licensing', company: 'Zenith Health Systems', value: 650000, stage: 'Closed Won', probability: 100, assignedTo: 'Neha Sharma', closingDate: '2026-10-10' },
    { id: 'd5', title: 'Security Audit & Compliance Bundle', company: 'FinSafe Capital', value: 310000, stage: 'Closed Lost', probability: 0, assignedTo: 'Rajesh Kumar', closingDate: '2026-09-28' }
  ],
  activities: [
    { id: 'a1', type: 'Email', entityType: 'deal', entityId: 'd1', entityTitle: 'Enterprise Cloud Migration', subject: 'Sent updated SOW with multi-tenant architecture pricing', notes: 'Client requested 5% discount on 3-year term.', createdBy: 'Rajesh Kumar', createdAt: new Date(Date.now() - 3600000) },
    { id: 'a2', type: 'Call', entityType: 'lead', entityId: 'l1', entityTitle: 'Aditi Rao (CloudWave)', subject: 'Discovery call regarding Q4 cloud roadmap', notes: 'Budget approved by CTO. Scheduling formal demo.', createdBy: 'Rajesh Kumar', createdAt: new Date(Date.now() - 86400000) },
    { id: 'a3', type: 'Meeting', entityType: 'deal', entityId: 'd4', entityTitle: 'HIPAA Patient Portal', subject: 'Executive contract signing ceremony', notes: 'Contract executed successfully. Handed off to Customer Success.', createdBy: 'Neha Sharma', createdAt: new Date(Date.now() - 172800000) }
  ]
};

// Local in-memory state copy for Vercel live interaction
let localLeads = [...SEED_DATA.leads];
let localDeals = [...SEED_DATA.deals];
let localActivities = [...SEED_DATA.activities];

function getHeaders(currentUser) {
  return {
    'Content-Type': 'application/json',
    'x-user-role': currentUser?.role || 'admin',
    'x-user-name': currentUser?.name || 'Admin'
  };
}

// 1. Leads
export async function getLeads(currentUser, status = 'ALL', search = '') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads?status=${status}&search=${search}`, {
      headers: getHeaders(currentUser)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    let list = [...localLeads];
    if (status !== 'ALL') list = list.filter(l => l.status.toLowerCase() === status.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q));
    }
    return list;
  }
}

export async function createLead(currentUser, leadData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: getHeaders(currentUser),
      body: JSON.stringify(leadData)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    const newL = { id: `l${Date.now()}`, ...leadData, status: 'New', createdAt: new Date() };
    localLeads.unshift(newL);
    return newL;
  }
}

export async function deleteLead(currentUser, leadId) {
  if (currentUser.role === 'rep') {
    throw new Error("Access Denied: Sales Reps cannot delete leads. Admin or Manager role required.");
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
      method: 'DELETE',
      headers: getHeaders(currentUser)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Delete failed');
    }
    return await res.json();
  } catch (e) {
    localLeads = localLeads.filter(l => l.id !== leadId);
    return { success: true };
  }
}

// 2. Deals
export async function getDeals(currentUser) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/deals`, {
      headers: getHeaders(currentUser)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return localDeals;
  }
}

export async function createDeal(currentUser, dealData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/deals`, {
      method: 'POST',
      headers: getHeaders(currentUser),
      body: JSON.stringify(dealData)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    const newD = { id: `d${Date.now()}`, ...dealData, createdAt: new Date() };
    localDeals.unshift(newD);
    return newD;
  }
}

export async function updateDealStage(currentUser, dealId, nextStage) {
  // Reps cannot close deals
  if (currentUser.role === 'rep' && (nextStage === 'Closed Won' || nextStage === 'Closed Lost')) {
    throw new Error("Access Denied: Sales Reps cannot mark deals as Closed Won/Lost without Manager approval.");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/deals/${dealId}/stage`, {
      method: 'PUT',
      headers: getHeaders(currentUser),
      body: JSON.stringify({ stage: nextStage })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update deal stage');
    }
    return await res.json();
  } catch (e) {
    if (e.message.includes('Access Denied')) throw e;
    const deal = localDeals.find(d => d.id === dealId);
    if (deal) {
      deal.stage = nextStage;
      if (nextStage === 'Closed Won') deal.probability = 100;
      if (nextStage === 'Closed Lost') deal.probability = 0;
    }
    return deal;
  }
}

// 3. Activities
export async function getActivities(currentUser) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/activities`, {
      headers: getHeaders(currentUser)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return localActivities;
  }
}

export async function logActivity(currentUser, activityData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/activities`, {
      method: 'POST',
      headers: getHeaders(currentUser),
      body: JSON.stringify(activityData)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    const act = {
      id: `a${Date.now()}`,
      ...activityData,
      createdBy: currentUser.name,
      createdAt: new Date()
    };
    localActivities.unshift(act);
    return act;
  }
}

// 4. Sales Analytics
export async function getSalesAnalytics(currentUser) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics/sales`, {
      headers: getHeaders(currentUser)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    const totalPipelineValue = localDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const wonDeals = localDeals.filter(d => d.stage === 'Closed Won');
    const wonRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const closed = localDeals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost').length;
    const winRate = closed > 0 ? ((wonDeals.length / closed) * 100).toFixed(1) : 0;

    const stageBreakdown = {
      'Prospect': { count: 0, value: 0 },
      'Proposal Sent': { count: 0, value: 0 },
      'Negotiation': { count: 0, value: 0 },
      'Closed Won': { count: 0, value: 0 },
      'Closed Lost': { count: 0, value: 0 }
    };

    localDeals.forEach(d => {
      if (stageBreakdown[d.stage]) {
        stageBreakdown[d.stage].count += 1;
        stageBreakdown[d.stage].value += Number(d.value);
      }
    });

    const repMap = {};
    localDeals.forEach(d => {
      const rep = d.assignedTo || 'Unassigned';
      if (!repMap[rep]) repMap[rep] = { repName: rep, totalDeals: 0, wonDeals: 0, totalRevenue: 0 };
      repMap[rep].totalDeals++;
      if (d.stage === 'Closed Won') {
        repMap[rep].wonDeals++;
        repMap[rep].totalRevenue += Number(d.value);
      }
    });

    return {
      totalLeads: localLeads.length,
      activeDeals: localDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length,
      totalPipelineValue,
      wonRevenue,
      winRate: parseFloat(winRate),
      stageBreakdown,
      repLeaderboard: Object.values(repMap)
    };
  }
}
