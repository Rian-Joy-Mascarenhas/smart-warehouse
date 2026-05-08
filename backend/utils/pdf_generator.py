"""
PDF Generator Utility
Handles invoice PDF generation using ReportLab
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
import io

class PDFGenerator:
    """
    Generate professional PDF invoices
    Uses ReportLab library for PDF creation
    """
    
    # Company details (can be customized)
    COMPANY_NAME = "Smart Warehouse Inc."
    COMPANY_ADDRESS = "123 Warehouse Street, Business City, ST 12345"
    COMPANY_PHONE = "(555) 123-4567"
    COMPANY_EMAIL = "info@smartwarehouse.com"
    COMPANY_TAX_ID = "TAX-123456789"
    
    def __init__(self, page_size=letter):
        """
        Initialize PDF Generator
        
        Args:
            page_size: Page size (letter or A4)
        """
        self.page_size = page_size
        self.width, self.height = page_size
    
    def generate_invoice_pdf(self, invoice_data):
        """
        Generate invoice PDF from invoice data
        
        Args:
            invoice_data (dict): Invoice data from MongoDB
        
        Returns:
            BytesIO: PDF file as bytes
        """
        # Create BytesIO buffer
        pdf_buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=self.page_size,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        # Container for PDF elements
        elements = []
        
        # Add header
        elements.extend(self._create_header(invoice_data))
        
        # Add invoice details
        elements.extend(self._create_invoice_details(invoice_data))
        
        # Add items table
        elements.extend(self._create_items_table(invoice_data))
        
        # Add totals section
        elements.extend(self._create_totals_section(invoice_data))
        
        # Add footer
        elements.extend(self._create_footer())
        
        # Build PDF
        doc.build(elements)
        
        # Reset buffer position
        pdf_buffer.seek(0)
        
        return pdf_buffer
    
    def _create_header(self, invoice_data):
        """Create PDF header with company and invoice info"""
        elements = []
        styles = getSampleStyleSheet()
        
        # Company name and details
        company_style = ParagraphStyle(
            'CustomCompany',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#6366f1'),
            spaceAfter=6,
            alignment=TA_LEFT
        )
        
        elements.append(Paragraph(self.COMPANY_NAME, company_style))
        
        company_info_style = ParagraphStyle(
            'CompanyInfo',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#666666'),
            spaceAfter=12
        )
        
        company_info = f"""
        {self.COMPANY_ADDRESS}<br/>
        Phone: {self.COMPANY_PHONE}<br/>
        Email: {self.COMPANY_EMAIL}<br/>
        Tax ID: {self.COMPANY_TAX_ID}
        """
        
        elements.append(Paragraph(company_info, company_info_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Invoice title and number
        invoice_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#1f2937'),
            alignment=TA_CENTER
        )
        
        elements.append(Paragraph('INVOICE', invoice_style))
        
        invoice_no_style = ParagraphStyle(
            'InvoiceNo',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#374151'),
            alignment=TA_CENTER,
            spaceAfter=12
        )
        
        elements.append(Paragraph(f"Invoice No: {invoice_data['invoice_number']}", invoice_no_style))
        elements.append(Spacer(1, 0.1*inch))
        
        return elements
    
    def _create_invoice_details(self, invoice_data):
        """Create invoice details section with dates and customer info"""
        elements = []
        styles = getSampleStyleSheet()
        
        # Format dates
        created_date = invoice_data['created_at']
        if isinstance(created_date, str):
            created_date = datetime.fromisoformat(created_date)
        
        formatted_date = created_date.strftime('%B %d, %Y')
        
        # Create details table
        details_data = [
            [
                f"<b>Invoice Date:</b><br/>{formatted_date}",
                f"<b>Bill To:</b><br/>{invoice_data['customer_details']['name']}<br/>{invoice_data['customer_details']['email']}<br/>{invoice_data['customer_details']['phone']}"
            ]
        ]
        
        details_table = Table(details_data, colWidths=[3*inch, 3*inch])
        details_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        elements.append(details_table)
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_items_table(self, invoice_data):
        """Create items table with product details"""
        elements = []
        
        # Table header
        table_data = [
            ['Product Name', 'Quantity', 'Price per Item', 'Total']
        ]
        
        # Add items
        for item in invoice_data['items']:
            item_total = float(item['quantity']) * float(item['price_per_item'])
            table_data.append([
                item['product_name'],
                f"{float(item['quantity']):.0f}",
                f"${float(item['price_per_item']):.2f}",
                f"${item_total:.2f}"
            ])
        
        # Create table
        items_table = Table(table_data, colWidths=[3*inch, 1*inch, 1.2*inch, 1.2*inch])
        
        items_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            
            # Data rows
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(items_table)
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_totals_section(self, invoice_data):
        """Create totals section with subtotal, tax, and total"""
        elements = []
        
        # Create totals table
        totals_data = [
            ['', 'Amount'],
            ['Subtotal', f"${invoice_data['subtotal']:.2f}"],
            [f"Tax ({invoice_data['tax_percentage']}%)", f"${invoice_data['tax_amount']:.2f}"],
            ['Total', f"${invoice_data['total']:.2f}"]
        ]
        
        totals_table = Table(totals_data, colWidths=[5*inch, 1.5*inch])
        
        totals_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            
            # Subtotal and Tax rows
            ('ALIGN', (0, 1), (-1, 2), 'RIGHT'),
            ('FONTNAME', (0, 1), (-1, 2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, 2), 9),
            
            # Total row (last row)
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 3), (-1, 3), colors.whitesmoke),
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 3), (-1, 3), 11),
            ('ALIGN', (0, 3), (-1, 3), 'RIGHT'),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ('PADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(totals_table)
        
        return elements
    
    def _create_footer(self):
        """Create PDF footer"""
        elements = []
        styles = getSampleStyleSheet()
        
        elements.append(Spacer(1, 0.3*inch))
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#999999'),
            alignment=TA_CENTER
        )
        
        footer_text = f"""
        Thank you for your business!<br/>
        Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>
        Smart Warehouse &copy; 2026 - All Rights Reserved
        """
        
        elements.append(Paragraph(footer_text, footer_style))
        
        return elements