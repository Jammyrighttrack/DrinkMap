import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path' // Thư viện lõi của NodeJS để xử lý đường dẫn

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Bí danh siêu xịn: Mọi đường dẫn bắt đầu bằng '@/' sẽ tự động được Vite dịch thành 'src/'
      // Ví dụ: import { Button } from '@/components/ui/Button' 
      // sẽ tương đương với: import { Button } from '../../../../components/ui/Button'
      '@': path.resolve(__dirname, './src'),
    },
  },
})
