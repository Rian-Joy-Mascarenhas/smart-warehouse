"""
Invoice Routes - API endpoints for invoice management
Handles all invoice-related operations
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
from models.invoice import Invoice
from utils.pdf_generator import PDFGenerator
import io

load_dotenv()

# Create Blueprint
invoice_bp = Blueprint('invoice', __name__, url_prefix='/api/invoice')

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB = 'smart_warehouse_main'

def get_db():
    """Get MongoDB database connection"""
    client = MongoClient(MONGO_URI)
    return client[MONGO_DB]

def get_next_invoice_number(db):
    """
    Generate next invoice number
    Uses a counter collection to ensure unique sequential invoice numbers
    
    Returns:
        str: Formatted invoice number (e.g., INV-2026-000001)
    """
    # Get counters collection
    counters = db['counters']
    
    # Increment counter
    result = counters.find_one_and_update(
        {'_id': 'invoice_counter'},
        {'$inc': {'seq': 1}},
        upsert=True,
        return_document=True
    )
    
    # Format invoice number
    invoice_seq = result['seq']
    current_year = datetime.utcnow().year
    invoice_number = f"INV-{current_year}-{invoice_seq:06d}"
    
    return invoice_number

@invoice_bp.route('/create', methods=['POST'])
@jwt_required()
def create_invoice():
    """
    Create a new invoice
    
    Expected JSON:
    {
        "customer_details": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "1234567890"
        },
        "items": [
            {
                "product_name": "Product A",
                "quantity": 5,
                "price_per_item": 100
            }
        ],
        "tax_percentage": 10
    }
    
    Returns:
        JSON: Created invoice with invoice number
    """
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Request body is empty'
            }), 400
        
        # Extract data
        customer_details = data.get('customer_details', {})
        items = data.get('items', [])
        tax_percentage = data.get('tax_percentage', 10)
        
        # Validate customer details
        is_valid, error_msg = Invoice.validate_customer_details(customer_details)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': error_msg
            }), 400
        
        # Validate items
        is_valid, error_msg = Invoice.validate_items(items)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': error_msg
            }), 400
        
        # Validate tax percentage
        try:
            tax_percentage = float(tax_percentage)
            if tax_percentage < 0 or tax_percentage > 100:
                return jsonify({
                    'status': 'error',
                    'message': 'Tax percentage must be between 0 and 100'
                }), 400
        except ValueError:
            return jsonify({
                'status': 'error',
                'message': 'Invalid tax percentage'
            }), 400
        
        # Create invoice object
        invoice = Invoice(
            customer_details=customer_details,
            items=items,
            tax_percentage=tax_percentage,
            created_by=current_user
        )
        
        # Get database
        db = get_db()
        invoices_collection = db['invoices']
        
        # Generate invoice number
        invoice_number = get_next_invoice_number(db)
        
        # Convert to dictionary and insert
        invoice_data = invoice.to_dict(invoice_number=invoice_number)
        result = invoices_collection.insert_one(invoice_data)
        
        # Add MongoDB ObjectId to response
        invoice_data['_id'] = str(result.inserted_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Invoice created successfully',
            'invoice': invoice_data
        }), 201
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to create invoice: {str(e)}'
        }), 500

@invoice_bp.route('/get/<invoice_number>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_number):
    """
    Get invoice by invoice number
    
    Args:
        invoice_number: Invoice number (e.g., INV-2026-000001)
    
    Returns:
        JSON: Invoice details
    """
    try:
        db = get_db()
        invoices_collection = db['invoices']
        
        # Find invoice
        invoice = invoices_collection.find_one({'invoice_number': invoice_number})
        
        if not invoice:
            return jsonify({
                'status': 'error',
                'message': 'Invoice not found'
            }), 404
        
        # Convert ObjectId to string
        invoice['_id'] = str(invoice['_id'])
        
        return jsonify({
            'status': 'success',
            'invoice': invoice
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve invoice: {str(e)}'
        }), 500

@invoice_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_invoices():
    """
    Get all invoices for current user
    Supports pagination with query parameters:
    - page: Page number (default: 1)
    - limit: Items per page (default: 10)
    
    Returns:
        JSON: List of invoices with pagination info
    """
    try:
        current_user = get_jwt_identity()
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        # Validate pagination
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 10
        
        # Calculate skip
        skip = (page - 1) * limit
        
        db = get_db()
        invoices_collection = db['invoices']
        
        # Get total count
        total_count = invoices_collection.count_documents({'created_by': current_user})
        
        # Get invoices
        invoices = list(invoices_collection
                       .find({'created_by': current_user})
                       .sort('created_at', -1)
                       .skip(skip)
                       .limit(limit))
        
        # Convert ObjectId to string
        for invoice in invoices:
            invoice['_id'] = str(invoice['_id'])
        
        return jsonify({
            'status': 'success',
            'invoices': invoices,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve invoices: {str(e)}'
        }), 500

@invoice_bp.route('/delete/<invoice_number>', methods=['DELETE'])
@jwt_required()
def delete_invoice(invoice_number):
    """
    Delete an invoice
    
    Args:
        invoice_number: Invoice number to delete
    
    Returns:
        JSON: Confirmation message
    """
    try:
        current_user = get_jwt_identity()
        db = get_db()
        invoices_collection = db['invoices']
        
        # Find and delete invoice
        result = invoices_collection.delete_one({
            'invoice_number': invoice_number,
            'created_by': current_user
        })
        
        if result.deleted_count == 0:
            return jsonify({
                'status': 'error',
                'message': 'Invoice not found or unauthorized'
            }), 404
        
        return jsonify({
            'status': 'success',
            'message': 'Invoice deleted successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete invoice: {str(e)}'
        }), 500

@invoice_bp.route('/download-pdf/<invoice_number>', methods=['GET'])
@jwt_required()
def download_invoice_pdf(invoice_number):
    """
    Download invoice as PDF
    
    Args:
        invoice_number: Invoice number to download
    
    Returns:
        PDF file for download
    """
    try:
        current_user = get_jwt_identity()
        db = get_db()
        invoices_collection = db['invoices']
        
        # Get invoice
        invoice = invoices_collection.find_one({
            'invoice_number': invoice_number,
            'created_by': current_user
        })
        
        if not invoice:
            return jsonify({
                'status': 'error',
                'message': 'Invoice not found'
            }), 404
        
        # Generate PDF
        pdf_generator = PDFGenerator()
        pdf_buffer = pdf_generator.generate_invoice_pdf(invoice)
        
        # Send file
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{invoice_number}.pdf'
        )
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to generate PDF: {str(e)}'
        }), 500

@invoice_bp.route('/search', methods=['POST'])
@jwt_required()
def search_invoices():
    """
    Search invoices by customer name or invoice number
    
    Expected JSON:
    {
        "search_term": "John",
        "search_type": "customer" or "invoice_number"
    }
    
    Returns:
        JSON: List of matching invoices
    """
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'search_term' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Search term is required'
            }), 400
        
        search_term = data.get('search_term', '').strip()
        search_type = data.get('search_type', 'customer')
        
        if not search_term:
            return jsonify({
                'status': 'error',
                'message': 'Search term cannot be empty'
            }), 400
        
        db = get_db()
        invoices_collection = db['invoices']
        
        # Build query
        query = {'created_by': current_user}
        
        if search_type == 'invoice_number':
            query['invoice_number'] = {'$regex': search_term, '$options': 'i'}
        else:  # customer
            query['customer_details.name'] = {'$regex': search_term, '$options': 'i'}
        
        # Find invoices
        invoices = list(invoices_collection.find(query).sort('created_at', -1))
        
        # Convert ObjectId to string
        for invoice in invoices:
            invoice['_id'] = str(invoice['_id'])
        
        return jsonify({
            'status': 'success',
            'invoices': invoices,
            'count': len(invoices)
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to search invoices: {str(e)}'
        }), 500