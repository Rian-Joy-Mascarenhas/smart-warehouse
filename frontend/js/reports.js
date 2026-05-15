/**
 * Reports & Analytics Module
 * Handles data visualization and analytics
 */

class ReportsManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.charts = {};
        this.allSalesData = [];
        this.allProductsData = [];
        this.initialize();
    }

    /**
     * Initialize reports and load data
     */
    async initialize() {
        try {
            // Set default date range (last 12 months)
            this.setDefaultDateRange();
            
            // Load all data
            await this.loadSalesData();
            await this.loadInventoryData();
            
            // Initialize charts
            this.initializeCharts();
            
            // Update summary stats
            this.updateSummaryStats();
            
            // Load product analytics
            await this.loadProductAnalytics();
        } catch (error) {
            console.error('Initialize reports error:', error);
            this.showAlert('error', 'Failed to load reports data');
        }
    }

    /**
     * Set default date range (last 12 months)
     */
    setDefaultDateRange() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);

        document.getElementById('startDate').valueAsDate = startDate;
        document.getElementById('endDate').valueAsDate = endDate;
    }

    /**
     * Load sales data from API
     */
    async loadSalesData() {
        try {
            const response = await fetch(`${this.apiUrl}/sales/orders?per_page=1000`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.allSalesData = data.data.orders || [];
            }
        } catch (error) {
            console.error('Load sales data error:', error);
            this.allSalesData = [];
        }
    }

    /**
     * Load inventory data from API
     */
    async loadInventoryData() {
        try {
            const response = await fetch(`${this.apiUrl}/inventory/products?per_page=1000`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.allProductsData = data.data.products || [];
                document.getElementById('totalProducts').textContent = this.allProductsData.length;
            }
        } catch (error) {
            console.error('Load inventory data error:', error);
            this.allProductsData = [];
        }
    }

    /**
     * Initialize all charts
     */
    initializeCharts() {
        this.initializeSalesChart();
        this.initializeInventoryChart();
        this.initializeStatusChart();
        this.initializePaymentChart();
    }

    /**
     * Initialize monthly sales chart
     */
    initializeSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        const monthlyData = this.calculateMonthlySales();

        this.charts.sales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Monthly Sales (₹)',
                    data: monthlyData.data,
                    backgroundColor: [
                        'rgba(168, 85, 247, 0.6)',
                        'rgba(168, 85, 247, 0.5)',
                        'rgba(168, 85, 247, 0.4)',
                        'rgba(6, 182, 212, 0.6)',
                        'rgba(6, 182, 212, 0.5)',
                        'rgba(6, 182, 212, 0.4)',
                        'rgba(236, 72, 153, 0.6)',
                        'rgba(236, 72, 153, 0.5)',
                        'rgba(236, 72, 153, 0.4)',
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(59, 130, 246, 0.5)',
                        'rgba(59, 130, 246, 0.4)',
                    ],
                    borderColor: [
                        'rgba(168, 85, 247, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(59, 130, 246, 1)',
                    ],
                    borderWidth: 1.5,
                    borderRadius: 8,
                    hoverBackgroundColor: 'rgba(168, 85, 247, 0.8)',
                    hoverBorderColor: 'rgba(168, 85, 247, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(226, 232, 240, 1)',
                            font: { family: "'Poppins', sans-serif", size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(168, 85, 247, 0.1)' },
                        ticks: { 
                            color: 'rgba(148, 163, 184, 1)',
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(148, 163, 184, 1)' }
                    }
                }
            }
        });
    }

    /**
     * Initialize inventory breakdown chart (pie chart)
     */
    initializeInventoryChart() {
        const ctx = document.getElementById('inventoryChart');
        if (!ctx) return;

        const categoryData = this.calculateInventoryByCategory();

        const colors = [
            'rgba(168, 85, 247, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(6, 182, 212, 0.6)',
        ];

        this.charts.inventory = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: colors.slice(0, categoryData.labels.length),
                    borderColor: 'rgba(15, 23, 42, 1)',
                    borderWidth: 2,
                    hoverBorderColor: 'rgba(168, 85, 247, 1)',
                    hoverBorderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(226, 232, 240, 1)',
                            font: { family: "'Poppins', sans-serif", size: 12 },
                            padding: 15,
                            usePointStyle: true,
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize order status chart
     */
    initializeStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const statusData = this.calculateOrderStatus();

        this.charts.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statusData.labels,
                datasets: [{
                    label: 'Number of Orders',
                    data: statusData.data,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(239, 68, 68, 0.7)',
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                    ],
                    borderWidth: 1.5,
                    borderRadius: 8,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(226, 232, 240, 1)',
                            font: { family: "'Poppins', sans-serif", size: 12 }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(168, 85, 247, 0.1)' },
                        ticks: { color: 'rgba(148, 163, 184, 1)' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: 'rgba(148, 163, 184, 1)' }
                    }
                }
            }
        });
    }

    /**
     * Initialize payment status chart
     */
    initializePaymentChart() {
        const ctx = document.getElementById('paymentChart');
        if (!ctx) return;

        const paymentData = this.calculatePaymentStatus();

        this.charts.payment = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: paymentData.labels,
                datasets: [{
                    data: paymentData.data,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                    ],
                    borderColor: 'rgba(15, 23, 42, 1)',
                    borderWidth: 2,
                    hoverBorderColor: 'rgba(168, 85, 247, 1)',
                    hoverBorderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(226, 232, 240, 1)',
                            font: { family: "'Poppins', sans-serif", size: 12 },
                            padding: 15,
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Calculate monthly sales data
     */
    calculateMonthlySales() {
        const monthlyData = {};
        const last12Months = [];

        // Generate last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
            monthlyData[monthKey] = 0;
            last12Months.push(monthKey);
        }

        // Add sales to corresponding months
        this.allSalesData.forEach(order => {
            if (order.payment_status === 'PAID') {
                const orderDate = new Date(order.created_at);
                const monthKey = orderDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
                if (monthKey in monthlyData) {
                    monthlyData[monthKey] += order.total_amount || 0;
                }
            }
        });

        return {
            labels: last12Months,
            data: last12Months.map(month => monthlyData[month])
        };
    }

    /**
     * Calculate inventory by category
     */
    calculateInventoryByCategory() {
        const categoryData = {};

        this.allProductsData.forEach(product => {
            const category = product.category_id || 'Uncategorized';
            if (!categoryData[category]) {
                categoryData[category] = 0;
            }
            categoryData[category]++;
        });

        return {
            labels: Object.keys(categoryData).map(key => {
                if (key === 'null') return 'Uncategorized';
                return key;
            }),
            data: Object.values(categoryData)
        };
    }

    /**
     * Calculate order status distribution
     */
    calculateOrderStatus() {
        const statusData = {
            'PENDING': 0,
            'CONFIRMED': 0,
            'SHIPPED': 0,
            'CANCELLED': 0,
            'DELIVERED': 0
        };

        this.allSalesData.forEach(order => {
            if (order.status in statusData) {
                statusData[order.status]++;
            }
        });

        return {
            labels: Object.keys(statusData),
            data: Object.values(statusData)
        };
    }

    /**
     * Calculate payment status distribution
     */
    calculatePaymentStatus() {
        const paymentData = {
            'PAID': 0,
            'PARTIAL': 0,
            'UNPAID': 0
        };

        this.allSalesData.forEach(order => {
            if (order.payment_status in paymentData) {
                paymentData[order.payment_status]++;
            }
        });

        return {
            labels: Object.keys(paymentData),
            data: Object.values(paymentData)
        };
    }

    /**
     * Update summary statistics
     */
    updateSummaryStats() {
        // Total sales
        const totalSales = this.allSalesData
            .filter(order => order.payment_status === 'PAID')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);
        document.getElementById('totalSalesValue').textContent = `₹${totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

        // Total orders
        const totalOrders = this.allSalesData.length;
        document.getElementById('totalOrdersValue').textContent = totalOrders;

        // Average order value
        const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
        document.getElementById('avgOrderValue').textContent = `₹${avgOrder.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }

    /**
     * Load product analytics
     */
    async loadProductAnalytics() {
        try {
            // Calculate highest and lowest selling products
            const productStats = this.calculateProductStats();

            if (productStats.highest) {
                document.getElementById('highestSelling').textContent = productStats.highest.name;
                document.getElementById('highestSellingDetails').textContent = 
                    `${productStats.highest.units} units sold | ₹${productStats.highest.revenue.toFixed(2)}`;
            }

            if (productStats.lowest) {
                document.getElementById('lowestSelling').textContent = productStats.lowest.name;
                document.getElementById('lowestSellingDetails').textContent = 
                    `${productStats.lowest.units} units sold | ₹${productStats.lowest.revenue.toFixed(2)}`;
            }

            // Display top products table
            this.displayTopProductsTable(productStats.topProducts);
            
            // Display low selling products table
            this.displayLowProductsTable(productStats.lowProducts);
        } catch (error) {
            console.error('Load product analytics error:', error);
        }
    }

    /**
     * Calculate product statistics
     */
    calculateProductStats() {
        const productStats = {};

        // Process all sales orders to count product sales
        this.allSalesData.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.product_id;
                    if (!productStats[productId]) {
                        const product = this.allProductsData.find(p => p._id === productId);
                        productStats[productId] = {
                            id: productId,
                            name: product ? product.name : 'Unknown Product',
                            sku: product ? product.sku : 'N/A',
                            units: 0,
                            revenue: 0,
                            quantity: product ? product.quantity : 0
                        };
                    }
                    productStats[productId].units += item.quantity || 0;
                    productStats[productId].revenue += (item.price * item.quantity) || 0;
                });
            }
        });

        const products = Object.values(productStats).sort((a, b) => b.units - a.units);

        return {
            highest: products.length > 0 ? products[0] : null,
            lowest: products.length > 0 ? products[products.length - 1] : null,
            topProducts: products.slice(0, 10),
            lowProducts: products.reverse().slice(0, 10)
        };
    }

    /**
     * Display top products table
     */
    displayTopProductsTable(products) {
        const tbody = document.getElementById('topProductsTableBody');
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No products found</td></tr>';
            return;
        }

        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="rank-badge">${index + 1}</span></td>
                <td><strong>${product.name}</strong></td>
                <td>${product.sku}</td>
                <td>${product.units}</td>
                <td>₹${product.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td>₹${(product.revenue / product.units).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Display low selling products table
     */
    displayLowProductsTable(products) {
        const tbody = document.getElementById('lowProductsTableBody');
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No products found</td></tr>';
            return;
        }

        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="rank-badge" style="background: linear-gradient(135deg, #ef4444, #dc2626);">${index + 1}</span></td>
                <td><strong>${product.name}</strong></td>
                <td>${product.sku}</td>
                <td>${product.units}</td>
                <td>₹${product.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td>${product.quantity} units</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Export chart as image
     */
    exportChartAsImage(chartId, filename) {
        const canvas = document.getElementById(chartId);
        if (!canvas) {
            this.showAlert('error', 'Chart not found');
            return;
        }

        const link = document.createElement('a');
        link.href = this.charts[chartId.replace('Chart', '')].canvas.toDataURL('image/png');
        link.download = filename;
        link.click();
        
        this.showAlert('success', 'Chart exported successfully');
    }

    /**
     * Generate PDF report
     */
    generatePDFReport() {
        const reportContent = `
            Smart Warehouse - Analytics Report
            Generated: ${new Date().toLocaleDateString('en-IN')}
            
            Monthly Sales Summary
            Total Sales: ₹${document.getElementById('totalSalesValue').textContent}
            Total Orders: ${document.getElementById('totalOrdersValue').textContent}
            Average Order Value: ${document.getElementById('avgOrderValue').textContent}
            
            Top Selling Product: ${document.getElementById('highestSelling').textContent}
            ${document.getElementById('highestSellingDetails').textContent}
            
            Lowest Selling Product: ${document.getElementById('lowestSelling').textContent}
            ${document.getElementById('lowestSellingDetails').textContent}
        `;

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
        element.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.showAlert('success', 'Report generated successfully');
    }

    /**
     * Apply date filter
     */
    applyDateFilter() {
        this.showAlert('info', 'Date filter applied - data will be filtered from next update');
        this.initialize();
    }

    /**
     * Reset date filter
     */
    resetDateFilter() {
        this.setDefaultDateRange();
        this.initialize();
    }

    /**
     * Show alert
     */
    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} show`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '80px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '400px';

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Initialize reports manager when DOM is loaded
let reportsManager;
document.addEventListener('DOMContentLoaded', () => {
    if (sessionManager.isAuthenticated()) {
        reportsManager = new ReportsManager();
    } else {
        window.location.href = 'login.html';
    }
});

// Global functions for HTML onclick handlers
function applyDateFilter() {
    if (reportsManager) reportsManager.applyDateFilter();
}

function resetDateFilter() {
    if (reportsManager) reportsManager.resetDateFilter();
}

function exportChartAsImage(chartId, filename) {
    if (reportsManager) reportsManager.exportChartAsImage(chartId, filename);
}

function generatePDFReport() {
    if (reportsManager) reportsManager.generatePDFReport();
}
