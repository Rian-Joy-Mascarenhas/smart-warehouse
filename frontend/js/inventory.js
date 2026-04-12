/**
 * Inventory Management Module
 * Handles inventory operations and API calls
 */

class InventoryManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.setupEventListeners();
        this.loadCategories();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Product form
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleAddProduct(e));
        }

        // Search functionality
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }

        // Category form
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));
        }

        // Filter by category
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e));
        }
    }

    /**
     * Load all categories
     */
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiUrl}/inventory/categories`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const categories = data.data.categories;
                this.populateCategoryDropdowns(categories);
                this.populateCategoryFilter(categories);
            }
        } catch (error) {
            console.error('Load categories error:', error);
        }
    }

    /**
     * Populate category dropdowns
     */
    populateCategoryDropdowns(categories) {
        const selects = document.querySelectorAll('.category-select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category._id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    /**
     * Populate category filter
     */
    populateCategoryFilter(categories) {
        const filter = document.getElementById('categoryFilter');
        if (!filter) return;

        filter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            filter.appendChild(option);
        });
    }

        /**
     * Load products - FIXED
     */
    async loadProducts(page = 1, search = '', categoryId = '') {
        try {
            this.showLoading('productsTable');

            let url = `${this.apiUrl}/inventory/products?page=${page}&per_page=${this.itemsPerPage}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (categoryId) url += `&category_id=${encodeURIComponent(categoryId)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            console.log('Products response:', data); // DEBUG

            if (response.ok) {
                // Check if data exists and has products
                if (data && data.data && data.data.products) {
                    this.displayProducts(data.data.products);
                    this.displayPagination(data.data.pagination);
                    this.loadInventoryStats();
                } else if (data && data.products) {
                    // Alternative response structure
                    this.displayProducts(data.products);
                    if (data.pagination) {
                        this.displayPagination(data.pagination);
                    }
                    this.loadInventoryStats();
                } else {
                    console.error('Unexpected response structure:', data);
                    this.showAlert('error', 'Unexpected response from server');
                }
            } else {
                console.error('API error:', data.message);
                this.showAlert('error', data.message || 'Failed to load products');
            }
        } catch (error) {
            console.error('Load products error:', error);
            this.showAlert('error', 'Failed to load products: ' + error.message);
        } finally {
            this.hideLoading('productsTable');
        }
    }

    /**
     * Display products in table
     */
    displayProducts(products) {
        const tbody = document.querySelector('#productsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No products found</td></tr>';
            return;
        }

        products.forEach(product => {
            const lowStock = product.quantity < product.min_stock;
            const row = document.createElement('tr');
            row.style.backgroundColor = lowStock ? '#ef7000' : '';

            row.innerHTML = `
                <td>${product.sku}</td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>${product.min_stock}</td>
                <td>${product.max_stock}</td>
                <td>
                    <span class="stock-badge ${lowStock ? 'low-stock' : 'normal-stock'}">
                        ${lowStock ? '⚠️ Low Stock' : '✓ In Stock'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-edit" onclick="inventoryManager.editProduct('${product._id}')">Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="inventoryManager.deleteProduct('${product._id}')">Delete</button>
                    <button class="btn btn-sm btn-adjust" onclick="inventoryManager.showAdjustStockModal('${product._id}')">Adjust</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Display pagination
     */
    displayPagination(pagination) {
        const paginationDiv = document.getElementById('pagination');
        if (!paginationDiv) return;

        paginationDiv.innerHTML = '';
        const { page, total_pages } = pagination;

        // Previous button
        if (page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-secondary';
            prevBtn.textContent = 'Previous';
            prevBtn.onclick = () => this.loadProducts(page - 1);
            paginationDiv.appendChild(prevBtn);
        }

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.style.margin = '0 1rem';
        pageInfo.textContent = `Page ${page} of ${total_pages}`;
        paginationDiv.appendChild(pageInfo);

        // Next button
        if (page < total_pages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-secondary';
            nextBtn.textContent = 'Next';
            nextBtn.onclick = () => this.loadProducts(page + 1);
            paginationDiv.appendChild(nextBtn);
        }
    }

        /**
     * Handle add product - FIXED WITH VALIDATION
     */
    async handleAddProduct(e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('productName')?.value.trim();
        const sku = document.getElementById('productSku')?.value.trim();
        const categoryId = document.getElementById('productCategory')?.value.trim();
        const price = document.getElementById('productPrice')?.value;
        const quantity = document.getElementById('productQuantity')?.value;
        const minStock = document.getElementById('productMinStock')?.value;
        const maxStock = document.getElementById('productMaxStock')?.value;
        const description = document.getElementById('productDescription')?.value.trim();

        // Validate required fields
        if (!name || name.length < 2) {
            this.showAlert('error', 'Product name is required (minimum 2 characters)');
            return;
        }
        if (!sku || sku.length < 2) {
            this.showAlert('error', 'SKU is required (minimum 2 characters)');
            return;
        }
        if (!price || parseFloat(price) < 0) {
            this.showAlert('error', 'Valid price is required');
            return;
        }
        if (!quantity || parseInt(quantity) < 0) {
            this.showAlert('error', 'Valid quantity is required');
            return;
        }
        if (!minStock || parseInt(minStock) < 0) {
            this.showAlert('error', 'Valid minimum stock is required');
            return;
        }
        if (!maxStock || parseInt(maxStock) < 0) {
            this.showAlert('error', 'Valid maximum stock is required');
            return;
        }

        // Prepare form data
        const formData = {
            name: name,
            sku: sku,
            category_id: categoryId && categoryId !== '' ? categoryId : null,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            min_stock: parseInt(minStock),
            max_stock: parseInt(maxStock),
            description: description || ''
        };

        console.log('Form data being sent:', formData); // DEBUG

        try {
            this.showLoading('productForm');

            const response = await fetch(`${this.apiUrl}/inventory/products`, {
                method: 'POST',
                headers: {
                    ...sessionManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            console.log('API Response:', data); // DEBUG

            if (response.ok) {
                this.showAlert('success', 'Product created successfully');
                
                // Close modal
                this.closeModal('addProductModal');
                
                // Reset form
                document.getElementById('productForm').reset();
                
                // Wait a moment then reload
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Go to first page and reload
                this.currentPage = 1;
                this.loadProducts();
                
                // Reload categories
                this.loadCategories();
            } else {
                // Show detailed error
                if (data.data && data.data.errors) {
                    this.showAlert('error', data.data.errors.join(', '));
                } else {
                    this.showAlert('error', data.message || 'Failed to create product');
                }
                console.error('API Error:', data);
            }
        } catch (error) {
            console.error('Add product error:', error);
            this.showAlert('error', 'Failed to create product: ' + error.message);
        } finally {
            this.hideLoading('productForm');
        }
    }

    /**
     * Edit product
     */
    async editProduct(productId) {
        try {
            const response = await fetch(`${this.apiUrl}/inventory/products/${productId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const product = data.data.product;
                
                // Populate edit form
                document.getElementById('editProductId').value = product._id;
                document.getElementById('editProductName').value = product.name;
                document.getElementById('editProductSku').value = product.sku;
                document.getElementById('editProductPrice').value = product.price;
                document.getElementById('editProductMinStock').value = product.min_stock;
                document.getElementById('editProductMaxStock').value = product.max_stock;
                document.getElementById('editProductCategory').value = product.category_id || '';
                document.getElementById('editProductDescription').value = product.description || '';

                this.openModal('editProductModal');
            } else {
                this.showAlert('error', 'Failed to load product');
            }
        } catch (error) {
            console.error('Edit product error:', error);
            this.showAlert('error', 'Failed to load product');
        }
    }

        /**
     * Handle update product - FIXED WITH VALIDATION
     */
    async handleUpdateProduct(e) {
        e.preventDefault();

        const productId = document.getElementById('editProductId').value;

        // Get form values
        const name = document.getElementById('editProductName')?.value.trim();
        const sku = document.getElementById('editProductSku')?.value.trim();
        const categoryId = document.getElementById('editProductCategory')?.value.trim();
        const price = document.getElementById('editProductPrice')?.value;
        const minStock = document.getElementById('editProductMinStock')?.value;
        const maxStock = document.getElementById('editProductMaxStock')?.value;
        const description = document.getElementById('editProductDescription')?.value.trim();

        // Validate required fields
        if (!name || name.length < 2) {
            this.showAlert('error', 'Product name is required (minimum 2 characters)');
            return;
        }
        if (!sku || sku.length < 2) {
            this.showAlert('error', 'SKU is required (minimum 2 characters)');
            return;
        }
        if (!price || parseFloat(price) < 0) {
            this.showAlert('error', 'Valid price is required');
            return;
        }
        if (!minStock || parseInt(minStock) < 0) {
            this.showAlert('error', 'Valid minimum stock is required');
            return;
        }
        if (!maxStock || parseInt(maxStock) < 0) {
            this.showAlert('error', 'Valid maximum stock is required');
            return;
        }

        // Prepare form data
        const formData = {
            name: name,
            sku: sku,
            category_id: categoryId && categoryId !== '' ? categoryId : null,
            price: parseFloat(price),
            min_stock: parseInt(minStock),
            max_stock: parseInt(maxStock),
            description: description || ''
        };

        console.log('Form data being sent:', formData); // DEBUG

        try {
            this.showLoading('editProductForm');

            const response = await fetch(`${this.apiUrl}/inventory/products/${productId}`, {
                method: 'PUT',
                headers: {
                    ...sessionManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            console.log('API Response:', data); // DEBUG

            if (response.ok) {
                this.showAlert('success', 'Product updated successfully');
                
                // Close modal first
                this.closeModal('editProductModal');
                
                // Reset form
                document.getElementById('editProductForm').reset();
                
                // Wait a moment then reload products
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Reload products
                this.currentPage = 1;
                this.loadProducts();
                
                // Reload categories dropdown
                this.loadCategories();
            } else {
                // Show detailed error
                if (data.data && data.data.errors) {
                    this.showAlert('error', data.data.errors.join(', '));
                } else {
                    this.showAlert('error', data.message || 'Failed to update product');
                }
                console.error('API Error:', data);
            }
        } catch (error) {
            console.error('Update product error:', error);
            this.showAlert('error', 'Failed to update product: ' + error.message);
        } finally {
            this.hideLoading('editProductForm');
        }
    }

    /**
     * Delete product
     */
    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`${this.apiUrl}/inventory/products/${productId}`, {
                method: 'DELETE',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Product deleted successfully');
                this.loadProducts();
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Delete product error:', error);
            this.showAlert('error', 'Failed to delete product');
        }
    }

    /**
     * Show adjust stock modal
     */
    showAdjustStockModal(productId) {
        document.getElementById('adjustProductId').value = productId;
        this.openModal('adjustStockModal');
    }

    /**
     * Handle adjust stock
     */
    async handleAdjustStock(e) {
        e.preventDefault();

        const productId = document.getElementById('adjustProductId').value;
        const quantityChange = document.getElementById('quantityChange')?.value;
        const reason = document.getElementById('adjustReason')?.value.trim();

        if (!quantityChange || !reason) {
            this.showAlert('error', 'All fields are required');
            return;
        }

        try {
            this.showLoading('adjustStockForm');

            const response = await fetch(`${this.apiUrl}/inventory/adjust-stock/${productId}`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({
                    quantity_change: parseInt(quantityChange),
                    reason: reason
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Stock adjusted successfully');
                document.getElementById('adjustStockForm').reset();
                this.loadProducts();
                this.closeModal('adjustStockModal');
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Adjust stock error:', error);
            this.showAlert('error', 'Failed to adjust stock');
        } finally {
            this.hideLoading('adjustStockForm');
        }
    }

    /**
     * Handle search
     */
    handleSearch(e) {
        const searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.loadProducts(1, searchQuery);
    }

    /**
     * Handle category filter
     */
    handleCategoryFilter(e) {
        const categoryId = e.target.value;
        this.currentPage = 1;
        const searchQuery = document.getElementById('searchProducts')?.value.trim() || '';
        this.loadProducts(1, searchQuery, categoryId);
    }

    /**
     * Load inventory statistics
     */
    async loadInventoryStats() {
        try {
            const response = await fetch(`${this.apiUrl}/inventory/statistics`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const stats = data.data;
                
                // Update stats display
                if (document.getElementById('totalProducts')) {
                    document.getElementById('totalProducts').textContent = stats.total_products;
                }
                if (document.getElementById('lowStockCount')) {
                    document.getElementById('lowStockCount').textContent = stats.low_stock_count;
                }
                if (document.getElementById('totalInventoryValue')) {
                    document.getElementById('totalInventoryValue').textContent = `$${stats.total_inventory_value.toFixed(2)}`;
                }
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    /**
     * Handle add category
     */
    async handleAddCategory(e) {
        e.preventDefault();

        const name = document.getElementById('categoryName')?.value.trim();
        const description = document.getElementById('categoryDescription')?.value.trim();

        if (!name) {
            this.showAlert('error', 'Category name is required');
            return;
        }

        try {
            this.showLoading('categoryForm');

            const response = await fetch(`${this.apiUrl}/inventory/categories`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    description
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Category created successfully');
                document.getElementById('categoryForm').reset();
                this.loadCategories();
                this.closeModal('addCategoryModal');
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Add category error:', error);
            this.showAlert('error', 'Failed to create category');
        } finally {
            this.hideLoading('categoryForm');
        }
    }

    /**
     * Validate product form
     */
    validateProductForm(formData) {
        if (!formData.name) return { valid: false, message: 'Product name is required' };
        if (!formData.sku) return { valid: false, message: 'SKU is required' };
        if (!formData.price || parseFloat(formData.price) < 0) return { valid: false, message: 'Valid price is required' };
        if (!formData.quantity || parseInt(formData.quantity) < 0) return { valid: false, message: 'Valid quantity is required' };
        if (!formData.min_stock || parseInt(formData.min_stock) < 0) return { valid: false, message: 'Valid minimum stock is required' };
        if (!formData.max_stock || parseInt(formData.max_stock) < 0) return { valid: false, message: 'Valid maximum stock is required' };
        if (parseInt(formData.min_stock) > parseInt(formData.max_stock)) {
            return { valid: false, message: 'Minimum stock cannot be greater than maximum stock' };
        }

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
let inventoryManager;
document.addEventListener('DOMContentLoaded', () => {
    if (sessionManager.isAuthenticated()) {
        inventoryManager = new InventoryManager();
        inventoryManager.loadProducts();
    } else {
        window.location.href = 'login.html';
    }
});