from datetime import datetime
from bson.objectid import ObjectId
from utils.db_manager import DatabaseManager
import uuid
from models.invoice import Invoice

class Sales:
    """Sales model for database operations"""
    
    def __init__(self, user_id):
        """
        Initialize sales manager for specific user
        
        Args:
            user_id (str): MongoDB ObjectId of user
        """
        self.user_id = user_id
        self.db = DatabaseManager.get_user_db(user_id)
        self.sales_orders_collection = self.db['sales_orders']
        self.order_items_collection = self.db['order_items']
        self.customers_collection = self.db['customers']
        self.products_collection = self.db['products']

    # ===================== CUSTOMER OPERATIONS =====================

    def create_customer(self, name, email, phone, address, city, state, zip_code, country):
        """Create a new customer"""
        try:
            customer_data = {
                'name': name,
                'email': email,
                'phone': phone,
                'address': address,
                'city': city,
                'state': state,
                'zip_code': zip_code,
                'country': country,
                'total_orders': 0,
                'total_spent': 0.0,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'is_active': True
            }
            
            result = self.customers_collection.insert_one(customer_data)
            if result.inserted_id:
                customer_data['_id'] = str(result.inserted_id)
                return customer_data
            return None
        except Exception as e:
            print(f"Error creating customer: {str(e)}")
            return None

    def find_customer_by_id(self, customer_id):
        """Find customer by ID"""
        try:
            customer = self.customers_collection.find_one({'_id': ObjectId(customer_id)})
            if customer:
                customer['_id'] = str(customer['_id'])
            return customer
        except:
            return None

    def find_customer_by_email(self, email):
        """Find customer by email"""
        customer = self.customers_collection.find_one({'email': email})
        if customer:
            customer['_id'] = str(customer['_id'])
        return customer

    def get_all_customers(self, page=1, per_page=10, search=None):
        """Get all customers with pagination and filtering"""
        try:
            query = {'is_active': True}
            
            if search:
                query['$or'] = [
                    {'name': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}},
                    {'phone': {'$regex': search, '$options': 'i'}}
                ]
            
            total_count = self.customers_collection.count_documents(query)
            
            skip = (page - 1) * per_page
            customers = list(self.customers_collection.find(query)
                           .skip(skip)
                           .limit(per_page)
                           .sort('name', 1))
            
            for customer in customers:
                customer['_id'] = str(customer['_id'])
            
            return customers, total_count
        except Exception as e:
            print(f"Error getting customers: {str(e)}")
            return [], 0

    def update_customer(self, customer_id, update_data):
        """Update customer information"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.customers_collection.update_one(
                {'_id': ObjectId(customer_id)},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating customer: {str(e)}")
            return False

    def delete_customer(self, customer_id):
        """Soft delete customer"""
        try:
            result = self.customers_collection.update_one(
                {'_id': ObjectId(customer_id)},
                {'$set': {
                    'is_active': False,
                    'updated_at': datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error deleting customer: {str(e)}")
            return False

    def recalculate_customer_stats(self, customer_id):
        """
        Recalculate customer stats (total_orders and total_spent) from active orders
        
        Args:
            customer_id (str): Customer ObjectId
        
        Returns:
            dict: Updated customer data
        """
        try:
            # Get all active orders for this customer
            active_orders = list(self.sales_orders_collection.find({
                'customer_id': ObjectId(customer_id),
                'status': {'$ne': 'CANCELLED'}
            }))
            
            total_orders = len(active_orders)
            total_spent = sum(order.get('total_amount', 0) for order in active_orders)
            
            # Update customer
            self.customers_collection.update_one(
                {'_id': ObjectId(customer_id)},
                {'$set': {
                    'total_orders': total_orders,
                    'total_spent': total_spent,
                    'updated_at': datetime.utcnow()
                }}
            )
            
            return self.find_customer_by_id(customer_id)
        except Exception as e:
            print(f"Error recalculating customer stats: {str(e)}")
            return None

    # ===================== SALES ORDER OPERATIONS =====================

    def create_sales_order(self, customer_id, items, notes, created_by):
        """Create a new sales order"""
        try:
            # Generate order number
            order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            
            # Calculate totals
            total_amount = 0.0
            total_quantity = 0
            
            for item in items:
                total_amount += item['price'] * item['quantity']
                total_quantity += item['quantity']
            
            order_data = {
                'order_number': order_number,
                'customer_id': ObjectId(customer_id),
                'items': items,
                'total_quantity': total_quantity,
                'subtotal': total_amount,
                'tax_amount': round(total_amount * 0.1, 2),  # 10% tax
                'total_amount': round(total_amount * 1.1, 2),  # With tax
                'status': 'PENDING',  # PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
                'payment_status': 'UNPAID',  # UNPAID, PARTIAL, PAID
                'notes': notes,
                'created_by': ObjectId(created_by),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            result = self.sales_orders_collection.insert_one(order_data)
            
            if result.inserted_id:
                order_data['_id'] = str(result.inserted_id)
                order_data['customer_id'] = str(order_data['customer_id'])
                order_data['created_by'] = str(order_data['created_by'])
                
                # Update customer stats
                self.customers_collection.update_one(
                    {'_id': ObjectId(customer_id)},
                    {'$inc': {
                        'total_orders': 1,
                        'total_spent': order_data['total_amount']
                    }}
                )
                
                return order_data
            return None
        except Exception as e:
            print(f"Error creating sales order: {str(e)}")
            return None

    def find_order_by_id(self, order_id):
        """Find order by ID"""
        try:
            order = self.sales_orders_collection.find_one({'_id': ObjectId(order_id)})
            if order:
                order['_id'] = str(order['_id'])
                order['customer_id'] = str(order['customer_id'])
                order['created_by'] = str(order['created_by'])
            return order
        except:
            return None

    def find_order_by_number(self, order_number):
        """Find order by order number"""
        order = self.sales_orders_collection.find_one({'order_number': order_number})
        if order:
            order['_id'] = str(order['_id'])
            order['customer_id'] = str(order['customer_id'])
            order['created_by'] = str(order['created_by'])
        return order

    def get_all_orders(self, page=1, per_page=10, status=None, customer_id=None, search=None):
        """Get all sales orders with filtering"""
        try:
            query = {}
            
            if status:
                query['status'] = status
            
            if customer_id:
                query['customer_id'] = ObjectId(customer_id)
            
            if search:
                query['order_number'] = {'$regex': search, '$options': 'i'}
            
            total_count = self.sales_orders_collection.count_documents(query)
            
            skip = (page - 1) * per_page
            orders = list(self.sales_orders_collection.find(query)
                         .skip(skip)
                         .limit(per_page)
                         .sort('created_at', -1))
            
            for order in orders:
                order['_id'] = str(order['_id'])
                order['customer_id'] = str(order['customer_id'])
                order['created_by'] = str(order['created_by'])
            
            return orders, total_count
        except Exception as e:
            print(f"Error getting orders: {str(e)}")
            return [], 0

    def update_order_status(self, order_id, status):
        """Update order status"""
        try:
            valid_statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
            
            if status not in valid_statuses:
                return False
            
            result = self.sales_orders_collection.update_one(
                {'_id': ObjectId(order_id)},
                {'$set': {
                    'status': status,
                    'updated_at': datetime.utcnow()
                }}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating order status: {str(e)}")
            return False

    def update_payment_status(self, order_id, payment_status, amount_paid=None):
        """Update order payment status"""
        try:
            valid_statuses = ['UNPAID', 'PARTIAL', 'PAID']
            
            if payment_status not in valid_statuses:
                return False
            
            update_data = {
                'payment_status': payment_status,
                'updated_at': datetime.utcnow()
            }
            
            if amount_paid is not None:
                update_data['amount_paid'] = amount_paid
            
            result = self.sales_orders_collection.update_one(
                {'_id': ObjectId(order_id)},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating payment status: {str(e)}")
            return False

    def cancel_order(self, order_id, reason):
        """
        Cancel a sales order and recalculate customer stats
        
        Args:
            order_id (str): Order ObjectId
            reason (str): Cancellation reason
        
        Returns:
            bool: True if successful
        """
        try:
            order = self.find_order_by_id(order_id)
            
            if not order:
                return False
            
            customer_id = order['customer_id']
            
            # Update order status
            result = self.sales_orders_collection.update_one(
                {'_id': ObjectId(order_id)},
                {'$set': {
                    'status': 'CANCELLED',
                    'cancellation_reason': reason,
                    'cancelled_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }}
            )
            
            if result.modified_count > 0:
                # Recalculate customer stats
                self.recalculate_customer_stats(customer_id)
                return True
            
            return False
        except Exception as e:
            print(f"Error cancelling order: {str(e)}")
            return False

    def delete_order(self, order_id):
        """
        Delete an order and recalculate customer stats
        
        Args:
            order_id (str): Order ObjectId
        
        Returns:
            bool: True if successful
        """
        try:
            order = self.find_order_by_id(order_id)
            
            if not order:
                return False
            
            customer_id = order['customer_id']
            
            # Delete order
            result = self.sales_orders_collection.delete_one({'_id': ObjectId(order_id)})
            
            if result.deleted_count > 0:
                # Recalculate customer stats
                self.recalculate_customer_stats(customer_id)
                return True
            
            return False
        except Exception as e:
            print(f"Error deleting order: {str(e)}")
            return False

    def get_order_statistics(self):
        """Get sales statistics"""
        try:
            total_orders = self.sales_orders_collection.count_documents({})
            
            # Total revenue (paid orders)
            pipeline = [
                {'$match': {'payment_status': 'PAID'}},
                {'$group': {'_id': None, 'total_revenue': {'$sum': '$total_amount'}}}
            ]
            revenue_result = list(self.sales_orders_collection.aggregate(pipeline))
            total_revenue = revenue_result[0]['total_revenue'] if revenue_result else 0.0
            
            # Orders by status
            pipeline = [
                {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
            ]
            status_result = list(self.sales_orders_collection.aggregate(pipeline))
            orders_by_status = {item['_id']: item['count'] for item in status_result}
            
            # Pending orders
            pending_orders = self.sales_orders_collection.count_documents({'status': 'PENDING'})
            
            # Average order value
            pipeline = [
                {'$group': {'_id': None, 'avg_value': {'$avg': '$total_amount'}}}
            ]
            avg_result = list(self.sales_orders_collection.aggregate(pipeline))
            average_order_value = avg_result[0]['avg_value'] if avg_result else 0.0
            
            return {
                'total_orders': total_orders,
                'total_revenue': total_revenue,
                'average_order_value': round(average_order_value, 2),
                'pending_orders': pending_orders,
                'orders_by_status': orders_by_status
            }
        except Exception as e:
            print(f"Error getting statistics: {str(e)}")
            return {}

    def get_customer_orders(self, customer_id, limit=10):
        """Get all orders for a specific customer"""
        try:
            orders = list(self.sales_orders_collection.find(
                {'customer_id': ObjectId(customer_id)}
            ).sort('created_at', -1).limit(limit))
            
            for order in orders:
                order['_id'] = str(order['_id'])
                order['customer_id'] = str(order['customer_id'])
                order['created_by'] = str(order['created_by'])
            
            return orders
        except Exception as e:
            print(f"Error getting customer orders: {str(e)}")
            return []
        
    def create_sales_order_with_invoice(self, customer_id, items, notes, created_by):
        """
        Create a sales order and automatically generate invoice
        
        Args:
            customer_id (str): Customer ObjectId
            items (list): List of items
            notes (str): Order notes
            created_by (str): User ID creating order
        
        Returns:
            dict: Created order and invoice
        """
        try:
            # Create sales order first
            order = self.create_sales_order(customer_id, items, notes, created_by)
            
            if not order:
                return None
            
            # Automatically create invoice from order
            invoice_manager = Invoice(self.user_id)
            invoice = invoice_manager.create_invoice_from_order(order['_id'], created_by)
            
            if invoice:
                print(f"✓ Invoice {invoice['invoice_number']} created for Order {order['order_number']}")
                
                return {
                    'order': order,
                    'invoice': invoice,
                    'message': f'Order created and Invoice {invoice["invoice_number"]} generated automatically'
                }
            else:
                print(f"⚠ Order created but failed to generate invoice")
                return {
                    'order': order,
                    'invoice': None,
                    'message': 'Order created but invoice generation failed'
                }
        except Exception as e:
            print(f"Error creating order with invoice: {str(e)}")
            return None

    def get_order_with_invoice(self, order_id):
        """
        Get order and its associated invoice
        
        Args:
            order_id (str): Order ObjectId
        
        Returns:
            dict: Order and invoice data
        """
        try:
            order = self.find_order_by_id(order_id)
            
            if not order:
                return None
            
            # Get invoice for this order
            invoice_manager = Invoice(self.user_id)
            invoice = invoice_manager.find_invoice_by_order_id(order_id)
            
            return {
                'order': order,
                'invoice': invoice
            }
        except Exception as e:
            print(f"Error getting order with invoice: {str(e)}")
            return None