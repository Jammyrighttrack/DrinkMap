import { useState, useCallback, useRef } from 'react';

export const useChatStream = () => {
  const [messages, setMessages] = useState('');
  const [shops, setShops] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(async (messageText) => {
    // Reset state
    setMessages('');
    setShops([]);
    setDrinks([]);
    setSuggestedActions([]);
    setError(null);
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      console.log("🌐 Đang fetch tới http://127.0.0.1:8000/api/chat/...");
      const response = await fetch('http://127.0.0.1:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: messageText,
          history: [], 
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        // Lấy chính xác chuỗi lỗi từ Backend (422 Unprocessable Entity, 500, v.v...)
        const errorText = await response.text();
        console.error(`🚨 Lỗi từ Backend (Status ${response.status}):`, errorText);
        
        let parsedError = errorText;
        try {
          const jsonError = JSON.parse(errorText);
          parsedError = JSON.stringify(jsonError, null, 2);
        } catch(e) {
          // Lỗi không phải dạng JSON (vd: Nginx 502)
        }
        throw new Error(`[HTTP ${response.status}] ${parsedError}`);
      }

      if (!response.body) {
        throw new Error('Không thể đọc luồng dữ liệu (ReadableStream is missing)');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const dataStr = part.substring(6).trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === 'content') {
                 setMessages((prev) => prev + data.text);
              } else if (data.type === 'metadata') {
                 if (data.shops) setShops(data.shops);
                 if (data.drinks) setDrinks(data.drinks);
                 if (data.suggested_actions) setSuggestedActions(data.suggested_actions);
              }
            } catch (err) {
              console.warn('⚠️ Lỗi Parse JSON tại chunk này, đưa vào buffer để chờ dòng tiếp theo. Nội dung lỗi:', err);
              buffer = part + '\n\n' + buffer;
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('⛔ Người dùng đã chủ động dừng stream.');
      } else {
        console.error('❌ Lỗi quá trình Stream:', err);
        setError(err.message || 'Kết nối máy chủ AI đang gián đoạn, vui lòng thử lại');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    shops,
    drinks,
    suggestedActions,
    isLoading,
    error,
    sendMessage,
    stopStream
  };
};
