import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
import gspread
import gspread_formatting as gsf

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/gmail.send'
]

def get_google_credentials():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except RefreshError as exc:
                raise ValueError(
                    "Google authorization expired. Reauthorize the app before sending email or logging to Sheets."
                ) from exc
        else:
            if not os.path.exists('credentials.json'):
                raise FileNotFoundError("credentials.json not found. Please download OAuth 2.0 Client IDs for Desktop app from Google Cloud Console.")
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return creds

def get_gspread_client():
    if os.path.exists('service_account.json'):
        # Method 1: Service Account (Recommended for headless servers / clients)
        return gspread.service_account(filename='service_account.json')
        
    # Method 2: OAuth 2.0 User Consent (Browser popup)
    creds = get_google_credentials()
    client = gspread.authorize(creds)
    return client

def log_to_google_sheet(sheet_name: str, row_data: list):
    """Appends a row to the specified Google Sheet and ensures formatting is correct."""
    client = get_gspread_client()
    try:
        sheet = client.open(sheet_name).sheet1
    except gspread.exceptions.SpreadsheetNotFound:
        raise ValueError(f"Google Sheet '{sheet_name}' not found. Please create it first.")

    # 0. Check if sheet is empty. If so, write the headers first.
    headers = [
        "ID", "Date", "Problem Title", "Difficulty", "Field", "Problem", "Final Answer",
        "Verification", "PDF File", "Email", "Status", "Notes"
    ]
    
    existing_rows = sheet.get_all_values()
    if len(existing_rows) == 0:
        sheet.append_row(headers)
        # Format the header row immediately
        header_fmt = gsf.cellFormat(
            backgroundColor=gsf.color(0.07, 0.09, 0.15),  # Slate 900 (#111827)
            textFormat=gsf.textFormat(bold=True, foregroundColor=gsf.color(1, 1, 1), fontFamily='Inter', fontSize=10),
            horizontalAlignment='CENTER',
            verticalAlignment='MIDDLE'
        )
        gsf.format_cell_range(sheet, 'A1:L1', header_fmt)
        gsf.set_frozen(sheet, rows=1)

    # Append row
    sheet.append_row(row_data)
    
    # 2. Get the row number we just appended
    row_num = len(sheet.get_all_values())
    
    # Alternating row background colors (zebra stripes)
    bg_color = gsf.color(0.97, 0.98, 1.0) if row_num % 2 == 0 else gsf.color(1.0, 1.0, 1.0) # Light blue-gray or White
    
    data_fmt = gsf.cellFormat(
        backgroundColor=bg_color,
        textFormat=gsf.textFormat(fontFamily='Inter', fontSize=9),
        verticalAlignment='MIDDLE',
        wrapStrategy='WRAP'
    )
    gsf.format_cell_range(sheet, f'A{row_num}:L{row_num}', data_fmt)

    # 3. Set custom column widths to fit content nicely (A to L)
    widths = {
        'A': 70, 'B': 130, 'C': 180, 'D': 100, 'E': 110, 'F': 250, 'G': 180, 'H': 120, 'I': 200,
        'J': 160, 'K': 100, 'L': 250
    }
    for col, width in widths.items():
        try:
            gsf.set_column_width(sheet, col, width)
        except Exception:
            pass
        
    return True
