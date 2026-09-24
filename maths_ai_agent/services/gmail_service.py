import base64
from email.message import EmailMessage
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from services.google_sheets_service import get_google_credentials
import os

def send_email_with_pdf(recipient_email: str, subject: str, body: str, pdf_path: str):
    """Sends an email with the PDF attached using the Gmail API."""
    creds = get_google_credentials()
    
    try:
        service = build('gmail', 'v1', credentials=creds)
        message = EmailMessage()
        
        message.set_content(body)
        message['To'] = recipient_email
        message['From'] = "me"
        message['Subject'] = subject
        
        # Attach the PDF
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
            
        message.add_attachment(
            pdf_data, 
            maintype='application', 
            subtype='pdf', 
            filename=os.path.basename(pdf_path)
        )
        
        # encoded message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        create_message = {
            'raw': encoded_message
        }
        
        send_message = (service.users().messages().send(userId="me", body=create_message).execute())
        return send_message
    except HttpError as error:
        raise ValueError(f"An error occurred sending the email: {error}")
