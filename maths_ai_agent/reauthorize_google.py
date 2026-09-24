"""Reconnect the local Google account after its refresh token is revoked."""

import os
import shutil
from datetime import datetime
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from services.google_sheets_service import SCOPES


ROOT = Path(__file__).resolve().parent
credentials_path = ROOT / "credentials.json"
token_path = ROOT / "token.json"

if not credentials_path.exists():
    raise SystemExit("Google credentials.json is missing.")

flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
flow.oauth2session.mount(
    "https://",
    HTTPAdapter(max_retries=Retry(total=4, connect=4, backoff_factor=1)),
)
credentials = flow.run_local_server(
    port=0,
    open_browser=True,
    authorization_prompt_message="",
    success_message="Google authorization is complete. You can close this tab.",
)

if token_path.exists():
    backup = ROOT / f"token.backup.{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
    shutil.copy2(token_path, backup)

temporary = ROOT / "token.json.tmp"
temporary.write_text(credentials.to_json(), encoding="utf-8")
os.replace(temporary, token_path)
print("Google authorization refreshed. Gmail and Sheets can be tested again.")
