/**
 * Invoice Generation Module - Frontend JavaScript
 * Handles all invoice operations on the client side
 */

// Configuration
const API_BASE_URL = "http://localhost:5000/api/invoice";
let currentInvoice = null;
let itemCount = 0;

/**
 * Initialize the invoice page
 * Called when the page loads
 */
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Add initial product row
  addProductRow();

  // Load invoices list
  loadInvoices();

  // Set up event listeners
  document
    .getElementById("taxPercentage")
    .addEventListener("change", updateCalculations);
});

/**
 * Add a new product row to the form
 */
function addProductRow() {
  const container = document.getElementById("itemsContainer");
  const itemRow = document.createElement("div");
  itemRow.className = "item-row";
  itemRow.id = `item-${itemCount}`;

  itemRow.innerHTML = `
        <div>
            <label class="form-label">Product Name *</label>
            <input type="text" class="form-control product-name" placeholder="Enter product name" onchange="updateCalculations()">
        </div>
        <div>
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-control product-qty" placeholder="Quantity" min="1" onchange="updateCalculations()">
        </div>
        <div>
            <label class="form-label">Price per Item *</label>
            <input type="number" class="form-control product-price" placeholder="Price" min="0" step="0.01" onchange="updateCalculations()">
        </div>
        <button type="button" class="btn btn-icon-sm btn-remove" onclick="removeProductRow(${itemCount})" title="Remove item">
            <i class="fas fa-trash"></i>
        </button>
    `;

  container.appendChild(itemRow);
  itemCount++;
}

/**
 * Remove a product row
 * @param {number} index - Row index to remove
 */
function removeProductRow(index) {
  const row = document.getElementById(`item-${index}`);
  if (row) {
    row.remove();
    updateCalculations();
  }
}

/**
 * Update calculations for real-time updates
 */
function updateCalculations() {
  const items = getFormItems();
  const taxPercentage =
    parseFloat(document.getElementById("taxPercentage").value) || 0;

  if (items.length === 0) return;

  // Calculate subtotal
  let subtotal = 0;
  items.forEach((item) => {
    const itemTotal =
      parseFloat(item.quantity) * parseFloat(item.price_per_item);
    subtotal += itemTotal;
  });

  // Calculate tax
  const tax = subtotal * (taxPercentage / 100);
  const total = subtotal + tax;

  // Update display if preview exists
  if (currentInvoice) {
    currentInvoice.subtotal = subtotal;
    currentInvoice.tax_amount = tax;
    currentInvoice.total = total;
    currentInvoice.items = items;
    currentInvoice.tax_percentage = taxPercentage;
    renderInvoicePreview();
  }
}

/**
 * Get form data for items
 * @returns {Array} Array of item objects
 */
function getFormItems() {
  const items = [];
  const itemRows = document.querySelectorAll(".item-row");

  itemRows.forEach((row) => {
    const productName = row.querySelector(".product-name").value.trim();
    const quantity = row.querySelector(".product-qty").value.trim();
    const price = row.querySelector(".product-price").value.trim();

    if (productName && quantity && price) {
      items.push({
        product_name: productName,
        quantity: parseFloat(quantity),
        price_per_item: parseFloat(price),
      });
    }
  });

  return items;
}

/**
 * Validate form data before submission
 * @returns {Object} Validation result with status and message
 */
function validateForm() {
  // Validate customer details
  const customerName = document.getElementById("customerName").value.trim();
  const customerEmail = document.getElementById("customerEmail").value.trim();
  const customerPhone = document.getElementById("customerPhone").value.trim();

  if (!customerName) {
    return { valid: false, message: "Please enter customer name" };
  }

  if (!customerEmail || !customerEmail.includes("@")) {
    return { valid: false, message: "Please enter a valid email address" };
  }

  if (!customerPhone) {
    return { valid: false, message: "Please enter customer phone number" };
  }

  // Validate items
  const items = getFormItems();
  if (items.length === 0) {
    return { valid: false, message: "Please add at least one product" };
  }

  return { valid: true, message: "Form is valid" };
}

/**
 * Generate invoice and send to server
 */
async function generateInvoice() {
  try {
    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
      showAlert(validation.message, "danger");
      return;
    }

    // Prepare invoice data
    const invoiceData = {
      customer_details: {
        name: document.getElementById("customerName").value.trim(),
        email: document.getElementById("customerEmail").value.trim(),
        phone: document.getElementById("customerPhone").value.trim(),
      },
      items: getFormItems(),
      tax_percentage:
        parseFloat(document.getElementById("taxPercentage").value) || 10,
    };

    // Show loading state
    showLoadingState(true);

    // Make API request
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invoiceData),
    });

    const result = await response.json();

    // Hide loading state
    showLoadingState(false);

    if (!response.ok) {
      showAlert(result.message || "Failed to create invoice", "danger");
      return;
    }

    // Store current invoice
    currentInvoice = result.invoice;

    // Show success message
    showAlert("Invoice created successfully!", "success");

    // Render preview
    renderInvoicePreview();

    // Show invoice card
    document.getElementById("invoiceCard").style.display = "block";

    // Reload invoices list
    loadInvoices();

    // Scroll to preview
    document
      .getElementById("invoiceCard")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showLoadingState(false);
    console.error("Error creating invoice:", error);
    showAlert("An error occurred while creating invoice", "danger");
  }
}

/**
 * Render invoice preview in HTML
 */
function renderInvoicePreview() {
  if (!currentInvoice) return;

  const invoice = currentInvoice;
  const createdDate = new Date(invoice.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let itemsHTML = "";
  invoice.items.forEach((item) => {
    const itemTotal = (
      parseFloat(item.quantity) * parseFloat(item.price_per_item)
    ).toFixed(2);
    itemsHTML += `
            <tr>
                <td>${item.product_name}</td>
                <td class="text-right">${parseFloat(item.quantity).toFixed(0)}</td>
                <td class="text-right">$${parseFloat(item.price_per_item).toFixed(2)}</td>
                <td class="text-right"><strong>$${itemTotal}</strong></td>
            </tr>
        `;
  });

  const previewHTML = `
        <div class="invoice-header">
            <div class="company-info">
                <h2>📦 Smart Warehouse</h2>
                <p>123 Warehouse Street, Business City, ST 12345</p>
                <p>(555) 123-4567 | info@smartwarehouse.com</p>
            </div>
            <div class="invoice-details">
                <div class="invoice-number">${invoice.invoice_number}</div>
                <div class="invoice-date">${createdDate}</div>
            </div>
        </div>

        <div style="margin-bottom: 30px;">
            <h5 style="color: var(--text-dark); font-weight: 600; margin-bottom: 10px;">Bill To</h5>
            <p style="margin: 0; font-weight: 600;">${invoice.customer_details.name}</p>
            <p style="margin: 0; color: var(--text-muted);">${invoice.customer_details.email}</p>
            <p style="margin: 0; color: var(--text-muted);">${invoice.customer_details.phone}</p>
        </div>

        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <div class="invoice-totals">
            <div class="totals-box">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>$${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Tax (${invoice.tax_percentage}%)</span>
                    <span>$${invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div class="total-row final">
                    <span>Total Amount</span>
                    <span>$${invoice.total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-color); text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            <p>Thank you for your business!</p>
            <p>Smart Warehouse &copy; 2026 - All Rights Reserved</p>
        </div>
    `;

  document.getElementById("invoicePreview").innerHTML = previewHTML;
}

/**
 * Print invoice
 */
function printInvoice() {
  window.print();
}

/**
 * Download invoice as PDF
 */
async function downloadPDF() {
  if (!currentInvoice || !currentInvoice.invoice_number) {
    showAlert("Invoice number not found", "danger");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const invoiceNumber = currentInvoice.invoice_number;

    const response = await fetch(
      `${API_BASE_URL}/download-pdf/${invoiceNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }

    // Get PDF as blob
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showAlert("Invoice downloaded successfully!", "success");
  } catch (error) {
    console.error("Error downloading PDF:", error);
    showAlert("Failed to download PDF", "danger");
  }
}

/**
 * Load invoices list
 */
async function loadInvoices() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/all?page=1&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load invoices");
    }

    const result = await response.json();
    renderInvoicesList(result.invoices || []);
  } catch (error) {
    console.error("Error loading invoices:", error);
    document.getElementById("invoicesListContainer").innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle"></i> Failed to load invoices
            </div>
        `;
  }
}

/**
 * Render invoices list in table format
 * @param {Array} invoices - List of invoices
 */
function renderInvoicesList(invoices) {
  const container = document.getElementById("invoicesListContainer");

  if (invoices.length === 0) {
    container.innerHTML = `
            <div class="alert alert-info" role="alert" style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-info-circle"></i> No invoices found. Create your first invoice!
            </div>
        `;
    return;
  }

  let tableHTML = `
        <div class="table-responsive">
            <table class="table table-hover" style="margin: 0;">
                <thead style="background: var(--light-bg); font-weight: 600;">
                    <tr>
                        <th style="color: var(--text-dark);">Invoice Number</th>
                        <th style="color: var(--text-dark);">Customer</th>
                        <th style="color: var(--text-dark);">Amount</th>
                        <th style="color: var(--text-dark);">Date</th>
                        <th style="color: var(--text-dark);">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

  invoices.forEach((invoice) => {
    const date = new Date(invoice.created_at).toLocaleDateString();
    tableHTML += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td><strong style="color: var(--primary-color);">${invoice.invoice_number}</strong></td>
                <td>${invoice.customer_details.name}</td>
                <td><strong>$${invoice.total.toFixed(2)}</strong></td>
                <td>${date}</td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-icon-sm" style="background: var(--primary-color); color: white;" 
                                onclick="viewInvoice('${invoice.invoice_number}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon-sm" style="background: var(--secondary-color); color: white;" 
                                onclick="downloadInvoicePDF('${invoice.invoice_number}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-icon-sm btn-remove" 
                                onclick="deleteInvoice('${invoice.invoice_number}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });

  tableHTML += `
                </tbody>
            </table>
        </div>
    `;

  container.innerHTML = tableHTML;
}

/**
 * View existing invoice
 * @param {string} invoiceNumber - Invoice number to view
 */
async function viewInvoice(invoiceNumber) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/get/${invoiceNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load invoice");
    }

    const result = await response.json();
    currentInvoice = result.invoice;
    renderInvoicePreview();
    document.getElementById("invoiceCard").style.display = "block";
    document
      .getElementById("invoiceCard")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error loading invoice:", error);
    showAlert("Failed to load invoice", "danger");
  }
}

/**
 * Download specific invoice PDF
 * @param {string} invoiceNumber - Invoice number to download
 */
async function downloadInvoicePDF(invoiceNumber) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/download-pdf/${invoiceNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showAlert("Invoice downloaded successfully!", "success");
  } catch (error) {
    console.error("Error downloading PDF:", error);
    showAlert("Failed to download PDF", "danger");
  }
}

/**
 * Delete invoice
 * @param {string} invoiceNumber - Invoice number to delete
 */
async function deleteInvoice(invoiceNumber) {
  if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/delete/${invoiceNumber}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete invoice");
    }

    showAlert("Invoice deleted successfully!", "success");
    loadInvoices();

    // Hide invoice card if viewing deleted invoice
    if (currentInvoice && currentInvoice.invoice_number === invoiceNumber) {
      document.getElementById("invoiceCard").style.display = "none";
      resetForm();
    }
  } catch (error) {
    console.error("Error deleting invoice:", error);
    showAlert("Failed to delete invoice", "danger");
  }
}

/**
 * Search invoices
 */
async function searchInvoices() {
  const searchTerm = document.getElementById("searchInput").value.trim();

  if (!searchTerm) {
    loadInvoices();
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        search_term: searchTerm,
        search_type: searchTerm.startsWith("INV-")
          ? "invoice_number"
          : "customer",
      }),
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const result = await response.json();
    renderInvoicesList(result.invoices || []);
  } catch (error) {
    console.error("Error searching invoices:", error);
    showAlert("Failed to search invoices", "danger");
  }
}

/**
 * Reset form to initial state
 */
function resetForm() {
  document.getElementById("customerName").value = "";
  document.getElementById("customerEmail").value = "";
  document.getElementById("customerPhone").value = "";
  document.getElementById("taxPercentage").value = "10";

  const container = document.getElementById("itemsContainer");
  container.innerHTML = "";

  addProductRow();
  currentInvoice = null;
  document.getElementById("invoiceCard").style.display = "none";
  document.getElementById("alertBox").style.display = "none";
}

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger, info, warning)
 */
function showAlert(message, type = "info") {
  const alertBox = document.getElementById("alertBox");
  alertBox.className = `alert-custom alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = "none";
  }, 5000);
}

/**
 * Show/hide loading state
 * @param {boolean} show - Show or hide loading
 */
function showLoadingState(show) {
  // Could be expanded to show a spinner
  console.log(show ? "Loading..." : "Done loading");
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
