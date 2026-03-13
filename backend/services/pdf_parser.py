"""
PDF Parsing Service for Schedule/COR Uploads
Migrated from legacy Flask app.py to work with SQLAlchemy
"""
import pdfplumber
import re
import time
import logging
from io import BytesIO
from typing import Optional, Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

# Maximum PDF file size: 10MB (per FRAMES Security Rules §5.2)
MAX_PDF_SIZE = 10 * 1024 * 1024


def clean_section(section_str: str) -> str:
    """
    Clean duplicated section names
    Example: "BSIT-BSIT-4A-M" -> "BSIT-4A-M"
    """
    parts = section_str.split('-')
    
    # Remove consecutive duplicates
    cleaned = [parts[0]]
    for part in parts[1:]:
        if part != cleaned[-1]:
            cleaned.append(part)
    
    return '-'.join(cleaned)


def parse_time_slot(days_str: str, time_str: str) -> List[Tuple[str, str, str]]:
    """
    Parse day and time from raw strings and return a list of slots.
    Handles multiple days like "T/TH", "W/F", "SAT".
    Returns: List of (FullDayName, StartTime, EndTime)
    """
    day_map = {
        'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'TH': 'Thursday', 'HU': 'Thursday',
        'F': 'Friday', 'S': 'Saturday', 'SAT': 'Saturday', 'SUN': 'Sunday', 'SU': 'Sunday'
    }
    
    # Parse time range first
    time_str = time_str.replace('\u2013', '-')
    if '-' in time_str:
        times = time_str.split('-')
        start = times[0].strip()
        end = times[1].strip() if len(times) > 1 else "TBA"
    else:
        start = time_str.strip()
        end = "TBA"
        
    # Clean and split days
    # Expected formats: "T/TH", "M/W", "F", "S", "M-W" (rare but possible), "TH"
    days_clean = days_str.upper().replace('.', '').strip()
    
    days_found = []
    
    if '/' in days_clean:
        parts = days_clean.split('/')
        for part in parts:
            if part in day_map:
                days_found.append(day_map[part])
    elif days_clean in day_map:
        days_found.append(day_map[days_clean])
    else:
        # Fallback: try to match known keys in the string if no separator
        # This is tricky without separator, but usually it's single day if no /
        # Or standard combos like "TTH"
        if days_clean == "TTH":
             days_found = ['Tuesday', 'Thursday']
        elif days_clean == "MW":
             days_found = ['Monday', 'Wednesday']
        else:
             days_found = [days_clean] # Unknown format, return as is
             
    result = []
    for day in days_found:
        result.append((day, start, end))
        
    return result


def parse_schedule_pdf(file_content: bytes, faculty_id: int) -> Optional[Dict[str, Any]]:
    """
    Parse COR PDF - ONE course with MANY students across pages.
    The result structure 'courses' list will contain ONE entry per DAY/TIME slot.
    So a T/TH class will result in TWO entries in 'courses' list, both with the same students.

    Args:
        file_content: Raw PDF bytes
        faculty_id: ID of the uploading faculty member

    Returns:
        Parsed schedule dict or None on failure
    """
    # Validate file size (per FRAMES Security Rules §5.2)
    if len(file_content) > MAX_PDF_SIZE:
        logger.warning(
            "PDF file too large: %d bytes (max %d bytes), faculty_id=%d",
            len(file_content), MAX_PDF_SIZE, faculty_id
        )
        return None

    logger.info("SCHEDULE | Parsing PDF for faculty_id=%d, size=%d bytes", faculty_id, len(file_content))
    parse_start = time.perf_counter()
    
    try:
        with pdfplumber.open(BytesIO(file_content)) as pdf:
            # Extract text from FIRST PAGE ONLY for header info
            page1_text = pdf.pages[0].extract_text() if len(pdf.pages) > 0 else ""
            
            # Find subject info from "Subject : CODE - Title" line
            # Example: "Subject : IT232-M - Computer Architecture and Organization, Lec Venue : ONLINE"
            subject_match = re.search(r'Subject\s*:\s*([^\n]+)', page1_text)
            subject_line = subject_match.group(1).strip() if subject_match else ""
            
            # Extract subject code and name from subject line
            # Pattern: "CODE - Title" where CODE can be like IT232-M, IT303--M, CS101, etc.
            subject_code = "UNKNOWN"
            subject_name = "Unknown Subject"
            
            if subject_line:
                # Try to split by " - " to separate code from title
                # Handle patterns like: "IT232-M - Computer Architecture..."
                code_title_match = re.match(r'^([A-Z]{2,4}\d{2,3}[A-Z-]*)\s*-\s*(.+)', subject_line)
                if code_title_match:
                    subject_code = code_title_match.group(1).strip()
                    # Clean up double dashes
                    subject_code = re.sub(r'-+', '-', subject_code)
                    subject_name = code_title_match.group(2).strip()
                    # Remove trailing "Venue : ..." from title if present
                    if 'Venue' in subject_name:
                        subject_name = subject_name.split('Venue')[0].strip().rstrip(',')
                else:
                    # Fallback: use the whole line as subject name
                    subject_name = subject_line
                    # Try harder to find a code pattern anywhere
                    code_search = re.search(r'([A-Z]{2,4}\d{2,3}[A-Z-]*)', subject_line)
                    if code_search:
                        subject_code = code_search.group(1)
                        subject_code = re.sub(r'-+', '-', subject_code)
            
            logger.info("SCHEDULE | Subject: %s - %s", subject_code, subject_name)
            
            # Find section
            section_match = re.search(r'Course/Section\s*:\s*([^\n]+)', page1_text)
            section_raw = section_match.group(1).strip() if section_match else "UNKNOWN"
            section = clean_section(section_raw)
            logger.info("SCHEDULE | Section: %s", section)
            
            # Find venue
            venue_match = re.search(r'Venue\s*:\s*([^\n]+)', page1_text)
            venue = venue_match.group(1).strip() if venue_match else "Room 324"
            logger.debug("SCHEDULE | Venue: %s", venue)
            
            # Extract Semester and Academic Year from PDF (Task 45/48 improvements)
            # Example patterns: "Semester : 1st Semester", "School Year : 2025-2026"
            pdf_semester = "1st Semester"
            pdf_ay = "2025-2026"
            
            # Robust extraction from header area
            # Sometimes labels are "SY" or "School Year" or "Academic Year"
            # Support: "Semester : 1st Semester" or "1st Semester" alone in header
            sem_match = re.search(r'(?:Semester\s*:\s*)?((?:1st|2nd|Summer)\s*Semester)', page1_text, re.IGNORECASE)
            if sem_match:
                pdf_semester = sem_match.group(1).strip().title()
                
            ay_match = re.search(r'(?:School Year|Academic Year|SY)\s*:\s*([\d-]{8,10})', page1_text, re.IGNORECASE)
            if not ay_match:
                # Try just the year pattern like 2025-2026
                ay_match = re.search(r'(\d{4}-\d{4})', page1_text)
                
            if ay_match:
                pdf_ay = ay_match.group(1).strip()
            
            logger.info("SCHEDULE | PDF Metadata Found: Sem=%s, AY=%s", pdf_semester, pdf_ay)

            # Find TOTAL students count
            all_text = ""
            for page in pdf.pages:
                all_text += page.extract_text() + "\n"
            
            total_match = re.search(r'Total Number of Students\s+(\d+)', all_text)
            total_students_expected = int(total_match.group(1)) if total_match else 0
            
            # --- Extract student list from ALL PAGES ---
            all_students = []
            student_counter = 0
            found_header = False
            
            for page_idx, page in enumerate(pdf.pages):
                table = page.extract_table()
                if not table: continue

                for row in table:
                    if not row: continue
                    clean_row = [str(x).replace('\n', ' ').strip() for x in row if x]
                    row_text = ' '.join(clean_row).lower()
                    
                    if not found_header:
                        if 'student no' in row_text and 'name of student' in row_text:
                            found_header = True
                            continue
                    
                    if not found_header: continue
                    
                    if 'total number of students' in row_text:
                        break
                    
                    if len(clean_row) < 3: continue
                    
                    first_cell = clean_row[0].strip()
                    if not first_cell or not first_cell[0].isdigit(): continue
                    
                    tupm_id = clean_row[1] if len(clean_row) > 1 else ""
                    name = clean_row[2] if len(clean_row) > 2 else "Unknown"
                    
                    if tupm_id and tupm_id.startswith("TUPM"):
                        all_students.append({'tupm_id': tupm_id, 'name': name})
                        student_counter += 1

            logger.info(
                "SCHEDULE | Students found: %d (expected: %d)",
                len(all_students), total_students_expected
            )

            # Find day/time and generate course slots
            course_slots = []
            
            # Updated Regex to capture slashed days like T/TH or M/W
            time_match = re.search(r'Day/Time\s*:\s*([A-Za-z/]+\s*\d{1,2}:\d{2}[AP]M-\d{1,2}:\d{2}[AP]M)', page1_text)
            
            if time_match:
                time_full = time_match.group(1).strip()
                # Split "T/TH 1:00PM-3:00PM" -> "T/TH" and "1:00PM-3:00PM"
                # Assumes the first part is days and rest is time. 
                # Sometimes there is a space, sometimes not? Usually "DAY TIME"
                parts = time_full.split(' ', 1)
                
                if len(parts) == 2:
                    days_raw = parts[0]
                    time_raw = parts[1]
                else:
                    # Fallback if split failed (weird formatting)
                    days_raw = time_full[0] # Very unsafe, but just a fallback
                    time_raw = time_full[1:]
                    
                # Fix regex for time extraction in case time_full was weird
                time_extract = re.search(r'(\d{1,2}:\d{2}[AP]M-\d{1,2}:\d{2}[AP]M)', time_full)
                if time_extract:
                    time_raw = time_extract.group(1)
                    # Update days_raw to be everything before the time
                    days_raw = time_full.replace(time_raw, '').strip()

                parsed_slots = parse_time_slot(days_raw, time_raw)
                logger.info("SCHEDULE | Parsed schedule slots: %s", parsed_slots)
                
                for day, start, end in parsed_slots:
                    course_slots.append({
                        'subject_code': subject_code,
                        'subject_name': subject_name,
                        'section': section,
                        'units': 2, # Default
                        'day': day,
                        'start_time': start,
                        'end_time': end,
                        'venue': venue,
                        'enrolled_students': all_students
                    })
            else:
                # No time found, default to TBA
                logger.warning("SCHEDULE | No Day/Time found in PDF for faculty_id=%d", faculty_id)
                course_slots.append({
                    'subject_code': subject_code,
                    'subject_name': subject_name,
                    'section': section,
                    'units': 2,
                    'day': "TBA",
                    'start_time': "TBA",
                    'end_time': "TBA",
                    'venue': venue,
                    'enrolled_students': all_students
                })
            
            elapsed_ms = (time.perf_counter() - parse_start) * 1000
            if elapsed_ms > 2000:
                logger.warning("SCHEDULE | Slow PDF parsing: %.1fms, faculty_id=%d", elapsed_ms, faculty_id)
            else:
                logger.info("SCHEDULE | PDF parsed in %.1fms, %d slots", elapsed_ms, len(course_slots))
            
            return {
                'semester': pdf_semester,
                'academic_year': pdf_ay,
                'courses': course_slots
            }

    except Exception as e:
        logger.exception("SCHEDULE | PDF parsing failed for faculty_id=%d", faculty_id)
        return None
