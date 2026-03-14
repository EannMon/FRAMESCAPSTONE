-- FRAMES Database Export
-- Generated on: 2026-03-12 11:10:32
-- Purpose: Complete database backup for restoration
-- Usage: psql -d your_database -f this_file.sql

BEGIN;
-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Data for departments
-- 1 records

INSERT INTO departments (id, name, code, created_at, active_academic_year, active_semester, college_id, semester_start_date, semester_end_date)
VALUES (1, 'COMPUTER STUDIES', 'CSD', '2026-03-05 01:33:54', '2025-2026', '2nd Semester', 1, '2026-01-19', '2026-06-27');

-- Data for programs
-- 2 records

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (1, 1, 'BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY', 'BSIT', '2026-03-05 01:33:55');

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (2, 1, 'BACHELOR OF SCIENCE IN COMPUTER SCIENCE', 'BSCS', '2026-03-05 01:33:56');

-- Data for subjects
-- 2 records

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (2, 'CC303-M', 'Methods of Research in Computing', 2, '2026-03-07 06:40:57');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (3, 'IT232-M', 'Computer Architecture and Organization, Lec', 2, '2026-03-09 02:08:21');

-- Data for users
-- 97 records

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (1, 'emmanuel.lungay@tup.edu.ph', '$2b$12$U0ASbYMan9PRoGhppcyhteZPEnTCRN1eQ/XjL6bjqQb14X3aNuf.y', NULL, 'HEAD', 'VERIFIED', TRUE, 'EMMANUEL', 'LUNGAY', 'MONDRAGON', 1, NULL, NULL, '2026-03-05 01:33:56', '2026-03-09 13:46:43', '003');

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (2, 'jhulliannakyle.marquez@tup.edu.ph', '$2b$12$0eaGX0F4CTHO2.rDX8WCNeGky.Vfq5q8TQwikbEEF9Eh7fN0QgIom', NULL, 'FACULTY', 'VERIFIED', FALSE, 'JERICHO ', 'DEL SOCORRO', '-', 1, 2, NULL, '2026-03-05 01:40:59', '2026-03-09 00:16:00', '004');

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (3, NULL, '$2b$12$JT9bZvLJiB.M0SjoJBK5ZuViaZbW0fQ3hG3zN0asKMPLaZ/yy2AN6', 'TUPM-24-1591', 'STUDENT', 'VERIFIED', TRUE, 'ANDEE OBANG', 'ACOSTA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:17', '2026-03-05 02:13:17', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (4, NULL, '$2b$12$F3gEu1H0CSMAYlRvgOe7meheljS.5yhhr0iTxugBdXHNUIwgUQOuS', 'TUPM-24-1951', 'STUDENT', 'VERIFIED', FALSE, 'JHON KENNETH NARISMA', 'AGUINALDO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:18', '2026-03-05 02:13:18', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (5, NULL, '$2b$12$a6MSXjXMFAlK8FjEez0/eOHopirGNkeMqCGJhKmLVxZmJpEVU4jbe', 'TUPM-24-6176', 'STUDENT', 'VERIFIED', FALSE, 'RANDY JR. MORALES', 'ALONZO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:19', '2026-03-05 02:13:19', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (6, NULL, '$2b$12$p2Wds7j3itC1ygEU03X/nucEiInOvWWise9BjIAUoylxgYqn4jT4y', 'TUPM-24-1760', 'STUDENT', 'VERIFIED', FALSE, 'MARK LAWRENCE ANGELO MASIGLAT', 'AVILES', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:20', '2026-03-05 02:13:20', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (7, NULL, '$2b$12$81EiFO4VhfjKXXf8i3o1IulUjq4yC/MxJV7tBZBj6gCB/j1xGK0M2', 'TUPM-24-1609', 'STUDENT', 'VERIFIED', FALSE, 'SIMON REODAVA', 'BERNARDO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:20', '2026-03-05 02:13:20', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (8, NULL, '$2b$12$U27RjXqgjm3Roc94XBoKd.KF6oAqitiZ9iBlVdQsWRsmVyTaZZt/m', 'TUPM-24-1960', 'STUDENT', 'VERIFIED', FALSE, 'ASHLEY KIM GUANSING', 'BURDEOS', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:21', '2026-03-05 02:13:21', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (9, NULL, '$2b$12$VdrP2C/oJQAQ.E.Kve5PougCvirvva7HIQpyBnim5KYG86tTsculu', 'TUPM-24-1796', 'STUDENT', 'VERIFIED', FALSE, 'ANJIE MARK ACOSTA', 'CAPLES', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:21', '2026-03-05 02:13:21', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (10, NULL, '$2b$12$rHQycSP0Zs.DD6cW0AYLp.i93bKWuf1ZX6hF4yqm9Lwzhiyj1K4NW', 'TUPM-24-1724', 'STUDENT', 'VERIFIED', FALSE, 'BRENT LUWI ESPIRITU', 'CASAS', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:22', '2026-03-05 02:13:22', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (11, NULL, '$2b$12$CGcZwfUmUUu3o283mEqWMub7bSpBnTPtc1O9Rd/MdXjjbCu.ij1lm', 'TUPM-24-1685', 'STUDENT', 'VERIFIED', FALSE, 'VETINA GENE GILHANG', 'CLAVATON', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:23', '2026-03-05 02:13:23', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (12, NULL, '$2b$12$2BXaGL1J9e5nw4t8n45nLOly2nf54AiBLNmZAPWe729fw8gUg7sie', 'TUPM-24-1668', 'STUDENT', 'VERIFIED', FALSE, 'MIKAELA DEGRAN', 'COQUILLA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:23', '2026-03-05 02:13:23', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (13, NULL, '$2b$12$xKDpsutaCO2JCaBknqjhOuMTYncbbKq3XjtBBFuaUH3Odtend2w0e', 'TUPM-24-1605', 'STUDENT', 'VERIFIED', FALSE, 'ROSHNY JEN LLAVORE', 'CRUZ', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:24', '2026-03-05 02:13:24', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (14, NULL, '$2b$12$kvnAGo.O1uFAMbH.flcl1OV9x6FaWShta1Tl73s1Phwtb0TYp2IXi', 'TUPM-24-1686', 'STUDENT', 'VERIFIED', FALSE, 'KRIZZA ANGEL CAMPO', 'DELA CRUZ', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:25', '2026-03-05 02:13:25', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (15, NULL, '$2b$12$Kpz.P5fBXutAwoXFt0Zy/.RCDgzd2Dm06bH4CW4YptIWfCunhmrMu', 'TUPM-24-1677', 'STUDENT', 'VERIFIED', FALSE, 'JOVIELYN NESORTADO', 'EGUILLOS', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:25', '2026-03-05 02:13:25', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (16, NULL, '$2b$12$OWYT3GfS0dKeClyIWEIyruZHeboc5Q1bmELwFJaAWPnYgfoCkh3au', 'TUPM-24-1710', 'STUDENT', 'VERIFIED', FALSE, 'LESTER MEANO', 'ESTAREJA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:26', '2026-03-05 02:13:26', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (17, NULL, '$2b$12$.hxT7x1oYX/U0RWsq9zDr.TSR1BW.m0hgPTO.1hmv1tT8pnknPgaK', 'TUPM-24-1766', 'STUDENT', 'VERIFIED', FALSE, 'MARK LORENZ GUDES', 'ETANG', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:27', '2026-03-05 02:13:27', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (18, NULL, '$2b$12$QDQsY9mJ.QJq3WDR00uKs.d2n1UZWMYYBGEsXS4eWKl6zenEzV0Mi', 'TUPM-24-1583', 'STUDENT', 'VERIFIED', FALSE, 'JOHN JHERVY GUTIERREZ', 'EUSEBIO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:27', '2026-03-05 02:13:27', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (19, NULL, '$2b$12$JuaXTn9F.yNoZzvNHul3lugqXM65yHoQ5Z/dCVKC0ZR1eqYMurJ.e', 'TUPM-24-1776', 'STUDENT', 'VERIFIED', FALSE, 'BEYONCE KELLY VILLARAZA', 'FAJARDO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:28', '2026-03-05 02:13:28', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (20, NULL, '$2b$12$BqAiReT.bxkfRHBZpAOjhenJ2gG4a7ifqadIJWoAWS7IZtbH1.rjW', 'TUPM-24-1597', 'STUDENT', 'VERIFIED', FALSE, 'FRANCIS VICTOR BAÑARES', 'FROA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:29', '2026-03-05 02:13:29', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (21, NULL, '$2b$12$OZevbn8JB.iNcGlgV3l4yuDD1wGPejSvGizw9l6I2lldKQjA3dsXC', 'TUPM-24-1596', 'STUDENT', 'VERIFIED', FALSE, 'JHON RYAN SAMONTEZA', 'FULLO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:29', '2026-03-05 02:13:29', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (22, NULL, '$2b$12$/U9mqiBlL8ydQ7eij1hRRe.FIXEhhlO2WmmDdcKX5P2FOV9ApZb..', 'TUPM-24-1717', 'STUDENT', 'VERIFIED', FALSE, 'RENZ MARRION DELA ROSA', 'LABRADOR', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:30', '2026-03-05 02:13:30', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (23, NULL, '$2b$12$Wsb9ViIFFeGAtfBdphbA4exu68d9H7QEgpyNzOLaqmTj8PzFcW//C', 'TUPM-24-1794', 'STUDENT', 'VERIFIED', FALSE, 'MARK KEVIN BRIONES', 'LACSON', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:31', '2026-03-05 02:13:31', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (24, NULL, '$2b$12$Pj3hs6U.vgWtxbUzhlosiumlA/ab24dpuDRRC3jw.5oIHzvYwRGSW', 'TUPM-24-1610', 'STUDENT', 'VERIFIED', FALSE, 'CARL ADRIANNE IGNACIO', 'LASCANO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:31', '2026-03-05 02:13:31', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (25, NULL, '$2b$12$lAS4kJqAaZcuGFyJ3I2yUuvZTIXRNRms.C7QCE6CjYD47IrBPi4Hm', 'TUPM-24-1719', 'STUDENT', 'VERIFIED', FALSE, 'REX JEMAR BERNAL', 'LATAYADA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:32', '2026-03-05 02:13:32', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (26, NULL, '$2b$12$zGOU7vB.4uPFQ/Fx31Mqr.LMInJt6OELYq5pf79svB1gGCAb13Ol6', 'TUPM-24-1678', 'STUDENT', 'VERIFIED', FALSE, 'LIANNE PRINCESS PRUCIA', 'LERIOS', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:33', '2026-03-05 02:13:33', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (27, NULL, '$2b$12$CElH.JYo53xehpB6aZyB8.9PffBR87zeKyKxIkYfkZtLoImClZ0eW', 'TUPM-24-2181', 'STUDENT', 'VERIFIED', FALSE, 'MARK CHRISTIAN LIMBO', 'LUCTO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:33', '2026-03-05 02:13:33', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (28, NULL, '$2b$12$qypZgzE2pNZ5scQRNA9/Ou77qmNsvV9NTCdOwe8OYe1Bf0KaK5P.G', 'TUPM-24-2293', 'STUDENT', 'VERIFIED', FALSE, 'LAWRENCE INES', 'MADERA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:34', '2026-03-05 02:13:34', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (29, NULL, '$2b$12$RbFOdtjGc8gBjelUrPJfbODsg0w1GVluocYHo.mSKkGijThODuaSC', 'TUPM-24-1680', 'STUDENT', 'VERIFIED', FALSE, 'KENT MICHAEL LEOJ PELIGRO', 'MALINAO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:35', '2026-03-05 02:13:35', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (30, NULL, '$2b$12$LO209xvLE2wRwDhqw.n.y.P7O/zk4HmJN1DHm7Dp43s3tPvfa0EHO', 'TUPM-24-1773', 'STUDENT', 'VERIFIED', FALSE, 'JOHN RAIVEN JAÑOZO', 'MANDRAS', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:35', '2026-03-05 02:13:35', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (31, NULL, '$2b$12$eq4KuhrI0xH7Qv7Fzfg8RO4RKZgKHI.BAAthTs0cr95KBPnuemTYG', 'TUPM-24-1601', 'STUDENT', 'VERIFIED', FALSE, 'ALDRED CABIQUE', 'MIQUE', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:36', '2026-03-05 02:13:36', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (32, NULL, '$2b$12$B9moewCHvamvWT5xK6ygr.Gd7nCMwKGlMuTrQ/HkpRm8YIPArsX2K', 'TUPM-24-1775', 'STUDENT', 'VERIFIED', FALSE, 'RAINIEL ESPINA', 'NAVA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:37', '2026-03-05 02:13:37', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (33, NULL, '$2b$12$XZ8diHegAQnHVYdY4LBIWOk0VuBtwKY8ocaR.CArfAQ7lV8k4UZNa', 'TUPM-24-1784', 'STUDENT', 'VERIFIED', FALSE, 'JANEL LABANON', 'NUNGAY', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:37', '2026-03-05 02:13:37', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (34, NULL, '$2b$12$7zfwrWCErXc0BX6Z2VH0U.sMA1eqXHN.U3u3ijbLqrIetxl/aAkbO', 'TUPM-24-1718', 'STUDENT', 'VERIFIED', FALSE, 'JEFFERSON', 'PADUA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:38', '2026-03-05 02:13:38', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (35, NULL, '$2b$12$oB7Xt1iW43PP3wr1SzRf2u/UpH5n6xCZc2RSrFxH75581hnwy4E7q', 'TUPM-24-1799', 'STUDENT', 'VERIFIED', FALSE, 'JULIE ANN SALAZAR', 'PALMIANO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:38', '2026-03-05 02:13:38', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (36, NULL, '$2b$12$gtu0KU6tQQS2CIH6ZRieb.vVnuYQYW7AtJ1H5iI9ojcAbTQOtpW3W', 'TUPM-24-1684', 'STUDENT', 'VERIFIED', FALSE, 'MATTHEW GEM INOLINO', 'PATDU', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:39', '2026-03-05 02:13:39', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (37, NULL, '$2b$12$2qpHwGS3pmhrK59Ixb/I0u8FkqVv4ux4hpfKvYhPozlDfZXudi7le', 'TUPM-24-1722', 'STUDENT', 'VERIFIED', FALSE, 'KHINITO CHRISTIAN CORTEZ', 'PEñAMANTE', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:40', '2026-03-05 02:13:40', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (38, NULL, '$2b$12$kIJBD1hNoX5SYRUfDcP/5.o3e9r35swMerJUHKp8ItFHaNw8k7Fm6', 'TUPM-24-1627', 'STUDENT', 'VERIFIED', FALSE, 'HANNAH MAERYL PEREZ', 'PERRARO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:41', '2026-03-05 02:13:41', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (39, NULL, '$2b$12$7IvXg9Nk9LkdRIimYxDFMuNK.B9ValfQ526J6E1Pfxl33REQBvB.2', 'TUPM-24-1727', 'STUDENT', 'VERIFIED', FALSE, 'ELLYZA MAY VARIAS', 'REYES', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:41', '2026-03-05 02:13:41', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (40, NULL, '$2b$12$xdwulpdP0q9pv2HywiKu6.O0Mg049uIqPlG7ndZziZ668zdyRHfmO', 'TUPM-24-1608', 'STUDENT', 'VERIFIED', FALSE, 'JOHN NOVYMHIER SANTIAGO', 'ROSALES', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:42', '2026-03-05 02:13:42', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (41, NULL, '$2b$12$vvp1z.O/OYXR7aipWqG2GulhyAtbmlf3n3PYbPxBrIelA49oPt3bi', 'TUPM-24-1753', 'STUDENT', 'VERIFIED', FALSE, 'JOSIAH BARCELONA', 'SANDAJAN', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:43', '2026-03-05 02:13:43', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (42, NULL, '$2b$12$ikymf8Nc1TRKBkLqmn8mgOJ9iCVAUn9nXnHE1fT2Ia8aVxCdqxOh6', 'TUPM-24-1723', 'STUDENT', 'VERIFIED', FALSE, 'JOHN GABRIEL RAMOS', 'SIA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:44', '2026-03-05 02:13:44', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (43, NULL, '$2b$12$L/6oP5hA97xIpBa0c.lopOY.rO0amTMSeCv104gzpEY4hwhT0Kld.', 'TUPM-24-1757', 'STUDENT', 'VERIFIED', FALSE, 'RASH IAN BEATRIZOLA', 'SINAG', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:44', '2026-03-05 02:13:44', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (44, NULL, '$2b$12$4FMxsLYE308et.69JrOVxeZOjA6gX/22oSenmpLYX/w5RgDGINK6m', 'TUPM-24-1614', 'STUDENT', 'VERIFIED', FALSE, 'GERARDO BURGOS', 'SISON', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:45', '2026-03-05 02:13:45', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (45, NULL, '$2b$12$zn6yw0CNBD24dEtXOPgcweTfceaShv0ATCujD8jcnPZvHM5mzqU7K', 'TUPM-24-1623', 'STUDENT', 'VERIFIED', FALSE, 'JANNA MARIE VILLANUEVA', 'TAHUM', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:46', '2026-03-05 02:13:46', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (46, NULL, '$2b$12$S87j8Wbiw1K7QzZpmC9OqenZ0185CaWv/AJgt/jg8gixX5coeaAu2', 'TUPM-24-1798', 'STUDENT', 'VERIFIED', FALSE, 'JAIMEE KELLY DAVID', 'TORCELINO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:46', '2026-03-05 02:13:46', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (47, NULL, '$2b$12$JJdcocspRrXpcc.Tmjbg2eKFt6awPD.aOx1n0UhWONBPQgJuCUMvG', 'TUPM-24-1762', 'STUDENT', 'VERIFIED', FALSE, 'ARRIANI JENN BALDAH', 'UNATING', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:47', '2026-03-05 02:13:47', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (48, NULL, '$2b$12$Uqcu6SpSKGMkS5mUqS0acOGNDwS1.DDDL/XRtSJo8lMfpF.QqcqDC', 'TUPM-24-2161', 'STUDENT', 'VERIFIED', FALSE, 'KESHENNA IYELLE PABILLORE', 'VALERIO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:48', '2026-03-05 02:13:48', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (49, NULL, '$2b$12$oC2BmmghmnnVLjQSyGQx6OSFnpo8at8ix2dxgEk9OTyU/fuXyBb/q', 'TUPM-24-1720', 'STUDENT', 'VERIFIED', FALSE, 'STEVEN VALDEZ', 'VALEROSO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:49', '2026-03-05 02:13:49', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (50, NULL, '$2b$12$rS3FCBWtZBWakdCn9zeX3.LukRXesnRJ/xF8/Yw9fbHJbJbxu0vLS', 'TUPM-24-1687', 'STUDENT', 'VERIFIED', FALSE, 'LUKE DWYANE RAMIREZ', 'VIDAMO', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:49', '2026-03-05 02:13:49', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (51, NULL, '$2b$12$2AjDihnJ3O9bqKn3erI.d.nZgv50m6e3puxAbvunihHgn.2/S7TJO', 'TUPM-24-1602', 'STUDENT', 'VERIFIED', FALSE, 'ALEXIS ALONZO', 'VILLANUEVA', NULL, NULL, NULL, 'BSIT-2B-M', '2026-03-05 02:13:50', '2026-03-05 02:13:50', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (52, NULL, '$2b$12$aRmibDkMKiZ4oC8FrdWnlOmvq1WOTHieuNOOI8aspPy4SPDD8d2/u', 'TUPM-23-2190', 'STUDENT', 'VERIFIED', FALSE, 'NICHOLAS ANDREW LEONARDO', 'ALCANTARA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:40:58', '2026-03-07 06:40:58', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (53, NULL, '$2b$12$/UNAtjdeTOFtm/QxbkMyg.sgv1dlzAxrbTfD6QI4VzcG7PMwm84z.', 'TUPM-23-2133', 'STUDENT', 'VERIFIED', FALSE, 'ANDREA MIKAELA AMAGSILA', 'ALGARA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:40:59', '2026-03-07 06:40:59', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (54, NULL, '$2b$12$oKHa.WpIxmZLKuhyKznms.Asniu.BFxKadNTI2l8ksw/8Jc2JD8mi', 'TUPM-23-2253', 'STUDENT', 'VERIFIED', FALSE, 'VIA YSABELLE BUTIN', 'ALMARIO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:00', '2026-03-07 06:41:00', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (55, NULL, '$2b$12$yl..NcvtRuNdeqJE.53LAOv1FpGoXSMz0lPG4zEQO69KyYIRmLS0a', 'TUPM-23-1600', 'STUDENT', 'VERIFIED', FALSE, 'RANDEL THOMAS OLIVEROS', 'BABAO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:02', '2026-03-07 06:41:02', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (56, NULL, '$2b$12$Vwsw0ZKYJctcIqbW.nwAVe0XPS7xRXO14qqlPPWPCVMx9pmtuj8Y.', 'TUPM-23-2120', 'STUDENT', 'VERIFIED', FALSE, 'JIREH GEUEL F.', 'BERNARDINO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:03', '2026-03-07 06:41:03', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (57, NULL, '$2b$12$l.16lJt4SLF3uBHZ8./pqOjejHVBPFP0NQSJy8FC6G9s8AkT3hI9q', 'TUPM-23-1715', 'STUDENT', 'VERIFIED', FALSE, 'JUAN MIGUEL DIAMSAY', 'CAMPOMANES', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:04', '2026-03-07 06:41:04', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (58, NULL, '$2b$12$d6KDRff1tXatttLIjSQacO7krppzEx1x0HaqWvnjddwnfZMWVaJ5K', 'TUPM-23-1657', 'STUDENT', 'VERIFIED', FALSE, 'TRISTAN JHON REYES', 'CAPUYAN', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:05', '2026-03-07 06:41:05', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (59, NULL, '$2b$12$u3lBpKw1JRN56QaHjIYvSuuwOyUzNKBGE1KDx53lXV1CHDezf1AGq', 'TUPM-23-2173', 'STUDENT', 'VERIFIED', FALSE, 'JAY LAWRENCE CAJANDING', 'CERNIAZ', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:07', '2026-03-07 06:41:07', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (60, NULL, '$2b$12$N1.JbLxb8d3W1KKAiB.cgOAZx4axfVXqOdKdht40NxnLheh/lJF1O', 'TUPM-23-2126', 'STUDENT', 'VERIFIED', FALSE, 'GLADYS GAIL STA. MARIA', 'COCHING', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:08', '2026-03-07 06:41:08', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (61, NULL, '$2b$12$yw1qywHP1bnzsGd/4MFZbOY7/QbPqqz18DI8oyYMAaLTfcYcnwtIa', 'TUPM-23-2214', 'STUDENT', 'VERIFIED', FALSE, 'KOBE LUIS ILUIS', 'CUISON', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:09', '2026-03-07 06:41:09', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (62, NULL, '$2b$12$vSjbgUk/ZvQ3i2ZxoVtJZuuvRhqZM6O.8yjfDPpRtMVf5B6RTG8Ze', 'TUPM-23-2165', 'STUDENT', 'VERIFIED', FALSE, 'NERO ARBERT DADIS', 'DE PAZ', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:10', '2026-03-07 06:41:10', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (63, NULL, '$2b$12$0cdtS6iI30TNWM9gCKckkuLuw1ghH8gTeauuIBvq2HRmzuhNai//O', 'TUPM-23-2101', 'STUDENT', 'VERIFIED', FALSE, 'JOHN CEDRICK BALDEO', 'DELACORTA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:11', '2026-03-07 06:41:11', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (64, NULL, '$2b$12$VI2ZJCu0OslvZky82nz9uur11uqkY8cMuVkPpbMwkdxPYLo2U0XZ.', 'TUPM-23-2326', 'STUDENT', 'VERIFIED', FALSE, 'RALPH MICHAEL NIETO', 'EVANGELISTA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:13', '2026-03-07 06:41:13', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (65, NULL, '$2b$12$sMnTWqQs3xfE4m106JVCf.mnPbdRdTdrvyXacC9hSyPyy5dOcx/8K', 'TUPM-23-2105', 'STUDENT', 'VERIFIED', FALSE, 'JUSTINE CARL QUIDILIG', 'FABIAN', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:14', '2026-03-07 06:41:14', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (66, NULL, '$2b$12$yG3AUpYNgz5PYNN82ySX.OOVrAuSX7DCzJ5olXYI.ZAxY5ZFO8Ycm', 'TUPM-23-2182', 'STUDENT', 'VERIFIED', FALSE, 'ANNE JANELLE PERALTA', 'FRONDA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:15', '2026-03-07 06:41:15', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (67, NULL, '$2b$12$kGKCW3nCTz1Di9uGp8UheuGIEIoM2TM1pA9.ARdosmfXnQ0E0XYhi', 'TUPM-23-2055', 'STUDENT', 'VERIFIED', FALSE, 'ARKIN PHOENIX DE GUZMAN', 'JAROMAMAY', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:17', '2026-03-07 06:41:17', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (68, NULL, '$2b$12$2SxTGVA8vSmw3tiP6s5.Uukqhjr0smJtWRk3LXnYkAwNRCJBLoV4W', 'TUPM-23-2205', 'STUDENT', 'VERIFIED', FALSE, 'ZEINT JUSTINE BARANDON', 'LACRA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:18', '2026-03-07 06:41:18', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (69, NULL, '$2b$12$UhNuZxMLTvguh5cQVGbKb.fQ.ah6U04VrcGfgZer9bBLw39HE9ilO', 'TUPM-22-1995', 'STUDENT', 'VERIFIED', FALSE, 'KRIZTEN ANTOINETTE BEJARIN', 'LAPUZ', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:19', '2026-03-07 06:41:19', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (70, NULL, '$2b$12$xezHH4gH5tYgW5SZp0yE8uHAsKZAOYBwT6U49JKVxwy6FK/3N7Seq', 'TUPM-23-2082', 'STUDENT', 'VERIFIED', FALSE, 'ALTHEA MARIE SANTOS', 'LAURENTE', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:20', '2026-03-07 06:41:20', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (71, NULL, '$2b$12$79TYmygZcdJfR/btUNBaWekOSFRdui3BnEKmmErXf03u1myObHFUW', 'TUPM-23-2131', 'STUDENT', 'VERIFIED', FALSE, 'IAN LESTER DIÑO', 'LESIGUES', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:22', '2026-03-07 06:41:22', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (72, NULL, '$2b$12$.jG2kNjEgm644MaB6E..J.skKiOa3vI8fYdDwB4KnALKk1D9Kkv9i', 'TUPM-23-2049', 'STUDENT', 'VERIFIED', FALSE, 'ZAILA MAE MABUTOL', 'LLANILLO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:23', '2026-03-07 06:41:23', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (73, NULL, '$2b$12$qp7mhMAAgHKnBF32rUTz3.lipEk0ViDbA5JHbm9cSzeZ/EWUek8W2', 'TUPM-23-1610', 'STUDENT', 'VERIFIED', FALSE, 'JASPER CERWYN EUSTACIO', 'LUZANA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:24', '2026-03-07 06:41:24', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (74, NULL, '$2b$12$m/C5PcXipamMmkxEBLaWNehUHbrFskt22TuXPINktO.mILrhNqnoa', 'TUPM-23-1671', 'STUDENT', 'VERIFIED', FALSE, 'GINOBBLI ALFRED ENRIQUEZ', 'MACASADIA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:25', '2026-03-07 06:41:25', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (75, NULL, '$2b$12$H2xVuMN3JM2WP2w/U2cnAuRiAzm0PUvvm5OaXBD9DZ18T4E3FfjEa', 'TUPM-23-2079', 'STUDENT', 'VERIFIED', FALSE, 'RICKY ANDREW ANIMA', 'MONTOYA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:27', '2026-03-07 06:41:27', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (76, NULL, '$2b$12$uyyTHBtwlX.8Kmt3g4WTjOH2n.VTD8jGINaC2LcQ5p86HaCOOy.ia', 'TUPM-23-2153', 'STUDENT', 'VERIFIED', FALSE, 'KARL CEDRICK REFORMADO', 'NAMUCO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:28', '2026-03-07 06:41:28', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (77, NULL, '$2b$12$AlM97U125fJKBUpQwusrVOADbZbf2i9JG5LYULNGkbO.cZrh1z2vu', 'TUPM-23-2215', 'STUDENT', 'VERIFIED', FALSE, 'ALLEN GABRIELLE SAN ANDRES', 'PASION', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:29', '2026-03-07 06:41:29', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (78, NULL, '$2b$12$68owHocetd7mz/2N9jVYm.glr/AxtYYP0pwzQkNXSHGUzs0kYr8ke', 'TUPM-23-1737', 'STUDENT', 'VERIFIED', FALSE, 'J.C. ROEVEN PEREGRINA', 'PEJI', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:30', '2026-03-07 06:41:30', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (79, NULL, '$2b$12$Pu6/TGVFTBJQwuMMDp.Lu.etWgyI8r9gllMVG3T0vKniIgfNSi.di', 'TUPM-23-1731', 'STUDENT', 'VERIFIED', FALSE, 'LEONARD OBILLO', 'PUEBLOS', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:31', '2026-03-07 06:41:31', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (80, NULL, '$2b$12$QtFs.xNMokdU4JZxzw7WkuhwHD0sLmTdCRQtFqiAv4HS5Yx9LUyCu', 'TUPM-23-1691', 'STUDENT', 'VERIFIED', FALSE, 'KIRBY DELA PAZ', 'RAMILO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:32', '2026-03-07 06:41:32', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (81, NULL, '$2b$12$5eytyxgRgR0LpsVf0mTVa.aXNw6N.NQAl4nHRXXSYTEmCmxFT0752', 'TUPM-23-1662', 'STUDENT', 'VERIFIED', FALSE, 'WHAYEN ASHLEY CAñIZARES', 'SALUDO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:33', '2026-03-07 06:41:33', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (82, NULL, '$2b$12$D.zHtkX0cfoXRQ1x5t.o9OhOxB/BeTztvDh93EAFF.S7cVoAeKdqO', 'TUPM-23-2063', 'STUDENT', 'VERIFIED', FALSE, 'PRINZE KYLE MAGDADARO', 'SANTIAGO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:34', '2026-03-07 06:41:34', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (83, NULL, '$2b$12$qmIQQwdaEzWwekOpvqUdQO/FjCmIDiVePJqFdyVGwuBHQEovX2PAy', 'TUPM-23-2089', 'STUDENT', 'VERIFIED', FALSE, 'WIAN LEI ATIGA', 'SANTOS', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:35', '2026-03-07 06:41:35', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (84, NULL, '$2b$12$Ije5uyDkxjVFfR3RadJkhe8cxo3aVz9akgqIyxBdOE.3tFoCsoVz.', 'TUPM-23-2110', 'STUDENT', 'VERIFIED', FALSE, 'JOHN CARL SALAS', 'SEPARA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:37', '2026-03-07 06:41:37', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (85, NULL, '$2b$12$Bg/veLawAGj4qEi.6OSKr.qclsvS8Uftm9dOmkeU73lIADFJJvsMG', 'TUPM-23-2123', 'STUDENT', 'VERIFIED', FALSE, 'IA MARY REPOLITO', 'SORIO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:38', '2026-03-07 06:41:38', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (86, NULL, '$2b$12$iGJtY9mCiSb9flYAblHMpOY8MvaoSPTZqyv1QiKVIV7iHBYDvCfTC', 'TUPM-23-2117', 'STUDENT', 'VERIFIED', FALSE, 'TIMOTHY AMORES', 'TALAGTAG', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:39', '2026-03-07 06:41:39', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (87, NULL, '$2b$12$XkuvFuVilvyfyrvH.0xd7OqS8KH7BU5P4r1rl872a/SQ41OPBhTZW', 'TUPM-23-1617', 'STUDENT', 'VERIFIED', FALSE, 'ARLETTE BAEL', 'TUASTUMBAN', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:40', '2026-03-07 06:41:40', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (88, NULL, '$2b$12$9Y8Tk3cMYZIMorvrB0pe/exOnY3ofpNtQn62B0heTJ1rp5loyhl6C', 'TUPM-23-2210', 'STUDENT', 'VERIFIED', FALSE, 'DAVID ERWIN ROMERO', 'VALDEPENA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:42', '2026-03-07 06:41:42', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (89, NULL, '$2b$12$G7Zvjwz.sCVMXM9jq.tXou7v3H70i4Tnbts9VPRfXJTk2OBN224HG', 'TUPM-23-2046', 'STUDENT', 'VERIFIED', FALSE, 'PAUL NATHAN RADAM', 'VALEÑA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:43', '2026-03-07 06:41:43', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (90, NULL, '$2b$12$A.9aAttWN.y/q174Yr.qf.dZaBVhkOmhHqMzCDK0hyNIP9aVeoVJS', 'TUPM-23-2058', 'STUDENT', 'VERIFIED', FALSE, 'SHARMAINE HANNAH PILAPIL', 'VALENZUELA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:44', '2026-03-07 06:41:44', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (91, NULL, '$2b$12$1VBDLZZZ5hMLuxNsQG9QEeLEIbshxb.q//HpAhJzCsFM7pWTdPD3q', 'TUPM-23-2114', 'STUDENT', 'VERIFIED', FALSE, 'ARABELLA SAMSON', 'VALERIO', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:45', '2026-03-07 06:41:45', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (92, NULL, '$2b$12$y24xLty60pZizSxWMUE2COuWAVF6dOvY.TfCt4zmvWGhf6rcMysdC', 'TUPM-23-2086', 'STUDENT', 'VERIFIED', FALSE, 'KRISHNA COLEEN PEREZ', 'VENGUA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:46', '2026-03-07 06:41:46', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (93, NULL, '$2b$12$FMMm4xYHrXb5txERqZDQaeocxcm0WOrdf8GRPIlekAtHkO8oGqQ3q', 'TUPM-23-2212', 'STUDENT', 'VERIFIED', FALSE, 'LYLA JANE LLENA', 'VILLANUEVA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:48', '2026-03-07 06:41:48', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (94, NULL, '$2b$12$ggrgxZQRJsv6/nJXaSSHk.ncWXZB7TnXGtRBeHA/kNaclswVEjhXq', 'TUPM-23-2091', 'STUDENT', 'VERIFIED', FALSE, 'CHARLES JUSTIN RAYCO', 'VIZCARRA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:49', '2026-03-07 06:41:49', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (95, NULL, '$2b$12$JsfFtR/ZrxPAcO3KIJh8Le8ukAt4vcUeHQFNGBeQCOAbVipFUrNQa', 'TUPM-23-2217', 'STUDENT', 'VERIFIED', FALSE, 'TYRONE JOHN FRESNIDO', 'ZAPATA', NULL, NULL, NULL, 'BSIT-3A-M', '2026-03-07 06:41:50', '2026-03-07 06:41:50', NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (96, 'karlrico.calingal@tup.edu.ph', '$2b$12$0x19r.CJPtTYEJk4iyNBou4RrDZIR.BNuRFfGa0aGSeE5XkuuMUou', NULL, 'FACULTY', 'VERIFIED', TRUE, 'KARL', 'CALINGAL', NULL, 1, NULL, NULL, '2026-03-10 01:49:09', '2026-03-10 02:25:47', '123654');

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, section, created_at, last_active, employee_id)
VALUES (97, 'angelica.terana@tup.edu.ph', '$2b$12$7NGnw7ejnrzh42hkeRfDhuab5IJKPnvieLXBICvz9NdGKNdTckTXG', NULL, 'FACULTY', 'VERIFIED', FALSE, 'ANGELICA', 'TERANA', '-', 1, 2, NULL, '2026-03-10 13:13:21', '2026-03-10 13:17:18', '147');

-- Data for devices
-- 1 records

INSERT INTO devices (id, room, ip_address, device_name, status, created_at, last_heartbeat, room_capacity)
VALUES (1, 'Room 328', '', 'RPI-328', 'ACTIVE', '2026-03-05 02:23:56', NULL, 50);

-- Data for facial_profiles
-- 3 records

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (4, 1, NULL::bytea, 'insightface_buffalo_sc_v1', '2026-03-09 05:51:07', '2026-03-09 05:51:32', 15, 0.831135630607605);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (5, 3, NULL::bytea, 'insightface_buffalo_sc_v1', '2026-03-09 05:52:58', '2026-03-09 05:53:59', 15, 0.8282839099566142);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (6, 96, NULL::bytea, 'insightface_buffalo_l_v1', '2026-03-10 01:50:29', '2026-03-10 01:52:25', 15, 0.831865910689036);

-- Data for classes
-- 2 records

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (3, 2, 1, 'Room 328', 'Saturday', '18:50:00', '22:00:00', 'BSIT-3A-M', '2nd Semester', '2025-2026', '2026-03-07 06:40:57', 0);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (4, 3, 1, 'Room 328', 'Wednesday', '13:30:00', '16:00:00', 'BSIT-2B-M', '2nd Semester', '2025-2026', '2026-03-09 02:08:22', 0);

-- No data found in audit_logs

-- Data for support_tickets
-- 2 records

INSERT INTO support_tickets (id, user_id, subject, message, status, created_at, evidence_files)
VALUES (1, 2, 'Test', 'Hi Karl', 'OPEN', '2026-03-05 06:20:02', 'tickets\2\e2e53120\3503e103_637904033_813320824363343_4994529727188372093_n.jpg');

INSERT INTO support_tickets (id, user_id, subject, message, status, created_at, evidence_files)
VALUES (2, 2, 'SDSS', 'dscsdssd', 'OPEN', '2026-03-09 00:16:55', NULL);

-- No data found in user_settings

-- No data found in system_metrics

-- No data found in security_logs

-- Data for enrollments
-- 93 records

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (99, 3, 52, '2026-03-07 06:40:59');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (100, 3, 53, '2026-03-07 06:41:00');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (101, 3, 54, '2026-03-07 06:41:02');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (102, 3, 55, '2026-03-07 06:41:03');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (103, 3, 56, '2026-03-07 06:41:04');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (104, 3, 57, '2026-03-07 06:41:05');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (105, 3, 58, '2026-03-07 06:41:07');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (106, 3, 59, '2026-03-07 06:41:08');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (107, 3, 60, '2026-03-07 06:41:09');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (108, 3, 61, '2026-03-07 06:41:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (109, 3, 62, '2026-03-07 06:41:12');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (110, 3, 63, '2026-03-07 06:41:13');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (111, 3, 64, '2026-03-07 06:41:14');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (112, 3, 65, '2026-03-07 06:41:15');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (113, 3, 66, '2026-03-07 06:41:17');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (114, 3, 67, '2026-03-07 06:41:18');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (115, 3, 68, '2026-03-07 06:41:19');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (116, 3, 69, '2026-03-07 06:41:20');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (117, 3, 70, '2026-03-07 06:41:22');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (118, 3, 71, '2026-03-07 06:41:23');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (119, 3, 72, '2026-03-07 06:41:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (120, 3, 73, '2026-03-07 06:41:25');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (121, 3, 74, '2026-03-07 06:41:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (122, 3, 75, '2026-03-07 06:41:28');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (123, 3, 76, '2026-03-07 06:41:29');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (124, 3, 77, '2026-03-07 06:41:30');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (125, 3, 78, '2026-03-07 06:41:31');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (126, 3, 79, '2026-03-07 06:41:32');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (127, 3, 80, '2026-03-07 06:41:33');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (128, 3, 81, '2026-03-07 06:41:34');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (129, 3, 82, '2026-03-07 06:41:35');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (130, 3, 83, '2026-03-07 06:41:37');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (131, 3, 84, '2026-03-07 06:41:38');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (132, 3, 85, '2026-03-07 06:41:39');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (133, 3, 86, '2026-03-07 06:41:40');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (134, 3, 87, '2026-03-07 06:41:42');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (135, 3, 88, '2026-03-07 06:41:43');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (136, 3, 89, '2026-03-07 06:41:44');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (137, 3, 90, '2026-03-07 06:41:45');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (138, 3, 91, '2026-03-07 06:41:46');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (139, 3, 92, '2026-03-07 06:41:48');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (140, 3, 93, '2026-03-07 06:41:49');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (141, 3, 94, '2026-03-07 06:41:50');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (142, 3, 95, '2026-03-07 06:41:50');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (143, 4, 3, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (144, 4, 4, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (145, 4, 5, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (146, 4, 6, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (147, 4, 7, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (148, 4, 8, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (149, 4, 9, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (150, 4, 10, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (151, 4, 11, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (152, 4, 12, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (153, 4, 13, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (154, 4, 14, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (155, 4, 15, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (156, 4, 16, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (157, 4, 17, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (158, 4, 18, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (159, 4, 19, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (160, 4, 20, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (161, 4, 21, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (162, 4, 22, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (163, 4, 23, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (164, 4, 24, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (165, 4, 25, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (166, 4, 26, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (167, 4, 27, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (168, 4, 28, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (169, 4, 29, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (170, 4, 30, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (171, 4, 31, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (172, 4, 32, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (173, 4, 33, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (174, 4, 34, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (175, 4, 35, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (176, 4, 36, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (177, 4, 37, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (178, 4, 38, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (179, 4, 39, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (180, 4, 40, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (181, 4, 41, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (182, 4, 42, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (183, 4, 43, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (184, 4, 44, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (185, 4, 45, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (186, 4, 46, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (187, 4, 47, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (188, 4, 48, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (189, 4, 49, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (190, 4, 50, '2026-03-09 02:08:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (191, 4, 51, '2026-03-09 02:08:24');

-- No data found in session_exceptions

-- Data for attendance_logs
-- 32 records

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (2, 1, 3, 1, 'ENTRY', 'FACE', 0.6613537073135376, NULL, '2026-03-07 14:54:09', ' [LATE by 834 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (3, 5, 3, 1, 'ENTRY', 'FACE', 0.64918053150177, NULL, '2026-03-07 15:06:28', '[NOT_IN_CLASS] Pedro Mendoza [NOT_IN_CLASS] [LATE by 16 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (4, 47, 3, 1, 'ENTRY', 'FACE', 0.5395649671554565, NULL, '2026-03-07 15:08:02', '[NOT_IN_CLASS] RASH IAN BEATRIZOLA SINAG [NOT_IN_CLASS] [LATE by 18 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (5, 1, 3, 1, 'EXIT', 'FACE+GESTURE', 0.6573825478553772, 'OPEN_PALM', '2026-03-07 16:25:29', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (6, 1, 3, 1, 'ENTRY', 'FACE', 0.6573825478553772, NULL, '2026-03-07 16:26:02', ' [LATE by 96 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (7, 1, 3, 1, 'EXIT', 'FACE+GESTURE', 0.7125680446624756, 'OPEN_PALM', '2026-03-07 16:29:47', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (8, 1, 3, 1, 'ENTRY', 'FACE', 0.6268854141235352, NULL, '2026-03-07 20:46:08', ' [LATE by 116 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (9, 1, 3, 1, 'EXIT', 'FACE+GESTURE', 0.5960335731506348, 'OPEN_PALM', '2026-03-07 20:55:40', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (10, 1, 3, 1, 'ENTRY', 'FACE', 0.5077186822891235, NULL, '2026-03-07 20:55:55', ' [LATE by 125 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (11, 1, 3, 1, 'EXIT', 'FACE+GESTURE', 0.6379714608192444, 'OPEN_PALM', '2026-03-07 20:56:56', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (12, 1, 3, 1, 'ENTRY', 'FACE', 0.5889655351638794, NULL, '2026-03-07 20:58:44', ' [LATE by 128 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (13, 1, 3, 1, 'EXIT', 'FACE+GESTURE', 0.5091352462768555, 'OPEN_PALM', '2026-03-07 20:59:01', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (15, 3, 4, 1, 'ENTRY', 'FACE', 0.8223409652709961, NULL, '2026-03-09 13:57:04', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (16, 3, 4, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7461367845535278, 'PEACE_SIGN', '2026-03-09 14:25:46', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (17, 3, 4, 1, 'BREAK_IN', 'FACE+GESTURE', 0.7197973728179932, 'THUMBS_UP', '2026-03-09 14:26:06', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (20, 3, 4, 1, 'EXIT', 'FACE+GESTURE', 0.6365185976028442, 'OPEN_PALM', '2026-03-09 14:55:10', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (21, 1, 4, 1, 'ENTRY', 'FACE', 0.7055608034133911, NULL, '2026-03-09 14:58:49', ' [LATE by 63 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (22, 1, 4, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7609539031982422, 'PEACE_SIGN', '2026-03-09 14:59:51', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (23, 1, 4, 1, 'BREAK_IN', 'FACE+GESTURE', 0.5877485871315002, 'THUMBS_UP', '2026-03-09 15:01:21', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (26, 1, 4, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.6081494092941284, 'PEACE_SIGN', '2026-03-09 15:20:56', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (27, 1, 4, 1, 'BREAK_IN', 'FACE+GESTURE', 0.7835729122161865, 'THUMBS_UP', '2026-03-09 15:21:18', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (28, 1, 4, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7688980102539062, 'PEACE_SIGN', '2026-03-09 15:22:23', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (29, 1, 4, 1, 'BREAK_IN', 'FACE+GESTURE', 0.6342662572860718, 'THUMBS_UP', '2026-03-09 15:23:12', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (31, 1, 4, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.5312947630882263, 'PEACE_SIGN', '2026-03-09 15:40:31', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (32, 1, 4, 1, 'BREAK_IN', 'FACE+GESTURE', 0.7823754549026489, 'THUMBS_UP', '2026-03-09 15:40:49', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (33, 1, 4, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.7748422026634216, 'PEACE_SIGN', '2026-03-09 15:41:07', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (34, 1, 4, 1, 'BREAK_IN', 'FACE+GESTURE', 0.734892725944519, 'THUMBS_UP', '2026-03-09 15:41:28', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (35, 1, 4, 1, 'EXIT', 'FACE+GESTURE', 0.7801819443702698, 'OPEN_PALM', '2026-03-09 15:41:51', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (38, 1, 4, 1, 'ENTRY', 'FACE', 0.5919607281684875, NULL, '2026-03-11 13:57:04', ' [LATE by 27 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (39, 1, 4, 1, 'BREAK_OUT', 'FACE+GESTURE', 0.5886707901954651, 'PEACE_SIGN', '2026-03-11 13:57:27', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (40, 1, 4, 1, 'BREAK_IN', 'FACE+GESTURE', 0.5861223936080933, 'THUMBS_UP', '2026-03-11 13:57:43', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (41, 1, 4, 1, 'EXIT', 'FACE+GESTURE', 0.587855875492096, 'OPEN_PALM', '2026-03-11 13:57:59', NULL, FALSE);

-- Data for colleges
-- 1 records

INSERT INTO colleges (id, name, code, created_at)
VALUES (1, 'College of Science', 'COS', '2026-03-04 22:56:53');

-- No data found in notifications

-- Data for user_invites
-- 1 records

INSERT INTO user_invites (id, email, token, department_id, role, expires_at, used, created_at)
VALUES (1, 'karlrico.calingal@tup.edu.ph', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImthcmxyaWNvLmNhbGluZ2FsQHR1cC5lZHUucGgiLCJkZXB0IjoxLCJpYXQiOjE3NzMxMDcyNzIsImV4cCI6MTc3MzI4MDA3MiwidHlwZSI6ImZhY3VsdHlfaW52aXRlIn0.Cvw5yP1YZB33iUM9RfFlgmY3-CJMTghsn7iUalExZK8', 1, 'FACULTY', '2026-03-12 01:47:52', TRUE, '2026-03-10 01:47:54');

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

COMMIT;

-- Export completed successfully
-- Total records exported: 237
