/**
 * models.js - MongoDB Data Schemas & In-Memory Fallback Store
 * B.Tech First Year Project - Enterprise CRM System
 */

const mongoose = require('mongoose');

// 1. Mongoose Schema Definitions (When MongoDB is Connected)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'manager', 'rep'], default: 'rep' },
  createdAt: { type: Date, default: Date.now }
});

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ['New', 'Contacted', 'Qualified', 'Lost'], default: 'New' },
  dealValue: { type: Number, default: 0 },
  assignedTo: { type: String, default: 'Unassigned' },
  source: { type: String, default: 'Website' },
  createdAt: { type: Date, default: Date.now }
});

const DealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  value: { type: Number, required: true },
  stage: { 
    type: String, 
    enum: ['Prospect', 'Contacted', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'], 
    default: 'Prospect' 
  },
  probability: { type: Number, default: 20 },
  closingDate: { type: Date },
  assignedTo: { type: String, default: 'Rajesh Kumar' },
  createdAt: { type: Date, default: Date.now }
});

const ActivitySchema = new mongoose.Schema({
  type: { type: String, enum: ['Email', 'Call', 'Meeting', 'Note'], required: true },
  entityType: { type: String, enum: ['lead', 'deal'], required: true },
  entityId: { type: String, required: true },
  entityTitle: { type: String },
  subject: { type: String, required: true },
  notes: { type: String },
  createdBy: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

// Compile models if Mongoose has a valid connection
let UserModel, LeadModel, DealModel, ActivityModel;
try {
  UserModel = mongoose.model('User', UserSchema);
  LeadModel = mongoose.model('Lead', LeadSchema);
  DealModel = mongoose.model('Deal', DealSchema);
  ActivityModel = mongoose.model('Activity', ActivitySchema);
} catch (e) {
  // Already compiled or fallback
}

// 2. High-Fidelity In-Memory Data Store (Works seamlessly if MongoDB is offline)
const inMemoryStore = {
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

module.exports = {
  UserModel,
  LeadModel,
  DealModel,
  ActivityModel,
  inMemoryStore
};
