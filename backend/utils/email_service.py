import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    """Email service for sending emails"""
    
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', '')
    SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')
    SENDER_NAME = os.getenv('SENDER_NAME', 'Smart Warehouse')
    
    @staticmethod
    def send_otp_email(recipient_email, otp):
        """
        Send OTP email to user
        
        Args:
            recipient_email (str): Recipient email address
            otp (str): One-time password
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = 'Password Reset OTP - Smart Warehouse'
            message['From'] = f"{EmailService.SENDER_NAME} <{EmailService.SENDER_EMAIL}>"
            message['To'] = recipient_email
            
            # HTML email template
            html = f"""\
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
                  
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Hello,
                  </p>
                  
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password. Use the following One-Time Password (OTP) to proceed with your password reset:
                  </p>
                  
                  <div style="background-color: #f0f0f0; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #333; font-size: 14px; margin: 5px 0;">
                      <strong>Your OTP:</strong>
                    </p>
                    <p style="color: #007bff; font-size: 32px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; text-align: center;">
                      {otp}
                    </p>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    <strong>Important:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
                  </p>
                  
                  <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    If you did not request a password reset, please ignore this email.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Smart Warehouse &copy; 2026. All rights reserved.
                  </p>
                </div>
              </body>
            </html>
            """
            
            # Plain text version
            text = f"""\
Password Reset Request

Hello,

We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:

OTP: {otp}

Important: This OTP will expire in 10 minutes. Do not share this code with anyone.

If you did not request a password reset, please ignore this email.

Smart Warehouse
            """
            
            # Attach parts
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            with smtplib.SMTP(EmailService.SMTP_SERVER, EmailService.SMTP_PORT) as server:
                server.starttls()
                server.login(EmailService.SENDER_EMAIL, EmailService.SENDER_PASSWORD)
                server.send_message(message)
            
            return True
        
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def send_password_reset_success_email(recipient_email, user_name='User'):
        """
        Send password reset success confirmation email
        
        Args:
            recipient_email (str): Recipient email address
            user_name (str): User's name for personalization
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            message = MIMEMultipart('alternative')
            message['Subject'] = 'Password Reset Successful - Smart Warehouse'
            message['From'] = f"{EmailService.SENDER_NAME} <{EmailService.SENDER_EMAIL}>"
            message['To'] = recipient_email
            
            # HTML email template
            html = f"""\
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #28a745; text-align: center; margin-bottom: 20px;">✓ Password Reset Successful</h2>
                  
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Hello {user_name},
                  </p>
                  
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Your password has been successfully reset. You can now log in with your new password.
                  </p>
                  
                  <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #155724; font-size: 14px; margin: 0;">
                      Your account is now secure with your new password.
                    </p>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    If you did not make this change or believe your account has been compromised, please contact our support team immediately.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Smart Warehouse &copy; 2026. All rights reserved.
                  </p>
                </div>
              </body>
            </html>
            """
            
            # Plain text version
            text = f"""\
Password Reset Successful

Hello {user_name},

Your password has been successfully reset. You can now log in with your new password.

If you did not make this change, please contact our support team immediately.

Smart Warehouse
            """
            
            # Attach parts
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            with smtplib.SMTP(EmailService.SMTP_SERVER, EmailService.SMTP_PORT) as server:
                server.starttls()
                server.login(EmailService.SENDER_EMAIL, EmailService.SENDER_PASSWORD)
                server.send_message(message)
            
            return True
        
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
