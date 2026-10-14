# ProctorShield: Online Examination & AI-Proctoring Platform
**B.Tech First Year Engineering Project**  
**Tech Stack:** React.js, Node.js (Express), PostgreSQL, WebRTC & Socket.io

---

## 1. Project Overview & Architecture

ProctorShield is a secure, full-stack online examination and candidate monitoring platform engineered for academic institutions. It provides a computer-based testing (CBT) interface, automated real-time proctoring telemetry via WebRTC and browser security APIs, instant server-side auto-evaluation with negative marking, and performance analytics.

```
                           ┌────────────────────────────────────────┐
                           │          React.js Client               │
                           │  - Timed Exam Portal & Palette         │
                           │  - Webcam Video HUD (getUserMedia)     │
                           │  - Event Observers (Tabs / Fullscreen) │
                           └───────────────┬────────────────────────┘
                                           │
                        HTTP REST / JSON   │   WebSocket / WebRTC Signaling
                                           │   (Socket.io)
                                           ▼
                           ┌────────────────────────────────────────┐
                           │      Node.js & Express Server          │
                           │  - WebRTC SDP & ICE Candidate Relay    │
                           │  - Automated Evaluation Engine         │
                           │  - Proctoring Violation Dispatcher     │
                           └───────────────┬────────────────────────┘
                                           │
                                  pg Pool  │ SQL Queries
                                           ▼
                           ┌────────────────────────────────────────┐
                           │       PostgreSQL Database              │
                           │  - users, exams, questions             │
                           │  - exam_submissions, student_answers   │
                           │  - proctoring_logs                     │
                           └────────────────────────────────────────┘
```

---

## 2. Key Modules & Features

### A. Timed Exams & Question Banks
- **Synchronized Exam Timer:** Countdown clock with dynamic visual warnings (green $\rightarrow$ warning yellow $\rightarrow$ pulsing danger red when $< 2$ minutes remain).
- **Auto-Submission:** Triggers an immediate submission payload when the timer hits `00:00:00`.
- **Adaptive Question Palette:** NTA/GATE-style question navigation tracking *Answered* (Green), *Marked for Review* (Yellow), and *Unvisited* (Dark slate).
- **Categorized Question Bank:** Stores MCQs with topic taxonomy, difficulty tiers (Easy/Medium/Hard), positive marks ($+2$), and negative marking penalties ($-0.5$).

### B. Webcam-Based Proctoring & WebRTC
- **Live Video Capture:** Utilizes the HTML5 `navigator.mediaDevices.getUserMedia` API to acquire real-time student camera and microphone feeds.
- **WebRTC Peer Streaming:** Connects to examiners via `RTCPeerConnection` using Google's public STUN server (`stun:stun.l.google.com:19302`) for peer-to-peer streaming with minimal server bandwidth overhead.
- **Tab-Switch & Blur Detection:** Listens to `document.visibilitychange` and `window.blur` to flag candidates navigating to external search engines or notes.
- **Fullscreen Enforcement:** Enforces `requestFullscreen` and triggers instant security incident alerts upon exit.

### C. Automated Evaluation Engine
- **Server-Side Grading Security:** The client receives question stems and options without answer keys. Responses are validated on the backend against PostgreSQL records to prevent client-side DevTools manipulation.
- **Scoring Formula:**
  $$\text{Final Score} = \sum (\text{Correct Answers} \times \text{Marks}) - \sum (\text{Wrong Answers} \times \text{Negative Penalty})$$
- **Pass/Fail Thresholding:** Evaluates against the course pass mark threshold and assigns completion statuses (`completed`, `auto_submitted`, or `flagged`).

### D. Result Analytics & Audit Logs
- **Candidate Scorecard:** Instant breakdown of marks, percentage accuracy, correct count, wrong count, and skipped questions.
- **Proctoring Incident Audit Trail:** Timestamped log of security incidents (e.g. `TAB_SWITCH`, `FULLSCREEN_EXIT`).
- **Batch Examination Metrics:** Computes batch average scores, highest score, and overall candidate pass percentages.

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (Optional: system includes an automatic in-memory relational fallback for zero-config demonstration)

### Step 1: Database Setup (PostgreSQL)
If you have PostgreSQL installed:
```bash
# Log in to PostgreSQL CLI
psql -U postgres

# Create the database
CREATE DATABASE exam_db;

# Run the provided schema script
\c exam_db;
\i backend/schema.sql;
```

*(Note: If you do not have PostgreSQL running, the backend automatically uses an in-memory relational data store with the exact same seed data so your viva demo will run without errors!)*

### Step 2: Start the Backend Server
```bash
cd backend
npm install
npm start
```
The server will initialize on `http://localhost:5000` with WebSocket signaling active.

### Step 3: Start the React Frontend
```bash
cd ../frontend
npm install
npm start
```
The web app will launch automatically at `http://localhost:3000`.

---

## 4. Database Schema Structure (`schema.sql`)

| Table Name | Primary Key | Description |
| :--- | :--- | :--- |
| `users` | `id` | Stores student and faculty credentials and roles (`student`, `admin`, `proctor`). |
| `exams` | `id` | Exam metadata (subject, duration in minutes, total marks, pass marks). |
| `questions` | `id` | Question text, 4 options (A/B/C/D), correct option key, marks, negative penalty, topic. |
| `exam_submissions` | `id` | Student test sessions, server-recorded start/submit timestamps, score, and violation count. |
| `student_answers` | `id` | Audit record of individual question choices, correctness boolean, and marks awarded. |
| `proctoring_logs` | `id` | Time-stamped incident telemetry (`TAB_SWITCH`, `FULLSCREEN_EXIT`, `NO_FACE`). |

---

## 5. B.Tech 1st Year Viva Voce Defense Guide

Here are the top technical questions professors ask during project evaluations, along with clear explanations:

#### Q1: What is WebRTC and why is it used instead of regular HTTP streaming?
> **Answer:** WebRTC (Web Real-Time Communication) enables direct peer-to-peer audio, video, and data communication between browsers without sending video through an intermediate web server. This provides sub-second latency and drastically cuts server bandwidth costs during large-scale college examinations.

#### Q2: What is the role of the STUN server in your project?
> **Answer:** Computers on campus networks or home Wi-Fi are behind NAT (Network Address Translation) and private firewalls. A STUN (Session Traversal Utilities for NAT) server lets the student's browser discover its public IP address and port so the proctor's browser can establish a direct peer-to-peer connection.

#### Q3: How do you prevent students from seeing the correct answers using browser Inspect Element?
> **Answer:** The frontend API request (`GET /api/exams/:id`) sanitizes the questions and strips out the `correct_option` field entirely before returning data to the student. The evaluation logic runs exclusively on the Node.js server (`POST /api/exams/:id/submit`), keeping answer keys completely hidden from client memory.

#### Q4: How does the system detect if a student switches tabs or minimizes the window?
> **Answer:** The frontend hooks into the Page Visibility API (`document.addEventListener('visibilitychange')`). When the student leaves the exam tab, `document.hidden` becomes `true`. Additionally, `window.addEventListener('blur')` triggers when the window loses focus, immediately dispatching a violation log to the backend and alerting the proctor in real-time.

#### Q5: How is time calculated securely against system clock tampering?
> **Answer:** Rather than trusting the student's local computer clock, the backend creates an immutable `start_time` timestamp in the database when the exam begins. Upon submission, the backend checks elapsed time against the exam duration to verify compliance.
