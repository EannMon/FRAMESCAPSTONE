-- MySQL dump 10.13  Distrib 8.0.35, for Win64 (x86_64)
--
-- Host: mysql-cf722f2-framessys01-cee4.c.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `CameraManagement`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CameraManagement` (
  `camera_id` int NOT NULL AUTO_INCREMENT,
  `room_name` varchar(100) NOT NULL,
  `department_code` varchar(20) DEFAULT NULL,
  `camera_name` varchar(100) DEFAULT NULL,
  `camera_ip` varchar(100) DEFAULT NULL,
  `rtsp_url` text,
  `camera_status` enum('Active','Inactive','Maintenance') DEFAULT 'Active',
  `capacity` int DEFAULT '40',
  PRIMARY KEY (`camera_id`),
  UNIQUE KEY `room_name` (`room_name`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClassSchedule`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClassSchedule` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `upload_id` int DEFAULT NULL,
  `course_code` varchar(50) DEFAULT NULL,
  `day_of_week` varchar(20) DEFAULT NULL,
  `start_time` varchar(20) DEFAULT NULL,
  `end_time` varchar(20) DEFAULT NULL,
  `camera_id` int DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `camera_id` (`camera_id`),
  KEY `faculty_id` (`faculty_id`),
  KEY `course_code` (`course_code`),
  KEY `upload_id` (`upload_id`),
  CONSTRAINT `ClassSchedule_ibfk_1` FOREIGN KEY (`camera_id`) REFERENCES `CameraManagement` (`camera_id`) ON DELETE SET NULL,
  CONSTRAINT `ClassSchedule_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `User` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `ClassSchedule_ibfk_3` FOREIGN KEY (`course_code`) REFERENCES `Subjects` (`subject_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClassSchedule_ibfk_4` FOREIGN KEY (`upload_id`) REFERENCES `FacultyScheduleUpload` (`upload_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EventLog`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EventLog` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `event_type` enum('attendance_in','attendance_out','break_in','break_out','unrecognized_face','spoof_attempt','system_alert') NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `camera_id` int DEFAULT NULL,
  `confidence_score` float DEFAULT NULL,
  `remarks` text,
  `gesture_detected` varchar(50) DEFAULT NULL,
  `schedule_id` int DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  KEY `camera_id` (`camera_id`),
  KEY `schedule_id` (`schedule_id`),
  CONSTRAINT `EventLog_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `EventLog_ibfk_2` FOREIGN KEY (`camera_id`) REFERENCES `CameraManagement` (`camera_id`) ON DELETE SET NULL,
  CONSTRAINT `EventLog_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `ClassSchedule` (`schedule_id`)
) ENGINE=InnoDB AUTO_INCREMENT=756 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FacultyScheduleUpload`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FacultyScheduleUpload` (
  `upload_id` int NOT NULL AUTO_INCREMENT,
  `faculty_id` int NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `semester` varchar(50) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Processing','Completed','Failed') DEFAULT 'Processing',
  `error_message` text,
  PRIMARY KEY (`upload_id`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `FacultyScheduleUpload_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `User` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Notification`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `notif_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `message` text,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notif_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `Notification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=426 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ReportHistory`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReportHistory` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `generated_by` int DEFAULT NULL,
  `report_type` varchar(100) NOT NULL,
  `parameters` json DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `generated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `ReportHistory_ibfk_1` FOREIGN KEY (`generated_by`) REFERENCES `User` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Subjects`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Subjects` (
  `subject_id` int NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(50) NOT NULL,
  `subject_description` varchar(255) DEFAULT NULL,
  `units` int DEFAULT '3',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `subject_code` (`subject_code`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SystemAudit`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SystemAudit` (
  `audit_id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `action_type` varchar(50) DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `details` text,
  PRIMARY KEY (`audit_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `SystemAudit_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `User` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `User`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` text NOT NULL,
  `role` enum('student','faculty','admin','dept_head') NOT NULL,
  `tupm_id` varchar(50) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `middleName` varchar(100) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `contactNumber` varchar(50) DEFAULT NULL,
  `street_number` varchar(50) DEFAULT NULL,
  `street_name` varchar(100) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `homeAddress` text,
  `college` varchar(100) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `year_level` varchar(20) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `student_status` varchar(50) DEFAULT NULL,
  `term` varchar(50) DEFAULT NULL,
  `faculty_status` varchar(50) DEFAULT NULL,
  `academic_advisor` varchar(100) DEFAULT NULL,
  `gpa` varchar(10) DEFAULT NULL,
  `expected_grad` varchar(20) DEFAULT NULL,
  `handled_sections` json DEFAULT NULL,
  `enrolled_courses` json DEFAULT NULL,
  `emergency_contact` json DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `face_embedding_vgg` mediumblob,
  `face_status` enum('Registered','Pending','Not Registered') DEFAULT 'Not Registered',
  `verification_status` enum('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  `last_active` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_registered` datetime DEFAULT CURRENT_TIMESTAMP,
  `face_data` longblob,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `tupm_id` (`tupm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-26 18:35:21
