/**
 * Invoice Management Module
 * Handles invoice operations and API calls
 */

class InvoiceManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search invoices
        const searchInvoices = document.getElementById('searchInvoices');
        if (searchInvoices) {
            searchInvoices.addEventListener('input', (e) => this.handleSearchInvoices(e));
        }

        // Filter by status
        const statusFilter = document.getElementById('invoiceStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e));
        }
    }

    /**
     * Load invoices
     */
    async loadInvoices(page = 1, search = '', status = '') {
        try {
            this.showLoading('invoicesTable');

            let url = `${this.apiUrl}/invoice?page=${page}&per_page=${this.itemsPerPage}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (status) url += `&status=${status}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayInvoices(data.data.invoices);
                this.displayInvoicesPagination(data.data.pagination);
                this.loadInvoiceStats();
            }
        } catch (error) {
            console.error('Load invoices error:', error);
            this.showAlert('error', 'Failed to load invoices');
        } finally {
            this.hideLoading('invoicesTable');
        }
    }

    /**
     * Display invoices in table
     */
        /**
     * Display invoices in table - UPDATED
     */
    displayInvoices(invoices) {
        const tbody = document.querySelector('#invoicesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No invoices found</td></tr>';
            return;
        }

        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            const statusClass = invoice.status === 'DRAFT' ? 'draft' : invoice.status === 'PAID' ? 'paid' : 'pending';

            row.innerHTML = `
                <td><input type="checkbox" name="invoice-select" value="${invoice._id}"></td>
                <td>${invoice.invoice_number}</td>
                <td>${invoice.customer_name}</td>
                <td>${new Date(invoice.created_at).toLocaleDateString()}</td>
                <td>$${invoice.total_amount.toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${invoice.status}</span></td>
                <td><span class="payment-badge ${invoice.payment_status === 'PAID' ? 'paid' : 'unpaid'}">${invoice.payment_status}</span></td>
                <td style="min-width: 300px;">
                    <button class="btn btn-sm btn-info" onclick="invoiceManager.viewInvoice('${invoice._id}')" title="View">👁️ View</button>
                    <button class="btn btn-sm btn-secondary" onclick="invoiceManager.downloadInvoicePDF('${invoice._id}')" title="Download PDF">📥 PDF</button>
                    <button class="btn btn-sm btn-primary" onclick="invoiceManager.sendInvoiceEmail('${invoice._id}')" title="Send Email">📧 Email</button>
                    <button class="btn btn-sm btn-edit" onclick="invoiceManager.editInvoice('${invoice._id}')" title="Edit">✏️ Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="invoiceManager.deleteInvoice('${invoice._id}')" title="Delete">🗑️ Delete</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Display invoices pagination
     */
    displayInvoicesPagination(pagination) {
        const paginationDiv = document.getElementById('invoicesPagination');
        if (!paginationDiv) return;

        paginationDiv.innerHTML = '';
        const { page, total_pages } = pagination;

        if (page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-secondary';
            prevBtn.textContent = 'Previous';
            prevBtn.onclick = () => this.loadInvoices(page - 1);
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
            nextBtn.onclick = () => this.loadInvoices(page + 1);
            paginationDiv.appendChild(nextBtn);
        }
    }

    /**
     * View invoice
     */
    async viewInvoice(invoiceId) {
        try {
            const response = await fetch(`${this.apiUrl}/invoice/${invoiceId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const invoice = data.data.invoice;
                let itemsHTML = '<table style="width: 100%; border-collapse: collapse;"><thead><tr><th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #bdc3c7;">Item</th><th style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #bdc3c7;">Qty</th><th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #bdc3c7;">Price</th><th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #bdc3c7;">Total</th></tr></thead><tbody>';
                
                invoice.items.forEach(item => {
                    itemsHTML += `
                        <tr>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #ecf0f1;">Item</td>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #ecf0f1; text-align: center;">${item.quantity}</td>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #ecf0f1; text-align: right;">$${item.price.toFixed(2)}</td>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #ecf0f1; text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    `;
                });
                
                itemsHTML += '</tbody></table>';
                
                const modal = document.getElementById('viewInvoiceModal');
                const content = modal.querySelector('.modal-content');
                content.innerHTML = `
                    <div class="modal-header">
                        <h2>Invoice: ${invoice.invoice_number}</h2>
                        <button type="button" class="modal-close" onclick="invoiceManager.closeModal('viewInvoiceModal')">&times;</button>
                    </div>
                    <div style="padding: 1.5rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                            <div>
                                <p><strong>Customer:</strong> ${invoice.customer_name}</p>
                                <p><strong>Email:</strong> ${invoice.customer_email}</p>
                                <p><strong>Phone:</strong> ${invoice.customer_phone}</p>
                            </div>
                            <div>
                                <p><strong>Status:</strong> <span class="status-badge">${invoice.status}</span></p>
                                <p><strong>Payment:</strong> <span class="payment-badge">${invoice.payment_status}</span></p>
                                <p><strong>Created:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <h3>Items</h3>
                        ${itemsHTML}
                        <div style="background-color: #f8f9fa; padding: 1rem; margin-top: 1rem; border-radius: 4px;">
                            <p style="display: flex; justify-content: space-between; margin: 0.5rem 0;"><strong>Subtotal:</strong> <strong>$${invoice.subtotal.toFixed(2)}</strong></p>
                            <p style="display: flex; justify-content: space-between; margin: 0.5rem 0;"><strong>Tax (10%):</strong> <strong>$${invoice.tax_amount.toFixed(2)}</strong></p>
                            <p style="display: flex; justify-content: space-between; margin: 0.5rem 0; font-size: 1.1rem; color: #3498db;"><strong>Total:</strong> <strong>$${invoice.total_amount.toFixed(2)}</strong></p>
                        </div>
                    </div>
                `;
                
                this.openModal('viewInvoiceModal');
            } else {
                this.showAlert('error', 'Failed to load invoice');
            }
        } catch (error) {
            console.error('View invoice error:', error);
            this.showAlert('error', 'Failed to load invoice');
        }
    }

    /**
     * Edit invoice
     */
    async editInvoice(invoiceId) {
        try {
            const response = await fetch(`${this.apiUrl}/invoice/${invoiceId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const invoice = data.data.invoice;
                
                document.getElementById('editInvoiceId').value = invoice._id;
                document.getElementById('editInvoiceNumber').value = invoice.invoice_number;
                document.getElementById('editInvoiceStatus').value = invoice.status;
                document.getElementById('editPaymentStatus').value = invoice.payment_status;
                document.getElementById('editDueDate').value = invoice.due_date ? invoice.due_date.split('T')[0] : '';
                document.getElementById('editInvoiceTotal').textContent = `$${invoice.total_amount.toFixed(2)}`;

                this.openModal('editInvoiceModal');
            } else {
                this.showAlert('error', 'Failed to load invoice');
            }
        } catch (error) {
            console.error('Edit invoice error:', error);
            this.showAlert('error', 'Failed to load invoice');
        }
    }

    /**
     * Handle update invoice
     */
    async handleUpdateInvoice(e) {
        e.preventDefault();

        const invoiceId = document.getElementById('editInvoiceId').value;
        const status = document.getElementById('editInvoiceStatus').value;
        const paymentStatus = document.getElementById('editPaymentStatus').value;
        const dueDate = document.getElementById('editDueDate').value;

        try {
            this.showLoading('editInvoiceForm');

            // Update status
            if (status) {
                const statusResponse = await fetch(`${this.apiUrl}/invoice/${invoiceId}/status`, {
                    method: 'PUT',
                    headers: sessionManager.getAuthHeaders(),
                    body: JSON.stringify({ status })
                });

                if (!statusResponse.ok) {
                    throw new Error('Failed to update status');
                }
            }

            // Update payment status
            if (paymentStatus) {
                const paymentResponse = await fetch(`${this.apiUrl}/invoice/${invoiceId}/payment`, {
                    method: 'PUT',
                    headers: sessionManager.getAuthHeaders(),
                    body: JSON.stringify({ payment_status: paymentStatus })
                });

                if (!paymentResponse.ok) {
                    throw new Error('Failed to update payment status');
                }
            }

            // Update due date
            if (dueDate) {
                const dueResponse = await fetch(`${this.apiUrl}/invoice/${invoiceId}/due-date`, {
                    method: 'PUT',
                    headers: sessionManager.getAuthHeaders(),
                    body: JSON.stringify({ due_date: dueDate })
                });

                if (!dueResponse.ok) {
                    throw new Error('Failed to update due date');
                }
            }

            this.showAlert('success', 'Invoice updated successfully');
            this.loadInvoices();
            this.closeModal('editInvoiceModal');
        } catch (error) {
            console.error('Update invoice error:', error);
            this.showAlert('error', error.message || 'Failed to update invoice');
        } finally {
            this.hideLoading('editInvoiceForm');
        }
    }

        /**
     * Download invoice as PDF
     */
    async downloadInvoicePDF(invoiceId) {
        try {
            const response = await fetch(`${this.apiUrl}/invoice/${invoiceId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const invoice = data.data.invoice;
                
                // Generate and download PDF using client-side method
                PDFGenerator.generateInvoicePDF(invoice);
                
                this.showAlert('success', 'Invoice PDF ready! Use browser print dialog to save.');
            } else {
                this.showAlert('error', 'Failed to load invoice');
            }
        } catch (error) {
            console.error('Download invoice error:', error);
            this.showAlert('error', 'Failed to download invoice');
        }
    }

    /**
     * Send invoice via email (notification only)
     */
    async sendInvoiceEmail(invoiceId) {
        const email = prompt('Enter email address to send invoice notification:');
        if (!email) return;

        try {
            const response = await fetch(`${this.apiUrl}/invoice/${invoiceId}/send-notification`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Invoice notification sent! Customer can view online.');
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Send invoice error:', error);
            this.showAlert('error', 'Failed to send invoice notification');
        }
    }

    /**
     * Send multiple invoices
     */
    async sendBulkInvoices() {
        // Get selected invoices
        const checkboxes = document.querySelectorAll('input[name="invoice-select"]:checked');
        
        if (checkboxes.length === 0) {
            this.showAlert('error', 'Please select at least one invoice');
            return;
        }

        const invoiceIds = Array.from(checkboxes).map(cb => cb.value);

        if (!confirm(`Send ${invoiceIds.length} invoices? This will update their status to SENT.`)) {
            return;
        }

        try {
            this.showLoading('invoicesTable');

            const response = await fetch(`${this.apiUrl}/invoice/bulk-send`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({ invoice_ids: invoiceIds })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', `Successfully sent ${data.data.sent} invoices`);
                this.loadInvoices();
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Bulk send error:', error);
            this.showAlert('error', 'Failed to send invoices');
        } finally {
            this.hideLoading('invoicesTable');
        }
    }

    /**
     * Delete invoice
     */
    async deleteInvoice(invoiceId) {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        try {
            const response = await fetch(`${this.apiUrl}/invoice/${invoiceId}`, {
                method: 'DELETE',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Invoice deleted successfully');
                this.loadInvoices();
            } else {
                this.showAlert('error', data.message);
            }
        } catch (error) {
            console.error('Delete invoice error:', error);
            this.showAlert('error', 'Failed to delete invoice');
        }
    }

    /**
     * Load invoice statistics
     */
    async loadInvoiceStats() {
        try {
            const response = await fetch(`${this.apiUrl}/invoice/statistics`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const stats = data.data;
                
                if (document.getElementById('totalInvoices')) {
                    document.getElementById('totalInvoices').textContent = stats.total_invoices;
                }
                if (document.getElementById('invoiceRevenue')) {
                    document.getElementById('invoiceRevenue').textContent = `$${stats.total_revenue.toFixed(2)}`;
                }
                if (document.getElementById('unpaidInvoices')) {
                    document.getElementById('unpaidInvoices').textContent = stats.unpaid_invoices;
                }
                if (document.getElementById('avgInvoiceValue')) {
                    document.getElementById('avgInvoiceValue').textContent = `$${stats.average_invoice_value.toFixed(2)}`;
                }
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    /**
     * Handle search invoices
     */
    handleSearchInvoices(e) {
        const searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.loadInvoices(1, searchQuery);
    }

    /**
     * Handle status filter
     */
    handleStatusFilter(e) {
        const status = e.target.value;
        this.currentPage = 1;
        this.loadInvoices(1, '', status);
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
let invoiceManager;
document.addEventListener('DOMContentLoaded', () => {
    if (sessionManager.isAuthenticated()) {
        invoiceManager = new InvoiceManager();
        invoiceManager.loadInvoices();
    } else {
        window.location.href = 'login.html';
    }
});