from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
import os
from dotenv import load_dotenv

load_dotenv()

def create_app(config_name=None):
    """Application factory function"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'status': 'error',
            'message': 'Invalid token'
        }), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({
            'status': 'error',
            'message': 'Token has expired'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'status': 'error',
            'message': 'Authorization header is missing'
        }), 401
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.inventory_routes import inventory_bp
    from routes.sales_routes import sales_bp
    from routes.invoice_routes import invoice_bp
    from routes.analytics_routes import analytics_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(sales_bp)
    app.register_blueprint(invoice_bp)
    app.register_blueprint(analytics_bp)
    
    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'success',
            'message': 'Smart Warehouse API is running'
        }), 200
    
    # Root route
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'status': 'success',
            'message': 'Smart Warehouse and Invoice Management System API',
            'version': '3.0.0',
            'description': 'Complete warehouse management with sales, invoicing, and analytics',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'inventory': '/api/inventory',
                'sales': '/api/sales',
                'invoice': '/api/invoice',
                'analytics': '/api/analytics'
            },
            'features': {
                'phase_1': 'Authentication & User Management',
                'phase_2': 'Inventory Management',
                'phase_3': 'Sales Management',
                'phase_4': 'Invoice Generation & Email',
                'phase_5': 'Reports & Analytics'
            }
        }), 200
    
    # API documentation route
    @app.route('/api/docs', methods=['GET'])
    def api_docs():
        docs = {
            'status': 'success',
            'message': 'Smart Warehouse API Documentation',
            'endpoints': {
                'authentication': {
                    'POST /api/auth/register': 'Register new user',
                    'POST /api/auth/login': 'Login user',
                    'POST /api/auth/logout': 'Logout user',
                    'GET /api/auth/profile': 'Get user profile',
                    'PUT /api/auth/profile': 'Update user profile',
                    'PUT /api/auth/change-password': 'Change password'
                },
                'inventory': {
                    'GET /api/inventory/products': 'Get all products',
                    'POST /api/inventory/products': 'Create product',
                    'GET /api/inventory/products/:id': 'Get single product',
                    'PUT /api/inventory/products/:id': 'Update product',
                    'DELETE /api/inventory/products/:id': 'Delete product',
                    'GET /api/inventory/categories': 'Get all categories',
                    'POST /api/inventory/categories': 'Create category',
                    'GET /api/inventory/products/:id/stock-history': 'Get stock history',
                    'GET /api/inventory/low-stock': 'Get low stock items'
                },
                'sales': {
                    'GET /api/sales/customers': 'Get all customers',
                    'POST /api/sales/customers': 'Create customer',
                    'GET /api/sales/customers/:id': 'Get customer',
                    'PUT /api/sales/customers/:id': 'Update customer',
                    'DELETE /api/sales/customers/:id': 'Delete customer',
                    'GET /api/sales/orders': 'Get all orders',
                    'POST /api/sales/orders': 'Create order (auto-generates invoice)',
                    'GET /api/sales/orders/:id': 'Get order',
                    'GET /api/sales/orders/:id/with-invoice': 'Get order with invoice',
                    'PUT /api/sales/orders/:id/status': 'Update order status',
                    'PUT /api/sales/orders/:id/payment': 'Update payment status',
                    'POST /api/sales/orders/:id/cancel': 'Cancel order',
                    'DELETE /api/sales/orders/:id': 'Delete order',
                    'POST /api/sales/orders/:id/generate-invoice': 'Generate invoice',
                    'POST /api/sales/orders/generate-invoices-batch': 'Generate bulk invoices',
                    'GET /api/sales/statistics': 'Get sales statistics'
                },
                'invoice': {
                    'GET /api/invoice': 'Get all invoices',
                    'GET /api/invoice/:id': 'Get invoice',
                    'POST /api/invoice/from-order/:id': 'Create from order',
                    'PUT /api/invoice/:id/status': 'Update status',
                    'PUT /api/invoice/:id/payment': 'Update payment status',
                    'PUT /api/invoice/:id/due-date': 'Set due date',
                    'DELETE /api/invoice/:id': 'Delete invoice',
                    'GET /api/invoice/customer/:id': 'Get customer invoices',
                    'GET /api/invoice/:id/view-data': 'Get invoice for viewing',
                    'POST /api/invoice/:id/send-notification': 'Send email notification',
                    'POST /api/invoice/bulk-send-notification': 'Send bulk notifications',
                    'GET /api/invoice/statistics': 'Get invoice statistics'
                },
                'analytics': {
                    'GET /api/analytics/dashboard-summary': 'Dashboard summary',
                    'GET /api/analytics/sales-by-period': 'Sales data',
                    'GET /api/analytics/top-products': 'Top products',
                    'GET /api/analytics/top-customers': 'Top customers',
                    'GET /api/analytics/sales-by-customer': 'Sales breakdown',
                    'GET /api/analytics/inventory-by-category': 'Inventory value',
                    'GET /api/analytics/low-stock-alerts': 'Low stock items',
                    'GET /api/analytics/inventory-turnover': 'Inventory turnover',
                    'GET /api/analytics/invoice-payment-breakdown': 'Invoice breakdown',
                    'GET /api/analytics/overdue-invoices': 'Overdue invoices',
                    'GET /api/analytics/monthly-comparison': 'Month comparison'
                }
            },
            'query_parameters': {
                'pagination': {
                    'page': 'Page number (default: 1)',
                    'per_page': 'Items per page (default: 10, max: 100)'
                },
                'filtering': {
                    'search': 'Search term',
                    'status': 'Filter by status',
                    'customer_id': 'Filter by customer',
                    'category_id': 'Filter by category'
                },
                'analytics': {
                    'period_days': 'Number of days to look back (default: 30)',
                    'limit': 'Limit results (default: 10)'
                }
            },
            'authentication': {
                'method': 'Bearer Token (JWT)',
                'header': 'Authorization: Bearer {token}',
                'token_expiry': '24 hours'
            }
        }
        return jsonify(docs), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'status': 'error',
            'message': 'Resource not found'
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'status': 'error',
            'message': 'Method not allowed'
        }), 405
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'status': 'error',
            'message': 'Forbidden - You do not have access to this resource'
        }), 403
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    print(f"""
    ╔════════════════════════════════════════════════════════════╗
    ║    Smart Warehouse Management System - API Server         ║
    ║    Version: 3.0.0                                         ║
    ╠════════════════════════════════════════════════════════════╣
    ║    🚀 Starting Server...                                   ║
    ║    📍 URL: http://0.0.0.0:{port}                          ║
    ║    📚 Documentation: http://localhost:{port}/api/docs     ║
    ║    ❤️  Health Check: http://localhost:{port}/api/health   ║
    ║                                                            ║
    ║    Features:                                              ║
    ║    ✅ Authentication & User Management                    ║
    ║    ✅ Inventory Management                                ║
    ║    ✅ Sales Management                                    ║
    ║    ✅ Invoice Generation & Email                          ║
    ║    ✅ Reports & Analytics                                 ║
    ║                                                            ║
    ║    Press CTRL+C to stop the server                        ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    app.run(debug=debug, host='0.0.0.0', port=port)