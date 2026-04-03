/**
 * Analytics & Reports Module
 * Handles analytics operations and API calls
 */

class AnalyticsManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Period selector
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => this.handlePeriodChange(e));
        }
    }

    /**
     * Load dashboard summary
     */
    async loadDashboardSummary() {
        try {
            const response = await fetch(`${this.apiUrl}/analytics/dashboard-summary`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayDashboardSummary(data.data);
            }
        } catch (error) {
            console.error('Load dashboard error:', error);
        }
    }

    /**
     * Display dashboard summary
     */
    displayDashboardSummary(data) {
        // Sales summary
        if (document.getElementById('dashSalesTotal')) {
            document.getElementById('dashSalesTotal').textContent = `$${data.sales_summary.total_sales.toFixed(2)}`;
        }
        if (document.getElementById('dashOrdersCount')) {
            document.getElementById('dashOrdersCount').textContent = data.sales_summary.total_orders;
        }

        // Invoice summary
        if (document.getElementById('dashInvoicesTotalCount')) {
            document.getElementById('dashInvoicesTotalCount').textContent = data.invoice_summary.total_invoices;
        }
        if (document.getElementById('dashInvoicesRevenue')) {
            document.getElementById('dashInvoicesRevenue').textContent = `$${data.invoice_summary.total_revenue.toFixed(2)}`;
        }

        // Inventory summary
        if (document.getElementById('dashProductsCount')) {
            document.getElementById('dashProductsCount').textContent = data.inventory_summary.total_products;
        }
        if (document.getElementById('dashInventoryValue')) {
            document.getElementById('dashInventoryValue').textContent = `$${data.inventory_summary.total_value.toFixed(2)}`;
        }
        if (document.getElementById('dashLowStockCount')) {
            document.getElementById('dashLowStockCount').textContent = data.inventory_summary.low_stock_items;
        }

        // Customers summary
        if (document.getElementById('dashCustomersCount')) {
            document.getElementById('dashCustomersCount').textContent = data.customer_summary.total_customers;
        }

        // Top products
        this.displayTopProducts(data.top_products);

        // Top customers
        this.displayTopCustomers(data.top_customers);
    }

    /**
     * Display top products
     */
    displayTopProducts(products) {
        const tbody = document.querySelector('#topProductsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">No data available</td></tr>';
            return;
        }

        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${product.product_name}</td>
                <td>${product.total_qty}</td>
                <td>$${product.total_revenue.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Display top customers
     */
    displayTopCustomers(customers) {
        const tbody = document.querySelector('#topCustomersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">No data available</td></tr>';
            return;
        }

        customers.forEach((customer, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${customer.customer_name}</td>
                <td>${customer.order_count}</td>
                <td>$${customer.total_spent.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Load sales by period
     */
    async loadSalesByPeriod(periodDays = 30) {
        try {
            const response = await fetch(`${this.apiUrl}/analytics/sales-by-period?period_days=${periodDays}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displaySalesByPeriod(data.data);
            }
        } catch (error) {
            console.error('Load sales by period error:', error);
        }
    }

    /**
     * Display sales by period
     */
    displaySalesByPeriod(data) {
        const tbody = document.querySelector('#salesByPeriodTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">No data available</td></tr>';
            return;
        }

        data.data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item._id}</td>
                <td>${item.order_count}</td>
                <td>$${item.total_sales.toFixed(2)}</td>
                <td>$${item.avg_order_value.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Load inventory by category
     */
    async loadInventoryByCategory() {
        try {
            const response = await fetch(`${this.apiUrl}/analytics/inventory-by-category`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayInventoryByCategory(data.data.data);
            }
        } catch (error) {
            console.error('Load inventory by category error:', error);
        }
    }

    /**
     * Display inventory by category
     */
    displayInventoryByCategory(data) {
        const tbody = document.querySelector('#inventoryByCategoryTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">No data available</td></tr>';
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item._id}</td>
                <td>${item.product_count}</td>
                <td>${item.total_quantity}</td>
                <td>$${item.total_value.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Load low stock alerts
     */
    async loadLowStockAlerts() {
        try {
            const response = await fetch(`${this.apiUrl}/analytics/low-stock-alerts`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayLowStockAlerts(data.data.items);
            }
        } catch (error) {
            console.error('Load low stock alerts error:', error);
        }
    }

    /**
     * Display low stock alerts
     */
    displayLowStockAlerts(items) {
        const tbody = document.querySelector('#lowStockAlertsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem;">No low stock items</td></tr>';
            return;
        }

        items.forEach(item => {
            const row = document.createElement('tr');
            row.style.backgroundColor = '#fff3cd';
            row.innerHTML = `
                <td>${item.sku}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.min_stock}</td>
                <td>${item.quantity - item.min_stock}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Load monthly comparison
     */
    async loadMonthlyComparison() {
        try {
            const response = await fetch(`${this.apiUrl}/analytics/monthly-comparison`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayMonthlyComparison(data.data);
            }
        } catch (error) {
            console.error('Load monthly comparison error:', error);
        }
    }

    /**
     * Display monthly comparison
     */
    displayMonthlyComparison(data) {
        const container = document.getElementById('monthlyComparisonContainer');
        if (!container) return;

        const current = data.current_month;
        const previous = data.previous_month;
        const growth = data.growth;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px;">
                    <h4>Current Month</h4>
                    <p><strong>Sales:</strong> $${current.total_sales.toFixed(2)}</p>
                    <p><strong>Orders:</strong> ${current.order_count}</p>
                </div>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px;">
                    <h4>Previous Month</h4>
                    <p><strong>Sales:</strong> $${previous.total_sales.toFixed(2)}</p>
                    <p><strong>Orders:</strong> ${previous.order_count}</p>
                </div>
            </div>
            <div style="background: #d4edda; padding: 1rem; border-radius: 4px; margin-top: 1rem;">
                <h4>Growth</h4>
                <p><strong>Sales Growth:</strong> <span style="color: ${growth.sales_growth_percent >= 0 ? '#27ae60' : '#e74c3c'}">${growth.sales_growth_percent >= 0 ? '+' : ''}${growth.sales_growth_percent}%</span></p>
                <p><strong>Orders Growth:</strong> <span style="color: ${growth.orders_growth_percent >= 0 ? '#27ae60' : '#e74c3c'}">${growth.orders_growth_percent >= 0 ? '+' : ''}${growth.orders_growth_percent}%</span></p>
            </div>
        `;
    }

    /**
     * Handle period change
     */
    handlePeriodChange(e) {
        const periodDays = e.target.value;
        this.loadSalesByPeriod(periodDays);
    }
}

// Initialize on DOM load
let analyticsManager;
document.addEventListener('DOMContentLoaded', () => {
    if (sessionManager.isAuthenticated()) {
        analyticsManager = new AnalyticsManager();
        analyticsManager.loadDashboardSummary();
        analyticsManager.loadSalesByPeriod();
        analyticsManager.loadInventoryByCategory();
        analyticsManager.loadLowStockAlerts();
        analyticsManager.loadMonthlyComparison();
    } else {
        window.location.href = 'login.html';
    }
});