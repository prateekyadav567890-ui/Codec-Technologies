-- ==============================================================================
-- ONLINE EXAMINATION & PROCTORING PLATFORM - DATABASE SCHEMA (PostgreSQL)
-- B.Tech First Year Engineering Project
-- ==============================================================================

-- 1. DROP EXISTING TABLES (IF RE-INITIALIZING)
DROP TABLE IF EXISTS proctoring_logs CASCADE;
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS exam_submissions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. USERS TABLE (Students & Admin / Proctor)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'password123',
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin', 'proctor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. EXAMS TABLE
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 15,
    total_marks INT NOT NULL DEFAULT 20,
    pass_marks INT NOT NULL DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. QUESTION BANK TABLE
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    marks INT NOT NULL DEFAULT 2,
    negative_marks DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    topic VARCHAR(100) DEFAULT 'General',
    difficulty VARCHAR(20) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard'))
);

-- 5. EXAM SUBMISSIONS TABLE
CREATE TABLE exam_submissions (
    id SERIAL PRIMARY KEY,
    exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    submit_time TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2) DEFAULT 0.00,
    total_possible INT NOT NULL,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'auto_submitted', 'flagged')),
    violation_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. STUDENT ANSWERS (INDIVIDUAL QUESTION AUDIT)
CREATE TABLE student_answers (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES exam_submissions(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN DEFAULT FALSE,
    marks_awarded DECIMAL(4,2) DEFAULT 0.00
);

-- 7. PROCTORING VIOLATION LOGS
CREATE TABLE proctoring_logs (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES exam_submissions(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL, -- 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'NO_FACE', 'WEBCAM_DISCONNECTED'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- ==============================================================================
-- SAMPLE SEED DATA FOR DEMO & TESTING
-- ==============================================================================

-- Seed Users
INSERT INTO users (name, email, role) VALUES 
('Prof. Sharma (Examiner)', 'admin@campus.edu', 'admin'),
('Aarav Patel (Student)', 'aarav@student.edu', 'student'),
('Ananya Gupta (Student)', 'ananya@student.edu', 'student');

-- Seed Exams
INSERT INTO exams (id, title, description, subject, duration_minutes, total_marks, pass_marks) VALUES 
(1, 'CS101: Midterm Fundamentals of Computer Systems', 'Midterm assessment on binary systems, memory, networking, and programming basics.', 'Computer Science', 10, 10, 4),
(2, 'ENG102: Data Structures & Algorithms Qualifier', 'Diagnostic test covering arrays, linked lists, stacks, and algorithmic complexity.', 'Computer Science', 15, 10, 5);

-- Seed Questions for Exam 1 (CS101)
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, negative_marks, topic, difficulty) VALUES 
(1, 'Which data structure follows the Last-In-First-Out (LIFO) principle?', 'Queue', 'Stack', 'Linked List', 'Array', 'B', 2, 0.50, 'Data Structures', 'Easy'),
(1, 'In WebRTC, what protocol is primarily used for direct peer-to-peer audio and video transmission?', 'TCP', 'UDP / SRTP', 'HTTP/2', 'SMTP', 'B', 2, 0.50, 'Networking', 'Medium'),
(1, 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?', 'O(1)', 'O(n)', 'O(log n)', 'O(n log n)', 'C', 2, 0.50, 'Algorithms', 'Medium'),
(1, 'Which browser event allows detecting when a student navigates away from an active exam tab?', 'window.onload', 'document.visibilitychange', 'navigator.geolocation', 'window.resize', 'B', 2, 0.50, 'Web Security', 'Easy'),
(1, 'In PostgreSQL, which keyword ensures that child records are deleted when a parent record is removed?', 'ON DELETE RESTRICT', 'ON REMOVE REMOVE', 'ON DELETE CASCADE', 'DROP IF EXISTS', 'C', 2, 0.50, 'Databases', 'Easy');

-- Seed Questions for Exam 2 (ENG102)
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, negative_marks, topic, difficulty) VALUES 
(2, 'What is the worst-case time complexity of QuickSort?', 'O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)', 'B', 2, 0.50, 'Algorithms', 'Medium'),
(2, 'Which of the following data structures can be used to implement recursion iteratively?', 'Queue', 'Stack', 'Binary Tree', 'Priority Queue', 'B', 2, 0.50, 'Data Structures', 'Easy'),
(2, 'Which network layer handles logical IP addressing?', 'Transport Layer', 'Data Link Layer', 'Network Layer', 'Physical Layer', 'C', 2, 0.50, 'Networking', 'Easy'),
(2, 'What does the STUN server do in a WebRTC connection?', 'Relays all live media data continuously', 'Discovers public IP address & port behind NAT', 'Stores recorded videos on disk', 'Acts as a web server for HTML files', 'B', 2, 0.50, 'Networking', 'Hard'),
(2, 'Which SQL constraint guarantees that all values in a column are distinct?', 'NOT NULL', 'UNIQUE', 'FOREIGN KEY', 'CHECK', 'B', 2, 0.50, 'Databases', 'Easy');
