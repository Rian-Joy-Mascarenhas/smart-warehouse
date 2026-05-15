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
    
    # ===================== INVOICE OPERATIONS =====================
    
    def create_invoice(self, order_id, payment_method, notes='', created_by=None):
        """
        Create invoice from sales order
        
        Args:
            order_id (str): Sales order ID
            payment_method (str): Payment method (Cash, Credit Card, Bank Transfer, etc.)
            notes (str): Additional notes
            created_by (str): User ID creating invoice
        
        Returns:
            dict: Created invoice or None
        """
        try:
            # Generate invoice number
            invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4().hex[:6]).upper()}"
            
            invoice_data = {
                'invoice_number': invoice_number,
                'order_id': ObjectId(order_id),
                'payment_method': payment_method,
                'notes': notes,
                'created_by': ObjectId(created_by) if created_by else None,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'is_active': True
            }
            
            result = self.invoices_collection.insert_one(invoice_data)
            
            if result.inserted_id:
                invoice_data['_id'] = str(result.inserted_id)
                invoice_data['order_id'] = str(invoice_data['order_id'])
                if invoice_data['created_by']:
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
                if invoice.get('created_by'):
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
            if invoice.get('created_by'):
                invoice['created_by'] = str(invoice['created_by'])
        return invoice
    
    def find_invoice_by_order(self, order_id):
        """Find invoice by order ID"""
        try:
            invoice = self.invoices_collection.find_one({'order_id': ObjectId(order_id)})
            if invoice:
                invoice['_id'] = str(invoice['_id'])
                invoice['order_id'] = str(invoice['order_id'])
                if invoice.get('created_by'):
                    invoice['created_by'] = str(invoice['created_by'])
            return invoice
        except:
            return None
    
    def get_all_invoices(self, page=1, per_page=10, search=None):
        """Get all invoices with pagination and filtering"""
        try:
            query = {'is_active': True}
            
            if search:
                query['$or'] = [
                    {'invoice_number': {'$regex': search, '$options': 'i'}},
                    {'notes': {'$regex': search, '$options': 'i'}}
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
                if invoice.get('created_by'):
                    invoice['created_by'] = str(invoice['created_by'])
            
            return invoices, total_count
        except Exception as e:
            print(f"Error getting invoices: {str(e)}")
            return [], 0
    
    def update_invoice(self, invoice_id, update_data):
        """Update invoice information"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.invoices_collection.update_one(
                {'_id': ObjectId(invoice_id)},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating invoice: {str(e)}")
            return False
    
    def delete_invoice(self, invoice_id):
        """Soft delete invoice"""
        try:
            result = self.invoices_collection.update_one(
                {'_id': ObjectId(invoice_id)},
                {'$set': {
                    'is_active': False,
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
            total_invoices = self.invoices_collection.count_documents({'is_active': True})
            
            # Recent invoices
            recent_invoices = list(self.invoices_collection.find({'is_active': True})
                                 .sort('created_at', -1)
                                 .limit(5))
            
            return {
                'total_invoices': total_invoices,
                'recent_invoices': len(recent_invoices)
            }
        except Exception as e:
            print(f"Error getting statistics: {str(e)}")
            return {}