
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pdfplumber
from io import BytesIO

def debug_pdf():
    """Debug PDF parsing to understand what text is being extracted"""
    file_path = os.path.join(os.path.dirname(__file__), '../testfile/BSIT4A.pdf')
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Debugging PDF: {file_path}")
    
    with open(file_path, 'rb') as f:
        content = f.read()
        
    with pdfplumber.open(BytesIO(content)) as pdf:
        page1_text = pdf.pages[0].extract_text() if len(pdf.pages) > 0 else ""
        
        print("=" * 60)
        print("FIRST PAGE RAW TEXT:")
        print("=" * 60)
        print(page1_text[:2000])  # Print first 2000 chars
        print("=" * 60)

if __name__ == "__main__":
    debug_pdf()
