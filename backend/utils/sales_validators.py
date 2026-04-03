def validate_customer_data(data):
    """
    Validate customer creation/update data
    
    Returns:
        tuple: (is_valid, error_messages)
    """
    errors = []
    
    # Validate name
    if 'name' in data:
        name = data['name']
        if not name or not isinstance(name, str):
            errors.append('Customer name is required and must be a string')
        elif len(name.strip()) < 2:
            errors.append('Customer name must be at least 2 characters')
        elif len(name.strip()) > 100:
            errors.append('Customer name cannot exceed 100 characters')
    
    # Validate email
    if 'email' in data:
        email = data['email']
        if not email or not isinstance(email, str):
            errors.append('Email is required and must be a string')
        elif not _is_valid_email(email):
            errors.append('Invalid email format')
    
    # Validate phone
    if 'phone' in data:
        phone = data['phone']
        if not phone or not isinstance(phone, str):
            errors.append('Phone is required and must be a string')
        elif len(phone.strip()) < 7:
            errors.append('Phone must be at least 7 characters')
    
    # Validate address
    if 'address' in data:
        address = data['address']
        if not address or not isinstance(address, str):
            errors.append('Address is required')
        elif len(address.strip()) < 5:
            errors.append('Address must be at least 5 characters')
    
    # Validate city
    if 'city' in data:
        city = data['city']
        if not city or not isinstance(city, str):
            errors.append('City is required')
        elif len(city.strip()) < 2:
            errors.append('City must be at least 2 characters')
    
    # Validate state
    if 'state' in data:
        state = data['state']
        if not state or not isinstance(state, str):
            errors.append('State is required')
        elif len(state.strip()) < 2:
            errors.append('State must be at least 2 characters')
    
    # Validate zip code
    if 'zip_code' in data:
        zip_code = data['zip_code']
        if not zip_code or not isinstance(zip_code, str):
            errors.append('Zip code is required')
        elif len(zip_code.strip()) < 3:
            errors.append('Zip code must be at least 3 characters')
    
    # Validate country
    if 'country' in data:
        country = data['country']
        if not country or not isinstance(country, str):
            errors.append('Country is required')
        elif len(country.strip()) < 2:
            errors.append('Country must be at least 2 characters')
    
    return len(errors) == 0, errors

def validate_sales_order_data(data, inventory):
    """
    Validate sales order data
    
    Args:
        data (dict): Order data
        inventory: Inventory manager instance
    
    Returns:
        tuple: (is_valid, error_messages)
    """
    errors = []
    
    # Validate customer_id
    if 'customer_id' not in data or not data['customer_id']:
        errors.append('Customer ID is required')
    
    # Validate items
    if 'items' not in data or not data['items']:
        errors.append('Order must contain at least one item')
    else:
        if not isinstance(data['items'], list):
            errors.append('Items must be a list')
        else:
            for i, item in enumerate(data['items']):
                if 'product_id' not in item:
                    errors.append(f'Item {i+1}: product_id is required')
                if 'quantity' not in item:
                    errors.append(f'Item {i+1}: quantity is required')
                elif not isinstance(item['quantity'], int) or item['quantity'] < 1:
                    errors.append(f'Item {i+1}: quantity must be a positive integer')
                if 'price' not in item:
                    errors.append(f'Item {i+1}: price is required')
                elif not isinstance(item['price'], (int, float)) or item['price'] < 0:
                    errors.append(f'Item {i+1}: price must be a positive number')
                
                # Check product exists and has sufficient stock
                product = inventory.find_product_by_id(item['product_id'])
                if not product:
                    errors.append(f'Item {i+1}: Product not found')
                elif product['quantity'] < item['quantity']:
                    errors.append(f'Item {i+1}: Insufficient stock. Available: {product["quantity"]}')
    
    return len(errors) == 0, errors

def _is_valid_email(email):
    """Validate email format"""
    import re
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None