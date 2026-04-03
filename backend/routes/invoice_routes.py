from flask import Blueprint, request, jsonify
from models.invoice import Invoice
from models.sales import Sales
from utils.helpers import create_response
from utils.email_service import EmailService
from middleware.auth_middleware import token_required
from datetime import datetime

invoice_bp = Blueprint('invoice', __name__, url_prefix='/api/invoice')

# ===================== INVOICE ENDPOINTS =====================

@invoice_bp.route('/from-order/<order_id>', methods=['POST'])
@token_required
def create_invoice_from_order(user_id, order_id):
    """Create an invoice from a sales order"""
    try:
        invoice_manager = Invoice(user_id)
        sales = Sales(user_id)
        
        # Check if order exists
        order = sales.find_order_by_id(order_id)
        if not order:
            return create_response('error', 'Order not found', status_code=404)
        
        # Create invoice
        invoice = invoice_manager.create_invoice_from_order(order_id, user_id)
        
        if invoice:
            return create_response(
                'success',
                'Invoice created successfully',
                data={'invoice': invoice},
                status_code=201
            )
        else:
            return create_response('error', 'Failed to create invoice or invoice already exists', status_code=400)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/<invoice_id>', methods=['GET'])
@token_required
def get_invoice(user_id, invoice_id):
    """Get a single invoice by ID"""
    try:
        invoice_manager = Invoice(user_id)
        invoice = invoice_manager.find_invoice_by_id(invoice_id)
        
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

@invoice_bp.route('', methods=['GET'])
@token_required
def get_invoices(user_id):
    """Get all invoices with filtering"""
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
        
        invoice_manager = Invoice(user_id)
        invoices, total_count = invoice_manager.get_all_invoices(
            page=page,
            per_page=per_page,
            status=status,
            customer_id=customer_id,
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

@invoice_bp.route('/<invoice_id>/status', methods=['PUT'])
@token_required
def update_invoice_status(user_id, invoice_id):
    """Update invoice status"""
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return create_response('error', 'Status is required', status_code=400)
        
        invoice_manager = Invoice(user_id)
        
        # Check if invoice exists
        invoice = invoice_manager.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Update status
        success = invoice_manager.update_invoice_status(invoice_id, data['status'].upper())
        
        if success:
            updated_invoice = invoice_manager.find_invoice_by_id(invoice_id)
            return create_response(
                'success',
                'Invoice status updated successfully',
                data={'invoice': updated_invoice},
                status_code=200
            )
        else:
            return create_response('error', 'Invalid status or failed to update', status_code=400)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/<invoice_id>/payment', methods=['PUT'])
@token_required
def update_invoice_payment_status(user_id, invoice_id):
    """Update invoice payment status"""
    try:
        data = request.get_json()
        
        if not data or 'payment_status' not in data:
            return create_response('error', 'Payment status is required', status_code=400)
        
        invoice_manager = Invoice(user_id)
        
        # Check if invoice exists
        invoice = invoice_manager.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Update payment status
        success = invoice_manager.update_invoice_payment_status(
            invoice_id,
            data['payment_status'].upper()
        )
        
        if success:
            updated_invoice = invoice_manager.find_invoice_by_id(invoice_id)
            return create_response(
                'success',
                'Invoice payment status updated successfully',
                data={'invoice': updated_invoice},
                status_code=200
            )
        else:
            return create_response('error', 'Invalid payment status or failed to update', status_code=400)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/<invoice_id>/due-date', methods=['PUT'])
@token_required
def set_invoice_due_date(user_id, invoice_id):
    """Set invoice due date"""
    try:
        data = request.get_json()
        
        if not data or 'due_date' not in data:
            return create_response('error', 'Due date is required', status_code=400)
        
        invoice_manager = Invoice(user_id)
        
        # Check if invoice exists
        invoice = invoice_manager.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Parse and validate due date
        try:
            due_date = datetime.fromisoformat(data['due_date'])
        except:
            return create_response('error', 'Invalid date format. Use ISO format (YYYY-MM-DD)', status_code=400)
        
        # Update due date
        success = invoice_manager.set_invoice_due_date(invoice_id, due_date)
        
        if success:
            updated_invoice = invoice_manager.find_invoice_by_id(invoice_id)
            return create_response(
                'success',
                'Invoice due date updated successfully',
                data={'invoice': updated_invoice},
                status_code=200
            )
        else:
            return create_response('error', 'Failed to update due date', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/<invoice_id>', methods=['DELETE'])
@token_required
def delete_invoice(user_id, invoice_id):
    """Delete an invoice"""
    try:
        invoice_manager = Invoice(user_id)
        
        # Check if invoice exists
        invoice = invoice_manager.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Delete invoice
        success = invoice_manager.delete_invoice(invoice_id)
        
        if success:
            return create_response('success', 'Invoice deleted successfully', status_code=200)
        else:
            return create_response('error', 'Failed to delete invoice', status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/customer/<customer_id>', methods=['GET'])
@token_required
def get_customer_invoices(user_id, customer_id):
    """Get all invoices for a specific customer"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        invoice_manager = Invoice(user_id)
        invoices = invoice_manager.get_customer_invoices(customer_id, limit=limit)
        
        return create_response(
            'success',
            'Customer invoices retrieved successfully',
            data={'invoices': invoices},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/statistics', methods=['GET'])
@token_required
def get_invoice_statistics(user_id):
    """Get invoice statistics"""
    try:
        invoice_manager = Invoice(user_id)
        stats = invoice_manager.get_invoice_statistics()
        
        return create_response(
            'success',
            'Statistics retrieved successfully',
            data=stats,
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/<invoice_id>/send-notification', methods=['POST'])
@token_required
def send_invoice_notification(user_id, invoice_id):
    """Send invoice notification email"""
    try:
        invoice_manager = Invoice(user_id)
        
        # Get invoice
        invoice = invoice_manager.find_invoice_by_id(invoice_id)
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Get email address (from request or use customer email)
        data = request.get_json() or {}
        email = data.get('email', invoice['customer_email'])
        
        # Create invoice link
        invoice_link = f"http://localhost:8000/pages/view-invoice.html?id={invoice_id}"
        
        # Send email
        email_service = EmailService()
        result = email_service.send_invoice_notification(
            recipient_email=email,
            recipient_name=invoice['customer_name'],
            invoice_number=invoice['invoice_number'],
            total_amount=invoice['total_amount'],
            invoice_link=invoice_link
        )
        
        if result['status'] == 'success':
            # Update invoice status to SENT
            invoice_manager.update_invoice_status(invoice_id, 'SENT')
            
            return create_response(
                'success',
                result['message'],
                data={},
                status_code=200
            )
        else:
            return create_response('error', result['message'], status_code=500)
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/bulk-send-notification', methods=['POST'])
@token_required
def send_bulk_invoice_notifications(user_id):
    """Send notification emails for multiple invoices"""
    try:
        data = request.get_json()
        
        if not data or 'invoice_ids' not in data:
            return create_response('error', 'Invoice IDs are required', status_code=400)
        
        invoice_manager = Invoice(user_id)
        email_service = EmailService()
        
        results = {
            'sent': 0,
            'failed': 0,
            'errors': []
        }
        
        # Send notification for each invoice
        for invoice_id in data['invoice_ids']:
            try:
                invoice = invoice_manager.find_invoice_by_id(invoice_id)
                if not invoice:
                    results['failed'] += 1
                    results['errors'].append({
                        'invoice_id': invoice_id,
                        'error': 'Invoice not found'
                    })
                    continue
                
                # Create invoice link
                invoice_link = f"http://localhost:8000/pages/view-invoice.html?id={invoice_id}"
                
                # Send email
                result = email_service.send_invoice_notification(
                    recipient_email=invoice['customer_email'],
                    recipient_name=invoice['customer_name'],
                    invoice_number=invoice['invoice_number'],
                    total_amount=invoice['total_amount'],
                    invoice_link=invoice_link
                )
                
                if result['status'] == 'success':
                    # Update invoice status to SENT
                    invoice_manager.update_invoice_status(invoice_id, 'SENT')
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append({
                        'invoice_id': invoice_id,
                        'error': result['message']
                    })
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'invoice_id': invoice_id,
                    'error': str(e)
                })
        
        return create_response(
            'success',
            f'Sent {results["sent"]} notifications, {results["failed"]} failed',
            data=results,
            status_code=200
        )
    
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@invoice_bp.route('/<invoice_id>/view-data', methods=['GET'])
@token_required
def get_invoice_for_viewing(user_id, invoice_id):
    """Get invoice data for viewing/printing (with formatted dates)"""
    try:
        invoice_manager = Invoice(user_id)
        invoice = invoice_manager.find_invoice_by_id(invoice_id)
        
        if not invoice:
            return create_response('error', 'Invoice not found', status_code=404)
        
        # Format dates for display
        if invoice.get('created_at'):
            invoice['created_at_formatted'] = datetime.fromisoformat(
                invoice['created_at'].replace('Z', '+00:00')
            ).strftime('%B %d, %Y')
        
        if invoice.get('due_date'):
            invoice['due_date_formatted'] = datetime.fromisoformat(
                invoice['due_date'].replace('Z', '+00:00')
            ).strftime('%B %d, %Y')
        
        return create_response(
            'success',
            'Invoice retrieved successfully',
            data={'invoice': invoice},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)