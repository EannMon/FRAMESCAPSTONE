"""
PDF Parsing Service for Schedule/COR Uploads
Migrated from legacy Flask app.py to work with SQLAlchemy
"""
import pdfplumber
import re
from io import BytesIO
from typing import Optional, Dict, List, Any


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


def parse_time_slot(days_str: str, time_str: str) -> tuple:
    """
    Parse day and time from raw strings
    Days: "W" -> "Wednesday", etc.
    Time: "06:00PM-08:00PM" -> ("06:00PM", "08:00PM")
    """
    day_map = {
        'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'TH': 'Thursday', 'HU': 'Thursday',
        'F': 'Friday', 'S': 'Saturday', 'SUN': 'Sunday', 'SU': 'Sunday'
    }
    
    clean_day = days_str.upper().replace('.', '').strip()
    full_day = day_map.get(clean_day, days_str)
    
    # Parse time range
    time_str = time_str.replace('–', '-')
    if '-' in time_str:
        times = time_str.split('-')
        start = times[0].strip()
        end = times[1].strip() if len(times) > 1 else "TBA"
    else:
        start = time_str.strip()
        end = "TBA"
    
    return full_day, start, end


def parse_schedule_pdf(file_content: bytes, faculty_id: int) -> Optional[Dict[str, Any]]:
    """
    Parse COR PDF - ONE course with MANY students across pages
    PDF structure:
    - Header: Schedule info (ONE course only)  
    - Body: Student list (rows 1-N across multiple pages)
    - End: "Total Number of Students: N"
    """
    print("\n🔍 Parsing Schedule PDF...")
    
    try:
        with pdfplumber.open(BytesIO(file_content)) as pdf:
            # Extract text from FIRST PAGE ONLY for header info
            page1_text = pdf.pages[0].extract_text() if len(pdf.pages) > 0 else ""
            
            # Find course code (pattern: XXXX-M like "IT232-M") - should be unique, appears once
            subject_code_match = re.search(r'(IT\d{3}-[A-Z])', page1_text)
            subject_code = subject_code_match.group(1) if subject_code_match else "UNKNOWN"
            print(f"   Subject Code: {subject_code}")
            
            # Find subject name (between "Subject :" and line break)
            subject_match = re.search(r'Subject\s*:\s*([^\n]+)', page1_text)
            subject_name = subject_match.group(1).strip() if subject_match else "Unknown Subject"
            print(f"   Subject Name: {subject_name}")
            
            # Find section (between "Course/Section :" and line break)
            section_match = re.search(r'Course/Section\s*:\s*([^\n]+)', page1_text)
            section_raw = section_match.group(1).strip() if section_match else "UNKNOWN"
            section = clean_section(section_raw)
            print(f"   Section Raw: {section_raw} → Cleaned: {section}")
            
            # Find day/time (pattern: "D HH:XXPM-HH:XXPM")
            time_match = re.search(r'Day/Time\s*:\s*([A-Za-z\s]+(\d{1,2}):(\d{2})[AP]M-\d{1,2}:\d{2}[AP]M)', page1_text)
            if time_match:
                time_full = time_match.group(1).strip()
                days_raw = time_full.split()[0] if len(time_full.split()) > 0 else "TBA"
                time_raw = re.search(r'(\d{1,2}):(\d{2})[AP]M-\d{1,2}:\d{2}[AP]M', time_full)
                time_raw = time_raw.group(0) if time_raw else "TBA"
                day, start_time, end_time = parse_time_slot(days_raw, time_raw)
                print(f"   Day/Time: {day} {start_time}-{end_time}")
            else:
                day, start_time, end_time = "TBA", "TBA", "TBA"
                print(f"   Day/Time: Not found (using TBA)")
            
            # Find venue (between "Venue :" and line break)
            venue_match = re.search(r'Venue\s*:\s*([^\n]+)', page1_text)
            venue = venue_match.group(1).strip() if venue_match else "Room 324"
            print(f"   Venue: {venue}")
            
            # Find total number of students (from full PDF text)
            all_text = ""
            for page in pdf.pages:
                all_text += page.extract_text() + "\n"
            
            total_match = re.search(r'Total Number of Students\s+(\d+)', all_text)
            total_students = int(total_match.group(1)) if total_match else 0
            print(f"   Expected Students: {total_students}")
            
            # --- Extract student list from ALL PAGES tables ---
            all_students = []
            student_counter = 0
            found_header = False
            
            for page_idx, page in enumerate(pdf.pages):
                print(f"\n📖 Processing page {page_idx + 1}...")
                
                # Extract table from entire page (NO CROPPING - use header row detection)
                table = page.extract_table()
                
                if not table:
                    print(f"   ⚠️  No table found on page {page_idx + 1}")
                    continue

                for row_idx, row in enumerate(table):
                    if not row:
                        continue
                    
                    # Clean row data
                    clean_row = [str(x).replace('\n', ' ').strip() for x in row if x]
                    row_text = ' '.join(clean_row).lower()
                    
                    # Look for the header row: "Student No. Name of Student Course Remarks"
                    if not found_header:
                        if 'student no' in row_text and 'name of student' in row_text:
                            print(f"   📋 Found header row at row {row_idx}")
                            found_header = True
                            continue  # Skip the header row itself
                    
                    # Only process rows AFTER header is found
                    if not found_header:
                        continue
                    
                    # STOP at "Total Number of Students" line
                    if 'total number of students' in row_text or ('total' in row_text and 'students' in row_text and len(clean_row) <= 3):
                        print(f"   ✓ Reached end of student list at row {row_idx}")
                        break
                    
                    if len(clean_row) < 3:
                        continue
                    
                    # Check if first cell is a student number (1., 2., etc)
                    first_cell = clean_row[0].strip()
                    if not first_cell or not first_cell[0].isdigit():
                        continue
                    
                    student_counter += 1
                    
                    # Extract: Student No. | TUPM ID | Name | (Program) | (Remarks)
                    tupm_id = clean_row[1] if len(clean_row) > 1 else ""
                    name = clean_row[2] if len(clean_row) > 2 else "Unknown"
                    
                    # Validate TUPM ID format
                    if tupm_id and tupm_id.startswith("TUPM"):
                        all_students.append({
                            'tupm_id': tupm_id,
                            'name': name  # LAST, FIRST format
                        })
                        if student_counter <= 5 or student_counter > total_students - 3:
                            print(f"   ✓ Student {student_counter}: {tupm_id} - {name}")
                        elif student_counter == 6:
                            print(f"   ... (showing first and last students)")
            
            # Verify count
            print(f"\n✅ PDF Parsing Complete!")
            print(f"   📚 Course: {subject_code} ({subject_name})")
            print(f"   👥 Students found: {len(all_students)} (Expected: {total_students})")
            
            if total_students > 0 and len(all_students) != total_students:
                print(f"   ⚠️  MISMATCH! Expected {total_students} but found {len(all_students)}")
            
            # Return ONE course with ALL students
            return {
                'semester': "1st Semester",
                'academic_year': "2025-2026",
                'courses': [{
                    'subject_code': subject_code,
                    'subject_name': subject_name,
                    'section': section,
                    'units': 2,
                    'day': day,
                    'start_time': start_time,
                    'end_time': end_time,
                    'venue': venue,
                    'enrolled_students': all_students
                }]
            }

    except Exception as e:
        print(f"❌ PDF Parsing Error: {e}")
        import traceback
        traceback.print_exc()
        return None
