# Tạo file: server/scripts/debug_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Liệt kê tất cả các model có hỗ trợ embedContent
print("Danh sách các model hỗ trợ Embedding:")
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(f"- {m.name}")