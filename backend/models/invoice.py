"""
Invoice Model for MongoDB
Handles the structure and validation of invoice data
"""
from datetime import datetime
from bson.objectid import ObjectId

class Invoice:
    """
    Invoice class to represent invoice documents in MongoDB
    Handles invoice creation, validation, and data structure
    """
    
    # Counter for invoice numbering (stored separately in DB)
    INVOICE_COUNTER_KEY = "invoice_counter"
    
    def __init__(self, customer_details, items, tax_percentage=10, created_by=None):
        """
        Initialize Invoice object
        
        Args:
            customer_details (dict): Customer information including name, email, phone
            items (list): List of product items with quantity and price
            tax_percentage (float): Tax percentage to apply (default: 10%)
            created_by (str): User ID who created the invoice
        """
        self.customer_details = customer_details
        self.items = items
        self.tax_percentage = tax_percentage
        self.created_by = created_by
        self.created_at = datetime.utcnow()
        self.status = "completed"
    
    def calculate_subtotal(self):
        """
        Calculate subtotal from all items
        
        Returns:
            float: Total amount before tax
        """
        subtotal = 0
        for item in self.items:
            subtotal += float(item['price_per_item']) * float(item['quantity'])
        return round(subtotal, 2)
    
    def calculate_tax(self):
        """
        Calculate tax amount based on subtotal
        
        Returns:
            float: Tax amount
        """
        subtotal = self.calculate_subtotal()
        tax = subtotal * (float(self.tax_percentage) / 100)
        return round(tax, 2)
    
    def calculate_total(self):
        """
        Calculate final total (subtotal + tax)
        
        Returns:
            float: Final total amount
        """
        return round(self.calculate_subtotal() + self.calculate_tax(), 2)
    
    def to_dict(self, invoice_number=None):
        """
        Convert invoice to dictionary for MongoDB storage
        
        Args:
            invoice_number (str): Unique invoice number
            
        Returns:
            dict: Invoice data as dictionary
        """
        return {
            'invoice_number': invoice_number,
            'customer_details': self.customer_details,
            'items': self.items,
            'subtotal': self.calculate_subtotal(),
            'tax_percentage': self.tax_percentage,
            'tax_amount': self.calculate_tax(),
            'total': self.calculate_total(),
            'created_at': self.created_at,
            'created_by': self.created_by,
            'status': self.status
        }
    
    @staticmethod
    def validate_customer_details(customer_details):
        """
        Validate customer information
        
        Args:
            customer_details (dict): Customer data to validate
            
        Returns:
            tuple: (bool, str) - (is_valid, error_message)
        """
        required_fields = ['name', 'email', 'phone']
        
        for field in required_fields:
            if field not in customer_details or not customer_details[field]:
                return False, f"Missing required field: {field}"
        
        # Basic email validation
        if '@' not in customer_details['email']:
            return False, "Invalid email format"
        
        # Basic phone validation (should have at least 10 digits)
        if len(customer_details['phone'].replace('-', '').replace(' ', '')) < 10:
            return False, "Invalid phone number"
        
        return True, "Valid"
    
    @staticmethod
    def validate_items(items):
        """
        Validate invoice items
        
        Args:
            items (list): List of items to validate
            
        Returns:
            tuple: (bool, str) - (is_valid, error_message)
        """
        if not items or len(items) == 0:
            return False, "At least one item is required"
        
        for idx, item in enumerate(items):
            required_fields = ['product_name', 'quantity', 'price_per_item']
            
            for field in required_fields:
                if field not in item or not item[field]:
                    return False, f"Item {idx + 1}: Missing field '{field}'"
            
            # Validate quantity is positive number
            try:
                qty = float(item['quantity'])
                if qty <= 0:
                    return False, f"Item {idx + 1}: Quantity must be positive"
            except ValueError:
                return False, f"Item {idx + 1}: Invalid quantity"
            
            # Validate price is positive number
            try:
                price = float(item['price_per_item'])
                if price <= 0:
                    return False, f"Item {idx + 1}: Price must be positive"
            except ValueError:
                return False, f"Item {idx + 1}: Invalid price"
        
        return True, "Valid"