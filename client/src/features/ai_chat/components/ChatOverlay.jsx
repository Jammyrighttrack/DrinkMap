import React from 'react';
import ChatBox from './ChatBox';
import ChatInput from './ChatInput';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import useChatStore from '../store/useChatStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function ChatOverlay() {
  const isChatOpen = useChatStore(s => s.isChatOpen);
  const closeChat  = useChatStore(s => s.closeChat);

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* ── Backdrop – z phải cao hơn Leaflet map (z-[400]) nhưng thấp hơn drawer ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={closeChat}
          />

          {/* ── Drawer Panel ── */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full md:w-[450px] z-[9999] flex flex-col bg-[#f4f7f6] shadow-2xl"
            style={{ willChange: 'transform' }}
          >
            {/* ── Header ── */}
            <div className="shrink-0 bg-gradient-to-r from-[#10705a] to-[#1a9a7c] px-5 py-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] tracking-wide leading-tight">DrinkMap AI</h3>
                  <span className="flex items-center gap-1 text-teal-100 text-xs mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                    Trực tuyến · Sẵn sàng hỗ trợ
                  </span>
                </div>
              </div>

              {/* Nút X đóng drawer */}
              <button
                id="chat-close-btn"
                onClick={closeChat}
                className="p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all duration-150"
                aria-label="Đóng khung chat"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <ChatBox />
            </div>

            {/* ── Input Area ── */}
            <div className="shrink-0 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
              <ChatInput />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
