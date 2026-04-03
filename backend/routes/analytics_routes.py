from flask import Blueprint, request, jsonify
from models.analytics import Analytics
from utils.helpers import create_response
from middleware.auth_middleware import token_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# ===================== SALES ANALYTICS =====================

@analytics_bp.route('/sales-by-period', methods=['GET'])
@token_required
def get_sales_by_period(user_id):
    """Get sales data for a period"""
    try:
        period_days = request.args.get('period_days', 30, type=int)
        
        if period_days < 1 or period_days > 365:
            period_days = 30
        
        analytics = Analytics(user_id)
        data = analytics.get_sales_by_period(period_days)
        
        return create_response(
            'success',
            'Sales data retrieved successfully',
            data=data,
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@analytics_bp.route('/top-products', methods=['GET'])
@token_required
def get_top_products(user_id):
    """Get top selling products"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        if limit < 1 or limit > 50:
            limit = 10
        
        analytics = Analytics(user_id)
        products = analytics.get_top_products(limit)
        
        return create_response(
            'success',
            'Top products retrieved successfully',
            data={'products': products},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@analytics_bp.route('/top-customers', methods=['GET'])
@token_required
def get_top_customers(user_id):
    """Get top customers by spending"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        if limit < 1 or limit > 50:
            limit = 10
        
        analytics = Analytics(user_id)
        customers = analytics.get_top_customers(limit)
        
        return create_response(
            'success',
            'Top customers retrieved successfully',
            data={'customers': customers},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@analytics_bp.route('/sales-by-customer', methods=['GET'])
@token_required
def get_sales_by_customer(user_id):
    """Get sales breakdown by customer"""
    try:
        analytics = Analytics(user_id)
        data = analytics.get_sales_by_customer()
        
        return create_response(
            'success',
            'Sales by customer retrieved successfully',
            data={'data': data},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

# ===================== INVENTORY ANALYTICS =====================

@analytics_bp.route('/inventory-by-category', methods=['GET'])
@token_required
def get_inventory_by_category(user_id):
    """Get inventory value by category"""
    try:
        analytics = Analytics(user_id)
        data = analytics.get_inventory_value_by_category()
        
        return create_response(
            'success',
            'Inventory by category retrieved successfully',
            data={'data': data},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@analytics_bp.route('/low-stock-alerts', methods=['GET'])
@token_required
def get_low_stock_alerts(user_id):
    """Get low stock alert items"""
    try:
        analytics = Analytics(user_id)
        items = analytics.get_low_stock_alert_items()
        
        return create_response(
            'success',
            'Low stock items retrieved successfully',
            data={'items': items},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@analytics_bp.route('/inventory-turnover', methods=['GET'])
@token_required
def get_inventory_turnover(user_id):
    """Get inventory turnover rate"""
    try:
        period_days = request.args.get('period_days', 30, type=int)
        
        if period_days < 1 or period_days > 365:
            period_days = 30
        
        analytics = Analytics(user_id)
        data = analytics.get_inventory_turnover(period_days)
        
        return create_response(
            'success',
            'Inventory turnover retrieved successfully',
            data={'data': data},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

# ===================== INVOICE ANALYTICS =====================

@analytics_bp.route('/invoice-payment-breakdown', methods=['GET'])
@token_required
def get_invoice_payment_breakdown(user_id):
    """Get invoice payment status breakdown"""
    try:
        analytics = Analytics(user_id)
        data = analytics.get_invoice_payment_breakdown()
        
        return create_response(
            'success',
            'Invoice payment breakdown retrieved successfully',
            data={'data': data},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@analytics_bp.route('/overdue-invoices', methods=['GET'])
@token_required
def get_overdue_invoices(user_id):
    """Get overdue invoices"""
    try:
        analytics = Analytics(user_id)
        invoices = analytics.get_overdue_invoices()
        
        return create_response(
            'success',
            'Overdue invoices retrieved successfully',
            data={'invoices': invoices},
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

# ===================== DASHBOARD SUMMARY =====================

@analytics_bp.route('/dashboard-summary', methods=['GET'])
@token_required
def get_dashboard_summary(user_id):
    """Get comprehensive dashboard summary"""
    try:
        analytics = Analytics(user_id)
        data = analytics.get_dashboard_summary()
        
        return create_response(
            'success',
            'Dashboard summary retrieved successfully',
            data=data,
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)

@analytics_bp.route('/monthly-comparison', methods=['GET'])
@token_required
def get_monthly_comparison(user_id):
    """Get month-over-month comparison"""
    try:
        analytics = Analytics(user_id)
        data = analytics.get_monthly_comparison()
        
        return create_response(
            'success',
            'Monthly comparison retrieved successfully',
            data=data,
            status_code=200
        )
    except Exception as e:
        return create_response('error', f'Server error: {str(e)}', status_code=500)