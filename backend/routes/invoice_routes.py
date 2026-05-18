from flask import Blueprint, request, jsonify
from models.invoice import Invoice
from models.sales import Sales
from models.user import User
from utils.helpers import create_response
from middleware.auth_middleware import token_required

invoice_bp = Blueprint('invoice', __name__, url_prefix='/api/invoice')

# ===================== INVOICE ENDPOINTS =====================

@invoice_bp.route('/invoices', methods=['GET'])
@token_required
def get_invoices(user_id):
    """Get all invoices with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
        
        invoice = Invoice(user_id)
        invoices, total_count = invoice.get_all_invoices(
            page=page,
            per_page=per_page,
            search=search
        )
        
        total_pages = (total_count + per_page - 1) // per_page
        
        return create_response(
            'success',
            'Invoices retrieved successfully',
            data={
                'invoices': invoices,
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

@invoice_bp.route('/invoices/<invoice_id>', methods=['GET'])
@token_required
def get_invoice(user_id, invoice_id):
    """Get a single invoice by ID"""
    try:
        invoice_mgr = Invoice(user_id)
        invoice = invoice_mgr.find_invoice_by_id(invoice_id)
        
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        return create_response(
            'success',
            'Invoice retrieved successfully',
            data={'invoice': invoice},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/invoices', methods=['POST'])
@token_required
def create_invoice(user_id):
    """Create invoice from sales order"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        order_id = data.get('order_id')
        payment_method = data.get('payment_method', '').strip()
        notes = data.get('notes', '').strip()
        
        if not order_id:
            return create_response('error', 'Order ID is required', status_code=400)
        
        if not payment_method:
            return create_response('error', 'Payment method is required', status_code=400)
        
        # Check if invoice already exists for this order
        invoice_mgr = Invoice(user_id)
        existing_invoice = invoice_mgr.find_invoice_by_order(order_id)
        
        if existing_invoice== True:
            return create_response('error', 'Invoice already exists for this order', status_code=409)
        
        # Verify order exists
        sales_mgr = Sales(user_id)
        order = sales_mgr.find_order_by_id(order_id)
        
        if not order:
            return create_response('error', 'Order not found', status_code=404)
        
        # Create invoice
        invoice = invoice_mgr.create_invoice(
            order_id=order_id,
            payment_method=payment_method,
            notes=notes,
            created_by=user_id
        )
        
        if invoice:
            return create_response(
                'success',
                'Invoice created successfully',
                data={'invoice': invoice},
                status_code=201
            )
        else:
            return create_response('error', 'Failed to create invoice', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/invoices/<invoice_id>', methods=['PUT'])
@token_required
def update_invoice(user_id, invoice_id):
    """Update invoice information"""
    try:
        data = request.get_json()
        
        if not data:
            return create_response('error', 'No data provided', status_code=400)
        
        invoice_mgr = Invoice(user_id)
        
        # Check if invoice exists
        invoice = invoice_mgr.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Prepare update data
        update_data = {}
        
        if 'payment_method' in data:
            update_data['payment_method'] = data['payment_method'].strip()
        
        if 'notes' in data:
            update_data['notes'] = data['notes'].strip()
        
        if not update_data:
            return create_response('error', 'No valid fields to update', status_code=400)
        
        # Update invoice
        success = invoice_mgr.update_invoice(invoice_id, update_data)
        
        if success:
            updated_invoice = invoice_mgr.find_invoice_by_id(invoice_id)
            return create_response(
                'success',
                'Invoice updated successfully',
                data={'invoice': updated_invoice},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to update invoice', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/invoices/<invoice_id>', methods=['DELETE'])
@token_required
def delete_invoice(user_id, invoice_id):
    """Delete an invoice"""
    try:
        invoice_mgr = Invoice(user_id)
        
        # Check if invoice exists
        invoice = invoice_mgr.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Delete invoice
        success = invoice_mgr.delete_invoice(invoice_id)
        
        if success:
            return create_response('success', 'Invoice deleted successfully', status_code=200)
        else:
            return create_response('error', 'Failed to delete invoice', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/invoices/<invoice_id>/details', methods=['GET'])
@token_required
def get_invoice_details(user_id, invoice_id):
    """Get complete invoice details with order and customer info"""
    try:
        invoice_mgr = Invoice(user_id)
        sales_mgr = Sales(user_id)
        user_mgr = User
        
        # Get invoice
        invoice = invoice_mgr.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Get order details
        order = sales_mgr.find_order_by_id(invoice['order_id'])
        if not order:
            return create_response('error', 'Order not found', status_code=404)
        
        # Get customer details
        customer = sales_mgr.find_customer_by_id(order['customer_id'])
        
        # Get company/seller details
        user = user_mgr.find_by_id(user_id)
        
        return create_response(
            'success',
            'Invoice details retrieved successfully',
            data={
                'invoice': invoice,
                'order': order,
                'customer': customer,
                'company': user
            },
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/statistics', methods=['GET'])
@token_required
def get_statistics(user_id):
    """Get invoice statistics"""
    try:
        invoice_mgr = Invoice(user_id)
        stats = invoice_mgr.get_invoice_statistics()
        
        return create_response(
            'success',
            'Statistics retrieved successfully',
            data=stats,
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)