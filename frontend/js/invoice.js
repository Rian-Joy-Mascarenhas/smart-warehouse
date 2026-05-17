/**
 * Invoice Management Module
 * Handles invoice operations and PDF generation
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
        // Create invoice from order
        const createInvoiceForm = document.getElementById('createInvoiceForm');
        if (createInvoiceForm) {
            createInvoiceForm.addEventListener('submit', (e) => this.handleCreateInvoice(e));
        }

        // Search functionality
        const searchInvoices = document.getElementById('searchInvoices');
        if (searchInvoices) {
            searchInvoices.addEventListener('input', (e) => this.handleSearch(e));
        }

        // Edit invoice form
        const editInvoiceForm = document.getElementById('editInvoiceForm');
        if (editInvoiceForm) {
            editInvoiceForm.addEventListener('submit', (e) => this.handleUpdateInvoice(e));
        }
    }

    /**
     * Load invoices
     */
    async loadInvoices(page = 1, search = '') {
        try {
            this.showLoading('invoicesTable');

            let url = `${this.apiUrl}/invoice/invoices?page=${page}&per_page=${this.itemsPerPage}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.displayInvoices(data.data.invoices);
                this.displayPagination(data.data.pagination);
                this.loadInvoiceStats();
            } else {
                this.showAlert('error', data.message || 'Failed to load invoices');
            }
        } catch (error) {
            console.error('Load invoices error:', error);
            this.showAlert('error', 'Failed to load invoices: ' + error.message);
        } finally {
            this.hideLoading('invoicesTable');
        }
    }

    /**
     * Display invoices in table
     */
    displayInvoices(invoices) {
        const tbody = document.querySelector('#invoicesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No invoices found</td></tr>';
            return;
        }

        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            const createdDate = new Date(invoice.created_at).toLocaleDateString();

            row.innerHTML = `
                <td>${invoice.invoice_number}</td>
                <td>${createdDate}</td>
                <td>${invoice.payment_method}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="invoiceManager.viewInvoice('${invoice._id}')">View</button>
                    <button class="btn btn-sm btn-edit" onclick="invoiceManager.editInvoice('${invoice._id}')">Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="invoiceManager.deleteInvoice('${invoice._id}')">Delete</button>
                </td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="invoiceManager.downloadPDF('${invoice._id}')">PDF</button>
                    <button class="btn btn-sm btn-secondary" onclick="invoiceManager.printInvoice('${invoice._id}')">Print</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Display pagination
     */
    displayPagination(pagination) {
        const paginationDiv = document.getElementById('invoicePagination');
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
     * Handle create invoice from order
     */
    async handleCreateInvoice(e) {
        e.preventDefault();

        const orderSelect = document.getElementById('orderSelect')?.value;
        const paymentMethod = document.getElementById('paymentMethod')?.value.trim();
        const notes = document.getElementById('invoiceNotes')?.value.trim();

        if (!orderSelect) {
            this.showAlert('error', 'Please select an order');
            return;
        }

        if (!paymentMethod) {
            this.showAlert('error', 'Please select a payment method');
            return;
        }

        try {
            this.showLoading('createInvoiceForm');

            const response = await fetch(`${this.apiUrl}/invoice/invoices`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({
                    order_id: orderSelect,
                    payment_method: paymentMethod,
                    notes: notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Invoice created successfully');
                document.getElementById('createInvoiceForm').reset();
                this.loadInvoices();
                this.closeModal('createInvoiceModal');
            } else {
                this.showAlert('error', data.message || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Create invoice error:', error);
            this.showAlert('error', 'Failed to create invoice: ' + error.message);
        } finally {
            this.hideLoading('createInvoiceForm');
        }
    }

    /**
     * View invoice with full details
     */
    async viewInvoice(invoiceId) {
        try {
            const response = await fetch(`${this.apiUrl}/invoice/invoices/${invoiceId}/details`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const invoiceData = data.data;
                this.displayInvoicePreview(invoiceData);
                this.openModal('invoicePreviewModal');
            } else {
                this.showAlert('error', 'Failed to load invoice details');
            }
        } catch (error) {
            console.error('View invoice error:', error);
            this.showAlert('error', 'Failed to load invoice');
        }
    }

    /**
     * Display invoice preview
     */
    displayInvoicePreview(invoiceData) {
        const container = document.getElementById('invoicePreviewContainer');
        if (!container) return;

        const { invoice, order, customer, company } = invoiceData;
        const invoiceDate = new Date(invoice.created_at);
        const formattedDate = invoiceDate.toLocaleDateString();
        const formattedTime = invoiceDate.toLocaleTimeString();

        // Calculate totals
        let subtotal = 0;
        order.items.forEach(item => {
            subtotal += item.quantity * item.price;
        });
        const tax = order.tax_amount;
        const total = order.total_amount;

        // Build items table
        let itemsHTML = '';
        order.items.forEach(item => {
            const itemTotal = item.quantity * item.price;
            itemsHTML += `
                <tr>
                    <td style="text-align: center; color: #000;">${item.quantity}</td>
                    <td style="color: #000;">${item.product_name}</td>
                    <td style="text-align: right; color: #000;">₹${item.price.toFixed(2)}</td>
                    <td style="text-align: right; color: #000;">₹${itemTotal.toFixed(2)}</td>
                    <td style="text-align: right; color: #000;">₹${(itemTotal * 0.1).toFixed(2)}</td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div style="padding: 2rem; background: white; color: black; font-family: Arial, sans-serif;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="color: #27a87d; margin: 0; font-size: 2rem;"><div>${company.company_name || ''}</div> Receipt</h1>
                </div>

                <!-- Receipt Info -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2rem; text-align: center;">
                    <div>
                        <div style="font-weight: bold; color: #27a87d;">Receipt Number</div>
                        <div>${invoice.invoice_number}</div>
                    </div>
                    <div>
                        <div style="font-weight: bold; color: #27a87d;">Receipt Date</div>
                        <div>${formattedDate} ${formattedTime}</div>
                    </div>
                    <div>
                        <div style="font-weight: bold; color: #27a87d;">Payment Method</div>
                        <div>${invoice.payment_method}</div>
                    </div>
                </div>

                <hr style="border: none; border-top: 2px solid #27a87d; margin: 2rem 0;">

                <!-- Customer & Company Info -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                    <div>
                        <div style="font-weight: bold; color: #27a87d; margin-bottom: 0.5rem;">Customer</div>
                        <div>${customer.name}</div>
                        <div>${customer.address}</div>
                        <div>${customer.city}, ${customer.state} ${customer.zip_code}</div>
                        <div>${customer.country}</div>
                    </div>
                    <div>
                        <div style="font-weight: bold; color: #27a87d; margin-bottom: 0.5rem;">Seller</div>
                        <div>${company.username || 'N/A'}</div>
                        <div>${company.email || 'N/A'}</div>
                        <div>${company.company_address || 'N/A'}</div>
                    </div>
                </div>

                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin: 2rem 0;">
                    <thead style="background: #27a87d; color: white;">
                        <tr>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: center;">QUANTITY</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d;">DESCRIPTION</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: right;">UNIT PRICE</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: right;">SUBTOTAL</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: right;">TAX</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <!-- Totals -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
                    <div></div>
                    <div style="text-align: right;">
                        <div style="margin-bottom: 0.5rem;">
                            <span style="font-weight: bold;">SUBTOTAL</span>
                            <span style="float: right;">₹${subtotal.toFixed(2)}</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <span style="font-weight: bold;">TAX (10%)</span>
                            <span style="float: right;">₹${tax.toFixed(2)}</span>
                        </div>
                        <div style="border-top: 2px solid #27a87d; padding-top: 0.5rem; color: #27a87d; font-weight: bold; font-size: 1.2rem;">
                            <span>Total</span>
                            <span style="float: right;">₹${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- Notes -->
                <div style="margin: 2rem 0; padding: 1rem; border: 1px solid #ddd; min-height: 100px;">
                    <div style="font-weight: bold; color: #27a87d; margin-bottom: 0.5rem;">Notes</div>
                    <div>${invoice.notes || 'N/A'}</div>
                </div>

                <!-- Signature Area -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; margin-top: 3rem; text-align: center;">
                    <div>
                        <div style="border-top: 2px solid black; padding-top: 1rem;">Salesperson</div>
                    </div>
                    <div>
                        <div style="border-top: 2px solid black; padding-top: 1rem;">Signature</div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 2rem; color: #27a87d; font-weight: bold;">
                    Thank you for the payment!
                </div>
            </div>
        `;
    }

    /**
     * Download invoice as PDF
     */
    async downloadPDF(invoiceId) {
        try {
            // Load invoice details
            const response = await fetch(`${this.apiUrl}/invoice/invoices/${invoiceId}/details`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                this.showAlert('error', 'Failed to load invoice');
                return;
            }

            // Load html2pdf library if not already loaded
            if (!window.html2pdf) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                document.head.appendChild(script);

                await new Promise(resolve => {
                    script.onload = resolve;
                });
            }

            // Create temporary container
            const tempContainer = document.createElement('div');
            const invoiceData = data.data;

            // Generate invoice HTML
            tempContainer.innerHTML = this.generateInvoiceHTML(invoiceData);

            // Configure PDF options
            const opt = {
                margin: 10,
                filename: `${invoiceData.invoice.invoice_number}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };

            // Generate PDF
            html2pdf().set(opt).from(tempContainer).save();

            this.showAlert('success', 'PDF downloaded successfully');
        } catch (error) {
            console.error('Download PDF error:', error);
            this.showAlert('error', 'Failed to download PDF: ' + error.message);
        }
    }

    /**
     * Generate invoice HTML for PDF
     */
    generateInvoiceHTML(invoiceData) {
        const { invoice, order, customer, company } = invoiceData;
        const invoiceDate = new Date(invoice.created_at);
        const formattedDate = invoiceDate.toLocaleDateString();
        const formattedTime = invoiceDate.toLocaleTimeString();

        let subtotal = 0;
        let itemsHTML = '';

        order.items.forEach(item => {
            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;
            itemsHTML += `
                <tr>
                    <td style="text-align: center; padding: 0.75rem; border: 1px solid #ddd; color: #000;">${item.quantity}</td>
                    <td style="padding: 0.75rem; border: 1px solid #ddd; color: #000;">${item.product_name}</td>
                    <td style="text-align: right; padding: 0.75rem; border: 1px solid #ddd; color: #000;">₹${item.price.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.75rem; border: 1px solid #ddd; color: #000;">₹${itemTotal.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.75rem; border: 1px solid #ddd; color: #000;">₹${(itemTotal * 0.1).toFixed(2)}</td>
                </tr>
            `;
        });

        return `
            <div style="padding: 2rem; background: white; color: black; font-family: Arial, sans-serif; width: 100%;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="color: #27a87d; margin: 0; font-size: 2rem;"><div>${company.company_name || ''}</div> Receipt</h1>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2rem; text-align: center; font-size: 0.9rem;">
                    <div>
                        <div style="font-weight: bold; color: #27a87d;">Receipt Number</div>
                        <div>${invoice.invoice_number}</div>
                    </div>
                    <div>
                        <div style="font-weight: bold; color: #27a87d;">Receipt Date</div>
                        <div>${formattedDate} ${formattedTime}</div>
                    </div>
                    <div>
                        <div style="font-weight: bold; color: #27a87d;">Payment Method</div>
                        <div>${invoice.payment_method}</div>
                    </div>
                </div>

                <hr style="border: none; border-top: 2px solid #27a87d; margin: 1.5rem 0;">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
                    <div>
                        <div style="font-weight: bold; color: #27a87d; margin-bottom: 0.5rem;">Customer</div>
                        <div>${customer.name}</div>
                        <div>${customer.address}</div>
                        <div>${customer.city}, ${customer.state}</div>
                    </div>
                    <div>
                        <div style="font-weight: bold; color: #27a87d; margin-bottom: 0.5rem;">Seller</div>
                        <div>${company.username || 'N/A'}</div>
                        <div>${company.email || 'N/A'}</div>
                        <div>${company.company_address || 'N/A'}</div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.85rem;">
                    <thead style="background: #27a87d; color: white;">
                        <tr>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: center;">QTY</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d;">DESCRIPTION</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: right;">UNIT PRICE</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: right;">SUBTOTAL</th>
                            <th style="padding: 0.75rem; border: 1px solid #27a87d; text-align: right;">TAX</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 1.5rem 0; font-size: 0.9rem;">
                    <div></div>
                    <div style="text-align: right;">
                        <div style="margin-bottom: 0.5rem;">
                            <span style="font-weight: bold;">SUBTOTAL</span>
                            <span style="float: right;">₹${subtotal.toFixed(2)}</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <span style="font-weight: bold;">TAX (10%)</span>
                            <span style="float: right;">₹${order.tax_amount.toFixed(2)}</span>
                        </div>
                        <div style="border-top: 2px solid #27a87d; padding-top: 0.5rem; color: #27a87d; font-weight: bold;">
                            <span>Total</span>
                            <span style="float: right;">₹${order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div style="margin: 1.5rem 0; padding: 1rem; border: 1px solid #ddd; min-height: 80px; font-size: 0.9rem;">
                    <div style="font-weight: bold; color: #27a87d; margin-bottom: 0.5rem;">Notes</div>
                    <div>${invoice.notes || 'N/A'}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; margin-top: 2rem; text-align: center; font-size: 0.85rem;">
                    <div>
                        <div style="border-top: 2px solid black; padding-top: 0.75rem;">Salesperson</div>
                    </div>
                    <div>
                        <div style="border-top: 2px solid black; padding-top: 0.75rem;">Signature</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 1.5rem; color: #27a87d; font-weight: bold; font-size: 0.9rem;">
                    Thank you for the payment!
                </div>
            </div>
        `;
    }

    /**
     * Print invoice
     */
    async printInvoice(invoiceId) {
        try {
            const response = await fetch(`${this.apiUrl}/invoice/invoices/${invoiceId}/details`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                this.showAlert('error', 'Failed to load invoice');
                return;
            }

            const invoiceData = data.data;
            const printWindow = window.open('', '', 'height=800,width=900');

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice - ${invoiceData.invoice.invoice_number}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; color: black; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background: #27a87d; color: white; }
                        h1 { color: #27a87d; text-align: center; }
                        .totals { text-align: right; font-weight: bold; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    ${this.generateInvoiceHTML(invoiceData)}
                    <br>
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Print invoice error:', error);
            this.showAlert('error', 'Failed to print invoice');
        }
    }

    /**
     * Edit invoice
     */
    async editInvoice(invoiceId) {
        try {
            const response = await fetch(`${this.apiUrl}/invoice/invoices/${invoiceId}`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const invoice = data.data.invoice;

                document.getElementById('editInvoiceId').value = invoice._id;
                document.getElementById('editPaymentMethod').value = invoice.payment_method;
                document.getElementById('editInvoiceNotes').value = invoice.notes;

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
        const paymentMethod = document.getElementById('editPaymentMethod').value.trim();
        const notes = document.getElementById('editInvoiceNotes').value.trim();

        try {
            this.showLoading('editInvoiceForm');

            const response = await fetch(`${this.apiUrl}/invoice/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({
                    payment_method: paymentMethod,
                    notes: notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', 'Invoice updated successfully');
                this.loadInvoices();
                this.closeModal('editInvoiceModal');
            } else {
                this.showAlert('error', data.message || 'Failed to update invoice');
            }
        } catch (error) {
            console.error('Update invoice error:', error);
            this.showAlert('error', 'Failed to update invoice');
        } finally {
            this.hideLoading('editInvoiceForm');
        }
    }

    /**
     * Delete invoice
     */
    async deleteInvoice(invoiceId) {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        try {
            const response = await fetch(`${this.apiUrl}/invoice/invoices/${invoiceId}`, {
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
     * Handle search
     */
    handleSearch(e) {
        const searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.loadInvoices(1, searchQuery);
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
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
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