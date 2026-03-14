-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP TYPE public."attendanceaction";

CREATE TYPE public."attendanceaction" AS ENUM (
	'ENTRY',
	'BREAK_OUT',
	'BREAK_IN',
	'EXIT');

-- DROP TYPE public."devicestatus";

CREATE TYPE public."devicestatus" AS ENUM (
	'ACTIVE',
	'INACTIVE',
	'MAINTENANCE');

-- DROP TYPE public."exceptiontype";

CREATE TYPE public."exceptiontype" AS ENUM (
	'ONSITE',
	'ONLINE',
	'CANCELLED',
	'HOLIDAY');

-- DROP TYPE public."notificationtype";

CREATE TYPE public."notificationtype" AS ENUM (
	'ATTENDANCE_ENTRY',
	'ATTENDANCE_BREAK',
	'ATTENDANCE_EXIT',
	'LATE_ALERT',
	'ABSENT_CONSECUTIVE',
	'SESSION_EXCEPTION',
	'VERIFICATION_APPROVED',
	'VERIFICATION_REJECTED',
	'SYSTEM_ALERT',
	'GENERAL',
	'OVERCROWDING_ALERT');

-- DROP TYPE public."securityeventtype";

CREATE TYPE public."securityeventtype" AS ENUM (
	'UNRECOGNIZED_FACE',
	'GESTURE_FAILURE',
	'SPOOF_ATTEMPT',
	'UNAUTHORIZED_ACCESS');

-- DROP TYPE public."ticketstatus";

CREATE TYPE public."ticketstatus" AS ENUM (
	'SUBMITTED',
	'REPLIED');

-- DROP TYPE public."userrole";

CREATE TYPE public."userrole" AS ENUM (
	'STUDENT',
	'FACULTY',
	'HEAD',
	'ADMIN');

-- DROP TYPE public."verificationstatus";

CREATE TYPE public."verificationstatus" AS ENUM (
	'PENDING',
	'VERIFIED',
	'REJECTED');

-- DROP TYPE public."verifiedby";

CREATE TYPE public."verifiedby" AS ENUM (
	'FACE',
	'FACE+GESTURE');

-- DROP SEQUENCE public.attendance_logs_id_seq;

CREATE SEQUENCE public.attendance_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.attendance_logs_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.attendance_logs_id_seq TO avnadmin;

-- DROP SEQUENCE public.audit_logs_id_seq;

CREATE SEQUENCE public.audit_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.audit_logs_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO avnadmin;

-- DROP SEQUENCE public.classes_id_seq;

CREATE SEQUENCE public.classes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.classes_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.classes_id_seq TO avnadmin;

-- DROP SEQUENCE public.colleges_id_seq;

CREATE SEQUENCE public.colleges_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.colleges_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.colleges_id_seq TO avnadmin;

-- DROP SEQUENCE public.departments_id_seq;

CREATE SEQUENCE public.departments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.departments_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.departments_id_seq TO avnadmin;

-- DROP SEQUENCE public.devices_id_seq;

CREATE SEQUENCE public.devices_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.devices_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.devices_id_seq TO avnadmin;

-- DROP SEQUENCE public.enrollments_id_seq;

CREATE SEQUENCE public.enrollments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.enrollments_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.enrollments_id_seq TO avnadmin;

-- DROP SEQUENCE public.facial_profiles_id_seq;

CREATE SEQUENCE public.facial_profiles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.facial_profiles_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.facial_profiles_id_seq TO avnadmin;

-- DROP SEQUENCE public.notifications_id_seq;

CREATE SEQUENCE public.notifications_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.notifications_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO avnadmin;

-- DROP SEQUENCE public.programs_id_seq;

CREATE SEQUENCE public.programs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.programs_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.programs_id_seq TO avnadmin;

-- DROP SEQUENCE public.security_logs_id_seq;

CREATE SEQUENCE public.security_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.security_logs_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.security_logs_id_seq TO avnadmin;

-- DROP SEQUENCE public.session_exceptions_id_seq;

CREATE SEQUENCE public.session_exceptions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.session_exceptions_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.session_exceptions_id_seq TO avnadmin;

-- DROP SEQUENCE public.subjects_id_seq;

CREATE SEQUENCE public.subjects_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.subjects_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.subjects_id_seq TO avnadmin;

-- DROP SEQUENCE public.support_tickets_id_seq;

CREATE SEQUENCE public.support_tickets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.support_tickets_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.support_tickets_id_seq TO avnadmin;

-- DROP SEQUENCE public.system_metrics_id_seq;

CREATE SEQUENCE public.system_metrics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_metrics_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.system_metrics_id_seq TO avnadmin;

-- DROP SEQUENCE public.user_invites_id_seq;

CREATE SEQUENCE public.user_invites_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_invites_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.user_invites_id_seq TO avnadmin;

-- DROP SEQUENCE public.user_settings_id_seq;

CREATE SEQUENCE public.user_settings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_settings_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.user_settings_id_seq TO avnadmin;

-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq OWNER TO avnadmin;
GRANT ALL ON SEQUENCE public.users_id_seq TO avnadmin;
-- public.colleges definition

-- Drop table

-- DROP TABLE public.colleges;

CREATE TABLE public.colleges ( id serial4 NOT NULL, "name" varchar(150) NOT NULL, code varchar(20) NULL, created_at timestamp DEFAULT now() NULL, CONSTRAINT colleges_code_key UNIQUE (code), CONSTRAINT colleges_name_key UNIQUE (name), CONSTRAINT colleges_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE public.colleges OWNER TO avnadmin;
GRANT ALL ON TABLE public.colleges TO avnadmin;


-- public.devices definition

-- Drop table

-- DROP TABLE public.devices;

CREATE TABLE public.devices ( id serial4 NOT NULL, room varchar(100) NULL, ip_address varchar(45) NULL, device_name varchar(100) NULL, status public."devicestatus" NULL, created_at timestamp NULL, last_heartbeat timestamp NULL, room_capacity int4 DEFAULT 50 NULL, CONSTRAINT devices_pkey PRIMARY KEY (id));
CREATE INDEX ix_devices_room ON public.devices USING btree (room);

-- Permissions

ALTER TABLE public.devices OWNER TO avnadmin;
GRANT ALL ON TABLE public.devices TO avnadmin;


-- public.subjects definition

-- Drop table

-- DROP TABLE public.subjects;

CREATE TABLE public.subjects ( id serial4 NOT NULL, code varchar(50) NOT NULL, title varchar(255) NOT NULL, units int4 NULL, created_at timestamp NULL, CONSTRAINT subjects_code_key UNIQUE (code), CONSTRAINT subjects_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE public.subjects OWNER TO avnadmin;
GRANT ALL ON TABLE public.subjects TO avnadmin;


-- public.departments definition

-- Drop table

-- DROP TABLE public.departments;

CREATE TABLE public.departments ( id serial4 NOT NULL, "name" varchar(100) NOT NULL, code varchar(20) NULL, created_at timestamp NULL, active_academic_year varchar(20) DEFAULT '2025-2026'::character varying NULL, active_semester varchar(50) DEFAULT '2nd Semester'::character varying NULL, college_id int4 NULL, semester_start_date date NULL, semester_end_date date NULL, CONSTRAINT departments_code_key UNIQUE (code), CONSTRAINT departments_name_key UNIQUE (name), CONSTRAINT departments_pkey PRIMARY KEY (id), CONSTRAINT departments_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id));
CREATE INDEX ix_departments_college_id ON public.departments USING btree (college_id);

-- Permissions

ALTER TABLE public.departments OWNER TO avnadmin;
GRANT ALL ON TABLE public.departments TO avnadmin;


-- public.programs definition

-- Drop table

-- DROP TABLE public.programs;

CREATE TABLE public.programs ( id serial4 NOT NULL, department_id int4 NOT NULL, "name" varchar(100) NOT NULL, code varchar(20) NULL, created_at timestamp NULL, CONSTRAINT programs_pkey PRIMARY KEY (id), CONSTRAINT programs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id));

-- Permissions

ALTER TABLE public.programs OWNER TO avnadmin;
GRANT ALL ON TABLE public.programs TO avnadmin;


-- public.security_logs definition

-- Drop table

-- DROP TABLE public.security_logs;

CREATE TABLE public.security_logs ( id serial4 NOT NULL, device_id int4 NULL, event_type public."securityeventtype" NOT NULL, embedding_data bytea NULL, confidence_score float8 NULL, room varchar(100) NULL, details varchar(500) NULL, "timestamp" timestamp NULL, CONSTRAINT security_logs_pkey PRIMARY KEY (id), CONSTRAINT security_logs_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id));

-- Permissions

ALTER TABLE public.security_logs OWNER TO avnadmin;
GRANT ALL ON TABLE public.security_logs TO avnadmin;


-- public.system_metrics definition

-- Drop table

-- DROP TABLE public.system_metrics;

CREATE TABLE public.system_metrics ( id serial4 NOT NULL, device_id int4 NULL, metric_type varchar(50) NOT NULL, value float8 NOT NULL, unit varchar(20) NULL, "timestamp" timestamp NULL, CONSTRAINT system_metrics_pkey PRIMARY KEY (id), CONSTRAINT system_metrics_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id));

-- Permissions

ALTER TABLE public.system_metrics OWNER TO avnadmin;
GRANT ALL ON TABLE public.system_metrics TO avnadmin;


-- public.user_invites definition

-- Drop table

-- DROP TABLE public.user_invites;

CREATE TABLE public.user_invites ( id serial4 NOT NULL, email varchar(255) NOT NULL, "token" varchar(500) NOT NULL, department_id int4 NOT NULL, "role" varchar(50) NULL, expires_at timestamp NOT NULL, used bool NULL, created_at timestamp NULL, CONSTRAINT user_invites_pkey PRIMARY KEY (id), CONSTRAINT user_invites_token_key UNIQUE (token), CONSTRAINT user_invites_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id));
CREATE INDEX ix_user_invites_email ON public.user_invites USING btree (email);

-- Permissions

ALTER TABLE public.user_invites OWNER TO avnadmin;
GRANT ALL ON TABLE public.user_invites TO avnadmin;


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users ( id serial4 NOT NULL, email varchar(255) NULL, password_hash varchar(255) NOT NULL, tupm_id varchar(50) NULL, "role" public."userrole" NOT NULL, verification_status public."verificationstatus" NULL, face_registered bool NULL, first_name varchar(100) NOT NULL, last_name varchar(100) NOT NULL, middle_name varchar(100) NULL, department_id int4 NULL, program_id int4 NULL, "section" varchar(50) NULL, created_at timestamp NULL, last_active timestamp NULL, employee_id varchar(50) NULL, email_notifications_enabled bool DEFAULT true NULL, in_app_notifications_enabled bool DEFAULT true NULL, CONSTRAINT users_email_key UNIQUE (email), CONSTRAINT users_employee_id_key UNIQUE (employee_id), CONSTRAINT users_pkey PRIMARY KEY (id), CONSTRAINT users_tupm_id_key UNIQUE (tupm_id), CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id), CONSTRAINT users_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id));
CREATE INDEX ix_users_department_id ON public.users USING btree (department_id);
CREATE INDEX ix_users_role ON public.users USING btree (role);
CREATE INDEX ix_users_verification_status ON public.users USING btree (verification_status);

-- Permissions

ALTER TABLE public.users OWNER TO avnadmin;
GRANT ALL ON TABLE public.users TO avnadmin;


-- public.audit_logs definition

-- Drop table

-- DROP TABLE public.audit_logs;

CREATE TABLE public.audit_logs ( id serial4 NOT NULL, user_id int4 NULL, action_type varchar(50) NOT NULL, target_table varchar(50) NULL, target_id int4 NULL, old_value json NULL, new_value json NULL, ip_address varchar(45) NULL, user_agent varchar(255) NULL, "timestamp" timestamp NULL, CONSTRAINT audit_logs_pkey PRIMARY KEY (id), CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id));
CREATE INDEX ix_audit_logs_action_type ON public.audit_logs USING btree (action_type);
CREATE INDEX ix_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");
CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);

-- Permissions

ALTER TABLE public.audit_logs OWNER TO avnadmin;
GRANT ALL ON TABLE public.audit_logs TO avnadmin;


-- public.classes definition

-- Drop table

-- DROP TABLE public.classes;

CREATE TABLE public.classes ( id serial4 NOT NULL, subject_id int4 NOT NULL, faculty_id int4 NOT NULL, room varchar(100) NULL, day_of_week varchar(20) NULL, start_time time NULL, end_time time NULL, "section" varchar(50) NULL, semester varchar(50) NULL, academic_year varchar(20) NULL, created_at timestamp NULL, late_threshold_minutes int4 DEFAULT 0 NULL, CONSTRAINT classes_pkey PRIMARY KEY (id), CONSTRAINT classes_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.users(id), CONSTRAINT classes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id));
CREATE INDEX ix_classes_day_of_week ON public.classes USING btree (day_of_week);
CREATE INDEX ix_classes_faculty_id ON public.classes USING btree (faculty_id);
CREATE INDEX ix_classes_room ON public.classes USING btree (room);
CREATE INDEX ix_classes_subject_id ON public.classes USING btree (subject_id);

-- Permissions

ALTER TABLE public.classes OWNER TO avnadmin;
GRANT ALL ON TABLE public.classes TO avnadmin;


-- public.enrollments definition

-- Drop table

-- DROP TABLE public.enrollments;

CREATE TABLE public.enrollments ( id serial4 NOT NULL, class_id int4 NOT NULL, student_id int4 NOT NULL, enrolled_at timestamp NULL, CONSTRAINT enrollments_pkey PRIMARY KEY (id), CONSTRAINT unique_enrollment UNIQUE (class_id, student_id), CONSTRAINT enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE, CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX ix_enrollments_class_id ON public.enrollments USING btree (class_id);
CREATE INDEX ix_enrollments_student_id ON public.enrollments USING btree (student_id);

-- Permissions

ALTER TABLE public.enrollments OWNER TO avnadmin;
GRANT ALL ON TABLE public.enrollments TO avnadmin;


-- public.facial_profiles definition

-- Drop table

-- DROP TABLE public.facial_profiles;

CREATE TABLE public.facial_profiles ( id serial4 NOT NULL, user_id int4 NOT NULL, embedding bytea NULL, model_version varchar(50) DEFAULT 'insightface_buffalo_l_v1'::character varying NULL, created_at timestamp NULL, updated_at timestamp NULL, num_samples int4 DEFAULT 0 NULL, enrollment_quality float8 DEFAULT 0.0 NULL, CONSTRAINT facial_profiles_pkey PRIMARY KEY (id), CONSTRAINT facial_profiles_user_id_key UNIQUE (user_id), CONSTRAINT facial_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.facial_profiles OWNER TO avnadmin;
GRANT ALL ON TABLE public.facial_profiles TO avnadmin;


-- public.notifications definition

-- Drop table

-- DROP TABLE public.notifications;

CREATE TABLE public.notifications ( id serial4 NOT NULL, user_id int4 NOT NULL, notification_type public."notificationtype" NOT NULL, title varchar(200) NOT NULL, message varchar(500) NOT NULL, is_read bool DEFAULT false NULL, reference_id int4 NULL, reference_type varchar(50) NULL, created_at timestamp DEFAULT now() NULL, CONSTRAINT notifications_pkey PRIMARY KEY (id), CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX ix_notification_user_unread ON public.notifications USING btree (user_id, is_read, created_at);
CREATE INDEX ix_notifications_created_at ON public.notifications USING btree (created_at);
CREATE INDEX ix_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX ix_notifications_notification_type ON public.notifications USING btree (notification_type);
CREATE INDEX ix_notifications_user_id ON public.notifications USING btree (user_id);

-- Permissions

ALTER TABLE public.notifications OWNER TO avnadmin;
GRANT ALL ON TABLE public.notifications TO avnadmin;


-- public.session_exceptions definition

-- Drop table

-- DROP TABLE public.session_exceptions;

CREATE TABLE public.session_exceptions ( id serial4 NOT NULL, class_id int4 NOT NULL, session_date date NOT NULL, exception_type public."exceptiontype" NULL, reason varchar(255) NULL, created_by int4 NULL, created_at timestamp NULL, CONSTRAINT session_exceptions_pkey PRIMARY KEY (id), CONSTRAINT session_exceptions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id), CONSTRAINT session_exceptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id));

-- Permissions

ALTER TABLE public.session_exceptions OWNER TO avnadmin;
GRANT ALL ON TABLE public.session_exceptions TO avnadmin;


-- public.support_tickets definition

-- Drop table

-- DROP TABLE public.support_tickets;

CREATE TABLE public.support_tickets ( id serial4 NOT NULL, user_id int4 NOT NULL, subject varchar(255) NOT NULL, message text NOT NULL, status public."ticketstatus" NULL, created_at timestamp NULL, evidence_files text NULL, CONSTRAINT support_tickets_pkey PRIMARY KEY (id), CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id));
CREATE INDEX ix_support_tickets_status ON public.support_tickets USING btree (status);
CREATE INDEX ix_support_tickets_user_id ON public.support_tickets USING btree (user_id);

-- Permissions

ALTER TABLE public.support_tickets OWNER TO avnadmin;
GRANT ALL ON TABLE public.support_tickets TO avnadmin;


-- public.user_settings definition

-- Drop table

-- DROP TABLE public.user_settings;

CREATE TABLE public.user_settings ( id serial4 NOT NULL, user_id int4 NOT NULL, email_notifications bool NULL, sms_notifications bool NULL, push_notifications bool NULL, theme varchar(50) NULL, "language" varchar(20) NULL, CONSTRAINT user_settings_pkey PRIMARY KEY (id), CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id));
CREATE UNIQUE INDEX ix_user_settings_user_id ON public.user_settings USING btree (user_id);

-- Permissions

ALTER TABLE public.user_settings OWNER TO avnadmin;
GRANT ALL ON TABLE public.user_settings TO avnadmin;


-- public.attendance_logs definition

-- Drop table

-- DROP TABLE public.attendance_logs;

CREATE TABLE public.attendance_logs ( id serial4 NOT NULL, user_id int4 NOT NULL, class_id int4 NULL, device_id int4 NULL, "action" public."attendanceaction" NOT NULL, verified_by public."verifiedby" NULL, confidence_score float8 NULL, gesture_detected varchar(50) NULL, "timestamp" timestamp NULL, remarks varchar(255) NULL, is_late bool DEFAULT false NULL, CONSTRAINT attendance_logs_pkey PRIMARY KEY (id), CONSTRAINT attendance_logs_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id), CONSTRAINT attendance_logs_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id), CONSTRAINT attendance_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id));
CREATE INDEX ix_attendance_logs_action ON public.attendance_logs USING btree (action);
CREATE INDEX ix_attendance_logs_class_id ON public.attendance_logs USING btree (class_id);
CREATE INDEX ix_attendance_logs_device_id ON public.attendance_logs USING btree (device_id);
CREATE INDEX ix_attendance_logs_is_late ON public.attendance_logs USING btree (is_late);
CREATE INDEX ix_attendance_logs_timestamp ON public.attendance_logs USING btree ("timestamp");
CREATE INDEX ix_attendance_logs_user_id ON public.attendance_logs USING btree (user_id);
CREATE INDEX ix_attendance_user_class_timestamp ON public.attendance_logs USING btree (user_id, class_id, "timestamp");

-- Permissions

ALTER TABLE public.attendance_logs OWNER TO avnadmin;
GRANT ALL ON TABLE public.attendance_logs TO avnadmin;




-- Permissions;