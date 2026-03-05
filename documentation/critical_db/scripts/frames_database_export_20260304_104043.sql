-- FRAMES Database Export
-- Generated on: 2026-03-04 10:40:43
-- Purpose: Complete database backup for restoration
-- Usage: psql -d your_database -f this_file.sql

BEGIN;
-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Data for departments
-- 1 records

INSERT INTO departments (id, name, code, created_at, active_academic_year, active_semester)
VALUES (1, 'Computer Studies Department', 'CSD', '2026-01-31 07:55:11', '2026-2027', '1st Semester');

-- Data for programs
-- 3 records

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (1, 1, 'Bachelor of Science in Information Technology', 'BSIT', '2026-01-31 07:55:11');

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (2, 1, 'Bachelor of Science in Information Systems', 'BSIS', '2026-01-31 07:55:11');

INSERT INTO programs (id, department_id, name, code, created_at)
VALUES (3, 1, 'Bachelor of Science in Computer Science', 'BSCS', '2026-01-31 07:55:11');

-- Data for subjects
-- 10 records

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (2, 'IT232-M', 'IT232-M - Computer Architecture and Organization, Lec Venue : ONLINE', 2, '2026-01-31 09:32:57');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (5, 'IT303-M', 'Systems Integration and Architecture 1', 2, '2026-02-07 11:54:26');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (6, 'CC303-M', 'Methods of Research in Computing', 2, '2026-02-08 05:14:20');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (39, 'IT KEME', 'Kineme', 3, '2026-02-15 06:43:53');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (40, 'IT 326', 'Capstone Project 2', 3, '2026-02-28 04:16:11');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (41, 'IT 322', 'Info Assurance & Security', 3, '2026-02-28 04:16:12');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (42, 'CS 311', 'Operating Systems', 3, '2026-02-28 04:16:12');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (43, 'IS 215', 'Database Administration', 3, '2026-02-28 04:16:12');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (44, 'KIOSK101', 'Kiosk Test Subject', 3, '2026-03-03 16:25:43');

INSERT INTO subjects (id, code, title, units, created_at)
VALUES (48, 'IT314-TEST', 'Web Development', 3, '2026-03-04 02:04:01');

-- Data for users
-- 125 records

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (1, 'head.santos@tup.edu.ph', '$2b$12$KoD9p9e7vL5H15LwZg9xfeN8P2SCTnO9iU5CCKwnX5jJECAvQGbCi', 'TUPM-20-0001', 'HEAD', 'VERIFIED', FALSE, 'Ricardo', 'Santos', 'Cruz', 1, NULL, NULL, NULL, '2026-01-31 07:55:12', '2026-02-01 03:36:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (2, 'maria.dela_cruz@tup.edu.ph', '$2b$12$5T6FdqrsikKkTyRuOga5H.377pGemYbj2/.8mXnOe3NVRp4Xt3Kgq', 'TUPM-21-0101', 'FACULTY', 'VERIFIED', FALSE, 'Maria', 'Dela Cruz', 'Reyes', 1, 1, NULL, NULL, '2026-01-31 07:55:12', '2026-01-31 07:55:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (3, 'juan.garcia@tup.edu.ph', '$2b$12$m079AQoFWvVqCUvEZpOVnO9CjNqOk403JWbcQYQdNvI805i500xXq', 'TUPM-21-0102', 'FACULTY', 'VERIFIED', TRUE, 'Juan', 'Garcia', 'Lopez', 1, 2, NULL, NULL, '2026-01-31 07:55:13', '2026-01-31 07:55:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (4, 'anna.reyes@tup.edu.ph', '$2b$12$vMtutd/4enjrc1wxpS75LO1zfkmiWLautCGgWDiB95/WORxKGLrEG', 'TUPM-21-0103', 'FACULTY', 'VERIFIED', TRUE, 'Anna', 'Reyes', 'Bautista', 1, 3, NULL, NULL, '2026-01-31 07:55:13', '2026-01-31 07:55:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (5, 'pedro.mendoza@tup.edu.ph', '$2b$12$sEm7Y4qkA260ToZOj8G4bO8NVSw4aUpRvITC8GhFmD3gFrGsWodO2', 'TUPM-21-0104', 'FACULTY', 'VERIFIED', TRUE, 'Pedro', 'Mendoza', 'Torres', 1, 1, NULL, NULL, '2026-01-31 07:55:14', '2026-01-31 07:55:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (6, 'elena.fernandez@tup.edu.ph', '$2b$12$9QKXbEorcKSmMDSzOOVPd.T8PHvN3Jf28YjI1xq/WEdLtdAKt.Vy6', 'TUPM-21-0105', 'FACULTY', 'VERIFIED', TRUE, 'Elena', 'Fernandez', 'Castro', 1, 3, NULL, NULL, '2026-01-31 07:55:14', '2026-01-31 07:55:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (7, 'tupm-24-1591@tup.edu.ph', '$2b$12$pk9.AAWUro1zHKqW194IQ.kIeb.jZWKDFR0HCdQ3cLJBB82dgXpp.', 'TUPM-24-1591', 'STUDENT', 'VERIFIED', FALSE, 'ANDEE OBANG', 'ACOSTA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:32:58', '2026-01-31 09:32:58', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (8, 'tupm-24-1951@tup.edu.ph', '$2b$12$phLDpP156IGrOowlA6lENedFy5vVV0RxWuMpCmYYtPElSMsIaEgCC', 'TUPM-24-1951', 'STUDENT', 'VERIFIED', TRUE, 'JHON KENNETH NARISMA', 'AGUINALDO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:32:59', '2026-01-31 09:32:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (9, 'tupm-24-6176@tup.edu.ph', '$2b$12$LX6RTlbXjHBhPbDb7/RVpOgRxAAFRkwpQNoqBS2B6jsV53zKA1762', 'TUPM-24-6176', 'STUDENT', 'VERIFIED', TRUE, 'RANDY JR. MORALES', 'ALONZO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:00', '2026-01-31 09:33:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (10, 'tupm-24-1760@tup.edu.ph', '$2b$12$/cEyP3BacMG44T5DNic1I.HPLif8wnpVbFyAtr04GAaKSIOz/FtFa', 'TUPM-24-1760', 'STUDENT', 'VERIFIED', FALSE, 'MARK LAWRENCE ANGELO MASIGLAT', 'AVILES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:01', '2026-01-31 09:33:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (11, 'tupm-24-1609@tup.edu.ph', '$2b$12$pOPqr7CIhWf5ja81fRNOt.T7tV/zUE3WrhW.UVbgkk9tHKum9XOM2', 'TUPM-24-1609', 'STUDENT', 'VERIFIED', TRUE, 'SIMON REODAVA', 'BERNARDO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:02', '2026-01-31 09:33:02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (12, 'tupm-24-1960@tup.edu.ph', '$2b$12$RQTHn/JCjT4uGXbqwlBdE.ZJ3wBkFOfHIzv.1zmEQbLMlWrs.ND1C', 'TUPM-24-1960', 'STUDENT', 'VERIFIED', FALSE, 'ASHLEY KIM GUANSING', 'BURDEOS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:03', '2026-01-31 09:33:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (13, 'tupm-24-1796@tup.edu.ph', '$2b$12$ZrtCm2UJUTIJ0fAeJVXsVOjjXRmz.hVIl8zWUanW/asIIMgB9AIlS', 'TUPM-24-1796', 'STUDENT', 'VERIFIED', FALSE, 'ANJIE MARK ACOSTA', 'CAPLES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:04', '2026-01-31 09:33:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (14, 'tupm-24-1724@tup.edu.ph', '$2b$12$JykliOjwoBIepKc8.0K1BOZJG08PX7ItcsFtIyo33Kayq/KzG8.jS', 'TUPM-24-1724', 'STUDENT', 'VERIFIED', FALSE, 'BRENT LUWI ESPIRITU', 'CASAS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:05', '2026-01-31 09:33:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (15, 'tupm-24-1685@tup.edu.ph', '$2b$12$vj58KFU4GdZDh1ipoZrZUugpUF.0YryrX/oBscXPgDoBKpRdbW5j2', 'TUPM-24-1685', 'STUDENT', 'VERIFIED', FALSE, 'VETINA GENE GILHANG', 'CLAVATON', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:06', '2026-01-31 09:33:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (16, 'tupm-24-1668@tup.edu.ph', '$2b$12$Xo/RS3tgh/aDWJjCANRHN.Y7HqcIOHpQ4Q7yaIhFtunKbS/1xpONO', 'TUPM-24-1668', 'STUDENT', 'VERIFIED', FALSE, 'MIKAELA DEGRAN', 'COQUILLA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:07', '2026-01-31 09:33:07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (17, 'tupm-24-1605@tup.edu.ph', '$2b$12$xaV/3w5Fh1TxwTNa/dRKouHu/naaxFbDA4MwbcpLerflyB9HOfZFW', 'TUPM-24-1605', 'STUDENT', 'VERIFIED', FALSE, 'ROSHNY JEN LLAVORE', 'CRUZ', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:08', '2026-01-31 09:33:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (18, 'tupm-24-1686@tup.edu.ph', '$2b$12$SVbZMtfB3UuVjovslrMJm.ctCMJzf2TW1XlaVUTjElmHQmlctCaJK', 'TUPM-24-1686', 'STUDENT', 'VERIFIED', FALSE, 'KRIZZA ANGEL CAMPO', 'DELA CRUZ', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:09', '2026-01-31 09:33:09', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (19, 'tupm-24-1677@tup.edu.ph', '$2b$12$geQEactrcNKDSgqaCcwyUu9Qvt9wGIL7K9iGp4NZJoQuh4NkdTaUi', 'TUPM-24-1677', 'STUDENT', 'VERIFIED', FALSE, 'JOVIELYN NESORTADO', 'EGUILLOS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:10', '2026-01-31 09:33:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (20, 'tupm-24-1710@tup.edu.ph', '$2b$12$QgXojMPyIvQwLZ7UIxMcveM/J5Ib37K0XKf32bHWjlNBtPPxY893a', 'TUPM-24-1710', 'STUDENT', 'VERIFIED', FALSE, 'LESTER MEANO', 'ESTAREJA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:13', '2026-01-31 09:33:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (21, 'tupm-24-1766@tup.edu.ph', '$2b$12$UJPIM6lB1BUhd0XEehouqu28k8FHAk2QFzm4dqypo/gByS.6/U.L6', 'TUPM-24-1766', 'STUDENT', 'VERIFIED', FALSE, 'MARK LORENZ GUDES', 'ETANG', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:14', '2026-01-31 09:33:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (22, 'tupm-24-1583@tup.edu.ph', '$2b$12$qfaqQ0qkPHnpXZlAnjM6GuWolLqSvnXcz3BL3q6UV8Vp.md1wFNre', 'TUPM-24-1583', 'STUDENT', 'VERIFIED', FALSE, 'JOHN JHERVY GUTIERREZ', 'EUSEBIO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:16', '2026-01-31 09:33:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (23, 'tupm-24-1776@tup.edu.ph', '$2b$12$7hg2ajaU5IMk0/AYiOMPaOXPmca3RaCECQJkrDjpSK9WMYelbLsni', 'TUPM-24-1776', 'STUDENT', 'VERIFIED', FALSE, 'BEYONCE KELLY VILLARAZA', 'FAJARDO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:20', '2026-01-31 09:33:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (24, 'tupm-24-1597@tup.edu.ph', '$2b$12$OL2JJKXk49/mRYm6oslz7uPWi3JeoyIGNJXaZOhHA5kVKkc6hazRu', 'TUPM-24-1597', 'STUDENT', 'VERIFIED', FALSE, 'FRANCIS VICTOR BAÑARES', 'FROA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:21', '2026-01-31 09:33:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (25, 'tupm-24-1596@tup.edu.ph', '$2b$12$X8YeFJfn2xWA5hn.41.PFOQgXmf6X9VNmDxjqrzSyMvF02zVoCIiG', 'TUPM-24-1596', 'STUDENT', 'VERIFIED', FALSE, 'JHON RYAN SAMONTEZA', 'FULLO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:24', '2026-01-31 09:33:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (26, 'tupm-24-1717@tup.edu.ph', '$2b$12$b5HYrP4ON9/asLQbiOW1FuAwQzivQMx.k6lAQtpW6fCGr6LjPJONO', 'TUPM-24-1717', 'STUDENT', 'VERIFIED', FALSE, 'RENZ MARRION DELA ROSA', 'LABRADOR', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:25', '2026-01-31 09:33:25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (27, 'tupm-24-1794@tup.edu.ph', '$2b$12$euphNpWsyHD4kHapM8HQOeiBHcotVWCZcZ.esNxrWv8H5yQo6HbJy', 'TUPM-24-1794', 'STUDENT', 'VERIFIED', FALSE, 'MARK KEVIN BRIONES', 'LACSON', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:27', '2026-01-31 09:33:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (28, 'tupm-24-1610@tup.edu.ph', '$2b$12$Qi/kOS4pnO0TlCWnLObE3OAOMiCgxxWyuo8Jzs7J6aNGAblfHiQNy', 'TUPM-24-1610', 'STUDENT', 'VERIFIED', FALSE, 'CARL ADRIANNE IGNACIO', 'LASCANO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:28', '2026-01-31 09:33:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (29, 'tupm-24-1719@tup.edu.ph', '$2b$12$KlIb0F7WkjnngRdeWEcEeO3HUHXFqdHYSWtly3zU9wGJQ3coxz50e', 'TUPM-24-1719', 'STUDENT', 'VERIFIED', FALSE, 'REX JEMAR BERNAL', 'LATAYADA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:29', '2026-01-31 09:33:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (30, 'tupm-24-1678@tup.edu.ph', '$2b$12$rWtuyM/Z9xvtBE5syHZ8vO4edl6h5T8Q6O.w6J0BseeKkpn6ffwvO', 'TUPM-24-1678', 'STUDENT', 'VERIFIED', FALSE, 'LIANNE PRINCESS PRUCIA', 'LERIOS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:30', '2026-01-31 09:33:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (31, 'tupm-24-2181@tup.edu.ph', '$2b$12$BuQ4PykJmSoNlBkTE1091OkSHNoJLvBx6kzkGyK2dfKrrWGegx2Si', 'TUPM-24-2181', 'STUDENT', 'VERIFIED', FALSE, 'MARK CHRISTIAN LIMBO', 'LUCTO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:31', '2026-01-31 09:33:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (32, 'tupm-24-2293@tup.edu.ph', '$2b$12$eiYGCrnpmbDhFtjs1va53OIvbzz1yhDoW7TuObn8GMZoaSz4UF6aK', 'TUPM-24-2293', 'STUDENT', 'VERIFIED', FALSE, 'LAWRENCE INES', 'MADERA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:32', '2026-01-31 09:33:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (33, 'tupm-24-1680@tup.edu.ph', '$2b$12$iuldnfMaWOM7Z97X7FXwJe6w8YIJDDMcoZ19pqbah8LG3YWlIqAUC', 'TUPM-24-1680', 'STUDENT', 'VERIFIED', FALSE, 'KENT MICHAEL LEOJ PELIGRO', 'MALINAO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:33', '2026-01-31 09:33:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (34, 'tupm-24-1773@tup.edu.ph', '$2b$12$2meiVJZPbJDdbb21Te92vu202M1QZR/uf.lzRxkR6UXTW9vx5d6nG', 'TUPM-24-1773', 'STUDENT', 'VERIFIED', FALSE, 'JOHN RAIVEN JAÑOZO', 'MANDRAS', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:34', '2026-01-31 09:33:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (35, 'tupm-24-1601@tup.edu.ph', '$2b$12$H54rvGCtR.FnRKmh8ozoCuLC1mw1YDkBzQQKMGmoAT9aTaMlYvHH.', 'TUPM-24-1601', 'STUDENT', 'VERIFIED', FALSE, 'ALDRED CABIQUE', 'MIQUE', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:35', '2026-01-31 09:33:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (36, 'tupm-24-1775@tup.edu.ph', '$2b$12$FFn2fA2nb1xAwTKJu62g8OvtKBHyVmtUCObfUPVLZX3bN/Ic14vKa', 'TUPM-24-1775', 'STUDENT', 'VERIFIED', FALSE, 'RAINIEL ESPINA', 'NAVA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:36', '2026-01-31 09:33:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (37, 'tupm-24-1784@tup.edu.ph', '$2b$12$gm4khk7yNgU0o1yqaB.ceOcUiHHSsjqm0aLblEhdN9YrZDW3qrS1S', 'TUPM-24-1784', 'STUDENT', 'VERIFIED', FALSE, 'JANEL LABANON', 'NUNGAY', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:37', '2026-01-31 09:33:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (38, 'tupm-24-1718@tup.edu.ph', '$2b$12$crAe/09PkFSvCV/JUbhMRukxC4FXdUz0d9UiHQ90HNC6ogTejlO7G', 'TUPM-24-1718', 'STUDENT', 'VERIFIED', FALSE, 'JEFFERSON', 'PADUA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:38', '2026-01-31 09:33:38', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (39, 'tupm-24-1799@tup.edu.ph', '$2b$12$4OJznZd94mRQCzuh95MQIuVzDZG/dRfccjgrngSgCcgPQOI34JonG', 'TUPM-24-1799', 'STUDENT', 'VERIFIED', FALSE, 'JULIE ANN SALAZAR', 'PALMIANO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:39', '2026-01-31 09:33:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (40, 'tupm-24-1684@tup.edu.ph', '$2b$12$VbT0/8Z4ZirX.pb2bDimn.7QR567H1UzBDBAbyi84UcMiTQMnZf7q', 'TUPM-24-1684', 'STUDENT', 'VERIFIED', FALSE, 'MATTHEW GEM INOLINO', 'PATDU', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:40', '2026-01-31 09:33:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (41, 'tupm-24-1722@tup.edu.ph', '$2b$12$8VQxwfV0OgzsQ48Ul2e87.IUKCOvkKq8HnCSMPiv1H3h5fph0GW5C', 'TUPM-24-1722', 'STUDENT', 'VERIFIED', FALSE, 'KHINITO CHRISTIAN CORTEZ', 'PEñAMANTE', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:41', '2026-01-31 09:33:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (42, 'tupm-24-1627@tup.edu.ph', '$2b$12$EhrJymfLMoXod9Sz9fFaH.j2eSlsyhfXJzEjbqfI1R20O3c6pu2.G', 'TUPM-24-1627', 'STUDENT', 'VERIFIED', FALSE, 'HANNAH MAERYL PEREZ', 'PERRARO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:42', '2026-01-31 09:33:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (43, 'tupm-24-1727@tup.edu.ph', '$2b$12$ys2J4ph9KsTlE4Kt9U72j.nf9WVedF9aIBCcwoQt.froBsxVyY14e', 'TUPM-24-1727', 'STUDENT', 'VERIFIED', FALSE, 'ELLYZA MAY VARIAS', 'REYES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:43', '2026-01-31 09:33:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (44, 'tupm-24-1608@tup.edu.ph', '$2b$12$VwYr2WOMinRpkvHnxMJ7OeFdgGlRCWDU7aC53RRN5y4KpU2gwCQYa', 'TUPM-24-1608', 'STUDENT', 'VERIFIED', FALSE, 'JOHN NOVYMHIER SANTIAGO', 'ROSALES', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:44', '2026-01-31 09:33:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (45, 'tupm-24-1753@tup.edu.ph', '$2b$12$mQK5thB3d0DkV0oFOFmapuysF7lNzOSIjdu1WQBqvtXkhoN9NbDVK', 'TUPM-24-1753', 'STUDENT', 'VERIFIED', FALSE, 'JOSIAH BARCELONA', 'SANDAJAN', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:45', '2026-01-31 09:33:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (46, 'tupm-24-1723@tup.edu.ph', '$2b$12$za4j1brJSn8e61dMM95YvO5u1DPgYzGagMiJ7lwLMmsZA0OIPHjUK', 'TUPM-24-1723', 'STUDENT', 'VERIFIED', FALSE, 'JOHN GABRIEL RAMOS', 'SIA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:46', '2026-01-31 09:33:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (47, 'tupm-24-1757@tup.edu.ph', '$2b$12$OHaqAiurIlhZzo7Kr2DvCu8j5XyT3gg4duHsOwociRRNYq80mY.3m', 'TUPM-24-1757', 'STUDENT', 'VERIFIED', FALSE, 'RASH IAN BEATRIZOLA', 'SINAG', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:47', '2026-01-31 09:33:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (48, 'tupm-24-1614@tup.edu.ph', '$2b$12$YWMr2/8UMqIRP7t3Q1TFwOhhQhauez4pqW4t0GTgVXC6pzs29InXS', 'TUPM-24-1614', 'STUDENT', 'VERIFIED', FALSE, 'GERARDO BURGOS', 'SISON', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:48', '2026-01-31 09:33:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (49, 'tupm-24-1623@tup.edu.ph', '$2b$12$aPQrKrQHaG4WX5xxrbgkJ.O.KYE52rQICNvQ.mwS3/QpY8NIXp5Mq', 'TUPM-24-1623', 'STUDENT', 'VERIFIED', FALSE, 'JANNA MARIE VILLANUEVA', 'TAHUM', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:49', '2026-01-31 09:33:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (50, 'tupm-24-1798@tup.edu.ph', '$2b$12$SUFvbwYYFRzFXVoxU0/hb.MKPPPGOib3Vz4TrT5I74p4AT1zEQkAa', 'TUPM-24-1798', 'STUDENT', 'VERIFIED', FALSE, 'JAIMEE KELLY DAVID', 'TORCELINO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:50', '2026-01-31 09:33:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (51, 'tupm-24-1762@tup.edu.ph', '$2b$12$fWwzmpfXH7jOo10BIj6FK.yYHmctgHlMc005X2Nma.U6D6EZdKyUW', 'TUPM-24-1762', 'STUDENT', 'VERIFIED', FALSE, 'ARRIANI JENN BALDAH', 'UNATING', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:51', '2026-01-31 09:33:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (52, 'tupm-24-2161@tup.edu.ph', '$2b$12$lFFfj7f48skFrwsTSSEMTONDMxXoP3b7qp5evOUmJSoaEqPoYm2qS', 'TUPM-24-2161', 'STUDENT', 'VERIFIED', FALSE, 'KESHENNA IYELLE PABILLORE', 'VALERIO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:52', '2026-01-31 09:33:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (53, 'tupm-24-1720@tup.edu.ph', '$2b$12$.1E/D.V2DFfsur8NRPIbeOylair3BUNpmWPMXdf6KSA7kzJ33yT/W', 'TUPM-24-1720', 'STUDENT', 'VERIFIED', FALSE, 'STEVEN VALDEZ', 'VALEROSO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:53', '2026-01-31 09:33:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (54, 'tupm-24-1687@tup.edu.ph', '$2b$12$qiEW2G6zdH/Mo3Kdt5EG3.e1c4HlNX3w8ZIlKecMDJqlLrbpV59Uy', 'TUPM-24-1687', 'STUDENT', 'VERIFIED', FALSE, 'LUKE DWYANE RAMIREZ', 'VIDAMO', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:54', '2026-01-31 09:33:54', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (55, 'tupm-24-1602@tup.edu.ph', '$2b$12$oTZBRQDCRVG4g9H3RrQu.e7t5DTCq.buOTOOKD2rj7.Ghw6q02KRa', 'TUPM-24-1602', 'STUDENT', 'VERIFIED', FALSE, 'ALEXIS ALONZO', 'VILLANUEVA', NULL, NULL, NULL, NULL, 'BSIT-2B-M', '2026-01-31 09:33:55', '2026-01-31 09:33:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (56, 'elena.llana@tup.edu.ph', '$2b$12$npMfFqNwYQNrkvJJJ7vFMuPOgIblAb4Rl1VFwkqWc34.yUnqBv3/K', 'TUPM-22-0368', 'STUDENT', 'REJECTED', FALSE, 'Elana', 'Llana', 'Juan', NULL, NULL, NULL, NULL, '2026-02-05 03:04:24', '2026-02-15 06:57:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (57, 'tupm-23-2190@tup.edu.ph', '$2b$12$rKxQ6znOpXIyTwkrsOILxelYDWBe038iB2IRv2y/h9aYbwbv/Nfba', 'TUPM-23-2190', 'STUDENT', 'VERIFIED', FALSE, 'NICHOLAS ANDREW LEONARDO', 'ALCANTARA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:04', '2026-02-07 08:07:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (58, 'tupm-23-2133@tup.edu.ph', '$2b$12$swr5q1JbdCBaWEoz16WUOO9uHbytVXXrskd/19PmCAfQx9k9ARV/i', 'TUPM-23-2133', 'STUDENT', 'VERIFIED', FALSE, 'ANDREA MIKAELA AMAGSILA', 'ALGARA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:05', '2026-02-07 08:07:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (59, 'tupm-23-2253@tup.edu.ph', '$2b$12$d1ySULkFQ5TyBJcp2xKyw.6jm9BWzA8ITxot5s92AWJ3qDLZzjAMq', 'TUPM-23-2253', 'STUDENT', 'VERIFIED', FALSE, 'VIA YSABELLE BUTIN', 'ALMARIO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:06', '2026-02-07 08:07:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (60, 'tupm-23-1600@tup.edu.ph', '$2b$12$h8JCf8Kjgb3rYbhuIdaMgeZStt7ZGbNFm0a0w1T81SV7pSiaH5/Mm', 'TUPM-23-1600', 'STUDENT', 'VERIFIED', FALSE, 'RANDEL THOMAS OLIVEROS', 'BABAO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:07', '2026-02-07 08:07:07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (61, 'tupm-23-2120@tup.edu.ph', '$2b$12$YSzj9.UwXF4xoo0PfvCnQev8nu0uTewG8qavvmXRSMHEZTq20qJnK', 'TUPM-23-2120', 'STUDENT', 'VERIFIED', FALSE, 'JIREH GEUEL F.', 'BERNARDINO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:08', '2026-02-07 08:07:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (62, 'tupm-23-1715@tup.edu.ph', '$2b$12$flaRuSzi6NxaSdpJrsHs/uokzT/lnuRdPdXgwuPflR4EXz9r3kyg2', 'TUPM-23-1715', 'STUDENT', 'VERIFIED', FALSE, 'JUAN MIGUEL DIAMSAY', 'CAMPOMANES', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:10', '2026-02-07 08:07:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (63, 'tupm-23-1657@tup.edu.ph', '$2b$12$D3rBuLPtgLagxVprurAab.FhEFiC/CzDVAOOVJPttSVAPiVMDb3fW', 'TUPM-23-1657', 'STUDENT', 'VERIFIED', FALSE, 'TRISTAN JHON REYES', 'CAPUYAN', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:11', '2026-02-07 08:07:11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (64, 'tupm-23-2173@tup.edu.ph', '$2b$12$fRm3Bo90.QkrcNJZrRHILux6oSGJghlu7bJ9UMnU/JGl0MlRwEz3u', 'TUPM-23-2173', 'STUDENT', 'VERIFIED', FALSE, 'JAY LAWRENCE CAJANDING', 'CERNIAZ', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:13', '2026-02-07 08:07:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (65, 'tupm-23-2126@tup.edu.ph', '$2b$12$EQYGuJhGC9235h0M8ejvhO6V28RnjThVY1wRBycXuELWxMV6KFa7u', 'TUPM-23-2126', 'STUDENT', 'VERIFIED', FALSE, 'GLADYS GAIL STA. MARIA', 'COCHING', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:14', '2026-02-07 08:07:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (66, 'tupm-23-2214@tup.edu.ph', '$2b$12$b63lRXAk6CFHQAHZN8nExusOBCJwXJoKi8HAbKkgcEKyG9hLM9i.y', 'TUPM-23-2214', 'STUDENT', 'VERIFIED', FALSE, 'KOBE LUIS ILUIS', 'CUISON', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:15', '2026-02-07 08:07:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (67, 'tupm-23-2165@tup.edu.ph', '$2b$12$8PPEzUxmUIF4Cn8n7j39SObJegQ3O0ld9rFXoBeWVciPeaJWQP7qq', 'TUPM-23-2165', 'STUDENT', 'VERIFIED', FALSE, 'NERO ARBERT DADIS', 'DE PAZ', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:16', '2026-02-07 08:07:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (68, 'tupm-23-2101@tup.edu.ph', '$2b$12$jz4X3pbS3BmHq1x4ONuOWObmMHkhh088yJMYAI4h0tD0WjcW8LCe6', 'TUPM-23-2101', 'STUDENT', 'VERIFIED', FALSE, 'JOHN CEDRICK BALDEO', 'DELACORTA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:17', '2026-02-07 08:07:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (69, 'tupm-23-2326@tup.edu.ph', '$2b$12$5Zj2aF35t9UoLInxqC4/T.Cpil93GCkywwBCfEgz3ZQpscNZdO0gC', 'TUPM-23-2326', 'STUDENT', 'VERIFIED', FALSE, 'RALPH MICHAEL NIETO', 'EVANGELISTA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:18', '2026-02-07 08:07:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (70, 'tupm-23-2105@tup.edu.ph', '$2b$12$qJr259KC1gcQRStf9VYcdumehpX.15K00qm1Qu9JmK2hxbCDoeoyK', 'TUPM-23-2105', 'STUDENT', 'VERIFIED', FALSE, 'JUSTINE CARL QUIDILIG', 'FABIAN', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:19', '2026-02-07 08:07:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (71, 'tupm-23-2182@tup.edu.ph', '$2b$12$LFoVgVD4ETCxZKNbvtYkVuoQ7jnYr.ngY//pOqp0U3PlFk42xW0YG', 'TUPM-23-2182', 'STUDENT', 'VERIFIED', FALSE, 'ANNE JANELLE PERALTA', 'FRONDA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:20', '2026-02-07 08:07:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (72, 'tupm-23-2055@tup.edu.ph', '$2b$12$ovVVHq3V5mJAyWNgnQWUm./426qHajDdcLBvLG3W.vuSp/qoVyOiW', 'TUPM-23-2055', 'STUDENT', 'VERIFIED', FALSE, 'ARKIN PHOENIX DE GUZMAN', 'JAROMAMAY', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:21', '2026-02-07 08:07:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (73, 'tupm-23-2205@tup.edu.ph', '$2b$12$y1WLXhOh6.tyk2msWk51RuzkTbG8gSN9cHO6TWZwkDQepuZCmIXt6', 'TUPM-23-2205', 'STUDENT', 'VERIFIED', FALSE, 'ZEINT JUSTINE BARANDON', 'LACRA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:22', '2026-02-07 08:07:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (74, 'tupm-23-2082@tup.edu.ph', '$2b$12$0TRFweWphQKEBT1Edggf3eOZyB10aYL65wvXoc1DU5EncVZGIztDm', 'TUPM-23-2082', 'STUDENT', 'VERIFIED', FALSE, 'ALTHEA MARIE SANTOS', 'LAURENTE', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:23', '2026-02-07 08:07:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (75, 'tupm-23-2131@tup.edu.ph', '$2b$12$wxIyjyP85zD3Ot0clQ.GM.N3A/hb687ZQK5MM2bfkMF.BFlpJELTG', 'TUPM-23-2131', 'STUDENT', 'VERIFIED', FALSE, 'IAN LESTER DIÑO', 'LESIGUES', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:25', '2026-02-07 08:07:25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (76, 'tupm-23-2049@tup.edu.ph', '$2b$12$zvR6vlULgxSCdLvUIdWpxed7A32SdCaHrqHMvGRi9NnwsJI567tda', 'TUPM-23-2049', 'STUDENT', 'VERIFIED', FALSE, 'ZAILA MAE MABUTOL', 'LLANILLO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:26', '2026-02-07 08:07:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (77, 'tupm-23-1610@tup.edu.ph', '$2b$12$BK4linXDgkswtjCrRzv/.O7p3DrVnBVJfRaKfUKg.6f9MSH1gtaSC', 'TUPM-23-1610', 'STUDENT', 'VERIFIED', FALSE, 'JASPER CERWYN EUSTACIO', 'LUZANA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:28', '2026-02-07 08:07:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (78, 'tupm-23-1671@tup.edu.ph', '$2b$12$0Te77vuzivQhKt34NOQfF.MLalFSSigqXgmU90xcmd0SciRK.wGp.', 'TUPM-23-1671', 'STUDENT', 'VERIFIED', FALSE, 'GINOBBLI ALFRED ENRIQUEZ', 'MACASADIA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:28', '2026-02-07 08:07:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (79, 'tupm-23-2079@tup.edu.ph', '$2b$12$DmUgF3TwZQBJZz8DI4GFoulYbZx/LZBbtGZfmqfCMe9be3H9odZh2', 'TUPM-23-2079', 'STUDENT', 'VERIFIED', FALSE, 'RICKY ANDREW ANIMA', 'MONTOYA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:30', '2026-02-07 08:07:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (80, 'tupm-23-2153@tup.edu.ph', '$2b$12$6jlin/KzJa09YBcfgc/o2.ytxPJL6qcx1Wb4hTU088/NlEkQMRK0u', 'TUPM-23-2153', 'STUDENT', 'VERIFIED', FALSE, 'KARL CEDRICK REFORMADO', 'NAMUCO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:31', '2026-02-07 08:07:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (81, 'tupm-23-2215@tup.edu.ph', '$2b$12$BeNM7ZUiSgmbHDGsGOzBRe7N9wlmiq7gY.qy7x.Ocjzl8Iz/4YoyK', 'TUPM-23-2215', 'STUDENT', 'VERIFIED', FALSE, 'ALLEN GABRIELLE SAN ANDRES', 'PASION', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:32', '2026-02-07 08:07:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (82, 'tupm-23-1737@tup.edu.ph', '$2b$12$zjr6gj/ijnu6Sqg0M26MIur5Tym2IRgQWowP0LrUWu4B.fUiOPe82', 'TUPM-23-1737', 'STUDENT', 'VERIFIED', FALSE, 'J.C. ROEVEN PEREGRINA', 'PEJI', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:33', '2026-02-07 08:07:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (83, 'tupm-23-1731@tup.edu.ph', '$2b$12$eRoRRzbXpBhxOG7M5HCvYudjlZB2Bd0Z7f4ag.NKHBjgKUZPD5ZYK', 'TUPM-23-1731', 'STUDENT', 'VERIFIED', FALSE, 'LEONARD OBILLO', 'PUEBLOS', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:35', '2026-02-07 08:07:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (84, 'tupm-23-1691@tup.edu.ph', '$2b$12$KAKpJWnoCcieo5xNDC3Hx.hfuPtkZxjqAC8WgdQK3MOQn10aCvrte', 'TUPM-23-1691', 'STUDENT', 'VERIFIED', FALSE, 'KIRBY DELA PAZ', 'RAMILO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:36', '2026-02-07 08:07:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (85, 'tupm-23-1662@tup.edu.ph', '$2b$12$Px9iwp08uNe/9gdgaYNk5OADiEPA6zbg/XUCf3F1Z.Ovmx8aYxQwm', 'TUPM-23-1662', 'STUDENT', 'VERIFIED', FALSE, 'WHAYEN ASHLEY CAñIZARES', 'SALUDO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:37', '2026-02-07 08:07:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (86, 'tupm-23-2063@tup.edu.ph', '$2b$12$o5JWeu0dgnsSDQfimhDnyO/ydvClnGOwHkk1Mr0UhBFPua0ERRnTm', 'TUPM-23-2063', 'STUDENT', 'VERIFIED', FALSE, 'PRINZE KYLE MAGDADARO', 'SANTIAGO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:39', '2026-02-07 08:07:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (87, 'tupm-23-2089@tup.edu.ph', '$2b$12$tA1WPBIXRwJY2rgYDh9MNeRXVkaC1YvZJplr9hdccU6wY5yp/hsGu', 'TUPM-23-2089', 'STUDENT', 'VERIFIED', FALSE, 'WIAN LEI ATIGA', 'SANTOS', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:40', '2026-02-07 08:07:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (88, 'tupm-23-2110@tup.edu.ph', '$2b$12$L7erlShW9VooxaVj8FM7cO0SPEU5qnY0FeGb3ejKM/Kek7o3JDV/q', 'TUPM-23-2110', 'STUDENT', 'VERIFIED', FALSE, 'JOHN CARL SALAS', 'SEPARA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:41', '2026-02-07 08:07:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (89, 'tupm-23-2123@tup.edu.ph', '$2b$12$dISuI0XRhVTRkcou5S3vdeZom9r8hbQ2KWG0Ea1mWeAbiA.4vDlBm', 'TUPM-23-2123', 'STUDENT', 'VERIFIED', FALSE, 'IA MARY REPOLITO', 'SORIO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:42', '2026-02-07 08:07:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (90, 'tupm-23-2117@tup.edu.ph', '$2b$12$1831cQ9hjM9XVmqPww1ZOueW8hV1atOWJqhxTm/QmcexbJU8UzHVu', 'TUPM-23-2117', 'STUDENT', 'VERIFIED', FALSE, 'TIMOTHY AMORES', 'TALAGTAG', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:43', '2026-02-07 08:07:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (91, 'tupm-23-1617@tup.edu.ph', '$2b$12$3joxsauZxUEj9xbWFoOKOO/eWNCeLjJRtKV9JklYEWQP5xYaPWhaa', 'TUPM-23-1617', 'STUDENT', 'VERIFIED', FALSE, 'ARLETTE BAEL', 'TUASTUMBAN', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:44', '2026-02-07 08:07:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (92, 'tupm-23-2210@tup.edu.ph', '$2b$12$P5YwkpgMhrI28ZbigGsfP.u8WfeddkGnA7Y4hHAE1Cg34qe59ik4u', 'TUPM-23-2210', 'STUDENT', 'VERIFIED', FALSE, 'DAVID ERWIN ROMERO', 'VALDEPENA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:45', '2026-02-07 08:07:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (93, 'tupm-23-2046@tup.edu.ph', '$2b$12$PYTDsMfLppzyGV6Qq9e4qeBMRwP0xj8elo70n2qFPUKjMlJLUTntC', 'TUPM-23-2046', 'STUDENT', 'VERIFIED', FALSE, 'PAUL NATHAN RADAM', 'VALEÑA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:46', '2026-02-07 08:07:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (94, 'tupm-23-2058@tup.edu.ph', '$2b$12$Gc.iC6gVrezWnygqug5KNuxAT68aklmtXEn6sZZfcvdP/KoOgmdG6', 'TUPM-23-2058', 'STUDENT', 'VERIFIED', FALSE, 'SHARMAINE HANNAH PILAPIL', 'VALENZUELA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:47', '2026-02-07 08:07:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (95, 'tupm-23-2114@tup.edu.ph', '$2b$12$1.0yH9dPuPxfB0YdNVPQIuns/Wt3BtyM6ondAcc/cVryCZz3plMzC', 'TUPM-23-2114', 'STUDENT', 'VERIFIED', FALSE, 'ARABELLA SAMSON', 'VALERIO', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:48', '2026-02-07 08:07:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (96, 'tupm-23-2086@tup.edu.ph', '$2b$12$8qLk0B30IDf5Be.TY7gVW.RysGXxcMb9rHkaVT8oBpv0pTxHT4XbK', 'TUPM-23-2086', 'STUDENT', 'VERIFIED', FALSE, 'KRISHNA COLEEN PEREZ', 'VENGUA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:49', '2026-02-07 08:07:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (97, 'tupm-23-2212@tup.edu.ph', '$2b$12$QDzp42PeP1XxdBJMHWlN6uyyoz6fjwzZ6b7uMsG1hZbQWKuEJiyHW', 'TUPM-23-2212', 'STUDENT', 'VERIFIED', FALSE, 'LYLA JANE LLENA', 'VILLANUEVA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:50', '2026-02-07 08:07:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (98, 'tupm-23-2091@tup.edu.ph', '$2b$12$eqg/cLvB1POiVLr4JrnEcuwQ7BbnwL0f3TxcIcieb9CDLykHUpBrK', 'TUPM-23-2091', 'STUDENT', 'VERIFIED', TRUE, 'CHARLES JUSTIN RAYCO', 'VIZCARRA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:51', '2026-02-07 08:07:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (99, 'tupm-23-2217@tup.edu.ph', '$2b$12$NiH1xh6sN9JF5G/OjDnxbOVcJ1CgO6vN3vb5Ss19gAzj/poJuX6Ea', 'TUPM-23-2217', 'STUDENT', 'VERIFIED', FALSE, 'TYRONE JOHN FRESNIDO', 'ZAPATA', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:07:52', '2026-02-07 08:07:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (100, 'tupm-22-1995@tup.edu.ph', '$2b$12$52nBaC6W9u9RPzJWa7RYJuFcxHTQY2bORlCvV20rkio7vtt6eF01.', 'TUPM-22-1995', 'STUDENT', 'VERIFIED', FALSE, 'KRIZTEN ANTOINETTE BEJARIN', 'LAPUZ', NULL, NULL, NULL, NULL, 'BSIT-3A-M', '2026-02-07 08:25:19', '2026-02-07 08:25:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (101, 'deee@gmail.com', '$2b$12$1d4/6m99I9yDsQdUvlVEIO7lknezzUAFcrMwGXcW9Ozj6c8YiYziS', 'TUPM-22-0987', 'FACULTY', 'VERIFIED', FALSE, 'deedee', 'mcdoodoo', 'de', NULL, NULL, NULL, NULL, '2026-02-08 05:38:03', '2026-02-15 06:57:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (134, 'efewf@gmail.com', '$2b$12$GigaPx2XCmdiujJ4tGPP3.fXGfzN3MddR4t2Ht7uoML2FC0vSnILG', 'TUPM-22-0098', 'STUDENT', 'VERIFIED', FALSE, 'as', 'ca', 'sa', NULL, NULL, NULL, NULL, '2026-02-16 09:20:48', '2026-02-25 20:41:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (135, 'ana.martinez@tup.edu.ph', '$2b$12$mHVSo4GOavI0J15Fjcjz9O6fcbZPKaUy7r/Oo6VtpRNTc.LsM2y4K', 'TUPM-22-1001', 'STUDENT', 'VERIFIED', TRUE, 'Ana', 'Martinez', NULL, 1, NULL, NULL, 'BSIT-4A', '2026-02-28 04:16:15', '2026-02-28 04:16:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (136, 'carlos.rivera@tup.edu.ph', '$2b$12$nBDsIYLAaAdkogHWW.kCEed66BB72AHkM9ALCx.eYKV/Z4hkTyRJu', 'TUPM-22-1002', 'STUDENT', 'VERIFIED', TRUE, 'Carlos', 'Rivera', NULL, 1, NULL, NULL, 'BSIT-4B', '2026-02-28 04:16:15', '2026-02-28 04:16:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (137, 'diana.cruz@tup.edu.ph', '$2b$12$J0ICJoJXN0l6zPy58.V.2.BQeIscJQrx0MywOPIPhFffrf.J7Lfrq', 'TUPM-22-1003', 'STUDENT', 'VERIFIED', TRUE, 'Diana', 'Cruz', NULL, 1, NULL, NULL, 'BSIT-4C', '2026-02-28 04:16:16', '2026-02-28 04:16:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (138, 'edgar.lim@tup.edu.ph', '$2b$12$NX7DmvuKlq9bTozxuPmbfOcfkWAYg2ICdiIU6FVPDULlwcBNUkLIa', 'TUPM-22-1004', 'STUDENT', 'VERIFIED', TRUE, 'Edgar', 'Lim', NULL, 1, NULL, NULL, 'BSIT-4D', '2026-02-28 04:16:16', '2026-02-28 04:16:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (139, 'fatima.santos@tup.edu.ph', '$2b$12$Gu1OFeuWjgZ5LdLTD2OqpeIEY3VglnU5mErzu2MouDzbXycub8bPe', 'TUPM-22-1005', 'STUDENT', 'VERIFIED', TRUE, 'Fatima', 'Santos', NULL, 1, NULL, NULL, 'BSIT-4A', '2026-02-28 04:16:17', '2026-02-28 04:16:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (140, 'gabriel.tan@tup.edu.ph', '$2b$12$2e0zk56WbBORJX0uS5w8henGmfjd7ivKNJaSX4RUcVhsH8wC/FvVK', 'TUPM-22-1006', 'STUDENT', 'VERIFIED', TRUE, 'Gabriel', 'Tan', NULL, 1, NULL, NULL, 'BSIT-4B', '2026-02-28 04:16:17', '2026-02-28 04:16:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (141, 'hannah.gomez@tup.edu.ph', '$2b$12$t6w3RVWuc1tCtIriDVud9Ox1o35NzcaOqXenq9r6rAefISv9xKlyO', 'TUPM-22-1007', 'STUDENT', 'VERIFIED', TRUE, 'Hannah', 'Gomez', NULL, 1, NULL, NULL, 'BSIT-4C', '2026-02-28 04:16:18', '2026-02-28 04:16:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (142, 'ivan.aquino@tup.edu.ph', '$2b$12$SCr48MEqAVKc/i.nNN0geuPW3YIMzyPKerGM7XQ.NZRccM27z48hy', 'TUPM-22-1008', 'STUDENT', 'VERIFIED', TRUE, 'Ivan', 'Aquino', NULL, 1, NULL, NULL, 'BSIT-4D', '2026-02-28 04:16:18', '2026-02-28 04:16:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (143, 'julia.castro@tup.edu.ph', '$2b$12$6zyc3IPazGDrHrW.tBghL.e70H90FPdZB88pyb3YVqWPF5rufhyyS', 'TUPM-22-1009', 'STUDENT', 'VERIFIED', TRUE, 'Julia', 'Castro', NULL, 1, NULL, NULL, 'BSIT-4A', '2026-02-28 04:16:19', '2026-02-28 04:16:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (144, 'kevin.ramos@tup.edu.ph', '$2b$12$x55dIxL9w0b7Bsj0d5kBl.p2hro397xqYuCfHPh1ym/dLU2iAm6Ry', 'TUPM-22-1010', 'STUDENT', 'VERIFIED', TRUE, 'Kevin', 'Ramos', NULL, 1, NULL, NULL, 'BSIT-4B', '2026-02-28 04:16:19', '2026-02-28 04:16:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (145, 'luna.bautista@tup.edu.ph', '$2b$12$VxLQHBjGgAe/6wJ7uk4vneeY3ryUIUZrKxT5ZVhL4f9fXswc/eRAS', 'TUPM-22-1011', 'STUDENT', 'VERIFIED', TRUE, 'Luna', 'Bautista', NULL, 1, NULL, NULL, 'BSIT-4C', '2026-02-28 04:16:20', '2026-02-28 04:16:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (146, 'marco.villanueva@tup.edu.ph', '$2b$12$FU0Oo7CQNOCFunAI8ZLCge/lKKb9ICKZNWAUE3p2s/./4AQb0ROBa', 'TUPM-22-1012', 'STUDENT', 'VERIFIED', TRUE, 'Marco', 'Villanueva', NULL, 1, NULL, NULL, 'BSIT-4D', '2026-02-28 04:16:20', '2026-02-28 04:16:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (147, 'nina.soriano@tup.edu.ph', '$2b$12$AHqBzTAOiJFteTdpGv6CVeMWQ9OCmiHGe1ghJhe9pdAni4uw4T4L2', 'TUPM-22-1013', 'STUDENT', 'VERIFIED', TRUE, 'Nina', 'Soriano', NULL, 1, NULL, NULL, 'BSIT-4A', '2026-02-28 04:16:21', '2026-02-28 04:16:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (148, 'oscar.diaz@tup.edu.ph', '$2b$12$YVAKOtpPAsZ3caiEn1WrDe8wicy/UdCkXjdq0WcIOd1IcDN5slmwO', 'TUPM-22-1014', 'STUDENT', 'VERIFIED', TRUE, 'Oscar', 'Diaz', NULL, 1, NULL, NULL, 'BSIT-4B', '2026-02-28 04:16:21', '2026-02-28 04:16:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (149, 'patricia.ferrer@tup.edu.ph', '$2b$12$bZEb7iSyrpPEeLvstcfYVOX5Bgg6glgn2PDDYQ8DP4dZj0jmrOvlW', 'TUPM-22-1015', 'STUDENT', 'VERIFIED', TRUE, 'Patricia', 'Ferrer', NULL, 1, NULL, NULL, 'BSIT-4C', '2026-02-28 04:16:22', '2026-02-28 04:16:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (150, 'rafael.manalo@tup.edu.ph', '$2b$12$ZQdZ.NNqWUVfLQ2zPVJK8egbMnwLJATE4T/8AE.MIYJ2qSAD32.QK', 'TUPM-22-1016', 'STUDENT', 'VERIFIED', TRUE, 'Rafael', 'Manalo', NULL, 1, NULL, NULL, 'BSIT-4D', '2026-02-28 04:16:22', '2026-02-28 04:16:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (151, 'sofia.pascual@tup.edu.ph', '$2b$12$aiq4tWQF1JfwLyhpfCnOmerws1ChTsZSMJBGmwh8k/T/MwKY5knES', 'TUPM-22-1017', 'STUDENT', 'VERIFIED', TRUE, 'Sofia', 'Pascual', NULL, 1, NULL, NULL, 'BSIT-4A', '2026-02-28 04:16:23', '2026-02-28 04:16:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (152, 'tomas.alvarez@tup.edu.ph', '$2b$12$yGiXU7bge.lEDnpSTI64vutlZQKgEztx69bvJp1BQKsV3KQ4l4ryu', 'TUPM-22-1018', 'STUDENT', 'VERIFIED', TRUE, 'Tomas', 'Alvarez', NULL, 1, NULL, NULL, 'BSIT-4B', '2026-02-28 04:16:23', '2026-02-28 04:16:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (153, 'uriel.navarro@tup.edu.ph', '$2b$12$f6FhPLu0JVPvXnSyQpusX.mYE41CCposVAeDdJA/c4VycIi10jEVi', 'TUPM-22-1019', 'STUDENT', 'VERIFIED', TRUE, 'Uriel', 'Navarro', NULL, 1, NULL, NULL, 'BSIT-4C', '2026-02-28 04:16:24', '2026-02-28 04:16:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (154, 'victoria.jimenez@tup.edu.ph', '$2b$12$fRYqWWRnOSgoTP05.X.UWeoDIfifEhl.Gwj.68QtMtKW0Wa0pPFCu', 'TUPM-22-1020', 'STUDENT', 'VERIFIED', TRUE, 'Victoria', 'Jimenez', NULL, 1, NULL, NULL, 'BSIT-4D', '2026-02-28 04:16:24', '2026-02-28 04:16:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (155, 'brian@gmail.com', '$2b$12$7.wFRhAioZTTfZwmW.BrjutXFobIu3pvYEDYKlTV5FVnfc0FeiP62', 'TUPM-22-0184', 'FACULTY', 'VERIFIED', TRUE, 'Brian', 'Balut', NULL, 1, 1, NULL, NULL, '2026-02-28 08:01:51', '2026-02-28 08:02:35', '2nd Semester', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (156, 'dubud13@gmail.com', '$2b$12$41wrAdEJTUjPxUEJf4yu9.T/5KbwwF4o2J01W6c.qurWWWe2A5R9C', 'TUPM-33-4334', 'FACULTY', 'VERIFIED', FALSE, 'ere', 'grer', NULL, 1, NULL, NULL, NULL, '2026-02-28 08:23:24', '2026-02-28 08:25:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO users (id, email, password_hash, tupm_id, role, verification_status, face_registered, first_name, last_name, middle_name, department_id, program_id, year_level, section, created_at, last_active, current_term, contact_number, birthday, home_address, academic_advisor, gpa, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_address)
VALUES (158, 'aiang.rathavit34@gmail.com', '$2b$12$Y1/15bU9V1r93WuDlRtI5O01n1O1UWiRudeLztwdU2t/mvjSCbkcS', 'TUPM-33-2342', 'FACULTY', 'VERIFIED', FALSE, 'cxcz', 'zczs', 'szc', 1, 2, NULL, NULL, '2026-03-01 09:57:11', '2026-03-01 09:57:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Data for devices
-- 1 records

INSERT INTO devices (id, room, ip_address, device_name, status, created_at, last_heartbeat, room_capacity)
VALUES (1, 'CL1', '192.168.1.100', 'KIOSK-CL1', 'ACTIVE', '2026-03-04 02:40:22', NULL, 40);

-- Data for facial_profiles
-- 9 records

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (1, 6, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-27 06:32:59', '2026-02-27 06:32:59', 15, 0.7421858310699463);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (2, 11, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-27 06:41:34', '2026-02-27 06:41:34', 15, 0.6685296297073364);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (3, 5, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-27 06:48:04', '2026-02-27 06:48:04', 15, 0.6676657199859619);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (4, 3, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-27 06:53:50', '2026-02-27 06:53:50', 15, 0.6734037399291992);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (5, 4, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-27 06:57:37', '2026-02-27 06:57:37', 13, 0.5205022692680359);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (6, 9, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-28 03:22:00', '2026-02-28 03:22:00', 15, 0.8574433406194051);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (9, 155, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-28 08:06:30', '2026-02-28 08:06:30', 13, 0.5474376082420349);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (10, 8, NULL::bytea, 'insightface_buffalo_l_v1', '2026-02-28 13:16:34', '2026-02-28 13:16:34', 5, 0.5109989643096924);

INSERT INTO facial_profiles (id, user_id, embedding, model_version, created_at, updated_at, num_samples, enrollment_quality)
VALUES (11, 98, NULL::bytea, 'insightface_buffalo_l_v1', '2026-03-01 10:03:27', '2026-03-01 10:03:27', 15, 0.5628582239151001);

-- Data for classes
-- 13 records

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (2, 2, 2, 'ONLINE', 'Wednesday', '18:00:00', '20:00:00', 'BSIT-2B-M', '1st Semester', '2024-2025', '2026-01-31 09:32:57', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (3, 2, 6, 'Room 306', 'Wednesday', '09:00:00', '23:30:00', 'BSIT-2B-M', '1st Semester', '2025-2026', '2026-01-31 09:37:54', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (14, 6, 4, 'Room 306', 'Friday', '16:00:00', '20:00:00', 'BSIT-3A-M', '1st Semester', '2024-2025', '2026-02-08 05:14:21', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (47, 39, 101, 'Room 302', 'Monday', '09:00:00', '12:00:00', 'TBA', NULL, NULL, '2026-02-15 06:44:04', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (48, 40, 5, 'Room 326', 'Saturday', '07:00:00.174990', '08:30:00.174990', 'BSIT-4A', '1st Semester', '2025-2026', '2026-02-28 04:16:13', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (49, 41, 1, 'Room 322', 'Saturday', '09:00:00.579089', '10:30:00.579089', 'BSIT-4B', '1st Semester', '2025-2026', '2026-02-28 04:16:13', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (50, 42, 3, 'Room 311', 'Saturday', '11:00:00.978158', '12:30:00.978158', 'BSIT-4C', '1st Semester', '2025-2026', '2026-02-28 04:16:13', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (51, 43, 6, 'Room 215', 'Saturday', '13:00:00.378462', '14:30:00', 'BSIT-4D', '1st Semester', '2025-2026', '2026-02-28 04:16:14', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (52, 5, 5, 'TBA', 'Tuesday', '14:30:00', '16:00:00', 'BSIT-3A-M', '1st Semester', '2024-2025', '2026-03-01 05:38:22', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (53, 5, 5, 'TBA', 'Thursday', '14:30:00', '16:00:00', 'BSIT-3A-M', '1st Semester', '2024-2025', '2026-03-01 05:38:25', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (54, 6, 5, 'TBA', 'Thursday', '17:00:00', '20:00:00', 'BSIT-3A-M', '1st Semester', '2024-2025', '2026-03-01 06:55:19', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (55, 44, 2, 'CL1', 'Wednesday', '23:55:00', '02:25:00', 'KIOSK-TEST', '2nd Semester', '2025-2026', '2026-03-03 16:25:43', 15);

INSERT INTO classes (id, subject_id, faculty_id, room, day_of_week, start_time, end_time, section, semester, academic_year, created_at, late_threshold_minutes)
VALUES (61, 48, 5, 'CL1', 'Wednesday', '09:30:00', '14:00:00', 'BSIT-4A', '2nd Semester', '2025-2026', '2026-03-04 02:40:22', 15);

-- No data found in audit_logs

-- Data for support_tickets
-- 2 records

INSERT INTO support_tickets (id, user_id, subject, message, status, created_at)
VALUES (1, 6, 'Test Issue', 'This is a test ticket.', 'OPEN', '2026-02-27 08:13:37');

INSERT INTO support_tickets (id, user_id, subject, message, status, created_at)
VALUES (2, 1, 'logihn', 'sbjsdhs', 'OPEN', '2026-02-28 15:43:23');

-- Data for user_settings
-- 3 records

INSERT INTO user_settings (id, user_id, email_notifications, sms_notifications, push_notifications, theme, language)
VALUES (2, 6, TRUE, TRUE, TRUE, 'dark', 'en');

INSERT INTO user_settings (id, user_id, email_notifications, sms_notifications, push_notifications, theme, language)
VALUES (3, 1, TRUE, TRUE, TRUE, 'dark', 'en');

INSERT INTO user_settings (id, user_id, email_notifications, sms_notifications, push_notifications, theme, language)
VALUES (4, 11, TRUE, FALSE, TRUE, 'dark', 'en');

-- No data found in system_metrics

-- No data found in security_logs

-- Data for enrollments
-- 308 records

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
VALUES (661, 48, 135, '2026-02-28 04:16:25');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (662, 48, 136, '2026-02-28 04:16:25');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (663, 48, 137, '2026-02-28 04:16:25');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (664, 48, 138, '2026-02-28 04:16:25');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (665, 48, 139, '2026-02-28 04:16:25');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (666, 49, 140, '2026-02-28 04:16:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (667, 49, 141, '2026-02-28 04:16:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (668, 49, 142, '2026-02-28 04:16:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (669, 49, 143, '2026-02-28 04:16:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (670, 49, 144, '2026-02-28 04:16:26');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (671, 50, 145, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (672, 50, 146, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (673, 50, 147, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (674, 50, 148, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (675, 50, 149, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (676, 51, 150, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (677, 51, 151, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (678, 51, 152, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (679, 51, 153, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (680, 51, 154, '2026-02-28 04:16:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (681, 48, 140, '2026-02-28 04:32:09');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (682, 48, 141, '2026-02-28 04:32:09');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (683, 48, 142, '2026-02-28 04:32:09');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (684, 48, 143, '2026-02-28 04:32:09');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (685, 48, 144, '2026-02-28 04:32:09');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (686, 49, 145, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (687, 49, 146, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (688, 49, 147, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (689, 49, 148, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (690, 49, 149, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (691, 49, 150, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (692, 49, 151, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (693, 49, 152, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (694, 49, 153, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (695, 49, 154, '2026-02-28 04:32:10');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (696, 52, 57, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (697, 52, 58, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (698, 52, 59, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (699, 52, 60, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (700, 52, 61, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (701, 52, 62, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (702, 52, 63, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (703, 52, 64, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (704, 52, 65, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (705, 52, 66, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (706, 52, 67, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (707, 52, 68, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (708, 52, 69, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (709, 52, 70, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (710, 52, 71, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (711, 52, 72, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (712, 52, 73, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (713, 52, 74, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (714, 52, 75, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (715, 52, 76, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (716, 52, 77, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (717, 52, 78, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (718, 52, 79, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (719, 52, 80, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (720, 52, 81, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (721, 52, 82, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (722, 52, 83, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (723, 52, 84, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (724, 52, 85, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (725, 52, 86, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (726, 52, 87, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (727, 52, 88, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (728, 52, 89, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (729, 52, 90, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (730, 52, 91, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (731, 52, 92, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (732, 52, 93, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (733, 52, 94, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (734, 52, 95, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (735, 52, 96, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (736, 52, 97, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (737, 52, 98, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (738, 52, 99, '2026-03-01 05:38:24');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (739, 53, 57, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (740, 53, 58, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (741, 53, 59, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (742, 53, 60, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (743, 53, 61, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (744, 53, 62, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (745, 53, 63, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (746, 53, 64, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (747, 53, 65, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (748, 53, 66, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (749, 53, 67, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (750, 53, 68, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (751, 53, 69, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (752, 53, 70, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (753, 53, 71, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (754, 53, 72, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (755, 53, 73, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (756, 53, 74, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (757, 53, 75, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (758, 53, 76, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (759, 53, 77, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (760, 53, 78, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (761, 53, 79, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (762, 53, 80, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (763, 53, 81, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (764, 53, 82, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (765, 53, 83, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (766, 53, 84, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (767, 53, 85, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (768, 53, 86, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (769, 53, 87, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (770, 53, 88, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (771, 53, 89, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (772, 53, 90, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (773, 53, 91, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (774, 53, 92, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (775, 53, 93, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (776, 53, 94, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (777, 53, 95, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (778, 53, 96, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (779, 53, 97, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (780, 53, 98, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (781, 53, 99, '2026-03-01 05:38:27');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (782, 54, 57, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (783, 54, 58, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (784, 54, 59, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (785, 54, 60, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (786, 54, 61, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (787, 54, 62, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (788, 54, 63, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (789, 54, 64, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (790, 54, 65, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (791, 54, 66, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (792, 54, 67, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (793, 54, 68, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (794, 54, 69, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (795, 54, 70, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (796, 54, 71, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (797, 54, 72, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (798, 54, 73, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (799, 54, 100, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (800, 54, 74, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (801, 54, 75, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (802, 54, 76, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (803, 54, 77, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (804, 54, 78, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (805, 54, 79, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (806, 54, 80, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (807, 54, 81, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (808, 54, 82, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (809, 54, 83, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (810, 54, 84, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (811, 54, 85, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (812, 54, 86, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (813, 54, 87, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (814, 54, 88, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (815, 54, 89, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (816, 54, 90, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (817, 54, 91, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (818, 54, 92, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (819, 54, 93, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (820, 54, 94, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (821, 54, 95, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (822, 54, 96, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (823, 54, 97, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (824, 54, 98, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (825, 54, 99, '2026-03-01 06:55:21');

INSERT INTO enrollments (id, class_id, student_id, enrolled_at)
VALUES (826, 55, 5, '2026-03-03 16:25:44');

-- No data found in session_exceptions

-- Data for attendance_logs
-- 70 records

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (1, 47, 3, NULL, 'ENTRY', 'FACE', 0.7616581916809082, NULL, '2026-02-18 21:52:34', ' [LATE by 22 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (4, 11, 3, NULL, 'ENTRY', 'FACE', 0.40253955125808716, NULL, '2026-02-28 11:25:13', ' [LATE by 25 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (5, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7055983543395996, 'OPEN_PALM', '2026-02-28 11:26:01', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (6, 11, 3, NULL, 'ENTRY', 'FACE', 0.36617180705070496, NULL, '2026-02-28 11:33:40', ' [LATE by 33 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (7, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7275956869125366, 'OPEN_PALM', '2026-02-28 11:34:26', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (8, 11, 3, NULL, 'ENTRY', 'FACE', 0.5646147727966309, NULL, '2026-02-28 11:40:55', ' [LATE by 40 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (9, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6866811513900757, 'OPEN_PALM', '2026-02-28 11:42:02', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (18, 47, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.7772762775421143, 'PEACE_SIGN', '2026-02-18 22:42:36', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (19, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7464088201522827, 'OPEN_PALM', '2026-02-18 22:43:17', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (20, 47, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.7772762775421143, 'PEACE_SIGN', '2026-02-18 22:42:36', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (21, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7464088201522827, 'OPEN_PALM', '2026-02-18 22:43:17', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (24, 47, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.7772762775421143, 'PEACE_SIGN', '2026-02-18 22:42:36', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (25, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7464088201522827, 'OPEN_PALM', '2026-02-18 22:43:17', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (33, 47, 3, NULL, 'ENTRY', 'FACE', 0.6176788806915283, NULL, '2026-02-20 16:44:29', ' [LATE by 44 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (34, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7650923132896423, 'OPEN_PALM', '2026-02-20 16:44:48', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (35, 47, 3, NULL, 'ENTRY', 'FACE', 0.6460152864456177, NULL, '2026-02-20 16:45:05', ' [LATE by 45 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (36, 47, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.6215105056762695, 'PEACE_SIGN', '2026-02-20 16:46:00', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (37, 47, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.7183650732040405, 'THUMBS_UP', '2026-02-20 16:46:50', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (38, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.695736289024353, 'OPEN_PALM', '2026-02-20 16:47:06', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (39, 47, 3, NULL, 'ENTRY', 'FACE', 0.568548858165741, NULL, '2026-02-23 22:45:51', ' [LATE by 45 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (40, 47, 3, NULL, 'ENTRY', 'FACE', 0.7670841217041016, NULL, '2026-02-24 00:01:32', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (41, 47, 3, NULL, 'ENTRY', 'FACE', 0.7900104522705078, NULL, '2026-02-25 18:05:11', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (42, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7995676398277283, 'OPEN_PALM', '2026-02-25 18:26:44', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (43, 47, 3, NULL, 'ENTRY', 'FACE', 0.8118503093719482, NULL, '2026-02-25 18:26:59', ' [LATE by 26 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (44, 47, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.7022098302841187, 'PEACE_SIGN', '2026-02-25 18:46:05', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (45, 47, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.7726399898529053, 'THUMBS_UP', '2026-02-25 18:46:23', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (46, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7662106156349182, 'OPEN_PALM', '2026-02-25 18:46:41', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (47, 47, 3, NULL, 'ENTRY', 'FACE', 0.5207818150520325, NULL, '2026-02-25 19:09:46', ' [LATE by 69 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (48, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7634803056716919, 'OPEN_PALM', '2026-02-25 19:11:00', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (49, 47, 3, NULL, 'ENTRY', 'FACE', 0.660841166973114, NULL, '2026-02-25 19:16:35', ' [LATE by 76 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (50, 47, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.7910513877868652, 'PEACE_SIGN', '2026-02-25 19:17:24', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (51, 47, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.7160851955413818, 'THUMBS_UP', '2026-02-25 19:19:22', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (52, 47, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7374211549758911, 'OPEN_PALM', '2026-02-25 19:19:43', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (77, 11, 3, NULL, 'ENTRY', 'FACE', 0.4987492263317108, NULL, '2026-02-28 15:25:34', ' [LATE by 25 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (78, 11, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.7057837247848511, 'PEACE_SIGN', '2026-02-28 15:26:00', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (79, 11, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.6932514905929565, 'THUMBS_UP', '2026-02-28 15:26:25', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (80, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6723748445510864, 'OPEN_PALM', '2026-02-28 15:26:47', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (81, 3, 3, NULL, 'ENTRY', 'FACE', 0.67313152551651, NULL, '2026-02-28 15:27:00', '[NOT_IN_CLASS] Juan Garcia [NOT_IN_CLASS] [LATE by 27 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (82, 5, 3, NULL, 'ENTRY', 'FACE', 0.4311566650867462, NULL, '2026-02-28 15:27:23', '[NOT_IN_CLASS] Pedro Mendoza [NOT_IN_CLASS] [LATE by 27 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (83, 11, 3, NULL, 'ENTRY', 'FACE', 0.6044110655784607, NULL, '2026-02-28 15:27:55', ' [LATE by 27 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (84, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.35978707671165466, 'OPEN_PALM', '2026-02-28 15:29:25', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (85, 11, 3, NULL, 'ENTRY', 'FACE', 0.6909079551696777, NULL, '2026-02-28 15:30:49', ' [LATE by 30 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (86, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6406875848770142, 'OPEN_PALM', '2026-02-28 15:31:34', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (87, 11, 3, NULL, 'ENTRY', 'FACE', 0.6873354315757751, NULL, '2026-02-28 15:31:51', ' [LATE by 31 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (88, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6169905662536621, 'OPEN_PALM', '2026-02-28 15:32:09', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (89, 11, 3, NULL, 'ENTRY', 'FACE', 0.6491334438323975, NULL, '2026-02-28 15:32:26', ' [LATE by 32 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (90, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6127266883850098, 'OPEN_PALM', '2026-02-28 15:32:46', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (91, 11, 3, NULL, 'ENTRY', 'FACE', 0.6284014582633972, NULL, '2026-02-28 15:33:01', ' [LATE by 33 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (92, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6865925192832947, 'OPEN_PALM', '2026-02-28 15:43:19', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (93, 11, 3, NULL, 'ENTRY', 'FACE', 0.6653457283973694, NULL, '2026-02-28 15:43:39', ' [LATE by 43 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (94, 11, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.665027379989624, 'PEACE_SIGN', '2026-02-28 15:43:58', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (95, 11, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.6007147431373596, 'THUMBS_UP', '2026-02-28 15:44:42', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (96, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.5183476805686951, 'OPEN_PALM', '2026-02-28 15:45:03', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (97, 4, 3, NULL, 'ENTRY', 'FACE', 0.676233172416687, NULL, '2026-02-28 15:45:17', '[NOT_IN_CLASS] Anna Reyes [NOT_IN_CLASS] [LATE by 45 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (99, 11, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.6398099660873413, 'PEACE_SIGN', '2026-02-28 17:29:59', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (100, 11, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.7287540435791016, 'THUMBS_UP', '2026-02-28 17:30:16', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (101, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.7167381048202515, 'OPEN_PALM', '2026-02-28 17:30:32', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (102, 11, 3, NULL, 'ENTRY', 'FACE', 0.568366289138794, NULL, '2026-02-28 17:31:28', ' [LATE by 91 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (103, 11, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.6919466257095337, 'PEACE_SIGN', '2026-02-28 20:57:57', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (104, 11, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.6634427905082703, 'THUMBS_UP', '2026-02-28 20:58:19', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (105, 11, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.6856187582015991, 'PEACE_SIGN', '2026-02-28 20:59:34', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (106, 11, 3, NULL, 'BREAK_IN', 'FACE+GESTURE', 0.6495786905288696, 'THUMBS_UP', '2026-02-28 21:01:28', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (107, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6791296005249023, 'OPEN_PALM', '2026-02-28 21:04:27', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (108, 8, 3, NULL, 'ENTRY', 'FACE+GESTURE', 0.8336904644966125, 'FINGER_COUNT_4', '2026-02-28 21:23:12', ' [LATE by 33 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (109, 8, 3, NULL, 'BREAK_OUT', 'FACE+GESTURE', 0.8371865749359131, 'PEACE_SIGN', '2026-02-28 21:24:15', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (110, 9, 3, NULL, 'ENTRY', 'FACE+GESTURE', 0.4327998757362366, 'FINGER_COUNT_2', '2026-02-28 21:25:42', ' [LATE by 35 min]', TRUE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (111, 11, 3, NULL, 'ENTRY', 'FACE', 0.500977098941803, NULL, '2026-03-03 22:46:46', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (112, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6494811177253723, 'OPEN_PALM', '2026-03-03 22:47:06', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (113, 11, 3, NULL, 'ENTRY', 'FACE', 0.6942547559738159, NULL, '2026-03-03 22:47:26', NULL, FALSE);

INSERT INTO attendance_logs (id, user_id, class_id, device_id, action, verified_by, confidence_score, gesture_detected, timestamp, remarks, is_late)
VALUES (114, 11, 3, NULL, 'EXIT', 'FACE+GESTURE', 0.6831803321838379, 'OPEN_PALM', '2026-03-03 22:47:49', NULL, FALSE);

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

COMMIT;

-- Export completed successfully
-- Total records exported: 545
