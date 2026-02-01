# ⚡ QUICK START CARD (Print This!)

**For FRAMES Capstone Team - Keep on desk!**

---

## 🚀 First Time Setup

```bash
git clone https://github.com/hasu621/Capstoneee.git
cd Capstoneee
```

**Backend**:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python scripts/test_db.py
```

**Frontend**:
```bash
cd frontend
npm install
npm start
```

---

## 📅 Every Day: Morning

```bash
cd /path/to/Capstoneee
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

---

## 💻 Work Steps

```bash
# 1. Make changes in your editor

# 2. Test locally
python app.py                # Backend
npm start                    # Frontend

# 3. Check changes
git status
git diff

# 4. Stage and commit
git add .
git commit -m "Add feature: description here"

# 5. Push
git push origin feature/your-feature-name
```

---

## 📤 When Feature Complete

```bash
git push origin feature/your-feature-name

# Go to GitHub → Click "Compare & pull request"
# Fill details → Create PR → Wait for review
# Make changes if requested → Merge when approved
```

---

## 📝 Commit Message Format

```
type: subject line

✅ add: Add hand gesture recognition
✅ fix: Fix camera crash in low light
✅ docs: Add gesture setup guide
✅ refactor: Extract API to services
✅ test: Add unit tests for gesture

❌ update stuff
❌ fix
❌ asdfjkl
```

---

## 🌳 Branch Name Format

```bash
feature/hand-gestures              ✅
feature/kiosk-interface            ✅
bugfix/face-false-positives        ✅
docs/setup-guide                   ✅

feature123                         ❌
work-in-progress                   ❌
feature/everything                 ❌
```

---

## 🆘 Common Issues

| Issue | Fix |
|-------|-----|
| "Permission denied" | Pull latest: `git pull origin main` |
| "Commit to wrong branch" | `git reset HEAD~1` then create new branch |
| "Merge conflict" | Edit file, remove conflict markers, `git add .`, `git commit` |
| Database error | Run: `python scripts/test_db.py` |
| npm not working | `rm -r node_modules` then `npm install` |

---

## 📋 Before Committing

- [ ] Code runs without errors
- [ ] Tested your feature
- [ ] No debug code left
- [ ] Updated documentation
- [ ] Clear commit message
- [ ] No .env or secrets included

---

## 🔗 Key Files

| File | Purpose |
|------|---------|
| [01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md) | Full workflow guide |
| [docs/README.md](../docs/README.md) | Project overview |
| [docs/PROJECT_ANALYSIS_AND_ARCHITECTURE.md](../docs/PROJECT_ANALYSIS_AND_ARCHITECTURE.md) | System design |
| [backend/requirements.txt](../backend/requirements.txt) | Python packages |
| [frontend/package.json](../frontend/package.json) | Node packages |

---

## ⚙️ Environment Setup

**Backend needs** (in `backend/.env`):
```
DATABASE_HOST=your-aiven-host
DATABASE_USER=avnadmin
DATABASE_PASSWORD=your-password
DATABASE_NAME=frames_db
MYSQL_CERT_PATH=ca.pem
```

**Frontend needs** (in `frontend/.env`):
```
REACT_APP_API_URL=http://localhost:5000
```

---

## 🎯 Before Pushing

**ALWAYS**:
1. Pull latest from main
2. Test your feature
3. Commit with clear message
4. Push to your branch
5. Create PR on GitHub
6. Ask for review
7. Don't force merge!

---

## 📞 Get Help

- **Code Question?** Ask team in chat
- **Git Problem?** Ask team lead
- **Database Issue?** Ask Emmanuel
- **Setup Problem?** Check [01_TEAM_WORKFLOW_GUIDE.md](./01_TEAM_WORKFLOW_GUIDE.md)

---

**Remember**: 
- Pull before you push
- Commit often
- Write clear messages
- Ask for help
- Have fun! 🚀

