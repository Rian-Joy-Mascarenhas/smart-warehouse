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
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(sales_bp)
    
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
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'inventory': '/api/inventory',
                'sales': '/api/sales'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'status': 'error',
            'message': 'Resource not found'
        }), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)