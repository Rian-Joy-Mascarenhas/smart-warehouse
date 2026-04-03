import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    """Send emails without PDF attachments"""
    
    def __init__(self):
        """Initialize email service"""
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL')
        self.sender_password = os.getenv('SENDER_PASSWORD')
        self.sender_name = os.getenv('SENDER_NAME', 'Smart Warehouse')
    
    def send_invoice_notification(self, recipient_email, recipient_name, invoice_number, total_amount, invoice_link):
        """
        Send invoice notification email (without PDF)
        
        Args:
            recipient_email (str): Customer email
            recipient_name (str): Customer name
            invoice_number (str): Invoice number
            total_amount (float): Invoice total
            invoice_link (str): Link to view invoice online
        
        Returns:
            dict: Result with status and message
        """
        try:
            if not self.sender_email or not self.sender_password:
                return {
                    'status': 'error',
                    'message': 'Email configuration not set. Please set SENDER_EMAIL and SENDER_PASSWORD in .env'
                }
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = recipient_email
            msg['Date'] = formatdate(localtime=True)
            msg['Subject'] = f"Invoice {invoice_number} from {self.sender_name}"
            
            # HTML email body
            html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2C3E50;">Invoice Notification</h2>
                        
                        <p>Dear <strong>{recipient_name}</strong>,</p>
                        
                        <p>Thank you for your business! Your invoice is ready.</p>
                        
                        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> {invoice_number}</p>
                            <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${total_amount:.2f}</p>
                        </div>
                        
                        <p>
                            <a href="{invoice_link}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                View Invoice Online
                            </a>
                        </p>
                        
                        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="font-size: 12px; color: #7F8C8D;">
                            Best regards,<br>
                            {self.sender_name} Team
                        </p>
                    </div>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html, 'html'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.send_message(msg)
            server.quit()
            
            return {
                'status': 'success',
                'message': f'Invoice notification sent to {recipient_email}'
            }
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {
                'status': 'error',
                'message': f'Failed to send email: {str(e)}'
            }