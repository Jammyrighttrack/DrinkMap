import httpx
import sys
import json
import re

def test_stream():
    url = "http://127.0.0.1:8000/api/chat/"
    payload = {
        "message": "Tìm cho tôi quán the note coffee",
        "history": []
    }
    
    print(f"=== LỚP 3: STREAMING & DEEP LINK CHECK ===")
    print(f"Gửi request tới: {url}")
    print(f"Nội dung: {payload['message']}")
    print("-" * 50)
    
    try:
        with httpx.stream("POST", url, json=payload, timeout=30.0) as response:
            if response.status_code != 200:
                print(f"❌ Lỗi HTTP: {response.status_code}")
                print(response.read().decode("utf-8"))
                return
                
            full_response_text = ""
            for chunk in response.iter_text():
                if chunk:
                    print(chunk, end="")
                    sys.stdout.flush()
                    if chunk.startswith("data: "):
                        try:
                            data = json.loads(chunk[6:].strip())
                            if data.get("type") == "content":
                                full_response_text += data.get("text", "")
                        except Exception:
                            pass
                            
            print("\n" + "-" * 50)
            print("=== KIỂM TRA DEEP LINK (SLUG) ===")
            if '"slug"' in full_response_text or re.search(r'"slug"\s*:', full_response_text):
                print("✅ TEST PASS: Gemini đã trả về trường 'slug' thành công để Frontend làm Deep Link!")
            else:
                print("⚠️ TEST FAIL: Không tìm thấy trường 'slug' trong kết quả JSON trả về. Cần kiểm tra lại RAG và AI Config.")
                
    except httpx.ConnectError:
         print("❌ Lỗi: Không thể kết nối tới Server. Hãy đảm bảo bạn đã chạy uvicorn!")
    except Exception as e:
        print(f"\n❌ Exception caught: {e}")

if __name__ == "__main__":
    test_stream()
