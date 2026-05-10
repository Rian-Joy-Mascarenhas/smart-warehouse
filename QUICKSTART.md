# Quick Start Guide - Smart Warehouse

## 🚀 Fastest Way to Start

### Option 1: Simple Start (Recommended)
1. **Double-click** `start.bat` in the project root folder
2. Backend will start on **http://localhost:5000**
3. Frontend will start on **http://localhost:8000**
4. Browser will open automatically to the login page

That's it! ✅

---

## 📋 What start.bat Does

```
1. Checks if Python is installed
2. Starts Backend Flask server (port 5000)
3. Starts Frontend HTTP server (port 8000)
4. Automatically opens login page in browser
5. Shows service status
```

---

## 🎯 Access the Application

After running `start.bat`, use these URLs:

| What | URL |
|------|-----|
| **Home Page** | http://localhost:8000 |
| **Login with Google** | http://localhost:8000/pages/login.html |
| **Register with Google** | http://localhost:8000/pages/register.html |
| **Dashboard** | http://localhost:8000/pages/dashboard.html |
| **API Health Check** | http://localhost:5000/api/health |

---

## 🛑 How to Stop

### Option 1: Close Windows
- Close both command windows that opened

### Option 2: Command Line
- Press `Ctrl+C` in each command window

### Option 3: Task Manager
```
Press: Ctrl+Shift+Esc
Find: python.exe
Click: End Task
```

---

## 🔧 Advanced Start (start-advanced.bat)

This version:
- ✅ Auto-installs missing dependencies
- ✅ Kills existing processes on ports 5000, 8000
- ✅ Better error checking
- ✅ Logs all activity

Usage: Double-click `start-advanced.bat`

---

## ⚠️ Troubleshooting

### Error: "Python not found"
**Solution:** Install Python 3.7+ from https://www.python.org/
- During install, check "Add Python to PATH"

### Error: "Port 5000 already in use"
**Solution 1:** Close other applications using port 5000
**Solution 2:** Use task manager to kill python.exe processes

### Error: "Port 8000 already in use"
**Solution:** Same as above, but for port 8000

### Frontend shows 404 error
**Solution:** Make sure you're using `http://localhost:8000`, not `file://`

### Google login button doesn't work
**Solution:** 
1. Make sure backend is running (check terminal windows)
2. Check browser console for errors (F12)
3. Verify MongoDB is running

---

## 📦 Requirements

Before using start.bat, ensure you have:

- ✅ **Python 3.7+** (with pip)
- ✅ **MongoDB** running (default: localhost:27017)
- ✅ **Dependencies installed** (will auto-install on advanced start)

### Install Dependencies Manually

```bash
cd backend
pip install -r requirements.txt
cd ..
```

---

## 📝 Manual Start (Without Batch File)

If start.bat doesn't work, start manually:

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
python -m http.server 8000
```

**Browser:**
```
Open: http://localhost:8000/pages/login.html
```

---

## ✅ Checklist Before Starting

- [ ] Python 3.7+ installed
- [ ] MongoDB running (or ensure it's configured)
- [ ] Backend requirements installed (`pip install -r requirements.txt`)
- [ ] Ports 5000 and 8000 are free
- [ ] No firewall blocking localhost

---

## 🐛 Debug Mode

### View Backend Logs
- The backend terminal shows all Flask logs
- Check for errors when making API calls

### View Frontend Logs
- Open browser DevTools: `F12`
- Go to **Console** tab
- Check for JavaScript errors

### Check API Health
```
curl http://localhost:5000/api/health
```

Should return:
```json
{
    "status": "success",
    "message": "Smart Warehouse API is running"
}
```

---

## 📚 Documentation

- `SOCIAL_LOGIN_IMPLEMENTATION.md` - Google OAuth setup details
- `SOCIAL_LOGIN_CHECKLIST.md` - Testing guide
- Backend: `backend/requirements.txt` - Python dependencies

---

## 💡 Tips

1. **Keep terminals open** - Shows live logs for debugging
2. **Don't close terminals** - This stops the services
3. **Clear browser cache** - If you see old versions (Ctrl+Shift+Del)
4. **Check console** - F12 in browser for JavaScript errors

---

## 🎓 Learning the Code

### Backend Structure
```
backend/
├── app.py              # Main Flask app
├── config.py           # Configuration
├── routes/auth_routes.py     # Google OAuth endpoints
├── models/user.py      # User database model
└── requirements.txt    # Python dependencies
```

### Frontend Structure
```
frontend/
├── index.html          # Home page
├── pages/login.html    # Login with Google
├── pages/register.html # Register with Google
├── js/google-auth.js   # Google OAuth handler
└── js/session.js       # Session management
```

---

**Status:** Ready to Launch! 🚀
