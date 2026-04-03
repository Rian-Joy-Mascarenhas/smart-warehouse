from email_validator import validate_email, EmailNotValidError
from datetime import datetime

def validate_email_format(email):
    """Validate email format"""
    try:
        valid = validate_email(email)
        return True, valid.email
    except EmailNotValidError as e:
        return False, str(e)

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, 'Password must be at least 6 characters'
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return False, 'Password must contain uppercase, lowercase, and numbers'
    
    return True, 'Password is valid'

def validate_product_data(data):
    """Validate product data"""
    errors = []
    
    if not data.get('name'):
        errors.append('Product name is required')
    
    if not data.get('sku'):
        errors.append('SKU is required')
    
    if 'price' not in data or data.get('price') is None:
        errors.append('Price is required')
    elif data.get('price') < 0:
        errors.append('Price cannot be negative')
    
    if 'quantity' not in data or data.get('quantity') is None:
        errors.append('Quantity is required')
    elif data.get('quantity') < 0:
        errors.append('Quantity cannot be negative')
    
    if 'min_stock' in data and data.get('min_stock') < 0:
        errors.append('Min stock cannot be negative')
    
    if 'max_stock' in data and data.get('max_stock') < 0:
        errors.append('Max stock cannot be negative')
    
    return len(errors) == 0, errors

def validate_sales_order_data(data, inventory):
    """
    Validate sales order data
    
    Args:
        data (dict): Order data
        inventory (Inventory): Inventory manager instance
    
    Returns:
        tuple: (is_valid, errors_list)
    """
    errors = []
    
    # Validate customer ID
    if not data.get('customer_id'):
        errors.append('Customer ID is required')
    
    # Validate items
    if not data.get('items') or len(data.get('items', [])) == 0:
        errors.append('At least one item is required')
    else:
        items = data.get('items', [])
        
        for idx, item in enumerate(items):
            # Check product ID
            if not item.get('product_id'):
                errors.append(f'Item {idx + 1}: Product ID is required')
                continue
            
            # Check quantity
            if 'quantity' not in item or item.get('quantity') is None:
                errors.append(f'Item {idx + 1}: Quantity is required')
                continue
            
            quantity = item.get('quantity')
            if not isinstance(quantity, (int, float)) or quantity <= 0:
                errors.append(f'Item {idx + 1}: Quantity must be greater than 0')
                continue
            
            # Check price
            if 'price' not in item or item.get('price') is None:
                errors.append(f'Item {idx + 1}: Price is required')
                continue
            
            price = item.get('price')
            if not isinstance(price, (int, float)) or price < 0:
                errors.append(f'Item {idx + 1}: Price cannot be negative')
                continue
            
            # Check inventory availability
            product = inventory.find_product_by_id(item.get('product_id'))
            if not product:
                errors.append(f'Item {idx + 1}: Product not found')
                continue
            
            if product.get('quantity', 0) < quantity:
                errors.append(f'Item {idx + 1}: Insufficient stock. Available: {product.get("quantity", 0)}, Requested: {quantity}')
    
    return len(errors) == 0, errors

def validate_customer_data(data):
    """Validate customer data"""
    errors = []
    
    if not data.get('name'):
        errors.append('Customer name is required')
    
    if not data.get('email'):
        errors.append('Email is required')
    else:
        is_valid, message = validate_email_format(data.get('email'))
        if not is_valid:
            errors.append(f'Invalid email: {message}')
    
    if not data.get('phone'):
        errors.append('Phone is required')
    
    if not data.get('address'):
        errors.append('Address is required')
    
    if not data.get('city'):
        errors.append('City is required')
    
    if not data.get('state'):
        errors.append('State is required')
    
    if not data.get('zip_code'):
        errors.append('Zip code is required')
    
    if not data.get('country'):
        errors.append('Country is required')
    
    return len(errors) == 0, errors

def validate_category_data(data):
    """Validate category data"""
    errors = []
    
    if not data.get('name'):
        errors.append('Category name is required')
    
    if data.get('name') and len(data.get('name')) < 2:
        errors.append('Category name must be at least 2 characters')
    
    return len(errors) == 0, errors

def validate_inventory_adjustment(data):
    """Validate inventory adjustment data"""
    errors = []
    
    if not data.get('product_id'):
        errors.append('Product ID is required')
    
    if 'quantity_change' not in data or data.get('quantity_change') is None:
        errors.append('Quantity change is required')
    
    if not data.get('reason'):
        errors.append('Reason for adjustment is required')
    
    return len(errors) == 0, errors

def validate_user_registration(data):
    """Validate user registration data"""
    errors = []
    
    if not data.get('username'):
        errors.append('Username is required')
    
    if len(data.get('username', '')) < 3:
        errors.append('Username must be at least 3 characters')
    
    if not data.get('email'):
        errors.append('Email is required')
    else:
        is_valid, message = validate_email_format(data.get('email'))
        if not is_valid:
            errors.append(f'Invalid email: {message}')
    
    if not data.get('password'):
        errors.append('Password is required')
    else:
        is_valid, message = validate_password(data.get('password'))
        if not is_valid:
            errors.append(message)
    
    return len(errors) == 0, errors

def validate_user_login(data):
    """Validate user login data"""
    errors = []
    
    if not data.get('username'):
        errors.append('Username is required')
    
    if not data.get('password'):
        errors.append('Password is required')
    
    return len(errors) == 0, errors

def validate_profile_update(data):
    """Validate profile update data"""
    errors = []
    
    if 'email' in data and data.get('email'):
        is_valid, message = validate_email_format(data.get('email'))
        if not is_valid:
            errors.append(f'Invalid email: {message}')
    
    if 'first_name' in data and data.get('first_name'):
        if len(data.get('first_name')) < 2:
            errors.append('First name must be at least 2 characters')
    
    if 'last_name' in data and data.get('last_name'):
        if len(data.get('last_name')) < 2:
            errors.append('Last name must be at least 2 characters')
    
    return len(errors) == 0, errors

def validate_password_change(data):
    """Validate password change data"""
    errors = []
    
    if not data.get('old_password'):
        errors.append('Old password is required')
    
    if not data.get('new_password'):
        errors.append('New password is required')
    else:
        is_valid, message = validate_password(data.get('new_password'))
        if not is_valid:
            errors.append(f'New password: {message}')
    
    if not data.get('confirm_password'):
        errors.append('Password confirmation is required')
    elif data.get('new_password') != data.get('confirm_password'):
        errors.append('New password and confirmation do not match')
    
    return len(errors) == 0, errors