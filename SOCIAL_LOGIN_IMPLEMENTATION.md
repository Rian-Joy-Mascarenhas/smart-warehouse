# Social Login Implementation Guide

## Overview
This document describes the Google OAuth 2.0 integration implemented for the Smart Warehouse system.

## Architecture

### Backend Setup (Python/Flask)
- **Endpoint**: `POST /api/auth/google-login`
- **Authentication**: Google ID Token verification
- **Google Client ID**: `405161400630-v4uo72hkbvbafs7hdtr4nun1olkaaibk.apps.googleusercontent.com`

### Frontend Implementation
- **Google Sign-In SDK**: Google Identity Services Library
- **Handler**: `frontend/js/google-auth.js`
- **Supported Pages**: 
  - Login page (`pages/login.html`)
  - Register page (`pages/register.html`)

## How It Works

### 1. User Initiates Google Login
- User clicks the Google button on login or register page
- `google-auth.js` initializes Google Sign-In with client ID

### 2. Google Sign-In Flow
- One-Tap UI appears if available
- User can dismiss One-Tap and click button for popup flow
- User authenticates with Google and grants access

### 3. ID Token Received
- Google returns ID token (JWT) to frontend
- Token contains user info: `sub` (Google ID), `email`, `name`

### 4. Backend Verification
- Frontend sends ID token to `/api/auth/google-login`
- Backend verifies token signature using Google's public keys
- Token validity is confirmed before proceeding

### 5. User Lookup or Creation
- Backend checks if user exists by `google_id`
- If user doesn't exist:
  - Checks if email already exists (account linking)
  - If email exists: links Google ID to existing account
  - If email is new: creates new user account

### 6. JWT Token Generation
- Backend creates secure JWT token for session
- Returns token + user data to frontend

### 7. Session Storage
- Frontend stores token in sessionStorage
- User redirected to dashboard
- Subsequent API calls include JWT in Authorization header

## API Endpoint

### POST `/api/auth/google-login`

**Request:**
```json
{
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ..."
}
```

**Success Response (200):**
```json
{
    "status": "success",
    "message": "Google login successful",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "_id": "123abc",
            "username": "john.doe",
            "email": "john@example.com",
            "google_id": "118364528934637895620",
            "created_at": "2026-05-10T12:00:00Z",
            "is_active": true,
            "role": "user"
        }
    }
}
```

**Error Response (400/401/500):**
```json
{
    "status": "error",
    "message": "Invalid token"
}
```

## Database Schema

### User Collection
When a user signs up via Google, they're created with:
- `username`: Derived from email (e.g., `john.doe` from `john.doe@example.com`)
- `email`: From Google account
- `google_id`: Google's unique user identifier
- `password`: Not set (optional for OAuth users)
- `mobile`: Not required for Google users
- `is_active`: `true`
- `created_at`: Current timestamp

```python
{
    "_id": ObjectId(...),
    "username": "john.doe",
    "email": "john.doe@example.com",
    "google_id": "118364528934637895620",
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow(),
    "is_active": true,
    "role": "user"
}
```

## Password Handling for OAuth Users

### Initial State
- Google OAuth users have no password set initially
- Cannot login with password until one is set

### Setting a Password
- OAuth users can access change-password endpoint without providing old password
- They can set an initial password to enable traditional login later

### Updated Change-Password Logic
```
IF user has password:
    REQUIRE old_password verification
ELSE (OAuth user):
    ALLOW setting new password directly
```

## Security Considerations

1. **ID Token Verification**
   - Backend verifies token signature using Google's public keys
   - Prevents token forgery
   - Uses `google-auth` library for secure verification

2. **Token Storage**
   - Frontend stores JWT in sessionStorage (cleared on page close)
   - SessionStorage is protected by browser same-origin policy
   - Not vulnerable to XSS in local file URLs

3. **CORS Configuration**
   - Backend allows CORS for login endpoints
   - Frontend requests properly authenticated

4. **User Privacy**
   - Passwords never transmitted for OAuth users
   - Only necessary scopes requested from Google
   - User data properly protected

## Testing the Implementation

### Manual Testing Steps

1. **Backend Running**
   ```bash
   cd backend
   python app.py  # Runs on http://localhost:5000
   ```

2. **Frontend Running**
   - Open `frontend/pages/login.html` in browser
   - Or serve with HTTP server:
   ```bash
   python -m http.server 8000 --directory frontend
   # Visit http://localhost:8000/pages/login.html
   ```

3. **Test Flows**

   **New Google User Registration:**
   - Click Google button on login page
   - Authenticate with a Google account
   - Should create new user and redirect to dashboard

   **Existing Email Link:**
   - Create a traditional account with `test@example.com`
   - Login with Google using same email
   - Should link Google ID to existing account
   - Can now login via either method

   **Password Change:**
   - Login with Google
   - Navigate to profile settings
   - Change password without entering old password
   - Should succeed and enable traditional login

### Backend Testing with curl

```bash
# Obtain real Google ID token from browser console:
# window.google.accounts.id.initialize({ callback: (response) => console.log(response.credential) })

# Then test backend:
curl -X POST http://localhost:5000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "YOUR_ID_TOKEN_HERE"
  }'
```

## Configuration

### Google OAuth Setup (Already Done)
- **Client ID**: 405161400630-v4uo72hkbvbafs7hdtr4nun1olkaaibk.apps.googleusercontent.com
- **Project**: Smart Warehouse
- **Authorized Origins**: 
  - http://localhost:8000
  - http://localhost
  - Add your production domain as needed

### Frontend Configuration
- Edit `frontend/js/google-auth.js` to change client ID if needed

### Backend Requirements
- `google-auth` library (already in requirements.txt)
- Valid Google OAuth credentials configured

## Troubleshooting

### "Invalid token" Error
- Verify ID token is fresh (< 1 hour old)
- Check client ID matches between frontend and backend
- Ensure Google API is accessible

### One-Tap Not Showing
- Check browser is HTTPS or localhost
- Verify user is logged into Google account
- Some browsers may have One-Tap disabled

### CORS Errors
- Ensure backend has CORS enabled
- Check frontend domain is in Google OAuth authorized origins
- Verify API endpoint is correct

### User Not Created
- Check MongoDB connection is working
- Verify database permissions
- Check error logs for specific issues

## Future Enhancements

1. **Additional OAuth Providers**
   - GitHub OAuth
   - Facebook OAuth
   - Microsoft/Azure AD

2. **Enhanced Account Linking**
   - Allow users to link multiple OAuth providers to one account
   - Manage connected accounts in profile settings

3. **Email Verification**
   - Send verification email for traditional signups
   - Optional for OAuth users (email already verified by provider)

4. **Social Metadata**
   - Store OAuth profile picture
   - Display user's Google profile picture in app

5. **Token Refresh**
   - Implement refresh tokens for longer sessions
   - Automatic token renewal

## Files Modified

- `backend/routes/auth_routes.py` - Added/updated Google OAuth endpoints and password change logic
- `backend/models/user.py` - Already supported OAuth users
- `frontend/pages/login.html` - Added Google button and SDK script
- `frontend/pages/register.html` - Added Google button and SDK script
- `frontend/js/google-auth.js` - New handler for Google OAuth flow

## References

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [PyMongo Documentation](https://pymongo.readthedocs.io/)
