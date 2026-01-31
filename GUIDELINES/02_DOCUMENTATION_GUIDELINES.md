# 📚 DOCUMENTATION GUIDELINES

**For FRAMES Capstone Team - How to Write Docs Like a Pro!**

---

## 📖 Table of Contents

1. [When to Write Docs](#when-to-write-docs)
2. [Documentation Types](#documentation-types)
3. [Markdown Formatting](#markdown-formatting)
4. [File Organization](#file-organization)
5. [Code Comments](#code-comments)
6. [README Best Practices](#readme-best-practices)
7. [Examples](#examples)

---

## 📝 When to Write Docs

Document EVERYTHING when you:

✅ **Add a new feature**
- Gesture recognition? Document it!
- New API endpoint? Document it!
- Database changes? Document it!

✅ **Fix a bug**
- What was the problem?
- Why did it happen?
- How did you fix it?

✅ **Change something major**
- Modified file structure?
- Updated dependencies?
- Refactored code?

✅ **Set up something new**
- First time setup steps?
- Configuration needed?
- Environment variables?

❌ **DON'T document**
- Regular bug fixes (too minor)
- Style changes (formatting)
- Internal refactors (same function, different code)

---

## 📂 Documentation Types

### 1. README.md (Project Overview)

**Purpose**: First file team sees  
**Location**: Root or folder root  
**Content**: What is this? How to run it?

**Structure**:
```markdown
# Project Name

## 📖 Overview
What is this project/folder?

## 🚀 Quick Start
How to get it running in 2 minutes?

## 📋 Requirements
What's needed to run this?

## 🔧 Installation
Step-by-step setup

## 📚 Usage
How to use it with examples?

## 🐛 Troubleshooting
Common problems & fixes

## 📞 Support
Who to ask for help
```

### 2. FEATURE_GUIDE.md (How to Use a Feature)

**Purpose**: Explain a specific feature  
**Location**: `docs/features/` folder  
**Content**: Tutorial for using the feature

**Structure**:
```markdown
# Feature: Hand Gesture Recognition

## What It Does
Plain English explanation

## Requirements
What's needed?

## Step-by-Step Usage
1. First step
2. Second step
3. Third step

## Code Example
Show how to implement

## Configuration
Settings to adjust

## Troubleshooting
Common issues

## Related Guides
Links to other docs
```

### 3. API_DOCUMENTATION.md (Technical Reference)

**Purpose**: Document API endpoints  
**Location**: `docs/` folder or `backend/docs/`  
**Content**: Every endpoint with details

**Structure**:
```markdown
# API Documentation

## Endpoint: POST /api/login

### Description
What does this endpoint do?

### Request
```json
{
  "tupm_id": "string",
  "password": "string"
}
```

### Response (Success: 200)
```json
{
  "token": "string",
  "user_id": "integer",
  "role": "string"
}
```

### Response (Error: 401)
```json
{
  "error": "Invalid credentials"
}
```

### Example Usage
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"tupm_id": "12345", "password": "pass"}'
```

### Notes
- Rate limited to 5 requests/minute
- Password hashed with bcrypt
```

### 4. SETUP_GUIDE.md (Installation Instructions)

**Purpose**: Help new team members set up  
**Location**: Root or `docs/`  
**Content**: Detailed step-by-step setup

### 5. TROUBLESHOOTING.md (Problem Solving)

**Purpose**: Common issues & solutions  
**Location**: `docs/`  
**Content**: Problem → Solution format

---

## ✏️ Markdown Formatting

### Headings

```markdown
# Main Title (H1) - Use ONCE per file
## Section (H2) - Use for main sections
### Subsection (H3) - Use for details
#### Sub-subsection (H4) - Use rarely
```

### Emphasis

```markdown
**Bold text** for important words
*Italic text* for emphasis
`Code` for single items
`code example` for technical terms
~~Strikethrough~~ for removed items
```

### Lists

```markdown
# Unordered List
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

# Ordered List
1. First step
2. Second step
   a. Sub-step
   b. Sub-step
3. Third step

# Checkbox List (For checklists)
- [ ] Incomplete task
- [x] Completed task
- [ ] Another task
```

### Code Blocks

```markdown
# Inline code
Use `variable_name` for single items

# Code block (no highlighting)
    code here
    indented with 4 spaces

# Code block with language (syntax highlighting)
\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

\`\`\`bash
git clone https://github.com/hasu621/Capstoneee.git
\`\`\`
```

### Links

```markdown
# Link with text
[Click here](https://github.com)

# Direct link
https://github.com

# Link to file in repo
See [setup guide](./SETUP_GUIDE.md)

# Link to file with line number
See [app.py line 100](../backend/app.py#L100)

# Link to section
See [Database Schema](#database-schema)
```

### Tables

```markdown
| Feature | Status | Date |
|---------|--------|------|
| Gesture Recognition | ✅ Complete | Jan 2026 |
| Kiosk Interface | 🔄 In Progress | Jan 2026 |
| Raspberry Pi | ❌ Not Started | TBD |
```

### Images

```markdown
# From URL
![Alt text](https://example.com/image.png)

# From local file
![Alt text](./images/screenshot.png)
```

### Blockquotes

```markdown
> This is important!
> 
> Read this carefully
```

### Horizontal Line

```markdown
---

Separates sections
```

---

## 📂 File Organization

### Location Strategy

```
docs/
├── 00_START_HERE.md              # Read first!
├── README.md                      # Project overview
├── QUICK_REFERENCE.md             # One-pager
├── SETUP_GUIDE.md                 # Installation
├── TROUBLESHOOTING.md             # Common issues
│
├── architecture/                  # System design
│   ├── DATABASE_SCHEMA.md
│   ├── API_STRUCTURE.md
│   └── SYSTEM_DESIGN.md
│
├── features/                      # Feature guides
│   ├── GESTURE_RECOGNITION.md
│   ├── PDF_UPLOAD.md
│   ├── KIOSK_INTERFACE.md
│   └── REPORTS.md
│
├── development/                   # Dev guides
│   ├── LOCAL_SETUP.md
│   ├── BACKEND_DEVELOPMENT.md
│   ├── FRONTEND_DEVELOPMENT.md
│   └── TESTING.md
│
├── deployment/                    # Deployment guides
│   ├── PRODUCTION_SETUP.md
│   ├── RASPBERRY_PI.md
│   └── TROUBLESHOOTING_DEPLOYMENT.md
│
└── api/                           # API docs
    ├── AUTHENTICATION.md
    ├── USER_ENDPOINTS.md
    ├── ATTENDANCE.md
    └── REPORTS.md
```

### Naming Convention

```
✅ GOOD names:
- GESTURE_RECOGNITION_GUIDE.md
- DATABASE_SCHEMA.md
- API_DOCUMENTATION.md
- LOCAL_SETUP.md

❌ BAD names:
- gesture.md (too vague)
- setup.md (which setup?)
- guide.md (which guide?)
- doc1.md (not descriptive)
```

---

## 💬 Code Comments

### Comment Format

```python
# Python comment - one line
def detect_gesture(frame):
    """
    Multi-line docstring for functions.
    
    Args:
        frame (numpy.ndarray): Input video frame
        
    Returns:
        str: Gesture type detected
    """
    # Use comments for WHY, not WHAT
    # If code is hard to understand, explain WHY
    
    # Bad comment:
    x = x + 1  # Add 1 to x (obvious!)
    
    # Good comment:
    # Increment counter to skip duplicate frames
    frame_skip_counter += 1
```

```javascript
// JavaScript comment
function detectGesture(frame) {
    /**
     * Multi-line comment for functions
     * Explains what it does
     * 
     * @param {Array} frame - Video frame data
     * @returns {String} Gesture type
     */
}
```

### When to Comment

```python
# ✅ Good: Explains non-obvious logic
# Use weighted average of last 3 frames for stability
gesture = weighted_average(last_3_frames)

# ✅ Good: Documents assumptions
# Assumes frame is 640x480 RGB format
def process_frame(frame):
    pass

# ✅ Good: Notes potential issues
# TODO: Add rate limiting before production
# FIXME: False positives in low light
# NOTE: DeepFace model requires preprocessing

# ❌ Bad: Obvious
x = x + 1  # Add 1 to x

# ❌ Bad: Outdated
# This used to work before update
```

### Use TODO/FIXME/NOTE

```python
# TODO: Implement gesture smoothing
def detect_gesture():
    pass

# FIXME: Camera sometimes disconnects
frame = camera.capture()

# NOTE: Must run with GPU for speed
def face_recognition():
    pass
```

---

## 📖 README Best Practices

### Essential Sections

```markdown
# Project Name

## 🎯 Overview
One paragraph: What is this?

## 🚀 Quick Start
Get running in 5 minutes

## 📋 Requirements
What's needed

## 🔧 Installation
Step by step

## 📚 Usage
How to use

## 📁 Project Structure
Folder overview

## 🐛 Troubleshooting
Common issues

## 📞 Support
Who to ask

## 📄 License
Legal stuff
```

### Tips

1. **Start with overview** - New reader needs context
2. **Code examples** - Show, don't tell
3. **Clear headings** - Easy to scan
4. **Use emoji** - Makes it readable
5. **Links everywhere** - Link to other docs
6. **Keep updated** - Stale docs are worse than no docs

---

## 🔥 Examples

### Example 1: Feature Guide

```markdown
# Hand Gesture Recognition Guide

## 🎯 What It Does
Detects student hand gestures on camera to confirm break in/out status.

## 📋 Requirements
- Python 3.9+
- MediaPipe library
- OpenCV
- Raspberry Pi 4 (for deployment)

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
pip install mediapipe opencv-python
\`\`\`

### 2. Start Recognition
\`\`\`python
from gesture_detection import GestureDetector

detector = GestureDetector()
gesture = detector.detect(frame)
print(gesture)  # Output: "peace", "thumbs_up", or "fist"
\`\`\`

### 3. Gestures Recognized
- 🤘 **Peace Sign** = Break Out
- 👍 **Thumbs Up** = Break In
- ✊ **Fist** = Exit

## ⚙️ Configuration
\`\`\`python
# In gesture_detection.py
CONFIDENCE_THRESHOLD = 0.8  # Adjust if too sensitive
MIN_FRAMES = 5  # Wait 5 frames to confirm
\`\`\`

## 🆘 Troubleshooting
**Gestures not detected?**
- Ensure good lighting
- Hand must be 30-60cm from camera
- Try raising CONFIDENCE_THRESHOLD

**Too many false positives?**
- Lower CONFIDENCE_THRESHOLD
- Ensure steady hand gesture (hold 1 second)

## 📖 Related
- [README](../README.md)
- [Kiosk Interface](./KIOSK_INTERFACE.md)
- [Raspberry Pi Setup](./RASPBERRY_PI.md)
```

### Example 2: API Documentation

```markdown
# Attendance API

## POST /api/attendance/check-in

### Description
Records student attendance when face is recognized

### Request
\`\`\`json
{
  "tupm_id": "2023-001",
  "gesture": "peace",
  "confidence": 0.95
}
\`\`\`

### Response (Success: 200)
\`\`\`json
{
  "status": "success",
  "message": "Attendance recorded",
  "timestamp": "2026-01-26T10:30:00Z",
  "class": "CMPSC-101"
}
\`\`\`

### Response (Error: 401)
\`\`\`json
{
  "error": "Face not recognized",
  "confidence": 0.65
}
\`\`\`

### Examples
**Success:**
\`\`\`bash
curl -X POST http://localhost:5000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "tupm_id": "2023-001",
    "gesture": "peace",
    "confidence": 0.95
  }'
\`\`\`

### Notes
- Requires face embedding to be registered
- Gesture optional but recommended
- Timestamp set by server
```

---

## ✅ Documentation Checklist

Before committing:

- [ ] File named clearly (FEATURE_DESCRIPTION.md)
- [ ] Located in correct folder
- [ ] First heading is the title
- [ ] Contains overview section
- [ ] Includes code examples
- [ ] Has troubleshooting section
- [ ] Links to related docs
- [ ] No spelling errors
- [ ] Markdown properly formatted
- [ ] Images referenced correctly

---

## 🎓 Summary

### DO ✅
- Write clear, simple English
- Use code examples
- Organize logically
- Link related docs
- Keep it updated
- Use heading levels correctly
- Add emoji for readability

### DON'T ❌
- Use too many parentheses (like this (which is annoying (right?)))
- Write in first person (except guides)
- Make docs too long (break into parts)
- Forget to update docs when code changes
- Write in technical jargon
- Use bad grammar
- Leave placeholder text

---

## 📞 Questions?

Check [01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md) for support contacts.

---

**Version**: 1.0  
**Created**: January 26, 2026  
**For**: FRAMES Capstone Team

