from services.openrouter_client import get_openrouter_client
from utils.file_utils import encode_image, get_mime_type

def extract_problem_from_image(image_path: str) -> str:
    """Uses Gemini via OpenRouter to extract mathematical text from an image."""
    client = get_openrouter_client()
    model = "google/gemini-3.1-flash-lite"  # OpenRouter model for Gemini 3.1 Flash Lite
    
    base64_image = encode_image(image_path)
    mime_type = get_mime_type(image_path)
    
    prompt = "Extract the mathematical problem from this image. Output only the pure text of the problem, using standard LaTeX notation for mathematical formulas if applicable. Do not solve it, just transcribe it perfectly."
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        temperature=0.1,
    )
    
    return response.choices[0].message.content.strip()

def extract_problem_from_audio(audio_path: str) -> str:
    """Transcribe spoken mathematics with an audio-capable model."""
    import base64
    import requests
    import os

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is missing")

    with open(audio_path, "rb") as f:
        audio_data = base64.b64encode(f.read()).decode("utf-8")

    ext = os.path.splitext(audio_path)[1].lower().replace(".", "")
    if ext not in ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg"]:
        ext = "wav"

    payload = {
        "model": os.getenv("AUDIO_TRANSCRIPTION_MODEL", "google/gemini-3.1-flash-lite"),
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": (
                    "Listen carefully and transcribe the spoken mathematical problem. "
                    "Write spoken numbers and operations as symbols, for example "
                    "'four times x plus three equals twenty three' becomes '4x + 3 = 23'. "
                    "Distinguish 'four x' (4x) from 'for x' (a request to solve for x). "
                    "Do not solve the problem or infer any number you cannot hear. "
                    "If a coefficient, operator, or number is unclear, respond 'UNCLEAR: ' followed by a short reason. "
                    "Otherwise output only the problem text."
                )},
                {"type": "input_audio", "input_audio": {"data": audio_data, "format": ext}}
            ]
        }],
        "temperature": 0,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/") + "/chat/completions"
    response = requests.post(url, headers=headers, json=payload, timeout=60.0)

    if response.status_code != 200:
        raise ValueError(f"Audio transcription failed with status {response.status_code}: {response.text}")

    result = response.json()
    text = result.get("choices", [{}])[0].get("message", {}).get("content")
    if not text:
        raise ValueError("Could not find transcribed text in audio model response.")
    if text.lstrip().upper().startswith("UNCLEAR:"):
        raise ValueError(f"Audio is ambiguous: {text.strip()[8:].strip()}")
    return text.strip()
