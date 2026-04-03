from datetime import datetime
from bson.objectid import ObjectId
from utils.db_manager import DatabaseManager
import uuid

class Invoice:
    """Invoice model for database operations"""
    
    def __init__(self, user_id):
        """
        Initialize invoice manager for specific user
        
        Args:
            user_id (str): MongoDB ObjectId of user
        """
        self.user_id = user_id
        self.db = DatabaseManager.get_user_db(user_id)
        self.invoices_collection = self.db['invoices']
        self.sales_orders_collection = self.db['sales_orders']
        self.customers_collection = self.db['customers']
        self.products_collection = self.db['products']

    # ===================== INVOICE OPERATIONS =====================

    def create_invoice_from_order(self, order_id, created_by):
        """
        Create an invoice from a sales order
        
        Args:
            order_id (str): Sales Order ObjectId
            created_by (str): User ID creating invoice
        
        Returns:
            dict: Created invoice or None
        """
        try:
            # Get the order
            order = self.sales_orders_collection.find_one({'_id': ObjectId(order_id)})
            
            if not order:
                return None
            
            # Check if invoice already exists for this order
            existing = self.invoices_collection.find_one({'order_id': ObjectId(order_id)})
            if existing:
                return None
            
            # Generate invoice number
            invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
            
            # Get customer details
            customer = self.customers_collection.find_one({'_id': order['customer_id']})
            
            invoice_data = {
                'invoice_number': invoice_number,
                'order_id': ObjectId(order_id),
                'customer_id': order['customer_id'],
                'customer_name': customer['name'] if customer else 'N/A',
                'customer_email': customer['email'] if customer else 'N/A',
                'customer_phone': customer['phone'] if customer else 'N/A',
                'customer_address': customer['address'] if customer else 'N/A',
                'customer_city': customer['city'] if customer else 'N/A',
                'customer_state': customer['state'] if customer else 'N/A',
                'customer_zip': customer['zip_code'] if customer else 'N/A',
                'customer_country': customer['country'] if customer else 'N/A',
                'items': order['items'],
                'subtotal': order['subtotal'],
                'tax_amount': order['tax_amount'],
                'total_amount': order['total_amount'],
                'status': 'DRAFT',  # DRAFT, SENT, PAID, OVERDUE, CANCELLED
                'payment_status': 'UNPAID',  # UNPAID, PARTIAL, PAID
                'due_date': None,
                'paid_date': None,
                'notes': order.get('notes', ''),
                'created_by': ObjectId(created_by),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            result = self.invoices_collection.insert_one(invoice_data)
            
            if result.inserted_id:
                invoice_data['_id'] = str(result.inserted_id)
                invoice_data['order_id'] = str(invoice_data['order_id'])
                invoice_data['customer_id'] = str(invoice_data['customer_id'])
                invoice_data['created_by'] = str(invoice_data['created_by'])
                return invoice_data
            
            return None
        except Exception as e:
            print(f"Error creating invoice: {str(e)}")
            return None

    def find_invoice_by_id(self, invoice_id):
        """Find invoice by ID"""
        try:
            invoice = self.invoices_collection.find_one({'_id': ObjectId(invoice_id)})
            if invoice:
                invoice['_id'] = str(invoice['_id'])
                invoice['order_id'] = str(invoice['order_id'])
                invoice['customer_id'] = str(invoice['customer_id'])
                invoice['created_by'] = str(invoice['created_by'])
            return invoice
        except:
            return None

    def find_invoice_by_number(self, invoice_number):
        """Find invoice by invoice number"""
        invoice = self.invoices_collection.find_one({'invoice_number': invoice_number})
        if invoice:
            invoice['_id'] = str(invoice['_id'])
            invoice['order_id'] = str(invoice['order_id'])
            invoice['customer_id'] = str(invoice['customer_id'])
            invoice['created_by'] = str(invoice['created_by'])
        return invoice

    def find_invoice_by_order_id(self, order_id):
        """Find invoice by order ID"""
        invoice = self.invoices_collection.find_one({'order_id': ObjectId(order_id)})
        if invoice:
            invoice['_id'] = str(invoice['_id'])
            invoice['order_id'] = str(invoice['order_id'])
            invoice['customer_id'] = str(invoice['customer_id'])
            invoice['created_by'] = str(invoice['created_by'])
        return invoice

    def get_all_invoices(self, page=1, per_page=10, status=None, customer_id=None, search=None):
        """Get all invoices with filtering"""
        try:
            query = {}
            
            if status:
                query['status'] = status
            
            if customer_id:
                query['customer_id'] = ObjectId(customer_id)
            
            if search:
                query['$or'] = [
                    {'invoice_number': {'$regex': search, '$options': 'i'}},
                    {'customer_name': {'$regex': search, '$options': 'i'}}
                ]
            
            total_count = self.invoices_collection.count_documents(query)
            
            skip = (page - 1) * per_page
            invoices = list(self.invoices_collection.find(query)
                           .skip(skip)
                           .limit(per_page)
                           .sort('created_at', -1))
            
            for invoice in invoices:
                invoice['_id'] = str(invoice['_id'])
                invoice['order_id'] = str(invoice['order_id'])
                invoice['customer_id'] = str(invoice['customer_id'])
                invoice['created_by'] = str(invoice['created_by'])
            
            return invoices, total_count
        except Exception as e:
            print(f"Error getting invoices: {str(e)}")
            return [], 0

    def update_invoice_status(self, invoice_id, status):
        """Update invoice status"""
        try:
            valid_statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']
            
            if status not in valid_statuses:
                return False
            
            result = self.invoices_collection.update_one(
                {'_id': ObjectId(invoice_id)},
                {'$set': {
                    'status': status,
                    'updated_at': datetime.utcnow()
                }}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating invoice status: {str(e)}")
            return False

    def update_invoice_payment_status(self, invoice_id, payment_status):
        """Update invoice payment status"""
        try:
            valid_statuses = ['UNPAID', 'PARTIAL', 'PAID']
            
            if payment_status not in valid_statuses:
                return False
            
            update_data = {
                'payment_status': payment_status,
                'updated_at': datetime.utcnow()
            }
            
            if payment_status == 'PAID':
                update_data['paid_date'] = datetime.utcnow()
            
            result = self.invoices_collection.update_one(
                {'_id': ObjectId(invoice_id)},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating invoice payment status: {str(e)}")
            return False

    def set_invoice_due_date(self, invoice_id, due_date):
        """Set invoice due date"""
        try:
            result = self.invoices_collection.update_one(
                {'_id': ObjectId(invoice_id)},
                {'$set': {
                    'due_date': due_date,
                    'updated_at': datetime.utcnow()
                }}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error setting due date: {str(e)}")
            return False

    def delete_invoice(self, invoice_id):
        """Delete an invoice (soft delete)"""
        try:
            result = self.invoices_collection.update_one(
                {'_id': ObjectId(invoice_id)},
                {'$set': {
                    'status': 'CANCELLED',
                    'updated_at': datetime.utcnow()
                }}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error deleting invoice: {str(e)}")
            return False

    def get_invoice_statistics(self):
        """Get invoice statistics"""
        try:
            total_invoices = self.invoices_collection.count_documents({})
            
            # Total revenue (paid invoices)
            pipeline = [
                {'$match': {'payment_status': 'PAID'}},
                {'$group': {'_id': None, 'total_revenue': {'$sum': '$total_amount'}}}
            ]
            revenue_result = list(self.invoices_collection.aggregate(pipeline))
            total_revenue = revenue_result[0]['total_revenue'] if revenue_result else 0.0
            
            # Unpaid invoices
            unpaid_count = self.invoices_collection.count_documents({'payment_status': {'$in': ['UNPAID', 'PARTIAL']}})
            
            # Average invoice value
            pipeline = [
                {'$group': {'_id': None, 'avg_value': {'$avg': '$total_amount'}}}
            ]
            avg_result = list(self.invoices_collection.aggregate(pipeline))
            average_invoice_value = avg_result[0]['avg_value'] if avg_result else 0.0
            
            # Invoices by status
            pipeline = [
                {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
            ]
            status_result = list(self.invoices_collection.aggregate(pipeline))
            invoices_by_status = {item['_id']: item['count'] for item in status_result}
            
            return {
                'total_invoices': total_invoices,
                'total_revenue': total_revenue,
                'average_invoice_value': round(average_invoice_value, 2),
                'unpaid_invoices': unpaid_count,
                'invoices_by_status': invoices_by_status
            }
        except Exception as e:
            print(f"Error getting statistics: {str(e)}")
            return {}

    def get_customer_invoices(self, customer_id, limit=10):
        """Get all invoices for a specific customer"""
        try:
            invoices = list(self.invoices_collection.find(
                {'customer_id': ObjectId(customer_id)}
            ).sort('created_at', -1).limit(limit))
            
            for invoice in invoices:
                invoice['_id'] = str(invoice['_id'])
                invoice['order_id'] = str(invoice['order_id'])
                invoice['customer_id'] = str(invoice['customer_id'])
                invoice['created_by'] = str(invoice['created_by'])
            
            return invoices
        except Exception as e:
            print(f"Error getting customer invoices: {str(e)}")
            return []