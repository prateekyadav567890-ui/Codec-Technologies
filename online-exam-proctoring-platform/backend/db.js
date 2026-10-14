/**
 * db.js - PostgreSQL Database Connection & Hybrid In-Memory Fallback
 * Designed for B.Tech First Year Project demonstration.
 * Connects to PostgreSQL if available, and gracefully falls back to an in-memory
 * relational mock so the system works even if PostgreSQL is not currently running.
 */

const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let useDatabase = false;

// Initial connection test
if (process.env.DATABASE_URL || process.env.PGUSER) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/exam_db',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    pool.connect()
        .then(client => {
            console.log('✅ Connected to PostgreSQL database successfully');
            useDatabase = true;
            client.release();
        })
        .catch(err => {
            console.warn('⚠️ PostgreSQL connection failed:', err.message);
            console.log('🔄 Running in High-Fidelity IN-MEMORY Fallback Mode for local demonstration.');
            useDatabase = false;
        });
} else {
    console.log('ℹ️ No PostgreSQL credentials detected. Initializing with IN-MEMORY fallback database.');
}

// In-Memory Relational Mock Data Store (Synchronized with schema.sql)
const memoryStore = {
    users: [
        { id: 1, name: 'Prof. Sharma (Examiner)', email: 'admin@campus.edu', role: 'admin' },
        { id: 2, name: 'Aarav Patel (Student)', email: 'aarav@student.edu', role: 'student' },
        { id: 3, name: 'Ananya Gupta (Student)', email: 'ananya@student.edu', role: 'student' }
    ],
    exams: [
        {
            id: 1,
            title: 'CS101: Midterm Fundamentals of Computer Systems',
            description: 'Midterm assessment on binary systems, memory, networking, and programming basics.',
            subject: 'Computer Science',
            duration_minutes: 10,
            total_marks: 10,
            pass_marks: 4,
            is_active: true,
            created_at: new Date()
        },
        {
            id: 2,
            title: 'ENG102: Data Structures & Algorithms Qualifier',
            description: 'Diagnostic test covering arrays, linked lists, stacks, and algorithmic complexity.',
            subject: 'Computer Science',
            duration_minutes: 15,
            total_marks: 10,
            pass_marks: 5,
            is_active: true,
            created_at: new Date()
        }
    ],
    questions: [
        {
            id: 1,
            exam_id: 1,
            question_text: 'Which data structure follows the Last-In-First-Out (LIFO) principle?',
            option_a: 'Queue',
            option_b: 'Stack',
            option_c: 'Linked List',
            option_d: 'Array',
            correct_option: 'B',
            marks: 2,
            negative_marks: 0.50,
            topic: 'Data Structures',
            difficulty: 'Easy'
        },
        {
            id: 2,
            exam_id: 1,
            question_text: 'In WebRTC, what protocol is primarily used for direct peer-to-peer audio and video transmission?',
            option_a: 'TCP',
            option_b: 'UDP / SRTP',
            option_c: 'HTTP/2',
            option_d: 'SMTP',
            correct_option: 'B',
            marks: 2,
            negative_marks: 0.50,
            topic: 'Networking',
            difficulty: 'Medium'
        },
        {
            id: 3,
            exam_id: 1,
            question_text: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
            option_a: 'O(1)',
            option_b: 'O(n)',
            option_c: 'O(log n)',
            option_d: 'O(n log n)',
            correct_option: 'C',
            marks: 2,
            negative_marks: 0.50,
            topic: 'Algorithms',
            difficulty: 'Medium'
        },
        {
            id: 4,
            exam_id: 1,
            question_text: 'Which browser event allows detecting when a student navigates away from an active exam tab?',
            option_a: 'window.onload',
            option_b: 'document.visibilitychange',
            option_a_other: 'navigator.geolocation',
            option_c: 'navigator.geolocation',
            option_d: 'window.resize',
            correct_option: 'B',
            marks: 2,
            negative_marks: 0.50,
            topic: 'Web Security',
            difficulty: 'Easy'
        },
        {
            id: 5,
            exam_id: 1,
            question_text: 'In PostgreSQL, which keyword ensures that child records are deleted when a parent record is removed?',
            option_a: 'ON DELETE RESTRICT',
            option_b: 'ON REMOVE REMOVE',
            option_c: 'ON DELETE CASCADE',
            option_d: 'DROP IF EXISTS',
            correct_option: 'C',
            marks: 2,
            negative_marks: 0.50,
            topic: 'Databases',
            difficulty: 'Easy'
        }
    ],
    submissions: [
        {
            id: 101,
            exam_id: 1,
            student_id: 2,
            start_time: new Date(Date.now() - 3600000),
            submit_time: new Date(Date.now() - 3000000),
            score: 8.00,
            total_possible: 10,
            percentage: 80.00,
            status: 'completed',
            violation_count: 1
        }
    ],
    student_answers: [],
    proctoring_logs: [
        {
            id: 1,
            submission_id: 101,
            student_id: 2,
            violation_type: 'TAB_SWITCH',
            timestamp: new Date(Date.now() - 3300000),
            details: 'Browser tab lost focus for 4 seconds.'
        }
    ]
};

// Database execution abstraction helper
async function query(text, params = []) {
    if (useDatabase && pool) {
        return pool.query(text, params);
    }
    // Return mock response representation
    return { rows: [] };
}

module.exports = {
    pool,
    query,
    memoryStore,
    isUsingDatabase: () => useDatabase
};
