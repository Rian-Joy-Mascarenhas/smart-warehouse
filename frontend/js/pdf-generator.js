/**
 * Client-side PDF Generator
 * Generates PDF invoices using browser's print capability
 */

class PDFGenerator {
    /**
     * Generate and download invoice as PDF
     */
    static generateInvoicePDF(invoice) {
        // Create HTML content
        const html = this.generateInvoiceHTML(invoice);
        
        // Create temporary element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.id = 'invoice-pdf-content';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        
        // Print to PDF
        setTimeout(() => {
            window.print();
            // Clean up after print dialog closes
            setTimeout(() => {
                document.body.removeChild(tempDiv);
            }, 100);
        }, 100);
    }
    
    /**
     * Generate invoice HTML
     */
    static generateInvoiceHTML(invoice) {
        const createdDate = new Date(invoice.created_at).toLocaleDateString();
        const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not Set';
        
        let itemsHTML = '';
        invoice.items.forEach(item => {
            const total = (item.quantity * item.price).toFixed(2);
            itemsHTML += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.product_id}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.price.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${total}</td>
                </tr>
            `;
        });
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoice_number}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 0; }
                        #invoice-pdf-content { margin: 0; padding: 0; }
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .invoice-container {
                        max-width: 900px;
                        margin: 0 auto;
                        border: 1px solid #ddd;
                        padding: 30px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #2C3E50;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0;
                        color: #2C3E50;
                        font-size: 28px;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #7F8C8D;
                        font-size: 12px;
                    }
                    .invoice-details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 30px;
                    }
                    .detail-section h3 {
                        margin-top: 0;
                        color: #2C3E50;
                        font-size: 14px;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 10px;
                    }
                    .detail-section p {
                        margin: 5px 0;
                        font-size: 13px;
                    }
                    .detail-section strong {
                        display: inline-block;
                        width: 120px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th {
                        background-color: #34495E;
                        color: white;
                        padding: 12px;
                        text-align: left;
                        font-size: 13px;
                    }
                    td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        font-size: 13px;
                    }
                    .totals {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 30px;
                    }
                    .totals-table {
                        width: 300px;
                    }
                    .totals-table tr td:first-child {
                        text-align: right;
                        font-weight: bold;
                        border: none;
                        padding-right: 20px;
                    }
                    .totals-table tr td:last-child {
                        text-align: right;
                        border: none;
                    }
                    .total-row {
                        background-color: #E8F4F8;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                        margin-top: 30px;
                        font-size: 12px;
                        color: #7F8C8D;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 5px 10px;
                        border-radius: 3px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    .status-draft {
                        background-color: #ecf0f1;
                        color: #495057;
                    }
                    .status-sent {
                        background-color: #d1ecf1;
                        color: #0c5460;
                    }
                    .status-paid {
                        background-color: #d4edda;
                        color: #155724;
                    }
                    @page { margin: 0.5cm; }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="header">
                        <h1>Smart Warehouse</h1>
                        <p>info@smartwarehouse.com | +1-800-WAREHOUSE</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                        <div>
                            <h3 style="margin: 0 0 10px 0; color: #2C3E50; font-size: 14px;">INVOICE DETAILS</h3>
                            <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
                            <p><strong>Date:</strong> ${createdDate}</p>
                            <p><strong>Due Date:</strong> ${dueDate}</p>
                            <p><strong>Status:</strong> <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 10px 0; color: #2C3E50; font-size: 14px;">PAYMENT STATUS</h3>
                            <p><strong>Payment:</strong> ${invoice.payment_status}</p>
                            <p><strong>Order ID:</strong> ${invoice.order_id}</p>
                        </div>
                    </div>
                    
                    <div class="invoice-details">
                        <div class="detail-section">
                            <h3>BILL TO:</h3>
                            <p><strong>Name:</strong> ${invoice.customer_name}</p>
                            <p><strong>Email:</strong> ${invoice.customer_email}</p>
                            <p><strong>Phone:</strong> ${invoice.customer_phone}</p>
                            <p><strong>Address:</strong> ${invoice.customer_address}</p>
                            <p>${invoice.customer_city}, ${invoice.customer_state} ${invoice.customer_zip}</p>
                            <p>${invoice.customer_country}</p>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: center;">Quantity</th>
                                <th style="text-align: right;">Unit Price</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                    
                    <div class="totals">
                        <table class="totals-table">
                            <tr>
                                <td>Subtotal:</td>
                                <td>$${invoice.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Tax (10%):</td>
                                <td>$${invoice.tax_amount.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td>TOTAL:</td>
                                <td>$${invoice.total_amount.toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>Generated on ${new Date().toLocaleString()}</p>
                        <p>This is an automatically generated invoice.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}