from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from utils.helpers import (
    hash_password, verify_password, validate_email_format,
    validate_password_strength, validate_username, create_response
)
from middleware.auth_middleware import token_required
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import os

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Expected JSON:
    {
        "username": "string",
        "email": "string",
        "password": "string",
        "full_name": "string"
    }
    """
    try:
        data = request.get_json()
        
        # Validation
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        mobile = data.get('mobile', '').strip()
        
        # Validate required fields
        if not all([username, email, password, mobile]):
            return create_response('error', 'All fields are required', status_code=400)
        
        # Validate username
        is_valid, message = validate_username(username)
        if not is_valid:
            return create_response('error', f'Invalid username: {message}', status_code=400)
        
        # Validate email
        is_valid, message = validate_email_format(email)
        if not is_valid:
            return create_response('error', f'Invalid email: {message}', status_code=400)
        
        # Validate password strength
        is_valid, message = validate_password_strength(password)
        if not is_valid:
            return create_response('error', f'Weak password: {message}', status_code=400)
        
        # Check if user already exists
        exists, field = User.user_exists(email, username)
        if exists:
            return create_response('error', f'User with this {field} already exists', status_code=409)
        
        # Hash password and create user
        password_hash = hash_password(password)
        user = User.create_user(username, email, password_hash, mobile)
        
        if user:
            # Remove sensitive data from response
            user.pop('password', None)
            return create_response(
                'success',
                'User registered successfully',
                data={'user': user},
                status_code=201
            )
        else:
            return create_response('error', 'Failed to create user', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and return JWT token
    
    Expected JSON:
    {
        "email": "string",
        "password": "string"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return create_response('error', 'Email and password are required', status_code=400)
        
        # Find user by email
        user = User.find_by_email(email)
        
        if not user:
            return create_response('error', 'Invalid email or password', status_code=401)
        
        # Verify password
        if not verify_password(password, user['password']):
            return create_response('error', 'Invalid email or password', status_code=401)
        
        # Check if user is active
        if not user.get('is_active', True):
            return create_response('error', 'User account is deactivated', status_code=403)
        
        # Generate JWT token
        access_token = create_access_token(identity=str(user['_id']))
        
        # Remove sensitive data
        user.pop('password', None)
        
        return create_response(
            'success',
            'Login successful',
            data={
                'access_token': access_token,
                'user': user
            },
            status_code=200
        )
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """
    Login or register user with Google OAuth
    
    Expected JSON:
    {
        "id_token": "string"
    }
    """
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        data = request.get_json()

        if not data or 'id_token' not in data:
            return create_response('error', 'ID token is required', status_code=400)

        id_token_value = data['id_token']

        # Verify the token
        CLIENT_ID = '319201634147-8h6fv2l011ke40l2k173nq70b1pjrq0e.apps.googleusercontent.com'
        try:
            idinfo = id_token.verify_oauth2_token(id_token_value, google_requests.Request(), CLIENT_ID)
        except ValueError:
            return create_response('error', 'Invalid token', status_code=401)

        # Get user info from token
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')

        # Check if user exists by Google ID
        user = User.find_by_google_id(google_id)
        account_status = 'existing'

        if not user:
            # Check if email already exists
            existing_user = User.find_by_email(email)
            if existing_user:
                # Link Google ID to existing user
                User.collection.update_one(
                    {'_id': ObjectId(existing_user['_id'])},
                    {'$set': {'google_id': google_id, 'updated_at': datetime.utcnow()}}
                )
                user = User.find_by_id(existing_user['_id'])
                account_status = 'linked'
            else:
                # Create new user
                username = email.split('@')[0]  # Simple username from email
                user = User.create_user(username, email, google_id=google_id)
                account_status = 'created'

        if not user:
            return create_response('error', 'Failed to create or find user', status_code=500)

        # Generate JWT token
        access_token = create_access_token(identity=str(user['_id']))

        # Remove sensitive data
        user.pop('password', None)

        return create_response(
            'success',
            f'Google login successful - account {account_status}',
            data={
                'access_token': access_token,
                'user': user,
                'account_status': account_status
            },
            status_code=200
        )
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(user_id):
    """
    Get current user profile (protected route)
    """
    try:
        user = User.get_user_profile(user_id)
        
        if not user:
            return create_response('error', 'User not found', status_code=404)
        
        return create_response(
            'success',
            'Profile retrieved successfully',
            data={'user': user},
            status_code=200
        )
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@auth_bp.route('/update-profile', methods=['PUT'])
@token_required
def update_profile(user_id):
    """
    Update user profile (protected route)
    
    Expected JSON:
    {
        "full_name": "string",
        "email": "string"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        update_data = {}
        
        # Update full_name if provided
        if 'full_name' in data:
            full_name = data['full_name'].strip()
            if not full_name:
                return create_response('error', 'Full name cannot be empty', status_code=400)
            update_data['full_name'] = full_name
        
        # Update email if provided
        if 'email' in data:
            new_email = data['email'].strip()
            is_valid, message = validate_email_format(new_email)
            if not is_valid:
                return create_response('error', f'Invalid email: {message}', status_code=400)
            
            # Check if email is already in use
            existing_user = User.find_by_email(new_email)
            if existing_user and existing_user['_id'] != user_id:
                return create_response('error', 'Email already in use', status_code=409)
            
            update_data['email'] = new_email
        
        if not update_data:
            return create_response('error', 'No valid fields to update', status_code=400)
        
        # Update user
        success = User.update_user(user_id, update_data)
        
        if success:
            user = User.get_user_profile(user_id)
            return create_response(
                'success',
                'Profile updated successfully',
                data={'user': user},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to update profile', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(user_id):
    """
    Change user password (protected route)

    Expected JSON:
    {
        "old_password": "string" (optional if user was created via OAuth),
        "new_password": "string",
        "confirm_password": "string"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return create_response('error', 'No data provided', status_code=400)

        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        if not all([new_password, confirm_password]):
            return create_response('error', 'New password and confirmation are required', status_code=400)

        if new_password != confirm_password:
            return create_response('error', 'New passwords do not match', status_code=400)

        # Get user
        user = User.find_by_id(user_id)
        if not user:
            return create_response('error', 'User not found', status_code=404)

        # Verify old password if user has one (not an OAuth-only user)
        if user.get('password'):
            if not old_password:
                return create_response('error', 'Old password is required', status_code=400)
            if not verify_password(old_password, user['password']):
                return create_response('error', 'Incorrect old password', status_code=401)

        # Validate new password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            return create_response('error', f'Weak password: {message}', status_code=400)

        # Hash and update new password
        new_password_hash = hash_password(new_password)
        success = User.update_user(user_id, {'password': new_password_hash})

        if success:
            return create_response('success', 'Password changed successfully', status_code=200)
        else:
            return create_response('error', 'Failed to change password', status_code=500)
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(user_id):
    """
    Logout user (protected route)
    Token is invalidated on frontend
    """
    return create_response('success', 'Logout successful', status_code=200)

@auth_bp.route('/verify-token', methods=['GET'])
@token_required
def verify_token(user_id):
    """
    Verify if JWT token is valid (protected route)
    """
    try:
        user = User.get_user_profile(user_id)
        return create_response(
            'success',
            'Token is valid',
            data={'user': user},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)