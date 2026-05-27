/**
 * useChatStore.js – Zustand Global State
 *
 * Replaces the fragile `activeControllers` Set + scattered DOM variables.
 * All state lives here; components are purely reactive views.
 *
 * Message shape:
 * {
 *   id:        string,          // unique ID
 *   role:      'user' | 'bot',
 *   content:   string,          // raw accumulated text (bot) or user text
 *   tokens:    Token[],         // parsed tokens for safe rendering (bot only)
 *   pipeline:  PipelineStep[],  // [{task, status, time}] (bot only)
 *   status:    'streaming' | 'done' | 'error' | 'cancelled', // bot only
 *   totalTime: number | null,
 *   errorText: string | null,
 * }
 */

import { create } from 'zustand';

const DEFAULT_SUGGESTIONS = [
  'Gần nhất', 'Có máy lạnh', 'Mở cửa 24/7', 'Học nhóm yên tĩnh',
];

const useChatStore = create((set, get) => ({
  // ── UI State ──────────────────────────────────────────────────
  darkMode: false,
  isChatOpen: false,
  suggestions: DEFAULT_SUGGESTIONS,

  // ── Messages ──────────────────────────────────────────────────
  messages: [],

  // ── Active SSE Streams: Map<streamId, AbortController> ───────
  // Using a plain object stored in state (Map isn't serializable, but that's OK for runtime)
  activeStreams: {},

  // ── Actions ───────────────────────────────────────────────────

  toggleDarkMode: () =>
    set(s => ({ darkMode: !s.darkMode })),

  toggleChat: () =>
    set(s => ({ isChatOpen: !s.isChatOpen })),

  closeChat: () =>
    set({ isChatOpen: false }),

  setSuggestions: (chips) =>
    set({ suggestions: chips }),

  // ── Message Actions ───────────────────────────────────────────

  addUserMessage: (text) => {
    const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set(s => ({
      messages: [...s.messages, { id, role: 'user', content: text }],
    }));
    return id;
  },

  addBotMessage: () => {
    const id = `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set(s => ({
      messages: [...s.messages, {
        id,
        role:      'bot',
        content:   '',
        tokens:    [],
        pipeline:  [],
        status:    'streaming',
        totalTime: null,
        errorText: null,
      }],
    }));
    return id;
  },

  appendBotContent: (msgId, text) =>
    set(s => ({
      messages: s.messages.map(m =>
        m.id === msgId ? { ...m, content: m.content + text } : m
      ),
    })),

  setBotTokens: (msgId, tokens) =>
    set(s => ({
      messages: s.messages.map(m =>
        m.id === msgId ? { ...m, tokens } : m
      ),
    })),

  updatePipeline: (msgId, step) =>
    set(s => ({
      messages: s.messages.map(m => {
        if (m.id !== msgId) return m;
        const idx = m.pipeline.findIndex(p => p.task === step.task);
        const newPipeline = idx >= 0
          ? m.pipeline.map((p, i) => i === idx ? step : p)
          : [...m.pipeline, step];
        return { ...m, pipeline: newPipeline };
      }),
    })),

  finishBotMessage: (msgId, totalTime) =>
    set(s => ({
      messages: s.messages.map(m =>
        m.id === msgId ? { ...m, status: 'done', totalTime } : m
      ),
    })),

  setBotError: (msgId, errorText) =>
    set(s => ({
      messages: s.messages.map(m =>
        m.id === msgId ? { ...m, status: 'error', errorText } : m
      ),
    })),

  setBotCancelled: (msgId) =>
    set(s => ({
      messages: s.messages.map(m =>
        m.id === msgId ? { ...m, status: 'cancelled' } : m
      ),
    })),

  // ── Stream Management ─────────────────────────────────────────

  registerStream: (streamId, controller) =>
    set(s => ({
      activeStreams: { ...s.activeStreams, [streamId]: controller },
    })),

  removeStream: (streamId) =>
    set(s => {
      const next = { ...s.activeStreams };
      delete next[streamId];
      return { activeStreams: next };
    }),

  cancelStream: (streamId) => {
    const { activeStreams } = get();
    const ctrl = activeStreams[streamId];
    if (ctrl) ctrl.abort();
    set(s => {
      const next = { ...s.activeStreams };
      delete next[streamId];
      return { activeStreams: next };
    });
  },

  cancelAllStreams: () => {
    const { activeStreams } = get();
    Object.values(activeStreams).forEach(ctrl => ctrl?.abort());
    set({ activeStreams: {} });
  },

  // ── Selectors / Derived ───────────────────────────────────────

  /**
   * Returns the last N messages formatted for Gemini chat history.
   * Includes only completed messages (not streaming/cancelled).
   */
  getChatHistory: (maxMessages = 20) => {
    const { messages } = get();
    return messages
      .filter(m => m.role === 'user' || (m.role === 'bot' && m.status === 'done'))
      .slice(-maxMessages)
      .map(m => ({
        role:    m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }));
  },

  activeStreamCount: () => Object.keys(get().activeStreams).length,
}));

export default useChatStore;
