import os
import json
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

PROMPT = """
Analyze this civic issue image and provide details strictly in the following JSON format:
{
  "issue_type": "Pothole / Garbage dump / Water leakage / Broken streetlight / Damaged road sign",
  "severity": "Low / Medium / High",
  "impact_score": 5, 
  "department": "Public Works / Sanitation / Water Department / Electrical Department / Traffic Control",
  "description": "Clear description of the problem seen in the image.",
  "recommended_action": "What needs to be done to resolve the problem."
}
Return ONLY raw valid JSON text. No markdown formatting, no ```json wrappers.
"""

def analyze_issue_image(image_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(image_bytes))
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    response = model.generate_content(
        [PROMPT, image],
        generation_config={"response_mime_type": "application/json"}
    )
    return json.loads(response.text)