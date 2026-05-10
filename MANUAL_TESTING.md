# Manual Testing - Step by Step

## If start.bat Still Doesn't Work, Do This Manually:

### Step 1: Open Two Command Prompts

**First Terminal (Backend):**
```bash
cd d:\Projects\smart-warehouse\backend
python app.py
```

Expected output:
```
WARNING in app.factory_function: ...
 * Serving Flask app 'app'
 * Running on http://0.0.0.0:5000
```

**Second Terminal (Frontend):**
```bash
cd d:\Projects\smart-warehouse\frontend
python -m http.server 8000
```

Expected output:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

---

### Step 2: Test the Server is Working

In your browser, try:

1. **Test Home Page:**
   ```
   http://localhost:8000/index.html
   ```
   Should show: Smart Warehouse home page with features

2. **Test Login Page:**
   ```
   http://localhost:8000/pages/login.html
   ```
   Should show: Login form with Google button

3. **Test Backend API:**
   ```
   http://localhost:5000/api/health
   ```
   Should show:
   ```json
   {
       "status": "success",
       "message": "Smart Warehouse API is running"
   }
   ```

---

### Step 3: Verify Directory Structure

Run this in PowerShell:
```powershell
cd d:\Projects\smart-warehouse
dir /s *.html
```

Should show:
```
frontend\index.html
frontend\pages\dashboard.html
frontend\pages\inventory.html
frontend\pages\login.html
frontend\pages\register.html
frontend\pages\sales.html
```

---

### Step 4: Check What URL You're Accessing

**WRONG (will give 404):**
- ❌ `file:///d:/Projects/smart-warehouse/frontend/pages/login.html`
- ❌ `localhost:8000/login.html` (missing /pages/)
- ❌ `http://127.0.0.1:8000/pages/login.html` (use localhost, not 127.0.0.1)

**CORRECT (will work):**
- ✅ `http://localhost:8000/pages/login.html`
- ✅ `http://localhost:8000/index.html`
- ✅ `http://localhost:5000/api/health`

---

### Step 5: Screenshot Check

Take a screenshot of:
1. Your browser address bar (what URL you're using)
2. The browser error message
3. Your command terminals

---

## Common 404 Issues & Solutions

### Issue: Server shows "GET /pages/login.html HTTP/1.1" 404
**Cause:** Server is in wrong directory
**Fix:** Make sure you're in `d:\Projects\smart-warehouse\frontend` when running:
```bash
python -m http.server 8000
```

### Issue: URL shows file:// protocol
**Cause:** Opening HTML file directly
**Fix:** Use HTTP server - never open HTML files directly

### Issue: "Connection refused" error
**Cause:** Server not running
**Fix:** Verify both terminals show:
- Backend: "Running on http://0.0.0.0:5000"
- Frontend: "Serving HTTP on 0.0.0.0 port 8000"

---

## Quick Verification Script

Create `test.bat` and run it:

```batch
@echo off
echo Testing Smart Warehouse Setup...
echo.

echo [TEST 1] Checking backend...
curl -s http://localhost:5000/api/health || echo "❌ Backend not responding"

echo.
echo [TEST 2] Checking frontend home...
curl -s http://localhost:8000/index.html | find "<title>" || echo "❌ Frontend not responding"

echo.
echo [TEST 3] Checking login page...
curl -s http://localhost:8000/pages/login.html | find "loginForm" || echo "❌ Login page not found"

echo.
echo [TEST 4] Checking if Google script loaded...
curl -s http://localhost:8000/pages/login.html | find "accounts.google" || echo "❌ Google SDK not in page"

echo.
echo All tests completed!
pause
```

---

## If Still Getting 404

Please provide:

1. **Screenshot** of browser address bar showing the URL
2. **Terminal output** from both windows
3. **Error message** from browser console (F12 → Console tab)
4. **Output of this command:**
   ```bash
   cd d:\Projects\smart-warehouse\frontend && dir
   ```

---

## Minimum Requirements

✅ Python 3.7+
✅ Ports 5000 and 8000 are free
✅ MongoDB running (for actual login, but not needed for page load)
✅ Using `http://localhost:XXXX` (not file://)

---

**Which step is failing?** Let me know and I'll help debug! 🔧
