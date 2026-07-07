# Smart Warehouse and Invoice Management System

A web-based warehouse management solution that simplifies inventory tracking, sales processing, invoice generation, and business reporting. The system helps businesses manage stock efficiently, monitor sales activities, generate invoices automatically, and analyze warehouse performance.

## Features

### Authentication & User Management

- User Registration and Login
- JWT-based Authentication
- Secure Session Management
- User Profile Management

### Inventory Management

- Add New Products
- Update Product Information
- Delete Products
- Track Stock Levels
- Inventory Monitoring

### Sales Management

- Record Sales Transactions
- Manage Customer Purchases
- Sales Validation
- Sales History Tracking

### Invoice Management

- Generate Invoices Automatically
- Download Invoice PDFs
- Invoice Tracking
- Invoice Records Management

### Reports & Analytics

- Sales Reports
- Inventory Reports
- Business Performance Analysis
- Warehouse Statistics Dashboard

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Python
- Flask
- Flask-CORS
- Flask-JWT-Extended

### Database

- MongoDB
- PyMongo

### Additional Libraries

- Bcrypt
- Email Validator
- Python Dotenv
- Requests

---

## Project Structure

```text
smart-warehouse/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   │
│   ├── middleware/
│   │   └── auth_middleware.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── inventory.py
│   │   ├── sales.py
│   │   └── invoice.py
│   │
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── inventory_routes.py
│   │   ├── sales_routes.py
│   │   └── invoice_routes.py
│   │
│   └── utils/
│       ├── db_manager.py
│       ├── email_service.py
│       ├── pdf_generator.py
│       └── validators.py
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── index.html
│
└── startup.bat
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Rian-Joy-Mascarenhas/smart-warehouse.git
cd smart-warehouse
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Virtual Environment

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r backend/requirements.txt
```


### Run the Application

```bash
python backend/app.py
```

---

## Modules

| Module               | Description                            |
| -------------------- | -------------------------------------- |
| Authentication       | User registration, login, and security |
| Inventory Management | Product and stock control              |
| Sales Management     | Sales processing and tracking          |
| Invoice Management   | Invoice generation and PDF export      |
| Reports & Analytics  | Business insights and reporting        |

---

## Team Members

| Name                 | Responsibility                    |
| -------------------- | --------------------------------- |
| **Rian Mascarenhas** | Sales Management Module           |
| **Amogh**            | Invoice Management Module         |
| **Varun**            | Inventory Management Module       |
| **Manthan**          | Authentication & Reporting Module |

---

## Project Objectives

- Improve warehouse efficiency
- Reduce manual inventory errors
- Automate invoice generation
- Simplify sales management
- Provide actionable business insights

---

## Future Enhancements

- Barcode & QR Code Scanning
- Email Invoice Delivery
- Advanced Analytics Dashboard
- Multi-Warehouse Support
- Mobile Application
- Cloud Deployment

---

## Academic Information

**Project Title:** Smart Warehouse and Invoice Management System

**Course:** Bachelor of Computer Applications (BCA)

**University:** Mangalore University

**Academic Year:** 2025–2026

---

## License

This project is developed for educational and academic purposes only.

---

## Acknowledgements

We sincerely thank our project guide, faculty members, and Mangalore University for their guidance and support throughout the development of this project.
