from flask import Blueprint, request, jsonify
from models.inventory import Inventory
from models.user import User
from utils.helpers import create_response
from utils.validators import validate_product_data, validate_category_data, validate_stock_adjustment
from middleware.auth_middleware import token_required

inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')

# ===================== PRODUCT ENDPOINTS =====================

@inventory_bp.route('/products', methods=['GET'])
@token_required
def get_products(user_id):
    """Get all products with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        category_id = request.args.get('category_id', None, type=str)
        
        # Validate pagination
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
        
        # Create inventory manager for this user
        inventory = Inventory(user_id)
        
        products, total_count = inventory.get_all_products(
            page=page,
            per_page=per_page,
            search=search,
            category_id=category_id
        )
        
        total_pages = (total_count + per_page - 1) // per_page
        
        return create_response(
            'success',
            'Products retrieved successfully',
            data={
                'products': products,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total_count': total_count,
                    'total_pages': total_pages
                }
            },
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/products/<product_id>', methods=['GET'])
@token_required
def get_product(user_id, product_id):
    """Get a single product by ID"""
    try:
        inventory = Inventory(user_id)
        product = inventory.find_product_by_id(product_id)
        
        if not product:
            return create_response('error', 'Product not found', status_code=404)
        
        return create_response(
            'success',
            'Product retrieved successfully',
            data={'product': product},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/products', methods=['POST'])
@token_required
def create_product(user_id):
    """Create a new product"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        # Validate required fields
        required_fields = ['name', 'sku', 'price', 'quantity', 'min_stock']
        missing_fields = [field for field in required_fields if field not in data or data[field] == '']
        
        if missing_fields:
            return create_response(
                'error',
                f'Missing required fields: {", ".join(missing_fields)}',
                status_code=400
            )
        
        # Validate product data
        is_valid, errors = validate_product_data(data)
        if not is_valid:
            return create_response(
                'error',
                'Validation failed',
                data={'errors': errors},
                status_code=400
            )
        
        inventory = Inventory(user_id)
        
        # Check if SKU already exists
        if inventory.check_sku_exists(data['sku']):
            return create_response('error', 'Product with this SKU already exists', status_code=409)
        
        # Create product
        product = inventory.create_product(
            name=data['name'].strip(),
            sku=data['sku'].strip(),
            category_id=data.get('category_id'),
            price=data['price'],
            quantity=data['quantity'],
            min_stock=data['min_stock'],
            description=data.get('description', '').strip(),
            created_by=user_id
        )
        
        if product:
            return create_response(
                'success',
                'Product created successfully',
                data={'product': product},
                status_code=201
            )
        else:
            return create_response('error', 'Failed to create product', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/products/<product_id>', methods=['PUT'])
@token_required
def update_product(user_id, product_id):
    """Update product information"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        inventory = Inventory(user_id)
        
        # Check if product exists
        product = inventory.find_product_by_id(product_id)
        if not product:
            return create_response('error', 'Product not found', status_code=404)
        
        # Validate product data
        is_valid, errors = validate_product_data(data)
        if not is_valid:
            return create_response(
                'error',
                'Validation failed',
                data={'errors': errors},
                status_code=400
            )
        
        # Check if new SKU already exists (if being changed)
        if 'sku' in data and data['sku'] != product['sku']:
            if inventory.check_sku_exists(data['sku'], exclude_product_id=product_id):
                return create_response('error', 'Product with this SKU already exists', status_code=409)
        
        # Prepare update data
        update_data = {}
        updateable_fields = ['name', 'sku', 'category_id', 'price', 'min_stock', 'description']
        
        for field in updateable_fields:
            if field in data:
                if field == 'name' or field == 'sku' or field == 'description':
                    update_data[field] = data[field].strip()
                else:
                    update_data[field] = data[field]
        
        # Update product
        success = inventory.update_product(product_id, update_data, user_id)
        
        if success:
            updated_product = inventory.find_product_by_id(product_id)
            return create_response(
                'success',
                'Product updated successfully',
                data={'product': updated_product},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to update product', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/products/<product_id>', methods=['DELETE'])
@token_required
def delete_product(user_id, product_id):
    """Delete (soft delete) a product"""
    try:
        inventory = Inventory(user_id)
        
        # Check if product exists
        product = inventory.find_product_by_id(product_id)
        if not product:
            return create_response('error', 'Product not found', status_code=404)
        
        # Delete product
        success = inventory.delete_product(product_id, deleted_by=user_id)
        
        if success:
            return create_response('success', 'Product deleted successfully', status_code=200)
        else:
            return create_response('error', 'Failed to delete product', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/search', methods=['GET'])
@token_required
def search_products(user_id):
    """Search products by name or SKU"""
    try:
        search_query = request.args.get('q', '', type=str).strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not search_query:
            return create_response('error', 'Search query is required', status_code=400)
        
        if limit < 1 or limit > 50:
            limit = 10
        
        inventory = Inventory(user_id)
        products = inventory.search_products(search_query, limit=limit)
        
        return create_response(
            'success',
            'Search completed successfully',
            data={'products': products},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

# ===================== CATEGORY ENDPOINTS =====================

@inventory_bp.route('/categories', methods=['GET'])
@token_required
def get_categories(user_id):
    """Get all categories"""
    try:
        inventory = Inventory(user_id)
        categories = inventory.get_all_categories()
        return create_response(
            'success',
            'Categories retrieved successfully',
            data={'categories': categories},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/categories', methods=['POST'])
@token_required
def create_category(user_id):
    """Create a new category"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        name = data.get('name', '').strip()
        
        # Validate category data
        is_valid, message = validate_category_data(name)
        if not is_valid:
            return create_response('error', message, status_code=400)
        
        inventory = Inventory(user_id)
        
        # Create category
        category = inventory.create_category(
            name=name,
            description=data.get('description', '').strip()
        )
        
        if category:
            return create_response(
                'success',
                'Category created successfully',
                data={'category': category},
                status_code=201
            )
        else:
            return create_response('error', 'Failed to create category', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/categories/<category_id>', methods=['PUT'])
@token_required
def update_category(user_id, category_id):
    """Update category"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        inventory = Inventory(user_id)
        
        # Check if category exists
        category = inventory.find_category_by_id(category_id)
        if not category:
            return create_response('error', 'Category not found', status_code=404)
        
        name = data.get('name', '').strip() if 'name' in data else None
        description = data.get('description', '').strip() if 'description' in data else None
        
        # Validate if name is provided
        if name:
            is_valid, message = validate_category_data(name)
            if not is_valid:
                return create_response('error', message, status_code=400)
        
        # Update category
        success = inventory.update_category(category_id, name=name, description=description)
        
        if success:
            updated_category = inventory.find_category_by_id(category_id)
            return create_response(
                'success',
                'Category updated successfully',
                data={'category': updated_category},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to update category', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/categories/<category_id>', methods=['DELETE'])
@token_required
def delete_category(user_id, category_id):
    """Delete a category"""
    try:
        inventory = Inventory(user_id)
        
        # Check if category exists
        category = inventory.find_category_by_id(category_id)
        if not category:
            return create_response('error', 'Category not found', status_code=404)
        
        # Delete category
        success = inventory.delete_category(category_id)
        
        if success:
            return create_response('success', 'Category deleted successfully', status_code=200)
        else:
            return create_response('error', 'Failed to delete category', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

# ===================== STOCK OPERATIONS =====================

@inventory_bp.route('/adjust-stock/<product_id>', methods=['POST'])
@token_required
def adjust_stock(user_id, product_id):
    """Adjust product stock"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        quantity_change = data.get('quantity_change')
        reason = data.get('reason', '').strip()
        
        # Validate stock adjustment
        is_valid, message = validate_stock_adjustment(quantity_change, reason)
        if not is_valid:
            return create_response('error', message, status_code=400)
        
        inventory = Inventory(user_id)
        
        # Check if product exists
        product = inventory.find_product_by_id(product_id)
        if not product:
            return create_response('error', 'Product not found', status_code=404)
        
        # Adjust stock
        updated_product = inventory.adjust_stock(
            product_id=product_id,
            quantity_change=int(quantity_change),
            reason=reason,
            user_id=user_id
        )
        
        if updated_product:
            return create_response(
                'success',
                'Stock adjusted successfully',
                data={'product': updated_product},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to adjust stock', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/low-stock', methods=['GET'])
@token_required
def get_low_stock(user_id):
    """Get all products with low stock"""
    try:
        inventory = Inventory(user_id)
        products = inventory.get_low_stock_items()
        return create_response(
            'success',
            'Low stock items retrieved successfully',
            data={'products': products},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/logs', methods=['GET'])
@token_required
def get_inventory_logs(user_id):
    """Get inventory transaction logs"""
    try:
        product_id = request.args.get('product_id', None, type=str)
        limit = request.args.get('limit', 50, type=int)
        
        if limit < 1 or limit > 500:
            limit = 50
        
        inventory = Inventory(user_id)
        logs = inventory.get_inventory_logs(product_id=product_id, limit=limit)
        
        return create_response(
            'success',
            'Inventory logs retrieved successfully',
            data={'logs': logs},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@inventory_bp.route('/statistics', methods=['GET'])
@token_required
def get_statistics(user_id):
    """Get inventory statistics"""
    try:
        inventory = Inventory(user_id)
        stats = inventory.get_inventory_statistics()
        return create_response(
            'success',
            'Statistics retrieved successfully',
            data=stats,
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)