import React from 'react';
import useChatStore from '../../features/ai_chat/store/useChatStore';

const Header = ({ onLoginClick, user }) => {
  const toggleChat = useChatStore(s => s.toggleChat);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex cursor-pointer items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-orange-600 p-2">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
              <path
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <span className="hidden bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-xl font-bold text-transparent sm:inline-block">
            DrinkMap
          </span>
        </div>

        <div className="relative mx-4 hidden max-w-md flex-1 md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full rounded-full border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200"
            placeholder="Tim quan cafe, tra sua quanh ban..."
          />
        </div>

        <div className="flex items-center gap-3">
          {/* ── Nút mở AI Chat ── */}
          <button
            id="open-ai-chat-btn"
            onClick={(e) => { e.preventDefault(); toggleChat(); }}
            title="Mở DrinkMap AI"
            className="
              flex items-center gap-1.5 rounded-full
              bg-gradient-to-r from-teal-600 to-emerald-500
              px-3 py-1.5 text-xs font-semibold text-white
              shadow-sm hover:shadow-md hover:from-teal-700 hover:to-emerald-600
              active:scale-95 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1
            "
          >
            {/* Sparkle / AI icon */}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            <span className="hidden sm:inline">AI Chat</span>
          </button>

          {user ? (
            <div className="flex cursor-pointer items-center gap-3 rounded-full p-1.5 transition-colors hover:bg-gray-50">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-800">{user.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">{user.email || 'user@example.com'}</p>
              </div>
              <img
                src={user.avatar || 'https://ui-avatars.com/api/?name=User&background=f97316&color=fff'}
                alt="Avatar"
                className="h-9 w-9 rounded-full border-2 border-orange-100 object-cover"
              />
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 active:scale-95"
            >
              Dang nhap / Dang ky
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

