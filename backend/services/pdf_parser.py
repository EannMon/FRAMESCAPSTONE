"""
PDF Parsing Service for Schedule/COR Uploads
Migrated from legacy Flask app.py to work with SQLAlchemy
"""
import pdfplumber
import re
from io import BytesIO
from typing import Optional, Dict, List, Any, Tuple


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
    time_str = time_str.replace('–', '-')
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
    Parse COR PDF - ONE course with MANY students across pages
    The result structure 'courses' list will contain ONE entry per DAY/TIME slot.
    So a T/TH class will result in TWO entries in 'courses' list, both with the same students.
    """
    print("\n🔍 Parsing Schedule PDF...")
    
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
            
            print(f"   Subject Code: {subject_code}")
            print(f"   Subject Name: {subject_name}")
            
            # Find section
            section_match = re.search(r'Course/Section\s*:\s*([^\n]+)', page1_text)
            section_raw = section_match.group(1).strip() if section_match else "UNKNOWN"
            section = clean_section(section_raw)
            print(f"   Section: {section}")
            
            # Find venue
            venue_match = re.search(r'Venue\s*:\s*([^\n]+)', page1_text)
            venue = venue_match.group(1).strip() if venue_match else "Room 324"
            print(f"   Venue: {venue}")
            
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

            print(f"   👥 Students found: {len(all_students)} (Expected: {total_students_expected})")

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
                print(f"   Parsed Schedule Slots: {parsed_slots}")
                
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
                print("   ⚠️ No Day/Time found")
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
            
            return {
                'semester': "1st Semester",
                'academic_year': "2025-2026",
                'courses': course_slots
            }

    except Exception as e:
        print(f"❌ PDF Parsing Error: {e}")
        import traceback
        traceback.print_exc()
        return None
