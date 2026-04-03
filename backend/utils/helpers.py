import bcrypt
import re
from email_validator import validate_email, EmailNotValidError

def hash_password(password):
    """
    Hash a password using bcrypt
    
    Args:
        password (str): Plain text password
    
    Returns:
        str: Hashed password
    """
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password, hashed_password):
    """
    Verify a password against its hash
    
    Args:
        password (str): Plain text password
        hashed_password (str): Hashed password from database
    
    Returns:
        bool: True if password matches, False otherwise
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def validate_email_format(email):
    """
    Validate email format
    
    Args:
        email (str): Email address to validate
    
    Returns:
        tuple: (bool, str) - (is_valid, message)
    """
    try:
        validate_email(email)
        return True, "Email is valid"
    except EmailNotValidError as e:
        return False, str(e)

def validate_password_strength(password):
    """
    Validate password strength
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password (str): Password to validate
    
    Returns:
        tuple: (bool, str) - (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is strong"

def validate_username(username):
    """
    Validate username
    - Length: 3-20 characters
    - Only alphanumeric and underscores
    
    Args:
        username (str): Username to validate
    
    Returns:
        tuple: (bool, str) - (is_valid, message)
    """
    if len(username) < 3 or len(username) > 20:
        return False, "Username must be between 3 and 20 characters"
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain alphanumeric characters and underscores"
    
    return True, "Username is valid"

def create_response(status, message, data=None, status_code=200):
    """
    Create a standardized response format
    
    Args:
        status (str): 'success' or 'error'
        message (str): Response message
        data (dict): Additional data
        status_code (int): HTTP status code
    
    Returns:
        tuple: (dict, int) - (response_body, status_code)
    """
    response = {
        'status': status,
        'message': message
    }
    if data:
        response['data'] = data
    return response, status_code