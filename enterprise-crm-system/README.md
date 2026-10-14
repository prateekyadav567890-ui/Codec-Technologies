# ApexCRM: Enterprise Customer Relationship Management System
**B.Tech First Year Engineering Project**  
**Tech Stack:** React.js, Node.js (Express), MongoDB (with In-Memory Fallback), REST APIs

---

## 1. Project Overview & Architecture

ApexCRM is a full-stack Enterprise Customer Relationship Management system designed to streamline customer lead acquisition, sales pipeline deal progression, communications auditing, and executive sales analytics. It incorporates Role-Based Access Control (RBAC) across three organizational tiers: **Administrators**, **Sales Managers**, and **Sales Representatives**.

```
                           ┌────────────────────────────────────────┐
                           │          React.js Client               │
                           │  - Kanban Deal Pipeline (5 Stages)     │
                           │  - Lead Capture & Scoring Matrix       │
                           │  - Sales KPI & Conversion Dashboards   │
                           │  - Live Role Switcher (RBAC Tester)    │
                           └───────────────┬────────────────────────┘
                                           │
                                 HTTP REST │ JSON Payloads
                                 (x-user-role headers)
                                           ▼
                           ┌────────────────────────────────────────┐
                           │      Node.js & Express API             │
                           │  - RBAC Permission Verification        │
                           │  - Pipeline State Transition Engine    │
                           │  - Sales Metric Aggregation Pipeline   │
                           └───────────────┬────────────────────────┘
                                           │
                             Mongoose / BSON│ Documents
                                           ▼
                           ┌────────────────────────────────────────┐
                           │       MongoDB Database                 │
                           │  - Users (Roles & Credentials)         │
                           │  - Leads (Inbound Prospects)           │
                           │  - Deals (Pipeline Negotiations)       │
                           │  - Activities (Email & Call Logs)      │
                           └────────────────────────────────────────┘
```

---

## 2. Core Modules & Features

### A. Lead Tracking & Deal Stages
* **Kanban Sales Pipeline:** Visual drag/click pipeline organized into 5 enterprise stages:
  $$\text{Prospect} \longrightarrow \text{Proposal Sent} \longrightarrow \text{Negotiation} \longrightarrow \text{Closed Won} \ / \ \text{Closed Lost}$$
* **Stage Value Aggregation:** Calculates real-time total prospective deal value in each column.
* **Lead Acquisition & Scoring:** Captures prospective leads with deal sizes, acquisition sources (LinkedIn, Inbound, Referrals), and assignment to sales reps.

### B. Sales Performance Dashboards
* **Total Pipeline Value:** Cumulative rupee value across all active sales negotiations.
* **Closed Won Revenue:** Total booked contract value completed in current cycle.
* **Win Rate Metric:**
  $$\text{Win Rate (\%)} = \left( \frac{\text{Closed Won Deals}}{\text{Closed Won Deals} + \text{Closed Lost Deals}} \right) \times 100$$
* **Representative Leaderboard:** Tracks individual quotas, closed deals, and revenue contributed per team member.

### C. Email & Activity Logs
* **Omnichannel Audit Trail:** Logs emails, telephone calls, executive meetings, and strategy notes.
* **Interaction History:** Automatically records an activity entry whenever a deal stage advances.

### D. Role-Based Access Control (RBAC) Matrix
The system enforces strict permission boundaries on both frontend and backend:

| Capability | Administrator (`admin`) | Sales Manager (`manager`) | Sales Representative (`rep`) |
| :--- | :---: | :---: | :---: |
| View Leads & Deals | Yes | Yes | Yes |
| Create New Leads & Deals | Yes | Yes | Yes |
| Log Communication Activities | Yes | Yes | Yes |
| Delete Leads | **Allowed** | **Allowed** | **Denied (403 Forbidden)** |
| Close Deals (`Closed Won`/`Lost`) | **Allowed** | **Allowed** | **Denied (Manager Approval Req.)** |
| Access Executive Revenue Dashboards | Full Access | Full Access | Individual Quota Only |

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (Optional: The backend includes an automatic high-fidelity in-memory database fallback so you can demonstrate the project even if MongoDB is not running locally!)

### Step 1: Start the Backend REST API
```bash
cd backend
npm install
npm start
```
* The API server initializes on `http://localhost:5001`.

### Step 2: Start the React Frontend
```bash
cd ../frontend
npm install
npm start
```
* The web app will launch automatically at `http://localhost:3000`.

---

## 4. Live Vercel Deployment Guide

1. Push the unzipped project to your GitHub account.
2. Sign in to [vercel.com](https://vercel.com) using GitHub.
3. Click **Add New Project** $\rightarrow$ **Import** your repository.
4. Set **Root Directory** to `frontend`.
5. Click **Deploy**. The application includes pre-configured mock fallbacks in `api.js` so all tabs, deals, lead management, and dashboards work 100% interactively on your live Vercel link!
