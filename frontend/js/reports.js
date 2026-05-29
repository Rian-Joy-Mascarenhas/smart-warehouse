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
        this.categoriesMap = {};
        this.initialize();
    }

    /**
     * Initialize reports and load data
     */
    async initialize() {
        try {
            // Load categories first
            await this.loadCategories();
            
            // Load all data
            await this.loadSalesData();
            await this.loadInventoryData();
            
            // Initialize charts
            this.initializeCharts();
            
            // Load product analytics (top and least selling)
            await this.loadProductAnalytics();
        } catch (error) {
            console.error('Initialize reports error:', error);
            this.showAlert('error', 'Failed to load reports data');
        }
    }

    /**
     * Load categories from API
     */
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiUrl}/inventory/categories`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const categories = data.data.categories || [];
                
                // Create map of category ID to name
                categories.forEach(cat => {
                    this.categoriesMap[cat._id] = cat.name;
                });
            }
        } catch (error) {
            console.error('Load categories error:', error);
        }
    }

    /**
     * Load sales data from API
     */
    async loadSalesData() {
    try {
        let allOrders = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`${this.apiUrl}/sales/orders?page=${page}&per_page=10`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const orders = data.data.orders || [];
                allOrders = allOrders.concat(orders);
                
                // Check if there are more pages
                hasMore = orders.length === 10; // If less than 10, it's the last page
                page++;
            } else {
                hasMore = false;
            }
        }

        this.allSalesData = allOrders;
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
        let allProducts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`${this.apiUrl}/inventory/products?page=${page}&per_page=10`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const products = data.data.products || [];
                allProducts = allProducts.concat(products);
                
                // Check if there are more pages
                hasMore = products.length === 10; // If less than 10, it's the last page
                page++;
            } else {
                hasMore = false;
            }
        }

        this.allProductsData = allProducts;
        document.getElementById('totalProducts').textContent = this.allProductsData.length;
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
     * Calculate monthly sales for last 12 months
     */
    calculateMonthlySales() {
        const months = [];
        const salesData = [];
        const today = new Date();

        // Generate last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            months.push(monthName);
        }

        // Calculate sales for each month
        months.forEach((month, index) => {
            const date = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthlySales = this.allSalesData
                .filter(order => {
                    const orderDate = new Date(order.created_at);
                    return orderDate >= monthStart && orderDate <= monthEnd && order.payment_status === 'PAID';
                })
                .reduce((sum, order) => sum + order.total_amount, 0);

            salesData.push(monthlySales);
        });

        return { labels: months, data: salesData };
    }

    /**
     * Initialize monthly sales chart
     */
    initializeSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        const monthlyData = this.calculateMonthlySales();

        if (this.charts.sales) {
            this.charts.sales.destroy();
        }

        this.charts.sales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Monthly Sales (₹)',
                    data: monthlyData.data,
                    backgroundColor: 'rgba(168, 85, 247, 0.6)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: 'rgba(168, 85, 247, 0.8)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.3)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.3)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize inventory breakdown chart (pie chart with category names)
     */
    initializeInventoryChart() {
        const ctx = document.getElementById('inventoryChart');
        if (!ctx) return;

        const categoryBreakdown = this.calculateCategoryBreakdown();

        if (this.charts.inventory) {
            this.charts.inventory.destroy();
        }

        // Store original data for hover
        const chartData = categoryBreakdown.data;
        const categoryProducts = categoryBreakdown.categoryProducts;

        this.charts.inventory = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryBreakdown.labels,
                datasets: [{
                    data: categoryBreakdown.data,
                    backgroundColor: [
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(244, 63, 94, 0.8)',
                    ],
                    borderColor: 'rgba(30, 41, 59, 0.9)',
                    borderWidth: 2,
                    hoverBorderColor: '#ffffff',
                    hoverBorderWidth: 3,
                    hoverOffset: 10,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 12 },
                            padding: 15
                        },
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(168, 85, 247, 0.5)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                const categoryName = context[0].label;
                                return categoryName;
                            },
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${value} units (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                const categoryName = context.label;
                                const products = categoryProducts[categoryName] || [];
                                
                                if (products.length === 0) return '';
                                
                                let result = '\n--- Products in category ---\n';
                                products.slice(0, 5).forEach(product => {
                                    result += `• ${product.name}: ${product.quantity} units\n`;
                                });
                                
                                if (products.length > 5) {
                                    result += `... and ${products.length - 5} more`;
                                }
                                
                                return result;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Calculate category breakdown for inventory
     */
    calculateCategoryBreakdown() {
        const categoryMap = {};
        const categoryProducts = {};

        // Group products by category
        this.allProductsData.forEach(product => {
            const categoryName = product.category_id 
                ? this.categoriesMap[product.category_id] || 'Uncategorized'
                : 'Uncategorized';

            if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = 0;
                categoryProducts[categoryName] = [];
            }

            categoryMap[categoryName] += product.quantity;
            categoryProducts[categoryName].push(product);
        });

        const labels = Object.keys(categoryMap);
        const data = labels.map(label => categoryMap[label]);

        return { labels, data, categoryProducts };
    }

    /**
     * Initialize order status chart
     */
    initializeStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const statusBreakdown = this.calculateStatusBreakdown();

        if (this.charts.status) {
            this.charts.status.destroy();
        }

        this.charts.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statusBreakdown.labels,
                datasets: [{
                    label: 'Orders by Status',
                    data: statusBreakdown.data,
                    backgroundColor: [
                        'rgba(245, 158, 11, 0.6)',
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(6, 182, 212, 0.6)',
                        'rgba(34, 197, 94, 0.6)',
                        'rgba(239, 68, 68, 0.6)',
                    ],
                    borderColor: [
                        'rgba(245, 158, 11, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)',
                    ],
                    borderWidth: 2,
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
                            color: '#e2e8f0'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.3)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.3)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Calculate order status breakdown
     */
    calculateStatusBreakdown() {
        const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        const statusCounts = {};

        statuses.forEach(status => {
            statusCounts[status] = this.allSalesData.filter(order => order.status === status).length;
        });

        return {
            labels: statuses,
            data: statuses.map(status => statusCounts[status])
        };
    }

    /**
     * Initialize payment status chart
     */
    initializePaymentChart() {
        const ctx = document.getElementById('paymentChart');
        if (!ctx) return;

        const paymentBreakdown = this.calculatePaymentBreakdown();

        if (this.charts.payment) {
            this.charts.payment.destroy();
        }

        this.charts.payment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: paymentBreakdown.labels,
                datasets: [{
                    data: paymentBreakdown.data,
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                    ],
                    borderColor: 'rgba(30, 41, 59, 0.9)',
                    borderWidth: 2,
                    hoverBorderColor: '#ffffff',
                    hoverBorderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 12 },
                            padding: 15
                        },
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#e2e8f0',
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${value} orders (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Calculate payment status breakdown
     */
    calculatePaymentBreakdown() {
        const statuses = ['PAID', 'PARTIAL', 'UNPAID'];
        const statusCounts = {};

        statuses.forEach(status => {
            statusCounts[status] = this.allSalesData.filter(order => order.payment_status === status).length;
        });

        return {
            labels: statuses,
            data: statuses.map(status => statusCounts[status])
        };
    }

    /**
     * Load product analytics (top and least selling)
     */
    async loadProductAnalytics() {
        try {
            const topSellingContainer = document.getElementById('topSellingProducts');
            const leastSellingContainer = document.getElementById('leastSellingProducts');

            if (!topSellingContainer || !leastSellingContainer) return;

            // Calculate product sales
            const productSales = this.calculateProductSales();

            // Sort by quantity sold
            const sortedByQuantity = [...productSales].sort((a, b) => b.totalSold - a.totalSold);

            // Get top 5 and least 5
            const topSelling = sortedByQuantity.slice(0, 5);
            const leastSelling = sortedByQuantity.slice(-5).reverse();

            // Display top selling
            topSellingContainer.innerHTML = '';
            if (topSelling.length === 0) {
                topSellingContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No sales data available</p>';
            } else {
                topSelling.forEach((product, index) => {
                    const card = this.createProductCard(product, index + 1, 'top');
                    topSellingContainer.appendChild(card);
                });
            }

            // Display least selling
            leastSellingContainer.innerHTML = '';
            if (leastSelling.length === 0) {
                leastSellingContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No sales data available</p>';
            } else {
                leastSelling.forEach((product, index) => {
                    const card = this.createProductCard(product, index + 1, 'least');
                    leastSellingContainer.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Load product analytics error:', error);
        }
    }

    /**
     * Calculate product sales
     */
    calculateProductSales() {
        const productSalesMap = {};

        // Count sales for each product
        this.allSalesData.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (!productSalesMap[item.product_id]) {
                        // Find product details
                        const product = this.allProductsData.find(p => p._id === item.product_id);
                        productSalesMap[item.product_id] = {
                            productId: item.product_id,
                            name: product ? product.name : 'Unknown Product',
                            sku: product ? product.sku : 'N/A',
                            totalSold: 0,
                            totalRevenue: 0
                        };
                    }
                    productSalesMap[item.product_id].totalSold += item.quantity;
                    productSalesMap[item.product_id].totalRevenue += item.price * item.quantity;
                });
            }
        });

        return Object.values(productSalesMap);
    }

    /**
     * Create product analytics card
     */
    createProductCard(product, rank, type) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cssText = `
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(6, 182, 212, 0.1));
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
        `;

        const rankBadge = document.createElement('div');
        rankBadge.style.cssText = `
            display: inline-block;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
        `;
        rankBadge.textContent = `#${rank} ${type === 'top' ? 'Top Seller' : 'Least Seller'}`;

        const productName = document.createElement('h4');
        productName.style.cssText = 'color: var(--text-white); margin: 0.75rem 0; font-size: 1.1rem;';
        productName.textContent = product.name;

        const sku = document.createElement('p');
        sku.style.cssText = 'color: var(--text-muted); margin: 0.5rem 0; font-size: 0.9rem;';
        sku.textContent = `SKU: ${product.sku}`;

        const stats = document.createElement('div');
        stats.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;';

        const quantityDiv = document.createElement('div');
        quantityDiv.style.cssText = 'background: rgba(168, 85, 247, 0.2); padding: 1rem; border-radius: 8px;';
        quantityDiv.innerHTML = `
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Units Sold</p>
            <p style="color: var(--primary-color); font-size: 1.8rem; font-weight: 700; margin: 0.5rem 0 0 0;">${product.totalSold}</p>
        `;

        const revenueDiv = document.createElement('div');
        revenueDiv.style.cssText = 'background: rgba(6, 182, 212, 0.2); padding: 1rem; border-radius: 8px;';
        revenueDiv.innerHTML = `
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Revenue</p>
            <p style="color: var(--secondary-color); font-size: 1.8rem; font-weight: 700; margin: 0.5rem 0 0 0;">₹${product.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        `;

        stats.appendChild(quantityDiv);
        stats.appendChild(revenueDiv);

        card.appendChild(rankBadge);
        card.appendChild(productName);
        card.appendChild(sku);
        card.appendChild(stats);

        return card;
    }

    /**
     * Show alert message
     */
    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} show`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (sessionManager.isAuthenticated()) {
        new ReportsManager();
    } else {
        window.location.href = 'login.html';
    }
});
