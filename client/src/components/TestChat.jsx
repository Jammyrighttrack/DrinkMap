import React, { useState, useCallback } from 'react';
import { useChatStream } from '../hooks/useChatStream';

const TestChat = () => {
  const [input, setInput] = useState('');
  
  // Tự động tránh Re-render vô cực nhờ useCallback và useRef ở bên trong custom hook
  const { messages, shops, isLoading, error, sendMessage, stopStream } = useChatStream();

  const handleSend = useCallback((e) => {
    // Ngăn trình duyệt reload lại trang nếu thẻ bọc ngoài là form
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    // In ra console để debug theo yêu cầu
    console.log("🚀 [TestChat] Gửi request lên AI với nội dung:", input);
    
    sendMessage(input);
  }, [input, sendMessage]);

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '40px auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>🤖 Test Chatbot SSE (DrinkMap AI)</h2>
      
      {/* Sửa div thành form và dùng onSubmit để tiện xử lý phím Enter */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '20px' }}>
        <input 
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ví dụ: Tìm cho tôi quán The Note Coffee..."
        />
        <button 
          type="submit"
          disabled={isLoading}
          style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: isLoading ? '#ccc' : '#007bff', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {isLoading ? 'Đang gửi...' : 'Gửi'}
        </button>
        {isLoading && (
          <button 
            type="button"
            onClick={stopStream}
            style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#dc3545', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Dừng
          </button>
        )}
      </form>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '20px', wordBreak: 'break-word' }}>
          <strong>Lỗi Server:</strong> {error}
        </div>
      )}

      <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', minHeight: '300px', backgroundColor: '#fafafa' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Phản hồi từ AI:</h3>
        
        {/* Nội dung streaming */}
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '16px', color: '#444' }}>
          {messages || (isLoading ? <span style={{ color: '#888', fontStyle: 'italic' }}>Đang kết nối luồng dữ liệu...</span> : "Chưa có tin nhắn nào. Thử gõ tìm một quán cà phê đi!")}
        </div>
        
        {/* Render danh sách quán kèm Slug nếu có */}
        {shops.length > 0 && (
          <div style={{ marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>🎯 CÁC QUÁN GỢI Ý (ĐÃ TÌM THẤY SLUG DEEP LINK):</h4>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {shops.map((shop, idx) => (
                <li key={idx} style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '10px' }}>
                  <strong>☕ Tên:</strong> {shop.name} <br/>
                  <strong>🔗 Slug:</strong> <code style={{ backgroundColor: '#eee', padding: '2px 6px', borderRadius: '4px', color: '#e65100' }}>{shop.slug}</code> <br/>
                  <strong>📍 Địa chỉ:</strong> <span style={{ fontSize: '14px', color: '#666' }}>{shop.address}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestChat;
