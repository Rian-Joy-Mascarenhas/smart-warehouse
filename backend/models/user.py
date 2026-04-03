from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
from utils.db_manager import DatabaseManager

load_dotenv()

class User:
    """User model for database operations"""
    
    # Get main database connection
    db = DatabaseManager.get_main_db()
    collection = db['users']
    
    # Create index
    collection.create_index('email', unique=True)
    collection.create_index('username', unique=True)

    @staticmethod
    def create_user(username, email, password_hash, full_name, role='user'):
        """
        Create a new user in the database
        
        Args:
            username (str): Username
            email (str): Email address
            password_hash (str): Hashed password
            full_name (str): Full name of user
            role (str): User role (default: 'user')
        
        Returns:
            dict: Created user object with _id or None if failed
        """
        user_data = {
            'username': username,
            'email': email,
            'password': password_hash,
            'full_name': full_name,
            'role': role,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_active': True
        }
        
        result = User.collection.insert_one(user_data)
        if result.inserted_id:
            user_id = str(result.inserted_id)
            
            # Create user-specific database
            DatabaseManager.create_user_db(user_id)
            
            user_data['_id'] = user_id
            return user_data
        return None
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        user = User.collection.find_one({'email': email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    
    @staticmethod
    def find_by_username(username):
        """Find user by username"""
        user = User.collection.find_one({'username': username})
        if user:
            user['_id'] = str(user['_id'])
        return user
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        try:
            user = User.collection.find_one({'_id': ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except:
            return None
    
    @staticmethod
    def user_exists(email, username):
        """Check if user already exists"""
        if User.collection.find_one({'email': email}):
            return True, 'email'
        if User.collection.find_one({'username': username}):
            return True, 'username'
        return False, None
    
    @staticmethod
    def update_user(user_id, update_data):
        """Update user information"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            result = User.collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def get_user_profile(user_id):
        """Get user profile (excluding password)"""
        user = User.find_by_id(user_id)
        if user:
            user.pop('password', None)
            return user
        return None
    
    @staticmethod
    def delete_user(user_id):
        """
        Delete user account and associated database
        """
        try:
            # Delete user from main database
            User.collection.delete_one({'_id': ObjectId(user_id)})
            
            # Delete user's personal database
            DatabaseManager.delete_user_db(user_id)
            
            return True
        except Exception as e:
            print(f"Error deleting user: {str(e)}")
            return False