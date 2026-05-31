/**
 * Sales Management Module
 * Handles sales operations and API calls
 */

class SalesManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.orderItems = [];
        this.setupEventListeners();
        this.loadCustomers();
        this.loadProducts();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Customer form
        const customerForm = document.getElementById('customerForm');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => this.handleAddCustomer(e));
        }

        // Order form
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => this.handleCreateOrder(e));
        }

        // Search customers
        const searchCustomers = document.getElementById('searchCustomers');
        if (searchCustomers) {
            searchCustomers.addEventListener('input', (e) => this.handleSearchCustomers(e));
        }

        // Search orders
        const searchOrders = document.getElementById('searchOrders');
        if (searchOrders) {
            searchOrders.addEventListener('input', (e) => this.handleSearchOrders(e));
        }

        // Filter orders by status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e));
        }

        // Add item to order
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.handleAddOrderItem());
        }
    }

    /**
     * Load all products for dropdown
     */
    async loadProducts() {
    try {
        let allProducts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`${this.apiUrl}/inventory/products?page=${page}&per_page=10`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const products = data.data.products;
                allProducts = allProducts.concat(products);
                
                // Check if there are more pages
                hasMore = products.length === 10; // If less than 10, it's the last page
                page++;
            } else {
                hasMore = false;
            }
        }

        this.products = allProducts; // Store all products
        this.populateProductDropdown(allProducts);
    } catch (error) {
        console.error('Load products error:', error);
    }
}

    /**
     * Populate product dropdown
     */
    populateProductDropdown(products) {
        const select = document.getElementById('orderProduct');
        if (!select) return;

        select.innerHTML = '<option value="">Select Product</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product._id;
            option.textContent = `${product.name} (${product.sku}) - ₹${product.price.toFixed(2)} - Stock: ${product.quantity}`;
            option.dataset.price = product.price;
            option.dataset.name = product.name;
            select.appendChild(option);
        });

        // Auto-fill price when product is selected
        select.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (selectedOption.dataset.price) {
                document.getElementById('orderPrice').value = selectedOption.dataset.price;
            }
        });
    }

    /**
     * Load all customers
     */
    async loadCustomers() {
        try {
            const response = await fetch(`${this.apiUrl}/sales/customers?per_page=1000`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const customers = data.data.customers;
                this.customers = customers; // Store for reference
                this.populateCustomerDropdowns(customers);
            }
        } catch (error) {
            console.error('Load customers error:', error);
        }
    }

    /**
     * Populate customer dropdowns
     */
    populateCustomerDropdowns(customers) {
        const selects = document.querySelectorAll('.customer-select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Customer</option>';
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer._id;
                option.textContent = customer.name;
                select.appendChild(option);
            });
        });
    }

    /**
     * Load customers
     */
    async loadCustomersTable(page = 1, search = '') {
        try {
            this.showLoading('customersTable');

            let url = `${this.apiUrl}/sales/customers?page=${page}&per_page=${this.itemsPerPage}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayCustomers(data.data.customers);
                this.displayCustomersPagination(data.data.pagination);
            }
        } catch (error) {
            console.error('Load customers error:', error);
            this.showAlert('error', 'Failed to load customers');
        } finally {
            this.hideLoading('customersTable');
        }
    }

    /**
     * Display customers in table
     */
    displayCustomers(customers) {
        const tbody = document.querySelector('#customersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No customers found</td></tr>';
            return;
        }

        customers.forEach(customer => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.city}, ${customer.state}</td>
                <td>${customer.total_orders}</td>
                <td>₹${customer.total_spent.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-edit" onclick="salesManager.editCustomer('${customer._id}')">Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="salesManager.deleteCustomer('${customer._id}')">Delete</button>
                    <button class="btn btn-sm btn-info" onclick="salesManager.viewCustomerOrders('${customer._id}')">Orders</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Display customers pagination
     */
    displayCustomersPagination(pagination) {
        const paginationDiv = document.getElementById('customersPagination');
        if (!paginationDiv) return;

        paginationDiv.innerHTML = '';
        const { page, total_pages } = pagination;

        if (page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-secondary';
            prevBtn.textContent = 'Previous';
            prevBtn.onclick = () => this.loadCustomersTable(page - 1);
            paginationDiv.appendChild(prevBtn);
        }

        const pageInfo = document.createElement('span');
        pageInfo.style.margin = '0 1rem';
        pageInfo.textContent = `Page ${page} of ${total_pages}`;
        paginationDiv.appendChild(pageInfo);

        if (page < total_pages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-secondary';
            nextBtn.textContent = 'Next';
            nextBtn.onclick = () => this.loadCustomersTable(page + 1);
            paginationDiv.appendChild(nextBtn);
        }
    }

    /**
     * Handle add customer
     */
    async handleAddCustomer(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('customerName')?.value.trim(),
            email: document.getElementById('customerEmail')?.value.trim(),
            phone: document.getElementById('customerPhone')?.value.trim(),
            address: document.getElementById('customerAddress')?.value.trim(),
            city: document.getElementById('customerCity')?.value.trim(),
            state: document.getElementById('customerState')?.value.trim(),
            zip_code: document.getElementById('customerZip')?.value.trim(),
            country: document.getElementById('customerCountry')?.value.trim()
        };

        const validation = this.validateCustomerForm(formData);
        if (!validation.valid) {
            this.showAlert('error', validation.message);
            return;
        }

        try {
            this.showLoading('customerForm');

            const response = await fetch(`${this.apiUrl}/sales/customers`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Customer created successfully');
                document.getElementById('customerForm').reset();
                this.loadCustomersTable();
                this.loadCustomers();
                this.closeModal('addCustomerModal');
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Add customer error:', error);
            this.showAlert('error', 'Failed to create customer');
        } finally {
            this.hideLoading('customerForm');
        }
    }

    /**
     * Edit customer
     */
    async editCustomer(customerId) {
        try {
            const response = await fetch(`${this.apiUrl}/sales/customers/${customerId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const customer = data.data.customer;
                
                document.getElementById('editCustomerId').value = customer._id;
                document.getElementById('editCustomerName').value = customer.name;
                document.getElementById('editCustomerEmail').value = customer.email;
                document.getElementById('editCustomerPhone').value = customer.phone;
                document.getElementById('editCustomerAddress').value = customer.address;
                document.getElementById('editCustomerCity').value = customer.city;
                document.getElementById('editCustomerState').value = customer.state;
                document.getElementById('editCustomerZip').value = customer.zip_code;
                document.getElementById('editCustomerCountry').value = customer.country;

                this.openModal('editCustomerModal');
            } else {
                this.showAlert('error', 'Failed to load customer');
            }
        } catch (error) {
            console.error('Edit customer error:', error);
            this.showAlert('error', 'Failed to load customer');
        }
    }

    /**
     * Handle update customer
     */
    async handleUpdateCustomer(e) {
        e.preventDefault();

        const customerId = document.getElementById('editCustomerId').value;
        const formData = {
            name: document.getElementById('editCustomerName')?.value.trim(),
            email: document.getElementById('editCustomerEmail')?.value.trim(),
            phone: document.getElementById('editCustomerPhone')?.value.trim(),
            address: document.getElementById('editCustomerAddress')?.value.trim(),
            city: document.getElementById('editCustomerCity')?.value.trim(),
            state: document.getElementById('editCustomerState')?.value.trim(),
            zip_code: document.getElementById('editCustomerZip')?.value.trim(),
            country: document.getElementById('editCustomerCountry')?.value.trim()
        };

        try {
            this.showLoading('editCustomerForm');

            const response = await fetch(`${this.apiUrl}/sales/customers/${customerId}`, {
                method: 'PUT',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Customer updated successfully');
                this.loadCustomersTable();
                this.loadCustomers();
                this.closeModal('editCustomerModal');
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Update customer error:', error);
            this.showAlert('error', 'Failed to update customer');
        } finally {
            this.hideLoading('editCustomerForm');
        }
    }

    /**
     * Delete customer
     */
    async deleteCustomer(customerId) {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        try {
            const response = await fetch(`${this.apiUrl}/sales/customers/${customerId}`, {
                method: 'DELETE',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Customer deleted successfully');
                this.loadCustomersTable();
                this.loadCustomers();
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Delete customer error:', error);
            this.showAlert('error', 'Failed to delete customer');
        }
    }

    /**
     * View customer orders
     */
    async viewCustomerOrders(customerId) {
        try {
            const response = await fetch(`${this.apiUrl}/sales/customer/${customerId}/orders`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const orders = data.data.orders;
                let ordersHTML = '<table style="width: 100%;"><thead><tr><th>Order Number</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
                
                orders.forEach(order => {
                    ordersHTML += `
                        <tr>
                            <td>${order.order_number}</td>
                            <td>${new Date(order.created_at).toLocaleDateString()}</td>
                            <td>₹${order.total_amount.toFixed(2)}</td>
                            <td>${order.status}</td>
                        </tr>
                    `;
                });
                
                ordersHTML += '</tbody></table>';
                
                const modal = document.getElementById('customerOrdersModal');
                const content = modal.querySelector('.modal-content');
                content.innerHTML = `
                    <div class="modal-header">
                        <h2>Customer Orders</h2>
                        <button type="button" class="modal-close" onclick="salesManager.closeModal('customerOrdersModal')">&times;</button>
                    </div>
                    ${ordersHTML}
                `;
                
                this.openModal('customerOrdersModal');
            } else {
                this.showAlert('error', 'Failed to load customer orders');
            }
        } catch (error) {
            console.error('View customer orders error:', error);
            this.showAlert('error', 'Failed to load customer orders');
        }
    }

    /**
     * Load orders
     */
    async loadOrders(page = 1, search = '', status = '') {
        try {
            this.showLoading('ordersTable');

            let url = `${this.apiUrl}/sales/orders?page=${page}&per_page=${this.itemsPerPage}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (status) url += `&status=${status}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayOrders(data.data.orders);
                this.displayOrdersPagination(data.data.pagination);
                this.loadSalesStats();
            }
        } catch (error) {
            console.error('Load orders error:', error);
            this.showAlert('error', 'Failed to load orders');
        } finally {
            this.hideLoading('ordersTable');
        }
    }

    /**
     * Display orders in table
     */
    displayOrders(orders) {
        const tbody = document.querySelector('#ordersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem;">No orders found</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            const statusClass = order.status === 'PENDING' ? 'pending' : order.status === 'CANCELLED' ? 'cancelled' : 'active';
            
            // Get product names from items
            const productNames = order.items.map(item => {
                const product = this.products?.find(p => p._id === item.product_id);
                return product ? product.name : item.product_name;
            }).join(', ');

            row.innerHTML = `
                <td>${order.order_number}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>${productNames}</td>
                <td>₹${order.total_amount.toFixed(2)}</td>
                <td>${order.total_quantity}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td><span class="payment-badge ${order.payment_status === 'PAID' ? 'paid' : 'unpaid'}">${order.payment_status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="salesManager.viewOrder('${order._id}')">View</button>
                    <button class="btn btn-sm btn-edit" onclick="salesManager.editOrder('${order._id}')">Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="salesManager.deleteOrder('${order._id}')">Delete</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Display orders pagination
     */
    displayOrdersPagination(pagination) {
        const paginationDiv = document.getElementById('ordersPagination');
        if (!paginationDiv) return;

        paginationDiv.innerHTML = '';
        const { page, total_pages } = pagination;

        if (page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-secondary';
            prevBtn.textContent = 'Previous';
            prevBtn.onclick = () => this.loadOrders(page - 1);
            paginationDiv.appendChild(prevBtn);
        }

        const pageInfo = document.createElement('span');
        pageInfo.style.margin = '0 1rem';
        pageInfo.textContent = `Page ${page} of ${total_pages}`;
        paginationDiv.appendChild(pageInfo);

        if (page < total_pages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-secondary';
            nextBtn.textContent = 'Next';
            nextBtn.onclick = () => this.loadOrders(page + 1);
            paginationDiv.appendChild(nextBtn);
        }
    }

    /**
     * Handle add order item
     */
    handleAddOrderItem() {
        const productSelect = document.getElementById('orderProduct');
        const quantityInput = document.getElementById('orderQuantity');
        const priceInput = document.getElementById('orderPrice');

        if (!productSelect.value || !quantityInput.value || !priceInput.value) {
            this.showAlert('error', 'Please fill all item fields');
            return;
        }

        const quantity = parseInt(quantityInput.value);
        const price = parseFloat(priceInput.value);

        if (quantity <= 0 || price <= 0) {
            this.showAlert('error', 'Quantity and price must be greater than 0');
            return;
        }

        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const item = {
            product_id: productSelect.value,
            product_name: selectedOption.dataset.name || selectedOption.text,
            quantity: quantity,
            price: price
        };

        this.orderItems.push(item);
        this.displayOrderItems();

        productSelect.value = '';
        quantityInput.value = '';
        priceInput.value = '';
    }

    /**
     * Display order items - FIXED CALCULATION
     */
    displayOrderItems() {
        const tbody = document.querySelector('#orderItemsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        let subtotal = 0;

        this.orderItems.forEach((item, index) => {
            const row = document.createElement('tr');
            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;

            row.innerHTML = `
                <td>${item.product_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
                <td style="text-align: right;">₹${itemTotal.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button type="button" class="btn btn-sm btn-delete" onclick="salesManager.removeOrderItem(${index})">Remove</button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Update totals - FIXED CALCULATION
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        document.getElementById('orderSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('orderTax').textContent = `₹${tax.toFixed(2)}`;
        document.getElementById('orderTotal').textContent = `₹${total.toFixed(2)}`;
    }

    /**
     * Remove order item
     */
    removeOrderItem(index) {
        this.orderItems.splice(index, 1);
        this.displayOrderItems();
    }

    /**
     * Handle create order
     */
    async handleCreateOrder(e) {
        e.preventDefault();

        if (this.orderItems.length === 0) {
            this.showAlert('error', 'Please add at least one item to the order');
            return;
        }

        const customerId = document.getElementById('orderCustomer')?.value;
        const notes = document.getElementById('orderNotes')?.value.trim();

        if (!customerId) {
            this.showAlert('error', 'Please select a customer');
            return;
        }

        try {
            this.showLoading('orderForm');

            const response = await fetch(`${this.apiUrl}/sales/orders`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({
                    customer_id: customerId,
                    items: this.orderItems,
                    notes: notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Order created successfully');
                document.getElementById('orderForm').reset();
                this.orderItems = [];
                this.displayOrderItems();
                this.loadOrders();
                this.closeModal('createOrderModal');
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Create order error:', error);
            this.showAlert('error', 'Failed to create order');
        } finally {
            this.hideLoading('orderForm');
        }
    }

    /**
     * View order
     */
    async viewOrder(orderId) {
        try {
            const response = await fetch(`${this.apiUrl}/sales/orders/${orderId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const order = data.data.order;
                let itemsHTML = '<table style="width: 100%;"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>';
                
                order.items.forEach(item => {
                    const product = this.products?.find(p => p._id === item.product_id);
                    const productName = product ? product.name : item.product_id;
                    itemsHTML += `
                        <tr>
                            <td>${productName}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price.toFixed(2)}</td>
                            <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    `;
                });
                
                itemsHTML += '</tbody></table>';
                
                const modal = document.getElementById('viewOrderModal');
                const content = modal.querySelector('.modal-content');
                content.innerHTML = `
                    <div class="modal-header">
                        <h2>Order: ${order.order_number}</h2>
                        <button type="button" class="modal-close" onclick="salesManager.closeModal('viewOrderModal')">&times;</button>
                    </div>
                    <div style="padding: 1.5rem;">
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Payment Status:</strong> ${order.payment_status}</p>
                        <p><strong>Total Amount:</strong> ₹${order.total_amount.toFixed(2)}</p>
                        <h3>Items</h3>
                        ${itemsHTML}
                    </div>
                `;
                
                this.openModal('viewOrderModal');
            } else {
                this.showAlert('error', 'Failed to load order');
            }
        } catch (error) {
            console.error('View order error:', error);
            this.showAlert('error', 'Failed to load order');
        }
    }

    /**
     * Edit order - NEW METHOD
     */
    async editOrder(orderId) {
        try {
            const response = await fetch(`${this.apiUrl}/sales/orders/${orderId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const order = data.data.order;
                
                document.getElementById('editOrderId').value = order._id;
                document.getElementById('editOrderNumber').value = order.order_number;
                document.getElementById('editOrderStatus').value = order.status;
                document.getElementById('editPaymentStatus').value = order.payment_status;
                document.getElementById('editOrderNotes').value = order.notes || '';
                document.getElementById('editOrderTotal').textContent = `₹${order.total_amount.toFixed(2)}`;

                // Display items
                const tbody = document.querySelector('#editOrderItemsTable tbody');
                tbody.innerHTML = '';
                
                order.items.forEach(item => {
                    const product = this.products?.find(p => p._id === item.product_id);
                    const productName = product ? product.name : item.product_id;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${productName}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                    `;
                    tbody.appendChild(row);
                });

                this.openModal('editOrderModal');
            } else {
                this.showAlert('error', 'Failed to load order');
            }
        } catch (error) {
            console.error('Edit order error:', error);
            this.showAlert('error', 'Failed to load order');
        }
    }

    /**
     * Handle update order - NEW METHOD
     */
    async handleUpdateOrder(e) {
        e.preventDefault();

        const orderId = document.getElementById('editOrderId').value;
        const status = document.getElementById('editOrderStatus').value;
        const paymentStatus = document.getElementById('editPaymentStatus').value;
        const notes = document.getElementById('editOrderNotes').value.trim();

        try {
            this.showLoading('editOrderForm');

            // Update status
            const statusResponse = await fetch(`${this.apiUrl}/sales/orders/${orderId}/status`, {
                method: 'PUT',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            const statusData = await statusResponse.json();

            if (!statusResponse.ok) {
                throw new Error(statusData.message);
            }

            // Update payment status
            const paymentResponse = await fetch(`${this.apiUrl}/sales/orders/${orderId}/payment`, {
                method: 'PUT',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({ payment_status: paymentStatus })
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
                throw new Error(paymentData.message);
            }

            this.showAlert('success', 'Order updated successfully');
            this.loadOrders();
            this.closeModal('editOrderModal');
        } catch (error) {
            console.error('Update order error:', error);
            this.showAlert('error', error.message || 'Failed to update order');
        } finally {
            this.hideLoading('editOrderForm');
        }
    }

    /**
     * Delete order - NEW METHOD
     */
    async deleteOrder(orderId) {
        if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

        try {
            const response = await fetch(`${this.apiUrl}/sales/orders/${orderId}`, {
                method: 'DELETE',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Order deleted successfully');
                this.loadOrders();
                this.loadCustomersTable();
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Delete order error:', error);
            this.showAlert('error', 'Failed to delete order');
        }
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId) {
        const reason = prompt('Enter cancellation reason:');
        if (!reason) return;

        try {
            const response = await fetch(`${this.apiUrl}/sales/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({ reason })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Order cancelled successfully');
                this.loadOrders();
                this.loadCustomersTable();
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Cancel order error:', error);
            this.showAlert('error', 'Failed to cancel order');
        }
    }

    /**
     * Handle search customers
     */
    handleSearchCustomers(e) {
        const searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.loadCustomersTable(1, searchQuery);
    }

    /**
     * Handle search orders
     */
    handleSearchOrders(e) {
        const searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.loadOrders(1, searchQuery);
    }

    /**
     * Handle status filter
     */
    handleStatusFilter(e) {
        const status = e.target.value;
        this.currentPage = 1;
        this.loadOrders(1, '', status);
    }

    /**
     * Load sales statistics
     */
    async loadSalesStats() {
        try {
            const response = await fetch(`${this.apiUrl}/sales/statistics`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const stats = data.data;
                
                if (document.getElementById('totalOrders')) {
                    document.getElementById('totalOrders').textContent = stats.total_orders;
                }
                if (document.getElementById('totalRevenue')) {
                    document.getElementById('totalRevenue').textContent = `₹${stats.total_revenue.toFixed(2)}`;
                }
                if (document.getElementById('avgOrderValue')) {
                    document.getElementById('avgOrderValue').textContent = `₹${stats.average_order_value.toFixed(2)}`;
                }
                if (document.getElementById('pendingOrders')) {
                    document.getElementById('pendingOrders').textContent = stats.pending_orders;
                }
                if (document.getElementById('totalOrdersCount')) {
                    document.getElementById('totalOrdersCount').textContent = stats.total_orders;
                }
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    /**
     * Validate customer form
     */
    validateCustomerForm(formData) {
        if (!formData.name) return { valid: false, message: 'Customer name is required' };
        if (!formData.email) return { valid: false, message: 'Email is required' };
        if (!formData.phone) return { valid: false, message: 'Phone is required' };
        if (!formData.address) return { valid: false, message: 'Address is required' };
        if (!formData.city) return { valid: false, message: 'City is required' };
        if (!formData.state) return { valid: false, message: 'State is required' };
        if (!formData.zip_code) return { valid: false, message: 'Zip code is required' };
        if (!formData.country) return { valid: false, message: 'Country is required' };

        return { valid: true };
    }

    /**
     * Show alert
     */
    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} show`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '400px';

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    /**
     * Show loading
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const submitBtn = element.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> Loading...';
            }
        }
    }

    /**
     * Hide loading
     */
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const submitBtn = element.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.textContent.replace('Loading...', 'Submit').trim();
            }
        }
    }

    /**
     * Open modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('show');
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    }
}

// Initialize on DOM load
let salesManager;
document.addEventListener('DOMContentLoaded', () => {
    if (sessionManager.isAuthenticated()) {
        salesManager = new SalesManager();
        salesManager.loadCustomersTable();
        salesManager.loadOrders();
    } else {
        window.location.href = 'login.html';
    }
});