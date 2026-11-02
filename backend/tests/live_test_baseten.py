"""
Live diagnostic test script for Baseten API key verification.
Tests both shared inference endpoints and custom model endpoints without exposing the key.
"""

import os
import sys
import time
import httpx
from dotenv import load_dotenv

# Load from backend/.env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

api_key = os.getenv("BASETEN_API_KEY")
base_url = os.getenv("BASETEN_BASE_URL", "https://inference.baseten.co/v1").rstrip("/")
model_id = os.getenv("BASETEN_MODEL_ID", "meta-models/muse-spark-open")

print("=" * 60)
print("KUGAYA — BASETEN LIVE API KEY VERIFICATION SUITE")
print("=" * 60)

if not api_key or api_key.strip() in ("", "your_baseten_api_key_here"):
    print("[ERROR] No valid BASETEN_API_KEY found.")
    sys.exit(1)

masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "***"
print(f"[*] API Key detected: {masked_key} (length: {len(api_key)})")
print(f"[*] Target Base URL:  {base_url}")
print(f"[*] Target Model ID:  {model_id}")
print("-" * 60)

url = f"{base_url}/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": model_id,
    "messages": [
        {"role": "system", "content": "You are Kugaya AI tutor. Answer in one concise sentence."},
        {"role": "user", "content": "What is a compiler? Respond in one sentence."}
    ],
    "max_tokens": 1024,
    "temperature": 0.3
}

print(f"[*] Dispatching live test request to: {url}...")
start_time = time.time()

try:
    with httpx.Client(timeout=45.0) as client:
        response = client.post(url, headers=headers, json=payload)
        latency = round((time.time() - start_time) * 1000, 2)
        
        print(f"[*] Response Status Code: {response.status_code} ({latency}ms)")
        
        if response.status_code == 200:
            data = response.json()
            message = data["choices"][0]["message"]
            reply = message.get("content")
            tokens = data.get("usage", {})
            print("[SUCCESS] Baseten live API call succeeded!")
            print(f"[*] Prompt Tokens:     {tokens.get('prompt_tokens', 'N/A')}")
            print(f"[*] Completion Tokens: {tokens.get('completion_tokens', 'N/A')}")
            print(f"[*] Generated Content: {reply}")
        else:
            print(f"[HTTP {response.status_code}] Response:")
            print(response.text)

except Exception as e:
    print(f"[NETWORK ERROR] Failed to connect: {e}")

print("=" * 60)
