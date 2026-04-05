from flask import Blueprint, request, jsonify
from models.sales import Sales
from models.inventory import Inventory
from utils.helpers import create_response
from utils.sales_validators import validate_customer_data, validate_sales_order_data
from middleware.auth_middleware import token_required

sales_bp = Blueprint('sales', __name__, url_prefix='/api/sales')

# ===================== CUSTOMER ENDPOINTS =====================

@sales_bp.route('/customers', methods=['GET'])
@token_required
def get_customers(user_id):
    """Get all customers with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
        
        sales = Sales(user_id)
        customers, total_count = sales.get_all_customers(
            page=page,
            per_page=per_page,
            search=search
        )
        
        total_pages = (total_count + per_page - 1) // per_page
        
        return create_response(
            'success',
            'Customers retrieved successfully',
            data={
                'customers': customers,
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

@sales_bp.route('/customers/<customer_id>', methods=['GET'])
@token_required
def get_customer(user_id, customer_id):
    """Get a single customer by ID"""
    try:
        sales = Sales(user_id)
        customer = sales.find_customer_by_id(customer_id)
        
        if not customer:
            return create_response('error', 'Customer not found', status_code=404)
        
        return create_response(
            'success',
            'Customer retrieved successfully',
            data={'customer': customer},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/customers', methods=['POST'])
@token_required
def create_customer(user_id):
    """Create a new customer"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'country']
        missing_fields = [field for field in required_fields if field not in data or data[field] == '']
        
        if missing_fields:
            return create_response(
                'error',
                f'Missing required fields: {", ".join(missing_fields)}',
                status_code=400
            )
        
        # Validate customer data
        is_valid, errors = validate_customer_data(data)
        if not is_valid:
            return create_response(
                'error',
                'Validation failed',
                data={'errors': errors},
                status_code=400
            )
        
        sales = Sales(user_id)
        
        # Check if email already exists
        existing = sales.find_customer_by_email(data['email'])
        if existing:
            return create_response('error', 'Customer with this email already exists', status_code=409)
        
        # Create customer
        customer = sales.create_customer(
            name=data['name'].strip(),
            email=data['email'].strip(),
            phone=data['phone'].strip(),
            address=data['address'].strip(),
            city=data['city'].strip(),
            state=data['state'].strip(),
            zip_code=data['zip_code'].strip(),
            country=data['country'].strip()
        )
        
        if customer:
            return create_response(
                'success',
                'Customer created successfully',
                data={'customer': customer},
                status_code=201
            )
        else:
            return create_response('error', 'Failed to create customer', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/customers/<customer_id>', methods=['PUT'])
@token_required
def update_customer(user_id, customer_id):
    """Update customer information"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        sales = Sales(user_id)
        
        # Check if customer exists
        customer = sales.find_customer_by_id(customer_id)
        if not customer:
            return create_response('error', 'Customer not found', status_code=404)
        
        # Validate customer data
        is_valid, errors = validate_customer_data(data)
        if not is_valid:
            return create_response(
                'error',
                'Validation failed',
                data={'errors': errors},
                status_code=400
            )
        
        # Prepare update data
        update_data = {}
        updateable_fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'country']
        
        for field in updateable_fields:
            if field in data:
                update_data[field] = data[field].strip()
        
        # Update customer
        success = sales.update_customer(customer_id, update_data)
        
        if success:
            updated_customer = sales.find_customer_by_id(customer_id)
            return create_response(
                'success',
                'Customer updated successfully',
                data={'customer': updated_customer},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to update customer', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/customers/<customer_id>', methods=['DELETE'])
@token_required
def delete_customer(user_id, customer_id):
    """Delete (soft delete) a customer"""
    try:
        sales = Sales(user_id)
        
        customer = sales.find_customer_by_id(customer_id)
        if not customer:
            return create_response('error', 'Customer not found', status_code=404)
        
        success = sales.delete_customer(customer_id)
        
        if success:
            return create_response('success', 'Customer deleted successfully', status_code=200)
        else:
            return create_response('error', 'Failed to delete customer', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

# ===================== SALES ORDER ENDPOINTS =====================

@sales_bp.route('/orders', methods=['GET'])
@token_required
def get_orders(user_id):
    """Get all sales orders with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', None, type=str)
        customer_id = request.args.get('customer_id', None, type=str)
        search = request.args.get('search', '', type=str)
        
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
        
        sales = Sales(user_id)
        orders, total_count = sales.get_all_orders(
            page=page,
            per_page=per_page,
            status=status,
            customer_id=customer_id,
            search=search
        )
        
        total_pages = (total_count + per_page - 1) // per_page
        
        return create_response(
            'success',
            'Orders retrieved successfully',
            data={
                'orders': orders,
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

@sales_bp.route('/orders/<order_id>', methods=['GET'])
@token_required
def get_order(user_id, order_id):
    """Get a single order by ID"""
    try:
        sales = Sales(user_id)
        order = sales.find_order_by_id(order_id)
        
        if not order:
            return create_response('error', 'Order not found', status_code=404)
        
        return create_response(
            'success',
            'Order retrieved successfully',
            data={'order': order},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/orders', methods=['POST'])
@token_required
def create_order(user_id):
    """Create a new sales order"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        sales = Sales(user_id)
        inventory = Inventory(user_id)
        
        # Validate order data
        is_valid, errors = validate_sales_order_data(data, inventory)
        if not is_valid:
            return create_response(
                'error',
                'Validation failed',
                data={'errors': errors},
                status_code=400
            )
        
        # Check if customer exists
        customer = sales.find_customer_by_id(data['customer_id'])
        if not customer:
            return create_response('error', 'Customer not found', status_code=404)
        
        # Create order
        order = sales.create_sales_order(
            customer_id=data['customer_id'],
            items=data['items'],
            notes=data.get('notes', '').strip(),
            created_by=user_id
        )
        
        if order:
            # Adjust inventory for each product
            for item in data['items']:
                inventory.adjust_stock(
                    product_id=item['product_id'],
                    quantity_change=-item['quantity'],
                    reason=f"Sold via Order {order['order_number']}",
                    user_id=user_id
                )
            
            return create_response(
                'success',
                'Order created successfully',
                data={'order': order},
                status_code=201
            )
        else:
            return create_response('error', 'Failed to create order', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/orders/<order_id>/status', methods=['PUT'])
@token_required
def update_order_status(user_id, order_id):
    """Update order status"""
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return create_response('error', 'Status is required', status_code=400)
        
        sales = Sales(user_id)
        
        # Check if order exists
        order = sales.find_order_by_id(order_id)
        if not order:
            return create_response('error', 'Order not found', status_code=404)
        
        # Update status
        success = sales.update_order_status(order_id, data['status'].upper())
        
        if success:
            updated_order = sales.find_order_by_id(order_id)
            return create_response(
                'success',
                'Order status updated successfully',
                data={'order': updated_order},
                status_code=200
            )
        else:
            return create_response('error', 'Invalid status or failed to update', status_code=400)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/orders/<order_id>/payment', methods=['PUT'])
@token_required
def update_payment_status(user_id, order_id):
    """Update order payment status"""
    try:
        data = request.get_json()
        
        if not data or 'payment_status' not in data:
            return create_response('error', 'Payment status is required', status_code=400)
        
        sales = Sales(user_id)
        
        # Check if order exists
        order = sales.find_order_by_id(order_id)
        if not order:
            return create_response('error', 'Order not found', status_code=404)
        
        # Update payment status
        success = sales.update_payment_status(
            order_id,
            data['payment_status'].upper(),
            amount_paid=data.get('amount_paid')
        )
        
        if success:
            updated_order = sales.find_order_by_id(order_id)
            return create_response(
                'success',
                'Payment status updated successfully',
                data={'order': updated_order},
                status_code=200
            )
        else:
            return create_response('error', 'Invalid payment status or failed to update', status_code=400)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/orders/<order_id>/cancel', methods=['POST'])
@token_required
def cancel_order(user_id, order_id):
    """Cancel a sales order"""
    try:
        data = request.get_json()
        
        if not data or 'reason' not in data:
            return create_response('error', 'Cancellation reason is required', status_code=400)
        
        sales = Sales(user_id)
        inventory = Inventory(user_id)
        
        # Check if order exists
        order = sales.find_order_by_id(order_id)
        if not order:
            return create_response('error', 'Order not found', status_code=404)
        
        if order['status'] == 'CANCELLED':
            return create_response('error', 'Order is already cancelled', status_code=400)
        
        # Cancel order (this will update customer stats)
        success = sales.cancel_order(order_id, data['reason'].strip())
        
        if success:
            # Restore inventory
            for item in order['items']:
                inventory.adjust_stock(
                    product_id=item['product_id'],
                    quantity_change=item['quantity'],
                    reason=f"Order {order['order_number']} cancelled",
                    user_id=user_id
                )
            
            updated_order = sales.find_order_by_id(order_id)
            return create_response(
                'success',
                'Order cancelled successfully',
                data={'order': updated_order},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to cancel order', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/orders/<order_id>', methods=['DELETE'])
@token_required
def delete_order(user_id, order_id):
    """Delete an order"""
    try:
        sales = Sales(user_id)
        inventory = Inventory(user_id)
        
        # Delete order (this will update customer stats)
        success, order = sales.delete_order(order_id)
        
        if success and order:
            # Restore inventory for all items
            for item in order['items']:
                inventory.adjust_stock(
                    product_id=item['product_id'],
                    quantity_change=item['quantity'],
                    reason=f"Order {order['order_number']} deleted",
                    user_id=user_id
                )
            
            return create_response('success', 'Order deleted successfully', status_code=200)
        else:
            return create_response('error', 'Order not found or failed to delete', status_code=404)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/customer/<customer_id>/orders', methods=['GET'])
@token_required
def get_customer_orders(user_id, customer_id):
    """Get all orders for a specific customer"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        sales = Sales(user_id)
        
        # Check if customer exists
        customer = sales.find_customer_by_id(customer_id)
        if not customer:
            return create_response('error', 'Customer not found', status_code=404)
        
        orders = sales.get_customer_orders(customer_id, limit=limit)
        
        return create_response(
            'success',
            'Customer orders retrieved successfully',
            data={'orders': orders},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@sales_bp.route('/statistics', methods=['GET'])
@token_required
def get_statistics(user_id):
    """Get sales statistics"""
    try:
        sales = Sales(user_id)
        stats = sales.get_order_statistics()
        
        return create_response(
            'success',
            'Statistics retrieved successfully',
            data=stats,
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)
    
