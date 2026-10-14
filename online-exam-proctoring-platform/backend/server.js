/**
 * server.js - Online Examination & Proctoring Platform Backend
 * Tech Stack: Node.js, Express, Socket.io (WebRTC Signaling), PostgreSQL
 * Features:
 *  1. Timed Exam Management & Question Banks
 *  2. WebRTC Live Video Streaming Signaling & Proctoring Socket Events
 *  3. Automated Exam Evaluation Engine with Negative Marking
 *  4. Result Analytics & Proctoring Audit Logs
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { query, memoryStore, isUsingDatabase } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow frontend React app
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==============================================================================
// 1. REST APIS: EXAM & QUESTION BANK MANAGEMENT
// ==============================================================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        database: isUsingDatabase() ? 'PostgreSQL' : 'In-Memory Relational Engine',
        timestamp: new Date().toISOString()
    });
});

// Get all active exams
app.get('/api/exams', async (req, res) => {
    try {
        if (isUsingDatabase()) {
            const result = await query('SELECT * FROM exams WHERE is_active = TRUE ORDER BY id ASC');
            return res.json(result.rows);
        }
        res.json(memoryStore.exams.filter(e => e.is_active));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get exam questions for taking an exam (Security: correct_option is stripped out)
app.get('/api/exams/:id', async (req, res) => {
    const examId = parseInt(req.params.id);
    try {
        let exam, questions;
        if (isUsingDatabase()) {
            const examRes = await query('SELECT * FROM exams WHERE id = $1', [examId]);
            if (examRes.rows.length === 0) return res.status(404).json({ error: 'Exam not found' });
            exam = examRes.rows[0];

            // Strip correct_option so student cannot inspect network tab to cheat
            const qRes = await query(
                'SELECT id, exam_id, question_text, option_a, option_b, option_c, option_d, marks, negative_marks, topic, difficulty FROM questions WHERE exam_id = $1 ORDER BY id ASC',
                [examId]
            );
            questions = qRes.rows;
        } else {
            exam = memoryStore.exams.find(e => e.id === examId);
            if (!exam) return res.status(404).json({ error: 'Exam not found' });

            questions = memoryStore.questions
                .filter(q => q.exam_id === examId)
                .map(({ correct_option, ...safeQuestion }) => safeQuestion);
        }

        res.json({ exam, questions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start an exam attempt (Records verified server-side start time)
app.post('/api/exams/:id/start', async (req, res) => {
    const examId = parseInt(req.params.id);
    const { studentId = 2 } = req.body;

    try {
        const startTime = new Date();
        let totalPossible = 0;

        if (isUsingDatabase()) {
            const qRes = await query('SELECT SUM(marks) as total FROM questions WHERE exam_id = $1', [examId]);
            totalPossible = parseInt(qRes.rows[0]?.total || 10);

            const insertRes = await query(
                'INSERT INTO exam_submissions (exam_id, student_id, start_time, total_possible, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [examId, studentId, startTime, totalPossible, 'in_progress']
            );
            return res.json({ submissionId: insertRes.rows[0].id, startTime });
        }

        const questions = memoryStore.questions.filter(q => q.exam_id === examId);
        totalPossible = questions.reduce((sum, q) => sum + q.marks, 0);

        const newSubmission = {
            id: Date.now(),
            exam_id: examId,
            student_id: studentId,
            start_time: startTime,
            submit_time: null,
            score: 0,
            total_possible: totalPossible || 10,
            percentage: 0,
            status: 'in_progress',
            violation_count: 0
        };
        memoryStore.submissions.push(newSubmission);

        res.json({ submissionId: newSubmission.id, startTime });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================================================
// 2. AUTOMATED EVALUATION ENGINE
// ==============================================================================

app.post('/api/exams/:id/submit', async (req, res) => {
    const examId = parseInt(req.params.id);
    const { submissionId, studentId = 2, answers = {}, violationCount = 0, isAutoSubmit = false } = req.body;

    try {
        const submitTime = new Date();
        let questions = [];

        if (isUsingDatabase()) {
            const qRes = await query('SELECT * FROM questions WHERE exam_id = $1', [examId]);
            questions = qRes.rows;
        } else {
            questions = memoryStore.questions.filter(q => q.exam_id === examId);
        }

        let calculatedScore = 0;
        let totalPossible = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let unattemptedCount = 0;
        const evaluationDetails = [];

        // Grade each question against stored answer key
        for (const q of questions) {
            totalPossible += q.marks;
            const chosen = answers[q.id];

            if (!chosen) {
                unattemptedCount++;
                evaluationDetails.push({
                    questionId: q.id,
                    questionText: q.question_text,
                    selectedOption: null,
                    correctOption: q.correct_option,
                    status: 'unattempted',
                    marksAwarded: 0,
                    topic: q.topic
                });
            } else if (chosen.toUpperCase() === q.correct_option.toUpperCase()) {
                correctCount++;
                calculatedScore += q.marks;
                evaluationDetails.push({
                    questionId: q.id,
                    questionText: q.question_text,
                    selectedOption: chosen,
                    correctOption: q.correct_option,
                    status: 'correct',
                    marksAwarded: q.marks,
                    topic: q.topic
                });
            } else {
                wrongCount++;
                const penalty = parseFloat(q.negative_marks || 0);
                calculatedScore -= penalty;
                evaluationDetails.push({
                    questionId: q.id,
                    questionText: q.question_text,
                    selectedOption: chosen,
                    correctOption: q.correct_option,
                    status: 'incorrect',
                    marksAwarded: -penalty,
                    topic: q.topic
                });
            }
        }

        // Clamp minimum score to 0
        if (calculatedScore < 0) calculatedScore = 0;
        const percentage = totalPossible > 0 ? ((calculatedScore / totalPossible) * 100).toFixed(2) : 0;
        const submissionStatus = isAutoSubmit ? 'auto_submitted' : (violationCount > 3 ? 'flagged' : 'completed');

        // Persist submission record
        if (isUsingDatabase()) {
            await query(
                'UPDATE exam_submissions SET submit_time = $1, score = $2, percentage = $3, status = $4, violation_count = $5 WHERE id = $6',
                [submitTime, calculatedScore, percentage, submissionStatus, violationCount, submissionId]
            );
        } else {
            const sub = memoryStore.submissions.find(s => s.id === parseInt(submissionId)) || {
                id: parseInt(submissionId),
                exam_id: examId,
                student_id: studentId,
                start_time: new Date()
            };
            sub.submit_time = submitTime;
            sub.score = calculatedScore;
            sub.total_possible = totalPossible;
            sub.percentage = parseFloat(percentage);
            sub.status = submissionStatus;
            sub.violation_count = violationCount;
            sub.evaluationDetails = evaluationDetails;
        }

        res.json({
            success: true,
            submissionId,
            score: calculatedScore,
            totalPossible,
            percentage: parseFloat(percentage),
            correctCount,
            wrongCount,
            unattemptedCount,
            status: submissionStatus,
            violationCount,
            evaluationDetails
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================================================
// 3. PROCTORING VIOLATION LOGGING API
// ==============================================================================

app.post('/api/proctor/violation', async (req, res) => {
    const { submissionId, studentId = 2, violationType, details } = req.body;
    const timestamp = new Date();

    try {
        if (isUsingDatabase()) {
            await query(
                'INSERT INTO proctoring_logs (submission_id, student_id, violation_type, timestamp, details) VALUES ($1, $2, $3, $4, $5)',
                [submissionId, studentId, violationType, timestamp, details]
            );
            await query(
                'UPDATE exam_submissions SET violation_count = violation_count + 1 WHERE id = $1',
                [submissionId]
            );
        } else {
            const logEntry = {
                id: memoryStore.proctoring_logs.length + 1,
                submission_id: parseInt(submissionId),
                student_id: parseInt(studentId),
                violation_type: violationType,
                timestamp,
                details
            };
            memoryStore.proctoring_logs.push(logEntry);

            const sub = memoryStore.submissions.find(s => s.id === parseInt(submissionId));
            if (sub) sub.violation_count = (sub.violation_count || 0) + 1;
        }

        // Notify proctor in real-time via Socket.io
        io.emit('live-proctor-alert', {
            submissionId,
            studentId,
            violationType,
            details,
            timestamp
        });

        res.json({ success: true, message: 'Violation logged and alerted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================================================
// 4. RESULT ANALYTICS APIS
// ==============================================================================

// Individual Submission Analytics
app.get('/api/analytics/submission/:submissionId', (req, res) => {
    const subId = parseInt(req.params.submissionId);
    const submission = memoryStore.submissions.find(s => s.id === subId);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const logs = memoryStore.proctoring_logs.filter(l => l.submission_id === subId);
    const exam = memoryStore.exams.find(e => e.id === submission.exam_id);

    // Compute Topic-Wise Accuracy
    const topicBreakdown = {};
    if (submission.evaluationDetails) {
        submission.evaluationDetails.forEach(item => {
            const topic = item.topic || 'General';
            if (!topicBreakdown[topic]) {
                topicBreakdown[topic] = { total: 0, correct: 0, marks: 0 };
            }
            topicBreakdown[topic].total++;
            if (item.status === 'correct') {
                topicBreakdown[topic].correct++;
                topicBreakdown[topic].marks += item.marksAwarded;
            }
        });
    }

    res.json({
        submission,
        exam,
        proctoringLogs: logs,
        topicBreakdown
    });
});

// Exam-Wide Aggregate Analytics for Admin/Proctor
app.get('/api/analytics/exam/:examId', (req, res) => {
    const examId = parseInt(req.params.examId);
    const exam = memoryStore.exams.find(e => e.id === examId);
    const submissions = memoryStore.submissions.filter(s => s.exam_id === examId);
    const questions = memoryStore.questions.filter(q => q.exam_id === examId);

    const totalSubmissions = submissions.length;
    const avgScore = totalSubmissions > 0
        ? (submissions.reduce((acc, s) => acc + s.score, 0) / totalSubmissions).toFixed(2)
        : 0;
    const highestScore = totalSubmissions > 0
        ? Math.max(...submissions.map(s => s.score))
        : 0;
    const passCount = submissions.filter(s => s.score >= (exam ? exam.pass_marks : 4)).length;
    const passPercentage = totalSubmissions > 0 ? ((passCount / totalSubmissions) * 100).toFixed(1) : 0;

    res.json({
        exam,
        totalQuestions: questions.length,
        totalSubmissions,
        averageScore: parseFloat(avgScore),
        highestScore,
        passPercentage: parseFloat(passPercentage),
        submissions,
        recentViolations: memoryStore.proctoring_logs.slice(-10)
    });
});

// Admin Add Question to Bank
app.post('/api/admin/questions', (req, res) => {
    const { examId, questionText, optionA, optionB, optionC, optionD, correctOption, marks = 2, negativeMarks = 0.5, topic, difficulty } = req.body;

    const newQuestion = {
        id: memoryStore.questions.length + 1,
        exam_id: parseInt(examId),
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption.toUpperCase(),
        marks: parseFloat(marks),
        negative_marks: parseFloat(negativeMarks),
        topic: topic || 'Computer Science',
        difficulty: difficulty || 'Medium'
    };

    memoryStore.questions.push(newQuestion);
    res.json({ success: true, question: newQuestion });
});

// ==============================================================================
// 5. WEBRTC SIGNALING SERVER & LIVE PROCTORING SOCKETS
// ==============================================================================

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room for exam sessions
    socket.on('join-exam-room', ({ examId, role, studentId, studentName }) => {
        const roomName = `exam-${examId}`;
        socket.join(roomName);
        socket.examRoom = roomName;
        socket.role = role;
        socket.studentId = studentId;

        console.log(`👤 ${role} (${studentName || studentId}) joined room: ${roomName}`);

        // If a student joined, inform any connected proctors
        if (role === 'student') {
            socket.to(roomName).emit('student-joined-session', {
                socketId: socket.id,
                studentId,
                studentName: studentName || `Student #${studentId}`
            });
        }
    });

    // WebRTC Signaling: SDP Offer
    socket.on('webrtc-offer', ({ targetSocketId, sdpOffer, senderId }) => {
        socket.to(targetSocketId).emit('webrtc-offer', {
            sdpOffer,
            senderSocketId: socket.id,
            senderId
        });
    });

    // WebRTC Signaling: SDP Answer
    socket.on('webrtc-answer', ({ targetSocketId, sdpAnswer }) => {
        socket.to(targetSocketId).emit('webrtc-answer', {
            sdpAnswer,
            senderSocketId: socket.id
        });
    });

    // WebRTC Signaling: Relay ICE Candidates
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
        socket.to(targetSocketId).emit('ice-candidate', {
            candidate,
            senderSocketId: socket.id
        });
    });

    // Proctor sending live warning or audio ping to student
    socket.on('send-proctor-warning', ({ studentSocketId, message }) => {
        io.to(studentSocketId).emit('proctor-warning-received', { message });
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        if (socket.examRoom) {
            socket.to(socket.examRoom).emit('student-disconnected', { socketId: socket.id });
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Examination & Proctoring Server running on http://localhost:${PORT}`);
    console.log(`📡 WebRTC Signaling Server active on ws://localhost:${PORT}`);
});
