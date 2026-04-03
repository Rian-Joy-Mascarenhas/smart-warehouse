from datetime import datetime, timedelta
from bson.objectid import ObjectId
from utils.db_manager import DatabaseManager

class Analytics:
    """Analytics model for reports and business insights"""
    
    def __init__(self, user_id):
        """
        Initialize analytics manager for specific user
        
        Args:
            user_id (str): MongoDB ObjectId of user
        """
        self.user_id = user_id
        self.db = DatabaseManager.get_user_db(user_id)
        self.sales_orders_collection = self.db['sales_orders']
        self.invoices_collection = self.db['invoices']
        self.products_collection = self.db['products']
        self.customers_collection = self.db['customers']
        self.inventory_logs_collection = self.db['inventory_logs']

    # ===================== SALES ANALYTICS =====================

    def get_sales_by_period(self, period_days=30):
        """
        Get sales data for a period
        
        Args:
            period_days (int): Number of days to look back
        
        Returns:
            dict: Sales data organized by date
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            pipeline = [
                {'$match': {
                    'created_at': {'$gte': start_date},
                    'status': {'$ne': 'CANCELLED'}
                }},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
                    'total_sales': {'$sum': '$total_amount'},
                    'order_count': {'$sum': 1},
                    'avg_order_value': {'$avg': '$total_amount'}
                }},
                {'$sort': {'_id': 1}}
            ]
            
            results = list(self.sales_orders_collection.aggregate(pipeline))
            
            return {
                'period_days': period_days,
                'data': results,
                'total_sales': sum(r['total_sales'] for r in results),
                'total_orders': sum(r['order_count'] for r in results)
            }
        except Exception as e:
            print(f"Error getting sales by period: {str(e)}")
            return {}

    def get_top_products(self, limit=10):
        """Get top selling products"""
        try:
            pipeline = [
                {'$unwind': '$items'},
                {'$group': {
                    '_id': '$items.product_id',
                    'total_qty': {'$sum': '$items.quantity'},
                    'total_revenue': {'$sum': {'$multiply': ['$items.quantity', '$items.price']}},
                    'order_count': {'$sum': 1}
                }},
                {'$sort': {'total_revenue': -1}},
                {'$limit': limit}
            ]
            
            results = list(self.sales_orders_collection.aggregate(pipeline))
            
            # Get product details
            for result in results:
                product = self.products_collection.find_one({'_id': result['_id']})
                if product:
                    result['product_name'] = product['name']
                    result['product_sku'] = product['sku']
                result['_id'] = str(result['_id'])
            
            return results
        except Exception as e:
            print(f"Error getting top products: {str(e)}")
            return []

    def get_top_customers(self, limit=10):
        """Get top customers by spending"""
        try:
            pipeline = [
                {'$match': {'status': {'$ne': 'CANCELLED'}}},
                {'$group': {
                    '_id': '$customer_id',
                    'total_spent': {'$sum': '$total_amount'},
                    'order_count': {'$sum': 1},
                    'avg_order_value': {'$avg': '$total_amount'}
                }},
                {'$sort': {'total_spent': -1}},
                {'$limit': limit}
            ]
            
            results = list(self.sales_orders_collection.aggregate(pipeline))
            
            # Get customer details
            for result in results:
                customer = self.customers_collection.find_one({'_id': result['_id']})
                if customer:
                    result['customer_name'] = customer['name']
                    result['customer_email'] = customer['email']
                result['_id'] = str(result['_id'])
            
            return results
        except Exception as e:
            print(f"Error getting top customers: {str(e)}")
            return []

    def get_sales_by_customer(self):
        """Get sales breakdown by customer"""
        try:
            pipeline = [
                {'$match': {'status': {'$ne': 'CANCELLED'}}},
                {'$group': {
                    '_id': '$customer_id',
                    'total_sales': {'$sum': '$total_amount'},
                    'order_count': {'$sum': 1}
                }},
                {'$sort': {'total_sales': -1}}
            ]
            
            results = list(self.sales_orders_collection.aggregate(pipeline))
            
            # Get customer names
            for result in results:
                customer = self.customers_collection.find_one({'_id': result['_id']})
                if customer:
                    result['customer_name'] = customer['name']
                result['_id'] = str(result['_id'])
            
            return results
        except Exception as e:
            print(f"Error getting sales by customer: {str(e)}")
            return []

    # ===================== INVENTORY ANALYTICS =====================

    def get_inventory_value_by_category(self):
        """Get inventory value breakdown by category"""
        try:
            pipeline = [
                {'$match': {'is_active': True}},
                {'$group': {
                    '_id': '$category_id',
                    'total_value': {'$sum': {'$multiply': ['$quantity', '$price']}},
                    'total_quantity': {'$sum': '$quantity'},
                    'product_count': {'$sum': 1}
                }}
            ]
            
            results = list(self.products_collection.aggregate(pipeline))
            
            for result in results:
                result['_id'] = str(result['_id']) if result['_id'] else 'Uncategorized'
            
            return results
        except Exception as e:
            print(f"Error getting inventory by category: {str(e)}")
            return []

    def get_low_stock_alert_items(self):
        """Get products with low stock"""
        try:
            products = list(self.products_collection.find({
                'is_active': True,
                '$expr': {'$lt': ['$quantity', '$min_stock']}
            }).sort('quantity', 1))
            
            for product in products:
                product['_id'] = str(product['_id'])
                if product.get('category_id'):
                    product['category_id'] = str(product['category_id'])
            
            return products
        except Exception as e:
            print(f"Error getting low stock items: {str(e)}")
            return []

    def get_inventory_turnover(self, period_days=30):
        """Calculate inventory turnover rate"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get sales quantity by product
            pipeline = [
                {'$match': {'created_at': {'$gte': start_date}}},
                {'$unwind': '$items'},
                {'$group': {
                    '_id': '$items.product_id',
                    'sold_quantity': {'$sum': '$items.quantity'}
                }}
            ]
            
            sold_items = list(self.inventory_logs_collection.aggregate(pipeline))
            
            results = []
            for item in sold_items:
                product = self.products_collection.find_one({'_id': item['_id']})
                if product and product['quantity'] > 0:
                    turnover_rate = item['sold_quantity'] / product['quantity']
                    results.append({
                        'product_id': str(item['_id']),
                        'product_name': product['name'],
                        'sold_quantity': item['sold_quantity'],
                        'current_stock': product['quantity'],
                        'turnover_rate': round(turnover_rate, 2)
                    })
            
            return results
        except Exception as e:
            print(f"Error calculating inventory turnover: {str(e)}")
            return []

    # ===================== INVOICE ANALYTICS =====================

    def get_invoice_payment_breakdown(self):
        """Get invoice payment status breakdown"""
        try:
            pipeline = [
                {'$group': {
                    '_id': '$payment_status',
                    'count': {'$sum': 1},
                    'total_amount': {'$sum': '$total_amount'}
                }}
            ]
            
            results = list(self.invoices_collection.aggregate(pipeline))
            
            return results
        except Exception as e:
            print(f"Error getting invoice breakdown: {str(e)}")
            return []

    def get_overdue_invoices(self):
        """Get overdue invoices"""
        try:
            now = datetime.utcnow()
            
            invoices = list(self.invoices_collection.find({
                'due_date': {'$lt': now},
                'payment_status': {'$in': ['UNPAID', 'PARTIAL']}
            }).sort('due_date', 1))
            
            for invoice in invoices:
                invoice['_id'] = str(invoice['_id'])
                invoice['order_id'] = str(invoice['order_id'])
                invoice['customer_id'] = str(invoice['customer_id'])
                days_overdue = (now - invoice['due_date']).days
                invoice['days_overdue'] = days_overdue
            
            return invoices
        except Exception as e:
            print(f"Error getting overdue invoices: {str(e)}")
            return []

    # ===================== DASHBOARD SUMMARY =====================

    def get_dashboard_summary(self):
        """Get comprehensive dashboard summary"""
        try:
            # Sales summary
            sales_stats = self.get_sales_by_period(period_days=30)
            
            # Invoice summary
            invoices = list(self.invoices_collection.find({}))
            total_invoices = len(invoices)
            total_invoice_revenue = sum(inv.get('total_amount', 0) for inv in invoices)
            
            # Inventory summary
            products = list(self.products_collection.find({'is_active': True}))
            total_products = len(products)
            total_inventory_value = sum(p.get('quantity', 0) * p.get('price', 0) for p in products)
            low_stock = len([p for p in products if p.get('quantity', 0) < p.get('min_stock', 0)])
            
            # Customer summary
            customers = list(self.customers_collection.find({'is_active': True}))
            total_customers = len(customers)
            
            # Top performers
            top_products = self.get_top_products(limit=5)
            top_customers = self.get_top_customers(limit=5)
            
            return {
                'sales_summary': {
                    'total_sales': sales_stats.get('total_sales', 0),
                    'total_orders': sales_stats.get('total_orders', 0)
                },
                'invoice_summary': {
                    'total_invoices': total_invoices,
                    'total_revenue': total_invoice_revenue
                },
                'inventory_summary': {
                    'total_products': total_products,
                    'total_value': total_inventory_value,
                    'low_stock_items': low_stock
                },
                'customer_summary': {
                    'total_customers': total_customers
                },
                'top_products': top_products,
                'top_customers': top_customers
            }
        except Exception as e:
            print(f"Error getting dashboard summary: {str(e)}")
            return {}

    def get_monthly_comparison(self):
        """Get month-over-month comparison"""
        try:
            now = datetime.utcnow()
            current_month_start = now.replace(day=1)
            previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
            previous_month_end = current_month_start - timedelta(days=1)
            
            # Current month sales
            current_pipeline = [
                {'$match': {
                    'created_at': {'$gte': current_month_start},
                    'status': {'$ne': 'CANCELLED'}
                }},
                {'$group': {
                    '_id': None,
                    'total_sales': {'$sum': '$total_amount'},
                    'order_count': {'$sum': 1}
                }}
            ]
            
            current = list(self.sales_orders_collection.aggregate(current_pipeline))
            current_sales = current[0]['total_sales'] if current else 0
            current_orders = current[0]['order_count'] if current else 0
            
            # Previous month sales
            previous_pipeline = [
                {'$match': {
                    'created_at': {'$gte': previous_month_start, '$lte': previous_month_end},
                    'status': {'$ne': 'CANCELLED'}
                }},
                {'$group': {
                    '_id': None,
                    'total_sales': {'$sum': '$total_amount'},
                    'order_count': {'$sum': 1}
                }}
            ]
            
            previous = list(self.sales_orders_collection.aggregate(previous_pipeline))
            previous_sales = previous[0]['total_sales'] if previous else 0
            previous_orders = previous[0]['order_count'] if previous else 0
            
            # Calculate growth
            sales_growth = ((current_sales - previous_sales) / previous_sales * 100) if previous_sales > 0 else 0
            orders_growth = ((current_orders - previous_orders) / previous_orders * 100) if previous_orders > 0 else 0
            
            return {
                'current_month': {
                    'total_sales': current_sales,
                    'order_count': current_orders
                },
                'previous_month': {
                    'total_sales': previous_sales,
                    'order_count': previous_orders
                },
                'growth': {
                    'sales_growth_percent': round(sales_growth, 2),
                    'orders_growth_percent': round(orders_growth, 2)
                }
            }
        except Exception as e:
            print(f"Error getting monthly comparison: {str(e)}")
            return {}