# 📋 GUIDELINES - Team Workflow & Best Practices

**For**: FRAMES Capstone Team  
**Created**: January 26, 2026  
**Purpose**: Help team members work efficiently & consistently

---

## 📖 TABLE OF CONTENTS

1. [Initial Setup](#initial-setup) - Clone repo
2. [Daily Workflow](#daily-workflow) - Pull, branch, code, push
3. [Commit Standards](#commit-standards) - Clear messages
4. [Pull Request Process](#pull-request-process) - PR guidelines
5. [File Naming](#file-naming) - Consistent naming
6. [Documentation](#documentation) - Always document!
7. [Code Review](#code-review) - Peer review checklist
8. [Troubleshooting](#troubleshooting) - Common issues & fixes

---

## 🚀 INITIAL SETUP (First Time Only)

### Step 1: Install Prerequisites

**What you need**:
```
✅ Git (https://git-scm.com/download)
✅ Python 3.9+ (https://www.python.org/)
✅ Node.js 18+ (https://nodejs.org/)
✅ Visual Studio Code (https://code.visualstudio.com/)
✅ GitHub Account (https://github.com/)
```

**Verify installation**:
```bash
git --version        # Should show Git version
python --version     # Should show 3.9+
node --version       # Should show 18+
npm --version        # Should show 8+
```

### Step 2: Configure Git (IMPORTANT!)

```bash
# Tell Git who you are
git config --global user.name "Your Full Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global user.name
git config --global user.email
```

### Step 3: Clone the Repository

```bash
# Navigate to where you want the project
cd /path/to/your/projects

# Clone the FRAMES repository
git clone https://github.com/hasu621/Capstoneee.git

# Enter the project folder
cd Capstoneee

# See available branches
git branch -a
```

### Step 4: Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify database connection
python scripts/test_db.py
# Should show: ✅ SUCCESS! Connected to Aiven!
```

### Step 5: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm list react
# Should show React version
```

### Step 6: You're Ready!

```bash
# Backend is ready on http://localhost:5000
# Frontend is ready on http://localhost:3000
# Database is connected to Aiven
✅ Setup complete!
```

---

## 📅 DAILY WORKFLOW (Every Day)

### Morning: Start Work

```bash
# 1. Navigate to project
cd /path/to/Capstoneee

# 2. Switch to main branch
git checkout main

# 3. Pull latest changes from team
git pull origin main
# Shows any changes other team members made

# 4. Create your feature branch (see naming below)
git checkout -b feature/your-feature-name
# Example: git checkout -b feature/hand-gesture-recognition
```

### During Day: Make Changes

```bash
# 1. Edit files in your editor

# 2. Save files (Ctrl+S or Cmd+S)

# 3. Test your changes
# Backend: python app.py
# Frontend: npm start

# 4. When satisfied, check what changed
git status
# Shows modified files

# 5. See the actual changes
git diff filename.py
# Shows what changed in that file

# 6. Add your changes
git add .
# OR add specific files:
git add filename.py another_file.js

# 7. Commit with clear message (see standards below)
git commit -m "Add hand gesture recognition for peace sign"

# 8. Push to your branch
git push origin feature/your-feature-name
```

### End of Day: Push Work

```bash
# Always push before leaving!
git push origin feature/your-feature-name

# Message shows:
# [new branch] feature/your-feature-name -> feature/your-feature-name
# OR
# feature/your-feature-name -> feature/your-feature-name

# Your work is safe in cloud ✅
```

### When Feature is Complete: Pull Request

```bash
# 1. Push final commit
git push origin feature/your-feature-name

# 2. Go to GitHub: https://github.com/hasu621/Capstoneee

# 3. Click "Compare & pull request" button

# 4. Fill in PR details:
#    - Title: Clear description
#    - Description: What changed & why
#    - Assignees: Who should review

# 5. Click "Create Pull Request"

# 6. Wait for code review

# 7. Make requested changes if needed:
git add .
git commit -m "Address review comments"
git push origin feature/your-feature-name
# PR automatically updates!

# 8. When approved, click "Merge Pull Request"

# 9. Go back to main
git checkout main
git pull origin main
# Your changes now in main ✅
```

---

## 💬 COMMIT STANDARDS (IMPORTANT!)

### Commit Message Format

```
<type>: <subject>

<body (optional)>
```

### Examples of Good Commits

```bash
# Feature commit
git commit -m "Add hand gesture recognition for peace sign"

# Bug fix commit
git commit -m "Fix face recognition false positives in low light"

# Documentation commit
git commit -m "Add gesture implementation guide"

# Refactor commit
git commit -m "Extract gesture logic to separate module"

# Test commit
git commit -m "Add unit tests for gesture detection"
```

### Examples of BAD Commits ❌

```bash
# Too vague
git commit -m "update stuff"

# Too long
git commit -m "asdfjkl;asdfjkl;asdfjkl;"

# Doesn't describe change
git commit -m "fix"

# Multiple features mixed
git commit -m "Added gesture, fixed database, updated docs"
```

### Commit Types

| Type | Use When | Example |
|------|----------|---------|
| **add** | Adding new feature | `add: Hand gesture recognition` |
| **fix** | Fixing a bug | `fix: Face recognition crash on empty frame` |
| **refactor** | Reorganizing code | `refactor: Extract API calls to services` |
| **docs** | Documentation changes | `docs: Add gesture setup guide` |
| **test** | Adding/updating tests | `test: Add gesture detection tests` |
| **style** | Code formatting | `style: Format gesture.py with black` |
| **chore** | Maintenance | `chore: Update dependencies` |

### Make Commits Atomic (Small & Focused)

```bash
# ❌ BAD: Many unrelated changes in one commit
git add .
git commit -m "Update everything"

# ✅ GOOD: Small, focused commits
git add gesture.py
git commit -m "Add peace sign gesture detection"

git add gesture_tests.py
git commit -m "Add unit tests for gesture detection"

git add GESTURE_GUIDE.md
git commit -m "Add gesture setup documentation"

# Result: Clean git history, easy to review!
```

---

## 🔀 PULL REQUEST PROCESS

### Step 1: Create Pull Request

After pushing your branch:
```bash
git push origin feature/your-feature-name
```

Go to GitHub and you'll see:
```
"Compare & pull request" button
```

### Step 2: Fill PR Details

```
Title: Clear one-line description
Example: "Add hand gesture recognition for break confirmation"

Description: More details
Example:
- Implements MediaPipe hand detection
- Recognizes 3 gestures: Peace (break-out), Thumbs up (break-in), Fist (exit)
- Tested with 20+ users
- All unit tests passing

Fixes: #123 (if closing an issue)
```

### Step 3: Add Reviewers

Click "Reviewers" and choose team members

### Step 4: Code Review Process

Reviewers will:
- ✅ Check code quality
- ✅ Run tests
- ✅ Leave comments
- ✅ Approve or request changes

You will:
- 📖 Read all comments
- 🔧 Make requested changes
- ✅ Push new commits
- 💬 Respond to comments

### Step 5: Merge to Main

After approval:
1. All conversations resolved
2. All checks passing
3. Click "Merge pull request"
4. Delete feature branch
5. Done! ✅

### PR Checklist (Before Creating)

```
✅ Code compiles/runs without errors
✅ Tests written and passing
✅ Documentation updated
✅ No console errors/warnings
✅ Commit messages are clear
✅ No debug code left behind
✅ Performance acceptable
✅ Security considerations reviewed
```

---

## 📝 FILE NAMING CONVENTIONS

### Python Files

```python
# Module names (lowercase, underscores)
gesture_detection.py      ✅ GOOD
face_recognition.py       ✅ GOOD
GestureDetection.py       ❌ BAD
gesture-detection.py      ❌ BAD

# Function/class names
def detect_gesture():      ✅ GOOD
class GestureDetector:     ✅ GOOD
def detectGesture():       ❌ BAD
```

### React/JavaScript Files

```javascript
// Component files (PascalCase)
GestureDetector.jsx       ✅ GOOD
FacultyUpload.jsx         ✅ GOOD
gesture-detector.jsx      ❌ BAD
gestureDetector.jsx       ❌ BAD

// Utility files (camelCase)
gestureUtils.js           ✅ GOOD
uploadService.js          ✅ GOOD
GestureUtils.js           ❌ BAD

// Constants (UPPER_SNAKE_CASE)
GESTURE_TYPES.js          ✅ GOOD
MAX_FACE_DISTANCE.js      ✅ GOOD
GestureTypes.js           ❌ BAD
```

### Documentation Files

```markdown
// Clear, descriptive names
GESTURE_SETUP_GUIDE.md                ✅ GOOD
HAND_GESTURE_IMPLEMENTATION.md        ✅ GOOD
gesture_setup.md                      ✅ GOOD
GESTURE.md                            ❌ TOO VAGUE
guide.md                              ❌ NOT DESCRIPTIVE
```

### Branch Names

```bash
# Feature
git checkout -b feature/hand-gestures              ✅ GOOD
git checkout -b feature/kiosk-interface            ✅ GOOD

# Bug fix
git checkout -b bugfix/face-false-positives        ✅ GOOD
git checkout -b bugfix/camera-crash                ✅ GOOD

# Documentation
git checkout -b docs/gesture-guide                 ✅ GOOD
git checkout -b docs/setup-instructions            ✅ GOOD

# Bad names
git checkout -b feature123                         ❌ TOO VAGUE
git checkout -b fix-stuff                          ❌ NOT SPECIFIC
git checkout -b work-in-progress                   ❌ NOT CLEAR
git checkout -b feature/everything                 ❌ TOO BROAD
```

---

## 📖 DOCUMENTATION STANDARDS

### Every Feature Needs Documentation

When you add a feature, document it:

```markdown
# Feature Name: Hand Gesture Recognition

## What It Does
Brief description of the feature

## How to Use It
Step-by-step instructions

## Code Example
Show how to implement/use

## Configuration
Any settings needed

## Testing
How to test the feature

## Troubleshooting
Common issues and solutions
```

### File Header Comments

```python
# Python
"""
Module: gesture_detection.py
Purpose: Detect hand gestures using MediaPipe
Author: Your Name
Date: January 26, 2026
"""

# Example usage:
# detector = GestureDetector()
# gesture = detector.detect(frame)
```

```javascript
// JavaScript
/**
 * Component: GestureDetector.jsx
 * Purpose: Display hand gesture feedback on Kiosk
 * Author: Your Name
 * Date: January 26, 2026
 */

// Example usage:
// <GestureDetector onGestureDetected={handleGesture} />
```

### Docstrings for Functions

```python
def detect_gesture(frame):
    """
    Detect hand gesture in video frame.
    
    Args:
        frame (numpy.ndarray): Video frame to analyze
        
    Returns:
        str: Gesture type ('peace', 'thumbs_up', 'fist') or None if not detected
        
    Raises:
        ValueError: If frame is invalid
        
    Example:
        >>> frame = cv2.imread('hand.jpg')
        >>> gesture = detect_gesture(frame)
        >>> print(gesture)
        'peace'
    """
    # Implementation...
```

---

## 🔍 CODE REVIEW CHECKLIST

When reviewing someone's code:

### Functionality
- [ ] Does it work as described?
- [ ] Are edge cases handled?
- [ ] Any potential bugs?

### Code Quality
- [ ] Is it readable?
- [ ] Is it well-commented?
- [ ] Follows naming conventions?
- [ ] No code duplication?

### Testing
- [ ] Tests written?
- [ ] Tests passing?
- [ ] Coverage adequate?

### Documentation
- [ ] Code commented?
- [ ] Docstrings present?
- [ ] README updated?

### Security
- [ ] Input validated?
- [ ] No hardcoded secrets?
- [ ] Safe database queries?

### Performance
- [ ] Efficient algorithms?
- [ ] No memory leaks?
- [ ] Acceptable load time?

---

## 🆘 TROUBLESHOOTING

### Problem: "I can't push - rejected"

```bash
# This happens when remote has changes you don't have

# Solution 1: Pull first
git pull origin feature/your-branch
git push origin feature/your-branch

# Solution 2: Force push (only if you know what you're doing)
git push origin feature/your-branch --force-with-lease
```

### Problem: "I committed to wrong branch!"

```bash
# Oops! You committed to main instead of feature branch

# Solution:
git reset HEAD~1           # Undo the commit (keeps changes)
git checkout -b feature/fix-branch  # Create new branch
git add .
git commit -m "Correct commit message"
git push origin feature/fix-branch
```

### Problem: "Merge conflict!"

```bash
# Two people changed the same file

# Solution:
git pull origin main       # This will show conflicts

# Open the file and look for:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> main

# Edit to keep what you want, delete conflict markers
git add .
git commit -m "Resolve merge conflict"
git push origin feature/your-branch
```

### Problem: "I lost my work!"

```bash
# Don't panic! Git has recovery tools

# See all recent commits (including deleted)
git reflog

# Find your commit and restore it
git reset --hard <commit-hash>

# Or ask team lead for help!
```

### Problem: "Database connection failed"

```bash
cd backend
python scripts/test_db.py

# If failed, check:
# 1. .env file exists in backend/ folder
# 2. Database credentials are correct
# 3. ca.pem certificate is present
# 4. Internet connection is working
# 5. Ask team lead to verify credentials
```

### Problem: "npm start not working"

```bash
cd frontend

# Clear cache and reinstall
rm -r node_modules
rm package-lock.json
npm install
npm start

# If still fails, check:
# 1. Node.js version (npm --version)
# 2. Port 3000 not in use (check Task Manager)
# 3. Ask team lead for help
```

---

## 📋 QUICK REFERENCE COMMANDS

### Most Used Commands

```bash
# Check status
git status

# See changes
git diff

# Add files
git add .

# Commit
git commit -m "Clear message"

# Push
git push origin feature/branch-name

# Pull
git pull origin main

# Create branch
git checkout -b feature/name

# Switch branch
git checkout main

# See log
git log --oneline

# Undo last commit (keep changes)
git reset --hard HEAD~1
```

### Useful Git Aliases (Optional)

Add to `.gitconfig`:
```
[alias]
    st = status
    co = checkout
    br = branch
    cm = commit -m
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all
```

Then use:
```bash
git st                    # Instead of: git status
git co main              # Instead of: git checkout main
git cm "message"         # Instead of: git commit -m "message"
```

---

## 👥 TEAM COMMUNICATION

### Before Starting Work

Tell the team:
```
"I'm working on: Hand gesture recognition for break-out"
"Working on branch: feature/gesture-break-out"
"Expected time: 2-3 days"
```

### When Stuck

Ask for help:
```
"I'm stuck on gesture detection - faces in shadows"
"Can someone review my PR? Waiting for feedback"
"Need help debugging camera connection"
```

### When Pushing to Main

Announce:
```
"Merged: Feature - Hand gesture recognition"
"Status: Gesture detection now live on main branch"
"Testing: All unit tests passing"
```

---

## 🎯 Daily Checklist

Every day when you work:

- [ ] Pull latest changes from main
- [ ] Create feature branch
- [ ] Write code
- [ ] Test your changes
- [ ] Commit with clear message
- [ ] Push to your branch
- [ ] Add documentation
- [ ] Before leaving: push all changes
- [ ] Tell team what you did

---

## 📞 Need Help?

- **Code Questions**: Ask team in chat
- **Git Issues**: Ask team lead
- **Database Problems**: Ask Emmanuel
- **Can't Run Locally**: Ask team lead
- **Documentation Questions**: Check `docs/` folder
- **Team Workflow**: See this guide again!

---

## 🎓 Next: Advanced Workflows (Coming Soon)

Future guides will cover:
- How to prompt for features
- Advanced git techniques
- Code optimization
- Testing strategies
- Deployment process

---

**Version**: 1.0  
**Created**: January 26, 2026  
**For**: FRAMES Capstone Team  
**Status**: ✅ Ready to Use

**Next Guide**: [FEATURE_REQUEST_GUIDE.md](./FEATURE_REQUEST_GUIDE.md) (coming soon)

