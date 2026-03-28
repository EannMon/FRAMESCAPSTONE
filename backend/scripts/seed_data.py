"""
Comprehensive Seed Data Script for FRAMES
Seeds: Departments, Programs, Faculty Head, Faculty Members, Program Coordinators

Hierarchy:
- 1 Faculty Head (Computer Studies Department)
- 5 Faculty Members (3 are also Program Coordinators for IT, IS, CS)
- Password for all: their lastname (lowercase)

SAFETY: This script NEVER deletes or alters existing records.
        It only INSERTs new rows. Existing records are skipped with a notice.
"""
import sys
import os
import bcrypt

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.department import Department
from models.program import Program
from models.user import User, UserRole, VerificationStatus


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def seed_all():
    """
    Seed all relational tables:
    - 1 Department (College of Science / Computer Studies)
    - 3 Programs (BSIT, BSIS, BSCS)
    - 1 Faculty Head
    - 5 Faculty Members (3 are Program Coordinators)
    """
    print("=" * 60)
    print("🌱 FRAMES Database Seeding")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # ============================================
        # 1. CREATE DEPARTMENT
        # ============================================
        print("\n📁 Creating Department...")
        
        department = db.query(Department).filter(Department.code == "CSD").first()
        if department:
            print(f"   ℹ️  Department already exists: {department.name} (ID: {department.id}) — skipping")
        else:
            department = Department(
                name="Computer Studies Department",
                code="CSD"
            )
            db.add(department)
            db.flush()
            print(f"   ✅ Created: {department.name} (ID: {department.id})")
        
        # ============================================
        # 2. CREATE PROGRAMS
        # ============================================
        print("\n📚 Creating Programs...")
        
        programs_data = [
            {"name": "Bachelor of Science in Information Technology", "code": "BSIT"},
            {"name": "Bachelor of Science in Information Systems", "code": "BSIS"},
            {"name": "Bachelor of Science in Computer Science", "code": "BSCS"},
        ]
        
        programs = {}
        for prog_data in programs_data:
            existing_prog = db.query(Program).filter(Program.code == prog_data["code"]).first()
            if existing_prog:
                programs[prog_data["code"]] = existing_prog
                print(f"   ℹ️  Program already exists: {prog_data['code']} (ID: {existing_prog.id}) — skipping")
            else:
                program = Program(
                    department_id=department.id,
                    name=prog_data["name"],
                    code=prog_data["code"]
                )
                db.add(program)
                db.flush()
                programs[prog_data["code"]] = program
                print(f"   ✅ Created: {prog_data['code']} - {prog_data['name']} (ID: {program.id})")
        
        # ============================================
        # 3. CREATE FACULTY HEAD
        # ============================================
        print("\n👔 Creating Faculty Head...")
        
        existing_head = db.query(User).filter(User.email == "head.santos@tup.edu.ph").first()
        if existing_head:
            print(f"   ℹ️  Faculty Head already exists: {existing_head.full_name} — skipping")
        else:
            head = User(
                email="head.santos@tup.edu.ph",
                password_hash=hash_password("santos"),  # Password: lastname
                tupm_id="TUPM-20-0001",
                role=UserRole.HEAD,
                verification_status=VerificationStatus.VERIFIED,
                face_registered=False,
                first_name="Ricardo",
                last_name="Santos",
                middle_name="Cruz",
                department_id=department.id,
                program_id=None  # Head oversees all programs
            )
            db.add(head)
            db.flush()
            print(f"   ✅ HEAD: {head.full_name} ({head.email})")
            print(f"      Password: santos | TUPM ID: {head.tupm_id}")
        
        # ============================================
        # 4. CREATE FACULTY MEMBERS (5 total)
        # 3 are Program Coordinators for IT, IS, CS
        # ============================================
        print("\n👨‍🏫 Creating Faculty Members...")
        
        faculty_data = [
            # Program Coordinators (first 3)
            {
                "email": "maria.dela_cruz@tup.edu.ph",
                "tupm_id": "TUPM-21-0101",
                "first_name": "Maria",
                "last_name": "Dela Cruz",
                "middle_name": "Reyes",
                "program_code": "BSIT",  # IT Program Coordinator
                "is_coordinator": True
            },
            {
                "email": "juan.garcia@tup.edu.ph",
                "tupm_id": "TUPM-21-0102",
                "first_name": "Juan",
                "last_name": "Garcia",
                "middle_name": "Lopez",
                "program_code": "BSIS",  # IS Program Coordinator
                "is_coordinator": True
            },
            {
                "email": "anna.reyes@tup.edu.ph",
                "tupm_id": "TUPM-21-0103",
                "first_name": "Anna",
                "last_name": "Reyes",
                "middle_name": "Bautista",
                "program_code": "BSCS",  # CS Program Coordinator
                "is_coordinator": True
            },
            # Regular Faculty Members (2 more)
            {
                "email": "pedro.mendoza@tup.edu.ph",
                "tupm_id": "TUPM-21-0104",
                "first_name": "Pedro",
                "last_name": "Mendoza",
                "middle_name": "Torres",
                "program_code": "BSIT",  # Teaches IT
                "is_coordinator": False
            },
            {
                "email": "elena.fernandez@tup.edu.ph",
                "tupm_id": "TUPM-21-0105",
                "first_name": "Elena",
                "last_name": "Fernandez",
                "middle_name": "Castro",
                "program_code": "BSCS",  # Teaches CS
                "is_coordinator": False
            },
        ]
        
        for fac_data in faculty_data:
            # Password is lastname in lowercase
            password = fac_data["last_name"].lower().replace(" ", "_")
            
            existing_fac = db.query(User).filter(User.email == fac_data["email"]).first()
            if existing_fac:
                coordinator_label = " 🎯 (Program Coordinator)" if fac_data["is_coordinator"] else ""
                print(f"   ℹ️  FACULTY already exists: {existing_fac.full_name}{coordinator_label} — skipping")
                continue
            
            faculty = User(
                email=fac_data["email"],
                password_hash=hash_password(password),
                tupm_id=fac_data["tupm_id"],
                role=UserRole.FACULTY,
                verification_status=VerificationStatus.VERIFIED,
                face_registered=False,
                first_name=fac_data["first_name"],
                last_name=fac_data["last_name"],
                middle_name=fac_data["middle_name"],
                department_id=department.id,
                program_id=programs[fac_data["program_code"]].id
            )
            db.add(faculty)
            db.flush()
            
            coordinator_label = " 🎯 (Program Coordinator)" if fac_data["is_coordinator"] else ""
            print(f"   ✅ FACULTY: {faculty.full_name} - {fac_data['program_code']}{coordinator_label}")
            print(f"      Email: {faculty.email} | Password: {password}")
        
        # ============================================
        # COMMIT ALL CHANGES
        # ============================================
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ SEEDING COMPLETE!")
        print("=" * 60)
        print("\n📊 Summary:")
        print(f"   • Departments: 1")
        print(f"   • Programs: 3 (BSIT, BSIS, BSCS)")
        print(f"   • Faculty Head: 1")
        print(f"   • Faculty Members: 5 (3 are Program Coordinators)")
        print(f"   • Total Users: 6")
        print("\n📝 Login Credentials (Password = Lastname):")
        print("   HEAD:    head.santos@tup.edu.ph / santos")
        print("   FACULTY: maria.dela_cruz@tup.edu.ph / dela_cruz (IT Coordinator)")
        print("   FACULTY: juan.garcia@tup.edu.ph / garcia (IS Coordinator)")
        print("   FACULTY: anna.reyes@tup.edu.ph / reyes (CS Coordinator)")
        print("   FACULTY: pedro.mendoza@tup.edu.ph / mendoza")
        print("   FACULTY: elena.fernandez@tup.edu.ph / fernandez")
        print("\n" + "=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()