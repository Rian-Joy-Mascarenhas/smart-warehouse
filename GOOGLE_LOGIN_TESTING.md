# Google Login Testing Guide

## What Was Fixed

1. **Google Auth Handler (google-auth.js)**
   - Fixed the broken sign-in flow
   - Properly initialize Google API once and reuse
   - Corrected button rendering to use Google's official button
   - Added proper error handling and logging
   - Support for both login and register pages

2. **startup.bat Compatibility**
   - Frontend now serves from `/frontend` directory
   - URLs are consistent between start.bat and startup.bat
   - Proper timeout to ensure servers are ready

## Testing Instructions

### Option 1: Using start.bat
```bash
cd d:\Projects\smart-warehouse
start.bat
```
- Opens: http://localhost:8000/pages/login.html
- Backend: http://localhost:5000

### Option 2: Using startup.bat
```bash
cd d:\Projects\smart-warehouse
startup.bat
```
- Opens: http://localhost:8000/pages/login.html
- Backend: http://localhost:5000

### Testing Google Login

1. **Initial Setup**
   - Make sure both servers are running (backend on 5000, frontend on 8000)
   - Wait for browser to fully load the page
   - Check browser console (F12) for any JavaScript errors

2. **Test Login Flow**
   - Click the Google button on the login page
   - One-Tap UI may appear - you can use it directly
   - Or dismiss One-Tap and click the official Google button
   - Sign in with your Google account
   - Should redirect to dashboard after login

3. **Test Registration Flow**
   - Go to http://localhost:8000/pages/register.html
   - Click the Google button
   - Sign in with your Google account
   - Should create new account and redirect to dashboard

4. **Verify Session Storage**
   - After login, open browser DevTools (F12)
   - Go to Application > Local Storage
   - Should see:
     - `smart_warehouse_token`: JWT access token
     - `smart_warehouse_user`: User object (JSON)

### Troubleshooting

#### "Invalid token" Error from Backend
- Check that Google Client ID matches in both files:
  - `frontend/js/google-auth.js` line 9
  - `backend/routes/auth_routes.py` line 161
- Ensure token is fresh (< 1 hour old)
- Check console for detailed error messages

#### Google Button Not Appearing
- Check browser console for JavaScript errors
- Ensure Google API loaded: `window.google.accounts` should exist
- Try hard refresh (Ctrl+Shift+R)

#### CORS/Network Errors
- Verify backend is running on http://localhost:5000
- Check Network tab in DevTools for failed requests
- Ensure no firewall blocking localhost connections

#### 404 When Browser Opens
- This is normal if servers haven't fully started yet
- Wait 5-10 seconds and refresh the page manually
- Alternatively, manually open http://localhost:8000/pages/login.html

### Browser Console Debugging

The updated google-auth.js logs detailed information:
- "Google credential received, sending to backend..."
- "Backend response: {...}"
- "One-Tap UI displayed" / "One-Tap UI not displayed"

These logs help identify where the issue is occurring.

### Expected Console Logs (Successful Flow)
```
One-Tap UI displayed
Google credential received, sending to backend...
Backend response: {status: "success", message: "Google login successful", data: {...}}
[Redirect to dashboard]
```

## Environment Configuration

**Backend** (`backend/app.py`)
- Running on: http://localhost:5000
- CORS: Enabled for frontend requests
- Google Client ID: 319201634147-8h6fv2l011ke40l2k173nq70b1pjrq0e.apps.googleusercontent.com

**Frontend** (`frontend/pages/`)
- Running on: http://localhost:8000
- Google API loaded via CDN script tag
- Google Client ID: 319201634147-8h6fv2l011ke40l2k173nq70b1pjrq0e.apps.googleusercontent.com

## API Response Format

### Successful Google Login
```json
{
    "status": "success",
    "message": "Google login successful",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "_id": "123abc456def",
            "username": "john.doe",
            "email": "john.doe@example.com",
            "google_id": "118364528934637895620",
            "created_at": "2026-05-10T12:00:00Z",
            "is_active": true,
            "role": "user"
        }
    }
}
```

### Error Response
```json
{
    "status": "error",
    "message": "Invalid token"
}
```

## Next Steps

After testing successfully:
1. Try linking an existing email to Google account
2. Test password change flow for Google-signed-up users
3. Verify dashboard access after Google login
4. Test logout and re-login flow
