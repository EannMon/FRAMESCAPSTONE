-- FRAMES Database Export
-- Generated on: 2026-02-26 17:46:37
-- Purpose: Complete database backup for restoration
-- Usage: psql -d your_database -f this_file.sql

BEGIN;
-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Data for attendance_logs
-- 27 records

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (1, 47, 3, 1, 'ENTRY', 'FACE', 0.7616581916809082, NULL, '2026-02-18 21:52:34', ' [LATE by 22 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (18, 47, 3, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7772762775421143, 'PEACE_SIGN', '2026-02-18 22:42:36', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (19, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7464088201522827, 'OPEN_PALM', '2026-02-18 22:43:17', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (20, 47, 3, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7772762775421143, 'PEACE_SIGN', '2026-02-18 22:42:36', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (21, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7464088201522827, 'OPEN_PALM', '2026-02-18 22:43:17', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (24, 47, 3, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7772762775421143, 'PEACE_SIGN', '2026-02-18 22:42:36', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (25, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7464088201522827, 'OPEN_PALM', '2026-02-18 22:43:17', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (33, 47, 3, 1, 'ENTRY', 'FACE', 0.6176788806915283, NULL, '2026-02-20 16:44:29', ' [LATE by 44 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (34, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7650923132896423, 'OPEN_PALM', '2026-02-20 16:44:48', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (35, 47, 3, 1, 'ENTRY', 'FACE', 0.6460152864456177, NULL, '2026-02-20 16:45:05', ' [LATE by 45 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (36, 47, 3, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.6215105056762695, 'PEACE_SIGN', '2026-02-20 16:46:00', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (37, 47, 3, 1, 'BREAK_IN', 'FACE+GESTURE', 0.7183650732040405, 'THUMBS_UP', '2026-02-20 16:46:50', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (38, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.695736289024353, 'OPEN_PALM', '2026-02-20 16:47:06', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (39, 47, 3, 1, 'ENTRY', 'FACE', 0.568548858165741, NULL, '2026-02-23 22:45:51', ' [LATE by 45 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (40, 47, 3, 1, 'ENTRY', 'FACE', 0.7670841217041016, NULL, '2026-02-24 00:01:32', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (41, 47, 3, 1, 'ENTRY', 'FACE', 0.7900104522705078, NULL, '2026-02-25 18:05:11', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (42, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7995676398277283, 'OPEN_PALM', '2026-02-25 18:26:44', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (43, 47, 3, 1, 'ENTRY', 'FACE', 0.8118503093719482, NULL, '2026-02-25 18:26:59', ' [LATE by 26 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (44, 47, 3, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7022098302841187, 'PEACE_SIGN', '2026-02-25 18:46:05', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (45, 47, 3, 1, 'BREAK_IN', 'FACE+GESTURE', 0.7726399898529053, 'THUMBS_UP', '2026-02-25 18:46:23', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (46, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7662106156349182, 'OPEN_PALM', '2026-02-25 18:46:41', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (47, 47, 3, 1, 'ENTRY', 'FACE', 0.5207818150520325, NULL, '2026-02-25 19:09:46', ' [LATE by 69 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (48, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7634803056716919, 'OPEN_PALM', '2026-02-25 19:11:00', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (49, 47, 3, 1, 'ENTRY', 'FACE', 0.660841166973114, NULL, '2026-02-25 19:16:35', ' [LATE by 76 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (50, 47, 3, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7910513877868652, 'PEACE_SIGN', '2026-02-25 19:17:24', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (51, 47, 3, 1, 'BREAK_IN', 'FACE+GESTURE', 0.7160851955413818, 'THUMBS_UP', '2026-02-25 19:19:22', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (52, 47, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7374211549758911, 'OPEN_PALM', '2026-02-25 19:19:43', NULL, FALSE);

-- No data found in audit_logs

-- Data for classes
-- 8 records

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (2, 2, 2, 'ONLINE', 'Wednesday', '18:00:00', '20:00:00', 'BSIT-2B-M', '1st Semester', '2024-2025', '2026-01-31 09:32:57', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (3, 2, 6, 'Room 306', 'Wednesday', '18:00:00', '20:30:00', 'BSIT-2B-M', '1st Semester', '2025-2026', '2026-01-31 09:37:54', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (12, 5, 5, 'TBA', 'Tuesday', '14:30:00', '16:00:00', 'BSIT-3A-M', '1st Semester', '2025-2026', '2026-02-07 11:54:27', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (13, 5, 5, 'TBA', 'Thursday', '14:30:00', '16:00:00', 'BSIT-3A-M', '1st Semester', '2025-2026', '2026-02-07 11:54:33', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (14, 6, 4, 'TBA', 'Thursday', '17:00:00', '20:00:00', 'BSIT-3A-M', '1st Semester', '2024-2025', '2026-02-08 05:14:21', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (15, 5, 4, 'TBA', 'Tuesday', '14:30:00', '16:00:00', 'BSIT-3A-M', '1st Semester', '2024-2025', '2026-02-08 05:15:17', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (16, 5, 4, 'TBA', 'Thursday', '14:30:00', '16:00:00', 'BSIT-3A-M', '1st Semester', '2024-2025', '2026-02-08 05:15:23', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (47, 39, 101, 'Room 302', 'Monday', '09:00:00', '12:00:00', 'TBA', NULL, NULL, '2026-02-15 06:44:04', 15);

-- Data for departments
-- 1 records

INSERT INTO departments (id, name, code, created_at)
VALUES (1, 'Computer Studies Department', 'CSD', '2026-01-31 07:55:11');

-- Data for devices
-- 1 records

INSERT INTO devices (id, room, ip_address, device_name, status, created_at, last_heartbeat, room_capacity)
VALUES (1, 'Room 306', '192.168.254.107', 'LAPTOP-Emmanuel-306', 'ACTIVE', '2026-02-18 13:08:15', NULL, 40);

-- Data for enrollments
-- 314 records

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (1, 2, 7, '2026-01-31 09:32:59');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (2, 2, 8, '2026-01-31 09:33:00');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (3, 2, 9, '2026-01-31 09:33:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (4, 2, 10, '2026-01-31 09:33:02');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (5, 2, 11, '2026-01-31 09:33:03');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (6, 2, 12, '2026-01-31 09:33:04');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (7, 2, 13, '2026-01-31 09:33:05');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (8, 2, 14, '2026-01-31 09:33:06');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (9, 2, 15, '2026-01-31 09:33:07');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (10, 2, 16, '2026-01-31 09:33:08');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (11, 2, 17, '2026-01-31 09:33:09');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (12, 2, 18, '2026-01-31 09:33:11');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (13, 2, 19, '2026-01-31 09:33:13');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (14, 2, 20, '2026-01-31 09:33:15');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (15, 2, 21, '2026-01-31 09:33:16');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (16, 2, 22, '2026-01-31 09:33:20');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (17, 2, 23, '2026-01-31 09:33:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (18, 2, 24, '2026-01-31 09:33:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (19, 2, 25, '2026-01-31 09:33:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (20, 2, 26, '2026-01-31 09:33:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (21, 2, 27, '2026-01-31 09:33:28');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (22, 2, 28, '2026-01-31 09:33:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (23, 2, 29, '2026-01-31 09:33:30');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (24, 2, 30, '2026-01-31 09:33:31');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (25, 2, 31, '2026-01-31 09:33:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (26, 2, 32, '2026-01-31 09:33:33');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (27, 2, 33, '2026-01-31 09:33:34');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (28, 2, 34, '2026-01-31 09:33:35');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (29, 2, 35, '2026-01-31 09:33:37');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (30, 2, 36, '2026-01-31 09:33:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (31, 2, 37, '2026-01-31 09:33:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (32, 2, 38, '2026-01-31 09:33:39');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (33, 2, 39, '2026-01-31 09:33:40');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (34, 2, 40, '2026-01-31 09:33:41');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (35, 2, 41, '2026-01-31 09:33:42');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (36, 2, 42, '2026-01-31 09:33:44');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (37, 2, 43, '2026-01-31 09:33:44');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (38, 2, 44, '2026-01-31 09:33:45');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (39, 2, 45, '2026-01-31 09:33:46');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (40, 2, 46, '2026-01-31 09:33:47');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (41, 2, 47, '2026-01-31 09:33:48');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (42, 2, 48, '2026-01-31 09:33:49');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (43, 2, 49, '2026-01-31 09:33:50');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (44, 2, 50, '2026-01-31 09:33:51');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (45, 2, 51, '2026-01-31 09:33:52');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (46, 2, 52, '2026-01-31 09:33:53');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (47, 2, 53, '2026-01-31 09:33:54');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (48, 2, 54, '2026-01-31 09:33:55');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (49, 2, 55, '2026-01-31 09:33:55');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (50, 3, 7, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (51, 3, 8, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (52, 3, 9, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (53, 3, 10, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (54, 3, 11, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (55, 3, 12, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (56, 3, 13, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (57, 3, 14, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (58, 3, 15, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (59, 3, 16, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (60, 3, 17, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (61, 3, 18, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (62, 3, 19, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (63, 3, 20, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (64, 3, 21, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (65, 3, 22, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (66, 3, 23, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (67, 3, 24, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (68, 3, 25, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (69, 3, 26, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (70, 3, 27, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (71, 3, 28, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (72, 3, 29, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (73, 3, 30, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (74, 3, 31, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (75, 3, 32, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (76, 3, 33, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (77, 3, 34, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (78, 3, 35, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (79, 3, 36, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (80, 3, 37, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (81, 3, 38, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (82, 3, 39, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (83, 3, 40, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (84, 3, 41, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (85, 3, 42, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (86, 3, 43, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (87, 3, 44, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (88, 3, 45, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (89, 3, 46, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (90, 3, 47, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (91, 3, 48, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (92, 3, 49, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (93, 3, 50, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (94, 3, 51, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (95, 3, 52, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (96, 3, 53, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (97, 3, 54, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (98, 3, 55, '2026-01-31 09:38:01');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (445, 12, 57, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (446, 12, 58, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (447, 12, 59, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (448, 12, 60, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (449, 12, 61, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (450, 12, 62, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (451, 12, 63, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (452, 12, 64, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (453, 12, 65, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (454, 12, 66, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (455, 12, 67, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (456, 12, 68, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (457, 12, 69, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (458, 12, 70, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (459, 12, 71, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (460, 12, 72, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (461, 12, 73, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (462, 12, 74, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (463, 12, 75, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (464, 12, 76, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (465, 12, 77, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (466, 12, 78, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (467, 12, 79, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (468, 12, 80, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (469, 12, 81, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (470, 12, 82, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (471, 12, 83, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (472, 12, 84, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (473, 12, 85, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (474, 12, 86, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (475, 12, 87, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (476, 12, 88, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (477, 12, 89, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (478, 12, 90, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (479, 12, 91, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (480, 12, 92, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (481, 12, 93, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (482, 12, 94, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (483, 12, 95, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (484, 12, 96, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (485, 12, 97, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (486, 12, 98, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (487, 12, 99, '2026-02-07 11:54:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (488, 13, 57, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (489, 13, 58, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (490, 13, 59, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (491, 13, 60, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (492, 13, 61, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (493, 13, 62, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (494, 13, 63, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (495, 13, 64, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (496, 13, 65, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (497, 13, 66, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (498, 13, 67, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (499, 13, 68, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (500, 13, 69, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (501, 13, 70, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (502, 13, 71, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (503, 13, 72, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (504, 13, 73, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (505, 13, 74, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (506, 13, 75, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (507, 13, 76, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (508, 13, 77, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (509, 13, 78, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (510, 13, 79, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (511, 13, 80, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (512, 13, 81, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (513, 13, 82, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (514, 13, 83, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (515, 13, 84, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (516, 13, 85, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (517, 13, 86, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (518, 13, 87, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (519, 13, 88, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (520, 13, 89, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (521, 13, 90, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (522, 13, 91, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (523, 13, 92, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (524, 13, 93, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (525, 13, 94, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (526, 13, 95, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (527, 13, 96, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (528, 13, 97, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (529, 13, 98, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (530, 13, 99, '2026-02-07 11:54:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (531, 14, 57, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (532, 14, 58, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (533, 14, 59, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (534, 14, 60, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (535, 14, 61, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (536, 14, 62, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (537, 14, 63, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (538, 14, 64, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (539, 14, 65, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (540, 14, 66, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (541, 14, 67, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (542, 14, 68, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (543, 14, 69, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (544, 14, 70, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (545, 14, 71, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (546, 14, 72, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (547, 14, 73, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (548, 14, 100, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (549, 14, 74, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (550, 14, 75, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (551, 14, 76, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (552, 14, 77, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (553, 14, 78, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (554, 14, 79, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (555, 14, 80, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (556, 14, 81, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (557, 14, 82, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (558, 14, 83, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (559, 14, 84, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (560, 14, 85, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (561, 14, 86, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (562, 14, 87, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (563, 14, 88, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (564, 14, 89, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (565, 14, 90, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (566, 14, 91, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (567, 14, 92, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (568, 14, 93, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (569, 14, 94, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (570, 14, 95, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (571, 14, 96, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (572, 14, 97, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (573, 14, 98, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (574, 14, 99, '2026-02-08 05:14:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (575, 15, 57, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (576, 15, 58, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (577, 15, 59, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (578, 15, 60, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (579, 15, 61, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (580, 15, 62, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (581, 15, 63, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (582, 15, 64, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (583, 15, 65, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (584, 15, 66, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (585, 15, 67, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (586, 15, 68, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (587, 15, 69, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (588, 15, 70, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (589, 15, 71, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (590, 15, 72, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (591, 15, 73, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (592, 15, 74, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (593, 15, 75, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (594, 15, 76, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (595, 15, 77, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (596, 15, 78, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (597, 15, 79, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (598, 15, 80, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (599, 15, 81, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (600, 15, 82, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (601, 15, 83, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (602, 15, 84, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (603, 15, 85, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (604, 15, 86, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (605, 15, 87, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (606, 15, 88, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (607, 15, 89, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (608, 15, 90, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (609, 15, 91, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (610, 15, 92, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (611, 15, 93, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (612, 15, 94, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (613, 15, 95, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (614, 15, 96, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (615, 15, 97, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (616, 15, 98, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (617, 15, 99, '2026-02-08 05:15:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (618, 16, 57, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (619, 16, 58, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (620, 16, 59, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (621, 16, 60, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (622, 16, 61, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (623, 16, 62, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (624, 16, 63, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (625, 16, 64, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (626, 16, 65, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (627, 16, 66, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (628, 16, 67, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (629, 16, 68, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (630, 16, 69, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (631, 16, 70, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (632, 16, 71, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (633, 16, 72, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (634, 16, 73, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (635, 16, 74, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (636, 16, 75, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (637, 16, 76, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (638, 16, 77, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (639, 16, 78, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (640, 16, 79, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (641, 16, 80, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (642, 16, 81, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (643, 16, 82, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (644, 16, 83, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (645, 16, 84, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (646, 16, 85, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (647, 16, 86, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (648, 16, 87, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (649, 16, 88, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (650, 16, 89, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (651, 16, 90, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (652, 16, 91, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (653, 16, 92, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (654, 16, 93, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (655, 16, 94, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (656, 16, 95, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (657, 16, 96, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (658, 16, 97, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (659, 16, 98, '2026-02-08 05:15:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (660, 16, 99, '2026-02-08 05:15:29');

-- Data for facial_profiles
-- 8 records

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (2, 47, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-01 03:55:24', '2026-02-01 03:55:24', 15, 0.7445927858352661);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (3, 5, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-02 15:52:10', '2026-02-02 15:52:10', 15, 0.8428620219230651);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (4, 7, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-03 02:18:31', '2026-02-03 02:18:31', 15, 0.8769676367441813);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (5, 10, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-03 09:16:56', '2026-02-03 09:16:56', 15, 0.8315791249275207);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (6, 6, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-04 07:09:12', '2026-02-04 07:09:12', 15, 0.5905117392539978);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (7, 13, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-04 17:52:10', '2026-02-04 17:52:10', 15, 0.8171722292900085);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (8, 21, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-07 11:35:18', '2026-02-07 11:35:18', 1, 0.5018830895423889);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (9, 4, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-08 03:02:31', '2026-02-08 03:02:31', 15, 0.8156909942626953);

-- Data for programs
-- 3 records

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (1, 1, 'Bachelor of Science in Information Technology', 'BSIT', '2026-01-31 07:55:11');

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (2, 1, 'Bachelor of Science in Information Systems', 'BSIS', '2026-01-31 07:55:11');

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (3, 1, 'Bachelor of Science in Computer Science', 'BSCS', '2026-01-31 07:55:11');

-- No data found in security_logs

-- Data for session_exceptions
-- 2 records

INSERT INTO session_exceptions (id, class_id, session_date, exception_type, reason, created_by, created_at)
VALUES (1, 12, '2026-02-03', 'ONLINE', 'Natural Disaster', NULL, '2026-02-07 12:16:58');

INSERT INTO session_exceptions (id, class_id, session_date, exception_type, reason, created_by, created_at)
VALUES (2, 15, '2026-02-03', 'CANCELLED', 'Holiday', NULL, '2026-02-08 05:16:16');

-- Data for subjects
-- 4 records

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (2, 'IT232-M', 'IT232-M - Computer Architecture and Organization, Lec Venue : ONLINE', 2, '2026-01-31 09:32:57');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (5, 'IT303-M', 'Systems Integration and Architecture 1', 2, '2026-02-07 11:54:26');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (6, 'CC303-M', 'Methods of Research in Computing', 2, '2026-02-08 05:14:20');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (39, 'IT KEME', 'Kineme', 3, '2026-02-15 06:43:53');

-- No data found in system_metrics

-- Data for users
-- 102 records

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (1, 'head.santos@tup.edu.ph', '$2b$12$KoD9p9e7vL5H15LwZg9xfeN8P2SCTnO9iU5CCKwnX5jJECAvQGbCi', 'TUPM-20-0001', 'HEAD', 'VERIFIED', FALSE, 'Ricardo', 'Santos', 'Cruz', 1, NULL, NULL, NULL, '2026-01-31 07:55:12', '2026-02-01 03:36:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (2, 'maria.dela_cruz@tup.edu.ph', '$2b$12$5T6FdqrsikKkTyRuOga5H.377pGemYbj2/.8mXnOe3NVRp4Xt3Kgq', 'TUPM-21-0101', 'FACULTY', 'VERIFIED', FALSE, 'Maria', 'Dela Cruz', 'Reyes', 1, 1, NULL, NULL, '2026-01-31 07:55:12', '2026-01-31 07:55:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (3, 'juan.garcia@tup.edu.ph', '$2b$12$m079AQoFWvVqCUvEZpOVnO9CjNqOk403JWbcQYQdNvI805i500xXq', 'TUPM-21-0102', 'FACULTY', 'VERIFIED', FALSE, 'Juan', 'Garcia', 'Lopez', 1, 2, NULL, NULL, '2026-01-31 07:55:13', '2026-01-31 07:55:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (4, 'anna.reyes@tup.edu.ph', '$2b$12$vMtutd/4enjrc1wxpS75LO1zfkmiWLautCGgWDiB95/WORxKGLrEG', 'TUPM-21-0103', 'FACULTY', 'VERIFIED', TRUE, 'Anna', 'Reyes', 'Bautista', 1, 3, NULL, NULL, '2026-01-31 07:55:13', '2026-01-31 07:55:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (5, 'pedro.mendoza@tup.edu.ph', '$2b$12$sEm7Y4qkA260ToZOj8G4bO8NVSw4aUpRvITC8GhFmD3gFrGsWodO2', 'TUPM-21-0104', 'FACULTY', 'VERIFIED', TRUE, 'Pedro', 'Mendoza', 'Torres', 1, 1, NULL, NULL, '2026-01-31 07:55:14', '2026-01-31 07:55:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (6, 'elena.fernandez@tup.edu.ph', '$2b$12$9QKXbEorcKSmMDSzOOVPd.T8PHvN3Jf28YjI1xq/WEdLtdAKt.Vy6', 'TUPM-21-0105', 'FACULTY', 'VERIFIED', TRUE, 'Elena', 'Fernandez', 'Castro', 1, 3, NULL, NULL, '2026-01-31 07:55:14', '2026-01-31 07:55:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (7, 'tupm-24-1591@tup.edu.ph', '$2b$12$pk9.AAWUro1zHKqW194IQ.kIeb.jZWKDFR0HCdQ3cLJBB82dgXpp.', 'TUPM-24-1591', 'STUDENT', 'VERIFIED', TRUE, 'ANDEE OBANG', 'ACOSTA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:32:58', '2026-01-31 09:32:58', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (8, 'tupm-24-1951@tup.edu.ph', '$2b$12$phLDpP156IGrOowlA6lENedFy5vVV0RxWuMpCmYYtPElSMsIaEgCC', 'TUPM-24-1951', 'STUDENT', 'VERIFIED', FALSE, 'JHON KENNETH NARISMA', 'AGUINALDO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:32:59', '2026-01-31 09:32:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (9, 'tupm-24-6176@tup.edu.ph', '$2b$12$LX6RTlbXjHBhPbDb7/RVpOgRxAAFRkwpQNoqBS2B6jsV53zKA1762', 'TUPM-24-6176', 'STUDENT', 'VERIFIED', FALSE, 'RANDY JR. MORALES', 'ALONZO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:00', '2026-01-31 09:33:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (10, 'tupm-24-1760@tup.edu.ph', '$2b$12$/cEyP3BacMG44T5DNic1I.HPLif8wnpVbFyAtr04GAaKSIOz/FtFa', 'TUPM-24-1760', 'STUDENT', 'VERIFIED', TRUE, 'MARK LAWRENCE ANGELO MASIGLAT', 'AVILES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:01', '2026-01-31 09:33:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (11, 'tupm-24-1609@tup.edu.ph', '$2b$12$pOPqr7CIhWf5ja81fRNOt.T7tV/zUE3WrhW.UVbgkk9tHKum9XOM2', 'TUPM-24-1609', 'STUDENT', 'VERIFIED', FALSE, 'SIMON REODAVA', 'BERNARDO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:02', '2026-01-31 09:33:02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (12, 'tupm-24-1960@tup.edu.ph', '$2b$12$RQTHn/JCjT4uGXbqwlBdE.ZJ3wBkFOfHIzv.1zmEQbLMlWrs.ND1C', 'TUPM-24-1960', 'STUDENT', 'VERIFIED', FALSE, 'ASHLEY KIM GUANSING', 'BURDEOS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:03', '2026-01-31 09:33:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (13, 'tupm-24-1796@tup.edu.ph', '$2b$12$ZrtCm2UJUTIJ0fAeJVXsVOjjXRmz.hVIl8zWUanW/asIIMgB9AIlS', 'TUPM-24-1796', 'STUDENT', 'VERIFIED', TRUE, 'ANJIE MARK ACOSTA', 'CAPLES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:04', '2026-01-31 09:33:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (14, 'tupm-24-1724@tup.edu.ph', '$2b$12$JykliOjwoBIepKc8.0K1BOZJG08PX7ItcsFtIyo33Kayq/KzG8.jS', 'TUPM-24-1724', 'STUDENT', 'VERIFIED', FALSE, 'BRENT LUWI ESPIRITU', 'CASAS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:05', '2026-01-31 09:33:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (15, 'tupm-24-1685@tup.edu.ph', '$2b$12$vj58KFU4GdZDh1ipoZrZUugpUF.0YryrX/oBscXPgDoBKpRdbW5j2', 'TUPM-24-1685', 'STUDENT', 'VERIFIED', FALSE, 'VETINA GENE GILHANG', 'CLAVATON', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:06', '2026-01-31 09:33:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (16, 'tupm-24-1668@tup.edu.ph', '$2b$12$Xo/RS3tgh/aDWJjCANRHN.Y7HqcIOHpQ4Q7yaIhFtunKbS/1xpONO', 'TUPM-24-1668', 'STUDENT', 'VERIFIED', FALSE, 'MIKAELA DEGRAN', 'COQUILLA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:07', '2026-01-31 09:33:07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (17, 'tupm-24-1605@tup.edu.ph', '$2b$12$xaV/3w5Fh1TxwTNa/dRKouHu/naaxFbDA4MwbcpLerflyB9HOfZFW', 'TUPM-24-1605', 'STUDENT', 'VERIFIED', FALSE, 'ROSHNY JEN LLAVORE', 'CRUZ', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:08', '2026-01-31 09:33:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (18, 'tupm-24-1686@tup.edu.ph', '$2b$12$SVbZMtfB3UuVjovslrMJm.ctCMJzf2TW1XlaVUTjElmHQmlctCaJK', 'TUPM-24-1686', 'STUDENT', 'VERIFIED', FALSE, 'KRIZZA ANGEL CAMPO', 'DELA CRUZ', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:09', '2026-01-31 09:33:09', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (19, 'tupm-24-1677@tup.edu.ph', '$2b$12$geQEactrcNKDSgqaCcwyUu9Qvt9wGIL7K9iGp4NZJoQuh4NkdTaUi', 'TUPM-24-1677', 'STUDENT', 'VERIFIED', FALSE, 'JOVIELYN NESORTADO', 'EGUILLOS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:10', '2026-01-31 09:33:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (20, 'tupm-24-1710@tup.edu.ph', '$2b$12$QgXojMPyIvQwLZ7UIxMcveM/J5Ib37K0XKf32bHWjlNBtPPxY893a', 'TUPM-24-1710', 'STUDENT', 'VERIFIED', FALSE, 'LESTER MEANO', 'ESTAREJA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:13', '2026-01-31 09:33:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (21, 'tupm-24-1766@tup.edu.ph', '$2b$12$UJPIM6lB1BUhd0XEehouqu28k8FHAk2QFzm4dqypo/gByS.6/U.L6', 'TUPM-24-1766', 'STUDENT', 'VERIFIED', TRUE, 'MARK LORENZ GUDES', 'ETANG', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:14', '2026-01-31 09:33:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (22, 'tupm-24-1583@tup.edu.ph', '$2b$12$qfaqQ0qkPHnpXZlAnjM6GuWolLqSvnXcz3BL3q6UV8Vp.md1wFNre', 'TUPM-24-1583', 'STUDENT', 'VERIFIED', FALSE, 'JOHN JHERVY GUTIERREZ', 'EUSEBIO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:16', '2026-01-31 09:33:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (23, 'tupm-24-1776@tup.edu.ph', '$2b$12$7hg2ajaU5IMk0/AYiOMPaOXPmca3RaCECQJkrDjpSK9WMYelbLsni', 'TUPM-24-1776', 'STUDENT', 'VERIFIED', FALSE, 'BEYONCE KELLY VILLARAZA', 'FAJARDO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:20', '2026-01-31 09:33:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (24, 'tupm-24-1597@tup.edu.ph', '$2b$12$OL2JJKXk49/mRYm6oslz7uPWi3JeoyIGNJXaZOhHA5kVKkc6hazRu', 'TUPM-24-1597', 'STUDENT', 'VERIFIED', FALSE, 'FRANCIS VICTOR BAÑARES', 'FROA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:21', '2026-01-31 09:33:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (25, 'tupm-24-1596@tup.edu.ph', '$2b$12$X8YeFJfn2xWA5hn.41.PFOQgXmf6X9VNmDxjqrzSyMvF02zVoCIiG', 'TUPM-24-1596', 'STUDENT', 'VERIFIED', FALSE, 'JHON RYAN SAMONTEZA', 'FULLO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:24', '2026-01-31 09:33:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (26, 'tupm-24-1717@tup.edu.ph', '$2b$12$b5HYrP4ON9/asLQbiOW1FuAwQzivQMx.k6lAQtpW6fCGr6LjPJONO', 'TUPM-24-1717', 'STUDENT', 'VERIFIED', FALSE, 'RENZ MARRION DELA ROSA', 'LABRADOR', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:25', '2026-01-31 09:33:25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (27, 'tupm-24-1794@tup.edu.ph', '$2b$12$euphNpWsyHD4kHapM8HQOeiBHcotVWCZcZ.esNxrWv8H5yQo6HbJy', 'TUPM-24-1794', 'STUDENT', 'VERIFIED', FALSE, 'MARK KEVIN BRIONES', 'LACSON', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:27', '2026-01-31 09:33:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (28, 'tupm-24-1610@tup.edu.ph', '$2b$12$Qi/kOS4pnO0TlCWnLObE3OAOMiCgxxWyuo8Jzs7J6aNGAblfHiQNy', 'TUPM-24-1610', 'STUDENT', 'VERIFIED', FALSE, 'CARL ADRIANNE IGNACIO', 'LASCANO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:28', '2026-01-31 09:33:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (29, 'tupm-24-1719@tup.edu.ph', '$2b$12$KlIb0F7WkjnngRdeWEcEeO3HUHXFqdHYSWtly3zU9wGJQ3coxz50e', 'TUPM-24-1719', 'STUDENT', 'VERIFIED', FALSE, 'REX JEMAR BERNAL', 'LATAYADA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:29', '2026-01-31 09:33:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (30, 'tupm-24-1678@tup.edu.ph', '$2b$12$rWtuyM/Z9xvtBE5syHZ8vO4edl6h5T8Q6O.w6J0BseeKkpn6ffwvO', 'TUPM-24-1678', 'STUDENT', 'VERIFIED', FALSE, 'LIANNE PRINCESS PRUCIA', 'LERIOS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:30', '2026-01-31 09:33:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (31, 'tupm-24-2181@tup.edu.ph', '$2b$12$BuQ4PykJmSoNlBkTE1091OkSHNoJLvBx6kzkGyK2dfKrrWGegx2Si', 'TUPM-24-2181', 'STUDENT', 'VERIFIED', FALSE, 'MARK CHRISTIAN LIMBO', 'LUCTO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:31', '2026-01-31 09:33:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (32, 'tupm-24-2293@tup.edu.ph', '$2b$12$eiYGCrnpmbDhFtjs1va53OIvbzz1yhDoW7TuObn8GMZoaSz4UF6aK', 'TUPM-24-2293', 'STUDENT', 'VERIFIED', FALSE, 'LAWRENCE INES', 'MADERA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:32', '2026-01-31 09:33:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (33, 'tupm-24-1680@tup.edu.ph', '$2b$12$iuldnfMaWOM7Z97X7FXwJe6w8YIJDDMcoZ19pqbah8LG3YWlIqAUC', 'TUPM-24-1680', 'STUDENT', 'VERIFIED', FALSE, 'KENT MICHAEL LEOJ PELIGRO', 'MALINAO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:33', '2026-01-31 09:33:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (34, 'tupm-24-1773@tup.edu.ph', '$2b$12$2meiVJZPbJDdbb21Te92vu202M1QZR/uf.lzRxkR6UXTW9vx5d6nG', 'TUPM-24-1773', 'STUDENT', 'VERIFIED', FALSE, 'JOHN RAIVEN JAÑOZO', 'MANDRAS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:34', '2026-01-31 09:33:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (35, 'tupm-24-1601@tup.edu.ph', '$2b$12$H54rvGCtR.FnRKmh8ozoCuLC1mw1YDkBzQQKMGmoAT9aTaMlYvHH.', 'TUPM-24-1601', 'STUDENT', 'VERIFIED', FALSE, 'ALDRED CABIQUE', 'MIQUE', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:35', '2026-01-31 09:33:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (36, 'tupm-24-1775@tup.edu.ph', '$2b$12$FFn2fA2nb1xAwTKJu62g8OvtKBHyVmtUCObfUPVLZX3bN/Ic14vKa', 'TUPM-24-1775', 'STUDENT', 'VERIFIED', FALSE, 'RAINIEL ESPINA', 'NAVA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:36', '2026-01-31 09:33:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (37, 'tupm-24-1784@tup.edu.ph', '$2b$12$gm4khk7yNgU0o1yqaB.ceOcUiHHSsjqm0aLblEhdN9YrZDW3qrS1S', 'TUPM-24-1784', 'STUDENT', 'VERIFIED', FALSE, 'JANEL LABANON', 'NUNGAY', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:37', '2026-01-31 09:33:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (38, 'tupm-24-1718@tup.edu.ph', '$2b$12$crAe/09PkFSvCV/JUbhMRukxC4FXdUz0d9UiHQ90HNC6ogTejlO7G', 'TUPM-24-1718', 'STUDENT', 'VERIFIED', FALSE, 'JEFFERSON', 'PADUA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:38', '2026-01-31 09:33:38', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (39, 'tupm-24-1799@tup.edu.ph', '$2b$12$4OJznZd94mRQCzuh95MQIuVzDZG/dRfccjgrngSgCcgPQOI34JonG', 'TUPM-24-1799', 'STUDENT', 'VERIFIED', FALSE, 'JULIE ANN SALAZAR', 'PALMIANO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:39', '2026-01-31 09:33:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (40, 'tupm-24-1684@tup.edu.ph', '$2b$12$VbT0/8Z4ZirX.pb2bDimn.7QR567H1UzBDBAbyi84UcMiTQMnZf7q', 'TUPM-24-1684', 'STUDENT', 'VERIFIED', FALSE, 'MATTHEW GEM INOLINO', 'PATDU', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:40', '2026-01-31 09:33:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (41, 'tupm-24-1722@tup.edu.ph', '$2b$12$8VQxwfV0OgzsQ48Ul2e87.IUKCOvkKq8HnCSMPiv1H3h5fph0GW5C', 'TUPM-24-1722', 'STUDENT', 'VERIFIED', FALSE, 'KHINITO CHRISTIAN CORTEZ', 'PEñAMANTE', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:41', '2026-01-31 09:33:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (42, 'tupm-24-1627@tup.edu.ph', '$2b$12$EhrJymfLMoXod9Sz9fFaH.j2eSlsyhfXJzEjbqfI1R20O3c6pu2.G', 'TUPM-24-1627', 'STUDENT', 'VERIFIED', FALSE, 'HANNAH MAERYL PEREZ', 'PERRARO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:42', '2026-01-31 09:33:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (43, 'tupm-24-1727@tup.edu.ph', '$2b$12$ys2J4ph9KsTlE4Kt9U72j.nf9WVedF9aIBCcwoQt.froBsxVyY14e', 'TUPM-24-1727', 'STUDENT', 'VERIFIED', FALSE, 'ELLYZA MAY VARIAS', 'REYES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:43', '2026-01-31 09:33:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (44, 'tupm-24-1608@tup.edu.ph', '$2b$12$VwYr2WOMinRpkvHnxMJ7OeFdgGlRCWDU7aC53RRN5y4KpU2gwCQYa', 'TUPM-24-1608', 'STUDENT', 'VERIFIED', FALSE, 'JOHN NOVYMHIER SANTIAGO', 'ROSALES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:44', '2026-01-31 09:33:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (45, 'tupm-24-1753@tup.edu.ph', '$2b$12$mQK5thB3d0DkV0oFOFmapuysF7lNzOSIjdu1WQBqvtXkhoN9NbDVK', 'TUPM-24-1753', 'STUDENT', 'VERIFIED', FALSE, 'JOSIAH BARCELONA', 'SANDAJAN', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:45', '2026-01-31 09:33:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (46, 'tupm-24-1723@tup.edu.ph', '$2b$12$za4j1brJSn8e61dMM95YvO5u1DPgYzGagMiJ7lwLMmsZA0OIPHjUK', 'TUPM-24-1723', 'STUDENT', 'VERIFIED', FALSE, 'JOHN GABRIEL RAMOS', 'SIA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:46', '2026-01-31 09:33:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (47, 'tupm-24-1757@tup.edu.ph', '$2b$12$OHaqAiurIlhZzo7Kr2DvCu8j5XyT3gg4duHsOwociRRNYq80mY.3m', 'TUPM-24-1757', 'STUDENT', 'VERIFIED', TRUE, 'RASH IAN BEATRIZOLA', 'SINAG', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:47', '2026-01-31 09:33:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (48, 'tupm-24-1614@tup.edu.ph', '$2b$12$YWMr2/8UMqIRP7t3Q1TFwOhhQhauez4pqW4t0GTgVXC6pzs29InXS', 'TUPM-24-1614', 'STUDENT', 'VERIFIED', FALSE, 'GERARDO BURGOS', 'SISON', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:48', '2026-01-31 09:33:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (49, 'tupm-24-1623@tup.edu.ph', '$2b$12$aPQrKrQHaG4WX5xxrbgkJ.O.KYE52rQICNvQ.mwS3/QpY8NIXp5Mq', 'TUPM-24-1623', 'STUDENT', 'VERIFIED', FALSE, 'JANNA MARIE VILLANUEVA', 'TAHUM', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:49', '2026-01-31 09:33:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (50, 'tupm-24-1798@tup.edu.ph', '$2b$12$SUFvbwYYFRzFXVoxU0/hb.MKPPPGOib3Vz4TrT5I74p4AT1zEQkAa', 'TUPM-24-1798', 'STUDENT', 'VERIFIED', FALSE, 'JAIMEE KELLY DAVID', 'TORCELINO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:50', '2026-01-31 09:33:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (51, 'tupm-24-1762@tup.edu.ph', '$2b$12$fWwzmpfXH7jOo10BIj6FK.yYHmctgHlMc005X2Nma.U6D6EZdKyUW', 'TUPM-24-1762', 'STUDENT', 'VERIFIED', FALSE, 'ARRIANI JENN BALDAH', 'UNATING', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:51', '2026-01-31 09:33:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (52, 'tupm-24-2161@tup.edu.ph', '$2b$12$lFFfj7f48skFrwsTSSEMTONDMxXoP3b7qp5evOUmJSoaEqPoYm2qS', 'TUPM-24-2161', 'STUDENT', 'VERIFIED', FALSE, 'KESHENNA IYELLE PABILLORE', 'VALERIO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:52', '2026-01-31 09:33:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (53, 'tupm-24-1720@tup.edu.ph', '$2b$12$.1E/D.V2DFfsur8NRPIbeOylair3BUNpmWPMXdf6KSA7kzJ33yT/W', 'TUPM-24-1720', 'STUDENT', 'VERIFIED', FALSE, 'STEVEN VALDEZ', 'VALEROSO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:53', '2026-01-31 09:33:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (54, 'tupm-24-1687@tup.edu.ph', '$2b$12$qiEW2G6zdH/Mo3Kdt5EG3.e1c4HlNX3w8ZIlKecMDJqlLrbpV59Uy', 'TUPM-24-1687', 'STUDENT', 'VERIFIED', FALSE, 'LUKE DWYANE RAMIREZ', 'VIDAMO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:54', '2026-01-31 09:33:54', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (55, 'tupm-24-1602@tup.edu.ph', '$2b$12$oTZBRQDCRVG4g9H3RrQu.e7t5DTCq.buOTOOKD2rj7.Ghw6q02KRa', 'TUPM-24-1602', 'STUDENT', 'VERIFIED', FALSE, 'ALEXIS ALONZO', 'VILLANUEVA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:55', '2026-01-31 09:33:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (56, 'elena.llana@tup.edu.ph', '$2b$12$npMfFqNwYQNrkvJJJ7vFMuPOgIblAb4Rl1VFwkqWc34.yUnqBv3/K', 'TUPM-22-0368', 'STUDENT', 'REJECTED', FALSE, 'Elana', 'Llana', 'Juan', NULL, NULL, NULL, NULL, '2026-02-05 03:04:24', '2026-02-15 06:57:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (57, 'tupm-23-2190@tup.edu.ph', '$2b$12$rKxQ6znOpXIyTwkrsOILxelYDWBe038iB2IRv2y/h9aYbwbv/Nfba', 'TUPM-23-2190', 'STUDENT', 'VERIFIED', FALSE, 'NICHOLAS ANDREW LEONARDO', 'ALCANTARA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:04', '2026-02-07 08:07:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (58, 'tupm-23-2133@tup.edu.ph', '$2b$12$swr5q1JbdCBaWEoz16WUOO9uHbytVXXrskd/19PmCAfQx9k9ARV/i', 'TUPM-23-2133', 'STUDENT', 'VERIFIED', FALSE, 'ANDREA MIKAELA AMAGSILA', 'ALGARA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:05', '2026-02-07 08:07:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (59, 'tupm-23-2253@tup.edu.ph', '$2b$12$d1ySULkFQ5TyBJcp2xKyw.6jm9BWzA8ITxot5s92AWJ3qDLZzjAMq', 'TUPM-23-2253', 'STUDENT', 'VERIFIED', FALSE, 'VIA YSABELLE BUTIN', 'ALMARIO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:06', '2026-02-07 08:07:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (60, 'tupm-23-1600@tup.edu.ph', '$2b$12$h8JCf8Kjgb3rYbhuIdaMgeZStt7ZGbNFm0a0w1T81SV7pSiaH5/Mm', 'TUPM-23-1600', 'STUDENT', 'VERIFIED', FALSE, 'RANDEL THOMAS OLIVEROS', 'BABAO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:07', '2026-02-07 08:07:07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (61, 'tupm-23-2120@tup.edu.ph', '$2b$12$YSzj9.UwXF4xoo0PfvCnQev8nu0uTewG8qavvmXRSMHEZTq20qJnK', 'TUPM-23-2120', 'STUDENT', 'VERIFIED', FALSE, 'JIREH GEUEL F.', 'BERNARDINO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:08', '2026-02-07 08:07:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (62, 'tupm-23-1715@tup.edu.ph', '$2b$12$flaRuSzi6NxaSdpJrsHs/uokzT/lnuRdPdXgwuPflR4EXz9r3kyg2', 'TUPM-23-1715', 'STUDENT', 'VERIFIED', FALSE, 'JUAN MIGUEL DIAMSAY', 'CAMPOMANES', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:10', '2026-02-07 08:07:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (63, 'tupm-23-1657@tup.edu.ph', '$2b$12$D3rBuLPtgLagxVprurAab.FhEFiC/CzDVAOOVJPttSVAPiVMDb3fW', 'TUPM-23-1657', 'STUDENT', 'VERIFIED', FALSE, 'TRISTAN JHON REYES', 'CAPUYAN', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:11', '2026-02-07 08:07:11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (64, 'tupm-23-2173@tup.edu.ph', '$2b$12$fRm3Bo90.QkrcNJZrRHILux6oSGJghlu7bJ9UMnU/JGl0MlRwEz3u', 'TUPM-23-2173', 'STUDENT', 'VERIFIED', FALSE, 'JAY LAWRENCE CAJANDING', 'CERNIAZ', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:13', '2026-02-07 08:07:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (65, 'tupm-23-2126@tup.edu.ph', '$2b$12$EQYGuJhGC9235h0M8ejvhO6V28RnjThVY1wRBycXuELWxMV6KFa7u', 'TUPM-23-2126', 'STUDENT', 'VERIFIED', FALSE, 'GLADYS GAIL STA. MARIA', 'COCHING', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:14', '2026-02-07 08:07:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (66, 'tupm-23-2214@tup.edu.ph', '$2b$12$b63lRXAk6CFHQAHZN8nExusOBCJwXJoKi8HAbKkgcEKyG9hLM9i.y', 'TUPM-23-2214', 'STUDENT', 'VERIFIED', FALSE, 'KOBE LUIS ILUIS', 'CUISON', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:15', '2026-02-07 08:07:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (67, 'tupm-23-2165@tup.edu.ph', '$2b$12$8PPEzUxmUIF4Cn8n7j39SObJegQ3O0ld9rFXoBeWVciPeaJWQP7qq', 'TUPM-23-2165', 'STUDENT', 'VERIFIED', FALSE, 'NERO ARBERT DADIS', 'DE PAZ', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:16', '2026-02-07 08:07:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (68, 'tupm-23-2101@tup.edu.ph', '$2b$12$jz4X3pbS3BmHq1x4ONuOWObmMHkhh088yJMYAI4h0tD0WjcW8LCe6', 'TUPM-23-2101', 'STUDENT', 'VERIFIED', FALSE, 'JOHN CEDRICK BALDEO', 'DELACORTA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:17', '2026-02-07 08:07:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (69, 'tupm-23-2326@tup.edu.ph', '$2b$12$5Zj2aF35t9UoLInxqC4/T.Cpil93GCkywwBCfEgz3ZQpscNZdO0gC', 'TUPM-23-2326', 'STUDENT', 'VERIFIED', FALSE, 'RALPH MICHAEL NIETO', 'EVANGELISTA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:18', '2026-02-07 08:07:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (70, 'tupm-23-2105@tup.edu.ph', '$2b$12$qJr259KC1gcQRStf9VYcdumehpX.15K00qm1Qu9JmK2hxbCDoeoyK', 'TUPM-23-2105', 'STUDENT', 'VERIFIED', FALSE, 'JUSTINE CARL QUIDILIG', 'FABIAN', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:19', '2026-02-07 08:07:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (71, 'tupm-23-2182@tup.edu.ph', '$2b$12$LFoVgVD4ETCxZKNbvtYkVuoQ7jnYr.ngY//pOqp0U3PlFk42xW0YG', 'TUPM-23-2182', 'STUDENT', 'VERIFIED', FALSE, 'ANNE JANELLE PERALTA', 'FRONDA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:20', '2026-02-07 08:07:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (72, 'tupm-23-2055@tup.edu.ph', '$2b$12$ovVVHq3V5mJAyWNgnQWUm./426qHajDdcLBvLG3W.vuSp/qoVyOiW', 'TUPM-23-2055', 'STUDENT', 'VERIFIED', FALSE, 'ARKIN PHOENIX DE GUZMAN', 'JAROMAMAY', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:21', '2026-02-07 08:07:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (73, 'tupm-23-2205@tup.edu.ph', '$2b$12$y1WLXhOh6.tyk2msWk51RuzkTbG8gSN9cHO6TWZwkDQepuZCmIXt6', 'TUPM-23-2205', 'STUDENT', 'VERIFIED', FALSE, 'ZEINT JUSTINE BARANDON', 'LACRA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:22', '2026-02-07 08:07:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (74, 'tupm-23-2082@tup.edu.ph', '$2b$12$0TRFweWphQKEBT1Edggf3eOZyB10aYL65wvXoc1DU5EncVZGIztDm', 'TUPM-23-2082', 'STUDENT', 'VERIFIED', FALSE, 'ALTHEA MARIE SANTOS', 'LAURENTE', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:23', '2026-02-07 08:07:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (75, 'tupm-23-2131@tup.edu.ph', '$2b$12$wxIyjyP85zD3Ot0clQ.GM.N3A/hb687ZQK5MM2bfkMF.BFlpJELTG', 'TUPM-23-2131', 'STUDENT', 'VERIFIED', FALSE, 'IAN LESTER DIÑO', 'LESIGUES', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:25', '2026-02-07 08:07:25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (76, 'tupm-23-2049@tup.edu.ph', '$2b$12$zvR6vlULgxSCdLvUIdWpxed7A32SdCaHrqHMvGRi9NnwsJI567tda', 'TUPM-23-2049', 'STUDENT', 'VERIFIED', FALSE, 'ZAILA MAE MABUTOL', 'LLANILLO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:26', '2026-02-07 08:07:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (77, 'tupm-23-1610@tup.edu.ph', '$2b$12$BK4linXDgkswtjCrRzv/.O7p3DrVnBVJfRaKfUKg.6f9MSH1gtaSC', 'TUPM-23-1610', 'STUDENT', 'VERIFIED', FALSE, 'JASPER CERWYN EUSTACIO', 'LUZANA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:28', '2026-02-07 08:07:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (78, 'tupm-23-1671@tup.edu.ph', '$2b$12$0Te77vuzivQhKt34NOQfF.MLalFSSigqXgmU90xcmd0SciRK.wGp.', 'TUPM-23-1671', 'STUDENT', 'VERIFIED', FALSE, 'GINOBBLI ALFRED ENRIQUEZ', 'MACASADIA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:28', '2026-02-07 08:07:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (79, 'tupm-23-2079@tup.edu.ph', '$2b$12$DmUgF3TwZQBJZz8DI4GFoulYbZx/LZBbtGZfmqfCMe9be3H9odZh2', 'TUPM-23-2079', 'STUDENT', 'VERIFIED', FALSE, 'RICKY ANDREW ANIMA', 'MONTOYA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:30', '2026-02-07 08:07:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (80, 'tupm-23-2153@tup.edu.ph', '$2b$12$6jlin/KzJa09YBcfgc/o2.ytxPJL6qcx1Wb4hTU088/NlEkQMRK0u', 'TUPM-23-2153', 'STUDENT', 'VERIFIED', FALSE, 'KARL CEDRICK REFORMADO', 'NAMUCO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:31', '2026-02-07 08:07:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (81, 'tupm-23-2215@tup.edu.ph', '$2b$12$BeNM7ZUiSgmbHDGsGOzBRe7N9wlmiq7gY.qy7x.Ocjzl8Iz/4YoyK', 'TUPM-23-2215', 'STUDENT', 'VERIFIED', FALSE, 'ALLEN GABRIELLE SAN ANDRES', 'PASION', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:32', '2026-02-07 08:07:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (82, 'tupm-23-1737@tup.edu.ph', '$2b$12$zjr6gj/ijnu6Sqg0M26MIur5Tym2IRgQWowP0LrUWu4B.fUiOPe82', 'TUPM-23-1737', 'STUDENT', 'VERIFIED', FALSE, 'J.C. ROEVEN PEREGRINA', 'PEJI', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:33', '2026-02-07 08:07:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (83, 'tupm-23-1731@tup.edu.ph', '$2b$12$eRoRRzbXpBhxOG7M5HCvYudjlZB2Bd0Z7f4ag.NKHBjgKUZPD5ZYK', 'TUPM-23-1731', 'STUDENT', 'VERIFIED', FALSE, 'LEONARD OBILLO', 'PUEBLOS', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:35', '2026-02-07 08:07:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (84, 'tupm-23-1691@tup.edu.ph', '$2b$12$KAKpJWnoCcieo5xNDC3Hx.hfuPtkZxjqAC8WgdQK3MOQn10aCvrte', 'TUPM-23-1691', 'STUDENT', 'VERIFIED', FALSE, 'KIRBY DELA PAZ', 'RAMILO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:36', '2026-02-07 08:07:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (85, 'tupm-23-1662@tup.edu.ph', '$2b$12$Px9iwp08uNe/9gdgaYNk5OADiEPA6zbg/XUCf3F1Z.Ovmx8aYxQwm', 'TUPM-23-1662', 'STUDENT', 'VERIFIED', FALSE, 'WHAYEN ASHLEY CAñIZARES', 'SALUDO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:37', '2026-02-07 08:07:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (86, 'tupm-23-2063@tup.edu.ph', '$2b$12$o5JWeu0dgnsSDQfimhDnyO/ydvClnGOwHkk1Mr0UhBFPua0ERRnTm', 'TUPM-23-2063', 'STUDENT', 'VERIFIED', FALSE, 'PRINZE KYLE MAGDADARO', 'SANTIAGO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:39', '2026-02-07 08:07:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (87, 'tupm-23-2089@tup.edu.ph', '$2b$12$tA1WPBIXRwJY2rgYDh9MNeRXVkaC1YvZJplr9hdccU6wY5yp/hsGu', 'TUPM-23-2089', 'STUDENT', 'VERIFIED', FALSE, 'WIAN LEI ATIGA', 'SANTOS', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:40', '2026-02-07 08:07:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (88, 'tupm-23-2110@tup.edu.ph', '$2b$12$L7erlShW9VooxaVj8FM7cO0SPEU5qnY0FeGb3ejKM/Kek7o3JDV/q', 'TUPM-23-2110', 'STUDENT', 'VERIFIED', FALSE, 'JOHN CARL SALAS', 'SEPARA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:41', '2026-02-07 08:07:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (89, 'tupm-23-2123@tup.edu.ph', '$2b$12$dISuI0XRhVTRkcou5S3vdeZom9r8hbQ2KWG0Ea1mWeAbiA.4vDlBm', 'TUPM-23-2123', 'STUDENT', 'VERIFIED', FALSE, 'IA MARY REPOLITO', 'SORIO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:42', '2026-02-07 08:07:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (90, 'tupm-23-2117@tup.edu.ph', '$2b$12$1831cQ9hjM9XVmqPww1ZOueW8hV1atOWJqhxTm/QmcexbJU8UzHVu', 'TUPM-23-2117', 'STUDENT', 'VERIFIED', FALSE, 'TIMOTHY AMORES', 'TALAGTAG', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:43', '2026-02-07 08:07:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (91, 'tupm-23-1617@tup.edu.ph', '$2b$12$3joxsauZxUEj9xbWFoOKOO/eWNCeLjJRtKV9JklYEWQP5xYaPWhaa', 'TUPM-23-1617', 'STUDENT', 'VERIFIED', FALSE, 'ARLETTE BAEL', 'TUASTUMBAN', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:44', '2026-02-07 08:07:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (92, 'tupm-23-2210@tup.edu.ph', '$2b$12$P5YwkpgMhrI28ZbigGsfP.u8WfeddkGnA7Y4hHAE1Cg34qe59ik4u', 'TUPM-23-2210', 'STUDENT', 'VERIFIED', FALSE, 'DAVID ERWIN ROMERO', 'VALDEPENA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:45', '2026-02-07 08:07:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (93, 'tupm-23-2046@tup.edu.ph', '$2b$12$PYTDsMfLppzyGV6Qq9e4qeBMRwP0xj8elo70n2qFPUKjMlJLUTntC', 'TUPM-23-2046', 'STUDENT', 'VERIFIED', FALSE, 'PAUL NATHAN RADAM', 'VALEÑA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:46', '2026-02-07 08:07:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (94, 'tupm-23-2058@tup.edu.ph', '$2b$12$Gc.iC6gVrezWnygqug5KNuxAT68aklmtXEn6sZZfcvdP/KoOgmdG6', 'TUPM-23-2058', 'STUDENT', 'VERIFIED', FALSE, 'SHARMAINE HANNAH PILAPIL', 'VALENZUELA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:47', '2026-02-07 08:07:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (95, 'tupm-23-2114@tup.edu.ph', '$2b$12$1.0yH9dPuPxfB0YdNVPQIuns/Wt3BtyM6ondAcc/cVryCZz3plMzC', 'TUPM-23-2114', 'STUDENT', 'VERIFIED', FALSE, 'ARABELLA SAMSON', 'VALERIO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:48', '2026-02-07 08:07:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (96, 'tupm-23-2086@tup.edu.ph', '$2b$12$8qLk0B30IDf5Be.TY7gVW.RysGXxcMb9rHkaVT8oBpv0pTxHT4XbK', 'TUPM-23-2086', 'STUDENT', 'VERIFIED', FALSE, 'KRISHNA COLEEN PEREZ', 'VENGUA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:49', '2026-02-07 08:07:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (97, 'tupm-23-2212@tup.edu.ph', '$2b$12$QDzp42PeP1XxdBJMHWlN6uyyoz6fjwzZ6b7uMsG1hZbQWKuEJiyHW', 'TUPM-23-2212', 'STUDENT', 'VERIFIED', FALSE, 'LYLA JANE LLENA', 'VILLANUEVA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:50', '2026-02-07 08:07:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (98, 'tupm-23-2091@tup.edu.ph', '$2b$12$eqg/cLvB1POiVLr4JrnEcuwQ7BbnwL0f3TxcIcieb9CDLykHUpBrK', 'TUPM-23-2091', 'STUDENT', 'VERIFIED', FALSE, 'CHARLES JUSTIN RAYCO', 'VIZCARRA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:51', '2026-02-07 08:07:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (99, 'tupm-23-2217@tup.edu.ph', '$2b$12$NiH1xh6sN9JF5G/OjDnxbOVcJ1CgO6vN3vb5Ss19gAzj/poJuX6Ea', 'TUPM-23-2217', 'STUDENT', 'VERIFIED', FALSE, 'TYRONE JOHN FRESNIDO', 'ZAPATA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:52', '2026-02-07 08:07:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (100, 'tupm-22-1995@tup.edu.ph', '$2b$12$52nBaC6W9u9RPzJWa7RYJuFcxHTQY2bORlCvV20rkio7vtt6eF01.', 'TUPM-22-1995', 'STUDENT', 'VERIFIED', FALSE, 'KRIZTEN ANTOINETTE BEJARIN', 'LAPUZ', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:25:19', '2026-02-07 08:25:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (101, 'deee@gmail.com', '$2b$12$1d4/6m99I9yDsQdUvlVEIO7lknezzUAFcrMwGXcW9Ozj6c8YiYziS', 'TUPM-22-0987', 'FACULTY', 'VERIFIED', FALSE, 'deedee', 'mcdoodoo', 'de', NULL, NULL, NULL, NULL, '2026-02-08 05:38:03', '2026-02-15 06:57:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, contact_number, birthday, home_address, current_term, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (134, 'efewf@gmail.com', '$2b$12$GigaPx2XCmdiujJ4tGPP3.fXGfzN3MddR4t2Ht7uoML2FC0vSnILG', 'TUPM-22-0098', 'STUDENT', 'VERIFIED', FALSE, 'as', 'ca', 'sa', NULL, NULL, NULL, NULL, '2026-02-16 09:20:48', '2026-02-25 20:41:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

COMMIT;

-- Export completed successfully
-- Total records exported: 470
