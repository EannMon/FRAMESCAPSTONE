-- FRAMES Database Expansion & Simulation
-- Focus: Room 306 (Device ID: 1)
-- Purpose: Populate empty tables and expand attendance data
-- Date: 2026-02-26

BEGIN;

-- 1. ADD NEW SUBJECTS FOR ROOM 306
INSERT INTO subjects (id, code, title, units, created_at) VALUES 
(101, 'IT311-M', 'Mobile Application Development', 3, '2026-02-23 08:00:00'),
(102, 'IT312-M', 'Information Assurance and Security 2', 3, '2026-02-23 08:00:00'),
(103, 'IT313-M', 'Social and Professional Issues in IT', 2, '2026-02-23 08:00:00');

-- 2. CREATE NEW CLASSES FOR ROOM 306
-- Faculty: Maria Dela Cruz (2) and Anna Reyes (4)
INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, late_threshold_minutes, created_at) VALUES 
(50, 101, 2, 'Room 306', 'Monday', '13:00:00', '16:00:00', 'BSIT-3A-M', '2nd Semester', '2025-2026', 15, '2026-02-23 09:00:00'),
(51, 102, 4, 'Room 306', 'Thursday', '09:00:00', '12:00:00', 'BSIT-3A-M', '2nd Semester', '2025-2026', 15, '2026-02-23 09:00:00');

-- 3. AUTO-ENROLL BSIT-3A-M STUDENTS (IDs 57-66)
INSERT INTO enrollments (class_id, student_id, enrolled_at)
SELECT 50, id, '2026-02-23 10:00:00' FROM users WHERE id BETWEEN 57 AND 66;

INSERT INTO enrollments (class_id, student_id, enrolled_at)
SELECT 51, id, '2026-02-23 10:00:00' FROM users WHERE id BETWEEN 57 AND 66;

-- 4. SIMULATE SECURITY EVENTS (security_logs)
-- Scenario: An unrecognized face attempted to enter Room 306 today
INSERT INTO security_logs (device_id, event_type, confidence_score, room, details, timestamp) VALUES 
(1, 'UNRECOGNIZED_FACE', 0.28, 'Room 306', 'Unknown person detected at door; confidence below threshold.', '2026-02-26 08:45:12'),
(1, 'GESTURE_FAILURE', 0.45, 'Room 306', 'Student 47 failed Peace Sign gesture 3 times during BREAK_OUT.', '2026-02-26 14:30:05');

-- 5. SIMULATE AUDIT LOGS (audit_logs)
-- Tracking administrative actions
INSERT INTO audit_logs (user_id, action_type, target_table, target_id, old_value, new_value, ip_address, timestamp) VALUES 
(1, 'USER_VERIFY', 'users', 56, '{"verification_status": "REJECTED"}', '{"verification_status": "VERIFIED"}', '192.168.254.10', '2026-02-25 10:00:00'),
(2, 'SCHEDULE_UPLOAD', 'classes', 50, NULL, '{"subject": "IT311-M", "room": "306"}', '192.168.254.12', '2026-02-23 09:05:00');

-- 6. SIMULATE SYSTEM PERFORMANCE (system_metrics)
-- Data for health monitoring
INSERT INTO system_metrics (device_id, metric_type, value, unit, timestamp) VALUES 
(1, 'RECOGNITION_LATENCY', 142.5, 'ms', '2026-02-26 13:00:00'),
(1, 'CPU_USAGE', 48.2, 'percent', '2026-02-26 13:00:00'),
(1, 'MEMORY_USAGE', 55.4, 'percent', '2026-02-26 13:00:00'),
(1, 'NETWORK_LATENCY', 12.0, 'ms', '2026-02-26 13:00:00');

-- 7. EXPAND ATTENDANCE LOGS
-- Scenario: Feb 26 session for Class 51 (Room 306)
-- Students 47, 57, and 58 attending
INSERT INTO attendance_logs (user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late) VALUES 
-- Student 47 (Rash Ian Sinag) -
(47, 51, 1, 'ENTRY', 'FACE', 0.88, NULL, '2026-02-26 08:58:10', NULL, FALSE),
(47, 51, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.81, 'PEACE_SIGN', '2026-02-26 10:15:30', NULL, FALSE),
(47, 51, 1, 'BREAK_IN', 'FACE+GESTURE', 0.84, 'THUMBS_UP', '2026-02-26 10:25:12', NULL, FALSE),
(47, 51, 1, 'EXIT', 'FACE+GESTURE', 0.92, 'OPEN_PALM', '2026-02-26 11:58:45', NULL, FALSE),

-- Student 57 (Nicholas Andrew Alcantara) - LATE
(57, 51, 1, 'ENTRY', 'FACE', 0.79, NULL, '2026-02-26 09:22:15', '[LATE by 22 min]', TRUE),
(57, 51, 1, 'EXIT', 'FACE+GESTURE', 0.85, 'OPEN_PALM', '2026-02-26 12:00:05', NULL, FALSE),

-- Student 58 (Andrea Mikaela Algara) -
(58, 51, 1, 'ENTRY', 'FACE', 0.91, NULL, '2026-02-26 08:55:40', NULL, FALSE),
(58, 51, 1, 'EXIT', 'FACE+GESTURE', 0.89, 'OPEN_PALM', '2026-02-26 12:05:20', NULL, FALSE);

COMMIT;

-- FRAMES Database Expansion & Simulation
-- Focus: Room 306 (Device ID: 1)
-- Purpose: Populate empty tables and expand attendance data
-- Date: 2026-02-26

BEGIN;

-- 1. ADD NEW SUBJECTS FOR ROOM 306
INSERT INTO subjects (id, code, title, units, created_at) VALUES 
(101, 'IT311-M', 'Mobile Application Development', 3, '2026-02-23 08:00:00'),
(102, 'IT312-M', 'Information Assurance and Security 2', 3, '2026-02-23 08:00:00'),
(103, 'IT313-M', 'Social and Professional Issues in IT', 2, '2026-02-23 08:00:00');

-- 2. CREATE NEW CLASSES FOR ROOM 306
-- Faculty: Maria Dela Cruz (2) and Anna Reyes (4)
INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, late_threshold_minutes, created_at) VALUES 
(50, 101, 2, 'Room 306', 'Monday', '13:00:00', '16:00:00', 'BSIT-3A-M', '2nd Semester', '2025-2026', 15, '2026-02-23 09:00:00'),
(51, 102, 4, 'Room 306', 'Thursday', '09:00:00', '12:00:00', 'BSIT-3A-M', '2nd Semester', '2025-2026', 15, '2026-02-23 09:00:00');

-- 3. AUTO-ENROLL BSIT-3A-M STUDENTS (IDs 57-66)
INSERT INTO enrollments (class_id, student_id, enrolled_at)
SELECT 50, id, '2026-02-23 10:00:00' FROM users WHERE id BETWEEN 57 AND 66;

INSERT INTO enrollments (class_id, student_id, enrolled_at)
SELECT 51, id, '2026-02-23 10:00:00' FROM users WHERE id BETWEEN 57 AND 66;

-- 4. SIMULATE SECURITY EVENTS (security_logs)
-- Scenario: An unrecognized face attempted to enter Room 306 today
INSERT INTO security_logs (device_id, event_type, confidence_score, room, details, timestamp) VALUES 
(1, 'UNRECOGNIZED_FACE', 0.28, 'Room 306', 'Unknown person detected at door; confidence below threshold.', '2026-02-26 08:45:12'),
(1, 'GESTURE_FAILURE', 0.45, 'Room 306', 'Student 47 failed Peace Sign gesture 3 times during BREAK_OUT.', '2026-02-26 14:30:05');

-- 5. SIMULATE AUDIT LOGS (audit_logs)
-- Tracking administrative actions
INSERT INTO audit_logs (user_id, action_type, target_table, target_id, old_value, new_value, ip_address, timestamp) VALUES 
(1, 'USER_VERIFY', 'users', 56, '{"verification_status": "REJECTED"}', '{"verification_status": "VERIFIED"}', '192.168.254.10', '2026-02-25 10:00:00'),
(2, 'SCHEDULE_UPLOAD', 'classes', 50, NULL, '{"subject": "IT311-M", "room": "306"}', '192.168.254.12', '2026-02-23 09:05:00');

-- 6. SIMULATE SYSTEM PERFORMANCE (system_metrics)
-- Data for health monitoring
INSERT INTO system_metrics (device_id, metric_type, value, unit, timestamp) VALUES 
(1, 'RECOGNITION_LATENCY', 142.5, 'ms', '2026-02-26 13:00:00'),
(1, 'CPU_USAGE', 48.2, 'percent', '2026-02-26 13:00:00'),
(1, 'MEMORY_USAGE', 55.4, 'percent', '2026-02-26 13:00:00'),
(1, 'NETWORK_LATENCY', 12.0, 'ms', '2026-02-26 13:00:00');

-- 7. EXPAND ATTENDANCE LOGS
-- Scenario: Feb 26 session for Class 51 (Room 306)
-- Students 47, 57, and 58 attending
INSERT INTO attendance_logs (user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late) VALUES 
-- Student 47 (Rash Ian Sinag) -
(47, 51, 1, 'ENTRY', 'FACE', 0.88, NULL, '2026-02-26 08:58:10', NULL, FALSE),
(47, 51, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.81, 'PEACE_SIGN', '2026-02-26 10:15:30', NULL, FALSE),
(47, 51, 1, 'BREAK_IN', 'FACE+GESTURE', 0.84, 'THUMBS_UP', '2026-02-26 10:25:12', NULL, FALSE),
(47, 51, 1, 'EXIT', 'FACE+GESTURE', 0.92, 'OPEN_PALM', '2026-02-26 11:58:45', NULL, FALSE),

-- Student 57 (Nicholas Andrew Alcantara) - LATE
(57, 51, 1, 'ENTRY', 'FACE', 0.79, NULL, '2026-02-26 09:22:15', '[LATE by 22 min]', TRUE),
(57, 51, 1, 'EXIT', 'FACE+GESTURE', 0.85, 'OPEN_PALM', '2026-02-26 12:00:05', NULL, FALSE),

-- Student 58 (Andrea Mikaela Algara) -
(58, 51, 1, 'ENTRY', 'FACE', 0.91, NULL, '2026-02-26 08:55:40', NULL, FALSE),
(58, 51, 1, 'EXIT', 'FACE+GESTURE', 0.89, 'OPEN_PALM', '2026-02-26 12:05:20', NULL, FALSE);

COMMIT;