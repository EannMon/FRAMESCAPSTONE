# 🎯 GUIDELINES - Team Onboarding Hub

**Welcome to FRAMES Capstone Team!**

This folder contains everything you need to work effectively with the team.

---

## 📚 What's Here?

### 1. [01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md) ⭐ START HERE

**Your complete guide to working with the team**

Learn:
- How to clone the repository for first time
- Daily workflow (pull, branch, code, push)
- How to make commits and pull requests
- Git best practices
- Troubleshooting common issues

**Time**: 30 minutes to read  
**For**: Everyone on team

---

### 2. [QUICK_START_CARD.md](./QUICK_START_CARD.md) 💨

**One-page reference - Print and keep on desk!**

Contains:
- Most common commands
- Quick troubleshooting
- First-time setup checklist
- Emergency fixes

**Time**: 2 minutes to scan  
**For**: Everyone - use daily

---

### 3. [02_DOCUMENTATION_GUIDELINES.md](./02_DOCUMENTATION_GUIDELINES.md) 📝

**How to write documentation like a pro**

Learn:
- When and what to document
- Markdown formatting
- Where to put documentation
- Code comment best practices
- Documentation examples

**Time**: 20 minutes to read  
**For**: Developers - use when adding features

---

## 🚀 Quick Start (5 Minutes)

### First Time Only

```bash
# 1. Clone repository
git clone https://github.com/hasu621/Capstoneee.git
cd Capstoneee

# 2. Backend setup
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python scripts/test_db.py    # Should show: ✅ SUCCESS!

# 3. Frontend setup
cd ../frontend
npm install
npm start                    # Should show: http://localhost:3000
```

### Every Morning

```bash
cd Capstoneee
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### End of Day

```bash
git add .
git commit -m "Add: Clear description of changes"
git push origin feature/your-feature-name
```

---

## 📖 Reading Guide

### First Time Working Here?

👉 Read in this order:

1. **This README** (2 min)
2. **[QUICK_START_CARD.md](./QUICK_START_CARD.md)** (2 min)
3. **[01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md)** (30 min)
4. **Project Docs**: [../docs/](../docs/) folder

**Total time: ~45 minutes**

### Working on a New Feature?

1. **[01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md)** - Refresh workflow
2. **[02_DOCUMENTATION_GUIDELINES.md](./02_DOCUMENTATION_GUIDELINES.md)** - Plan docs
3. **Related project docs** - Understand system
4. **Code!** - Implement feature
5. **Document** - Add documentation
6. **Push & PR** - Create pull request

### Need to Fix Something?

1. **[QUICK_START_CARD.md](./QUICK_START_CARD.md)** - See troubleshooting section
2. **[01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md#troubleshooting)** - Full guide
3. **Ask team** - In chat or standup

---

## 💡 Key Principles

### 1. Pull First, Push Last

Always pull before you start work:
```bash
git pull origin main
```

Always push before you leave:
```bash
git push origin feature/your-branch
```

### 2. Branches for Everything

NEVER commit directly to `main`!

Always create a feature branch:
```bash
git checkout -b feature/what-you-are-building
```

### 3. Clear Commit Messages

Commits should describe WHAT changed:

```bash
✅ git commit -m "Add hand gesture recognition"
✅ git commit -m "Fix camera crash in low light"
✅ git commit -m "Add documentation for setup"

❌ git commit -m "update"
❌ git commit -m "fix"
❌ git commit -m "asdfjkl"
```

### 4. Document Everything

Add documentation when you:
- Create new feature
- Fix important bug
- Change file structure
- Update configuration

See [02_DOCUMENTATION_GUIDELINES.md](./02_DOCUMENTATION_GUIDELINES.md)

### 5. Test Before Pushing

Test your changes locally before pushing:

```bash
# Backend: python app.py
# Frontend: npm start
# Check for errors!
```

### 6. Ask for Help

Stuck? Confused? Ask the team!
- Chat: Ask in group chat
- Emergency: Call team lead
- Documentation: Check [docs/](../docs/) folder

---

## 🎯 Team Workflow Summary

```
DAY 1: Setup
├─ Clone repository
├─ Setup backend (Python)
├─ Setup frontend (Node.js)
└─ Test database connection ✅

EVERY DAY: Work Cycle
├─ Morning: pull main → create branch
├─ During: code → test → commit → push
├─ End: push changes
└─ Review: check GitHub status

WHEN DONE: Pull Request
├─ GitHub: Create PR
├─ Team: Reviews code
├─ You: Address feedback
├─ Merge: When approved
└─ Team: Pulls latest changes ✅
```

---

## 📁 Project Structure

```
Capstoneee/
├─ README.md                           # Project overview
├─ GUIDELINES/                         # 👈 You are here!
│  ├─ README.md
│  ├─ 01_TEAM_WORKFLOW_GUIDE.md
│  ├─ 02_DOCUMENTATION_GUIDELINES.md
│  └─ QUICK_START_CARD.md
│
├─ docs/                              # All documentation
│  ├─ START_HERE.md
│  ├─ PROJECT_ANALYSIS_AND_ARCHITECTURE.md
│  ├─ FILE_MANIFEST.md
│  └─ ...other guides
│
├─ backend/                           # Python Flask API
│  ├─ app.py                         # Main application
│  ├─ db_config.py                   # Database config
│  ├─ requirements.txt               # Python packages
│  ├─ scripts/                       # Dev scripts
│  │  ├─ test_db.py
│  │  ├─ seed_data.py
│  │  └─ ...others
│  ├─ api/                           # API routes
│  ├─ core/                          # Core logic
│  ├─ database/                      # DB models
│  └─ tests/                         # Test files
│
├─ frontend/                          # React app
│  ├─ package.json                   # Node packages
│  ├─ public/                        # Static files
│  └─ src/
│     ├─ App.js                      # Main component
│     ├─ components/                 # React components
│     ├─ services/                   # API calls
│     ├─ context/                    # State management
│     ├─ utils/                      # Utilities
│     └─ hooks/                      # Custom hooks
│
├─ SQL/                              # Database schema
│  └─ database_structure.sql
│
└─ .gitignore                        # Files to ignore
```

---

## 🔗 Important Links

### Documentation
- [Project Overview](../docs/START_HERE.md)
- [System Architecture](../docs/PROJECT_ANALYSIS_AND_ARCHITECTURE.md)
- [Database Schema](../docs/PROJECT_ANALYSIS_AND_ARCHITECTURE.md#database-schema)
- [File Organization](../docs/FILE_MANIFEST.md)

### Code
- [Backend: app.py](../backend/app.py) - Main Flask app
- [Frontend: App.js](../frontend/src/App.js) - Main React app
- [Database: database_structure.sql](../SQL/database_structure.sql)

### Development
- [Backend Requirements](../backend/requirements.txt)
- [Frontend Package.json](../frontend/package.json)

---

## ❓ Frequently Asked Questions

### Q: How do I get started?
A: Read [01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md#initial-setup-first-time-only) section "Initial Setup"

### Q: What's my first task?
A: Clone repo, setup backend/frontend, run test_db.py and npm start to verify everything works

### Q: How do I make changes?
A: See [Daily Workflow](./01_TEAM_WORKFLOW_GUIDE.md#daily-workflow-every-day) section

### Q: How do I push my feature?
A: Create pull request on GitHub. See [Pull Request Process](./01_TEAM_WORKFLOW_GUIDE.md#pull-request-process) section

### Q: My code isn't working!
A: Check [Troubleshooting](./01_TEAM_WORKFLOW_GUIDE.md#troubleshooting) section or ask team

### Q: What should I name my branch?
A: See [File Naming](./01_TEAM_WORKFLOW_GUIDE.md#file-naming-conventions) section for branch naming

### Q: How do I write documentation?
A: See [02_DOCUMENTATION_GUIDELINES.md](./02_DOCUMENTATION_GUIDELINES.md)

### Q: I accidentally committed to main!
A: See [Troubleshooting](./01_TEAM_WORKFLOW_GUIDE.md#problem-i-committed-to-wrong-branch) section

---

## 🎓 Learning Path

### Week 1: Learn Basics
- [ ] Read all GUIDELINES documents
- [ ] Clone and setup project
- [ ] Run backend and frontend
- [ ] Make first commit to practice branch
- [ ] Create first pull request

### Week 2+: Regular Work
- [ ] Daily pull/branch/code/push cycle
- [ ] Review team pull requests
- [ ] Write documentation for features
- [ ] Help onboard new team members

---

## 👥 Team Contacts

| Role | Name | Contact |
|------|------|---------|
| Team Lead | Emmanuel | Chat or call |
| Backend Dev | [Your Name] | [Your Contact] |
| Frontend Dev | [Your Name] | [Your Contact] |
| Database Admin | Emmanuel | [Your Contact] |

---

## 🎯 Success Criteria

You're ready when you can:

✅ Clone the repository  
✅ Setup backend and frontend  
✅ Test database connection  
✅ Create a feature branch  
✅ Make a small change and commit  
✅ Push to GitHub  
✅ Create a pull request  
✅ Understand the project structure  
✅ Write basic documentation  
✅ Help other team members  

---

## 📋 Next Steps

### Right Now (30 minutes)
1. [ ] Read [QUICK_START_CARD.md](./QUICK_START_CARD.md)
2. [ ] Read [01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md)
3. [ ] Clone repository
4. [ ] Setup backend
5. [ ] Setup frontend

### First Day (2 hours)
1. [ ] Run `python scripts/test_db.py` - verify database
2. [ ] Run `npm start` - verify frontend
3. [ ] Create test branch `git checkout -b test/first-branch`
4. [ ] Make small change
5. [ ] Commit and push
6. [ ] Create pull request on GitHub
7. [ ] Ask team lead to review

### First Week
1. [ ] Read all documentation in [docs/](../docs/)
2. [ ] Understand project architecture
3. [ ] Get assigned first feature
4. [ ] Implement feature with documentation
5. [ ] Submit PR for review

---

## 📞 Need Help?

1. **Check Documentation** - First, search GUIDELINES and docs/
2. **Ask in Chat** - Post question in team chat
3. **Ask in Meeting** - Bring up in standup meeting
4. **Emergency** - Call team lead

---

## 🚀 Ready to Get Started?

### Start Here:
👉 [01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md)

Good luck! 🎉

---

**Version**: 1.0  
**Created**: January 26, 2026  
**For**: FRAMES Capstone Team  
**Status**: ✅ Ready to Use

---

**Last Updated**: January 26, 2026  
**Maintained by**: Emmanuel

