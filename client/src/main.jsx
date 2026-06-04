import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

// Redux Store (Trọng tâm quản lý State toàn cục)
import { store } from './store/index.js';

// Styles & Component Rễ
import './index.css';
import App from './App.jsx';
   
/**   
 * DrinkMap App Entry Point
 * ---
 * 1. StrictMode: Bắt lỗi React lifecycle, detect các hàm unmount chưa được dọn dẹp (tự chạy 2 lần ở màn Dev).
 * 2. Provider: Bọc toàn bộ App để bơm dòng máu dữ liệu từ (store) chảy xuống tất cả Component con.
 */
const mountPoint = document.getElementById('root');

if (!mountPoint) {
  throw new Error('Critical: Không tìm thấy thẻ <div id="root"> trong file index.html');
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#fee', border: '1px solid red', margin: '20px', borderRadius: '8px', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong.</h2>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(mountPoint).render(
  <StrictMode>
    {/* Truyền Store tổng vào hệ sinh thái React */}
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </StrictMode>
);