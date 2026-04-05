import re

def validate_product_data(data):
    """
    Validate product creation/update data
    
    Args:
        data (dict): Product data to validate
    
    Returns:
        tuple: (is_valid, error_messages)
    """
    errors = []
    
    # Validate name
    if 'name' in data:
        name = data['name']
        if not name or not isinstance(name, str):
            errors.append('Product name is required and must be a string')
        elif len(name.strip()) < 2:
            errors.append('Product name must be at least 2 characters')
        elif len(name.strip()) > 100:
            errors.append('Product name cannot exceed 100 characters')
    
    # Validate SKU
    if 'sku' in data:
        sku = data['sku']
        if not sku or not isinstance(sku, str):
            errors.append('SKU is required and must be a string')
        elif len(sku.strip()) < 2:
            errors.append('SKU must be at least 2 characters')
        elif len(sku.strip()) > 50:
            errors.append('SKU cannot exceed 50 characters')
        elif not re.match(r'^[A-Z0-9\-]+$', sku.strip()):
            errors.append('SKU must contain only uppercase letters, numbers, and hyphens')
    
    # Validate price
    if 'price' in data:
        try:
            price = float(data['price'])
            if price < 0:
                errors.append('Price cannot be negative')
            elif price > 999999.99:
                errors.append('Price cannot exceed 999999.99')
        except (ValueError, TypeError):
            errors.append('Price must be a valid number')
    
    # Validate quantity
    if 'quantity' in data:
        try:
            quantity = int(data['quantity'])
            if quantity < 0:
                errors.append('Quantity cannot be negative')
        except (ValueError, TypeError):
            errors.append('Quantity must be a valid integer')
    
    # Validate min_stock
    if 'min_stock' in data:
        try:
            min_stock = int(data['min_stock'])
            if min_stock < 0:
                errors.append('Minimum stock cannot be negative')
        except (ValueError, TypeError):
            errors.append('Minimum stock must be a valid integer')
    
    # Validate max_stock
    if 'max_stock' in data:
        try:
            max_stock = int(data['max_stock'])
            if max_stock < 0:
                errors.append('Maximum stock cannot be negative')
        except (ValueError, TypeError):
            errors.append('Maximum stock must be a valid integer')
    
    # Check if min_stock < max_stock
    if 'min_stock' in data and 'max_stock' in data:
        try:
            if int(data['min_stock']) > int(data['max_stock']):
                errors.append('Minimum stock cannot be greater than maximum stock')
        except:
            pass
    
    # Validate description
    if 'description' in data and data['description']:
        description = data['description']
        if not isinstance(description, str):
            errors.append('Description must be a string')
        elif len(description) > 500:
            errors.append('Description cannot exceed 500 characters')
    
    # Validate category_id
    if 'category_id' in data and data['category_id']:
        if not isinstance(data['category_id'], str):
            errors.append('Category ID must be a string')
    
    return len(errors) == 0, errors

def validate_category_data(name):
    """
    Validate category creation data
    
    Args:
        name (str): Category name
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if not name or not isinstance(name, str):
        return False, 'Category name is required and must be a string'
    
    if len(name.strip()) < 2:
        return False, 'Category name must be at least 2 characters'
    
    if len(name.strip()) > 50:
        return False, 'Category name cannot exceed 50 characters'
    
    return True, 'Valid'

def validate_stock_adjustment(quantity_change, reason):
    """
    Validate stock adjustment data
    
    Args:
        quantity_change (int): Change in quantity
        reason (str): Reason for change
    
    Returns:
        tuple: (is_valid, error_message)
    """
    errors = []
    
    try:
        qty = int(quantity_change)
        if qty == 0:
            errors.append('Quantity change cannot be zero')
    except (ValueError, TypeError):
        errors.append('Quantity change must be a valid integer')
    
    if not reason or not isinstance(reason, str):
        errors.append('Reason is required and must be a string')
    elif len(reason.strip()) < 3:
        errors.append('Reason must be at least 3 characters')
    elif len(reason.strip()) > 200:
        errors.append('Reason cannot exceed 200 characters')
    
    return len(errors) == 0, errors[0] if errors else 'Valid'