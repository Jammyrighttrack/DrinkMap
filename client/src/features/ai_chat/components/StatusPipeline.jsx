/**
 * StatusPipeline.jsx – DrinkMap AI
 *
 * Animated pipeline steps indicator:
 *   - RUNNING: wave-dot animation + border teal
 *   - DONE: checkmark badge + elapsed time
 *
 * Dùng React.useState/useEffect trực tiếp (không import from 'react') để nhất quán
 * với pattern của dự án.
 */

import React, { useState, useEffect } from 'react';

// ── Wave dots cho "running" state ─────────────────────────────────────────────
function WaveDots() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden>
      <span
        className="w-[5px] h-[5px] rounded-full bg-teal-500 inline-block"
        style={{ animation: 'wave 1.2s ease-in-out infinite', animationDelay: '0ms' }}
      />
      <span
        className="w-[5px] h-[5px] rounded-full bg-teal-500 inline-block"
        style={{ animation: 'wave 1.2s ease-in-out infinite', animationDelay: '200ms' }}
      />
      <span
        className="w-[5px] h-[5px] rounded-full bg-teal-500 inline-block"
        style={{ animation: 'wave 1.2s ease-in-out infinite', animationDelay: '400ms' }}
      />
    </span>
  );
}

// ── Live timer cho running step ───────────────────────────────────────────────
function LiveTimer() {
  const [elapsed, setElapsed] = useState('0.00');

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      setElapsed(((performance.now() - start) / 1000).toFixed(2));
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="ml-1.5 opacity-60 font-mono tabular-nums text-[11px]">
      {elapsed}s
    </span>
  );
}

// ── Running step ──────────────────────────────────────────────────────────────
function RunningStep({ task }) {
  return (
    <div
      className="
        inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-2
        border border-teal-600/40 bg-teal-50
        text-teal-700 text-[12px] font-semibold
        shadow-sm
      "
      role="status"
      aria-label={`Đang xử lý: ${task}`}
    >
      <WaveDots />
      <span>{task}</span>
      <LiveTimer />
    </div>
  );
}

// ── Done step ─────────────────────────────────────────────────────────────────
function DoneStep({ task, time }) {
  return (
    <div
      className="
        flex items-center gap-2
        text-gray-400 text-[11px] mb-1.5 font-medium
      "
      aria-label={`Hoàn thành: ${task}${time != null ? ` trong ${time}s` : ''}`}
    >
      <span className="w-[14px] h-[14px] rounded-full bg-teal-400 flex flex-shrink-0 items-center justify-center text-white text-[9px] font-bold">
        ✓
      </span>
      <span className="flex-1 truncate">{task}</span>
      {time != null && (
        <span className="opacity-60 font-mono tabular-nums ml-2">{time}s</span>
      )}
    </div>
  );
}

// ── StatusPipeline root ───────────────────────────────────────────────────────
export default function StatusPipeline({ pipeline }) {
  if (!pipeline || pipeline.length === 0) return null;

  return (
    <div className="mb-2 w-full" aria-live="polite" aria-atomic="false">
      {pipeline.map((step, i) =>
        step.status === 'done'
          ? <DoneStep key={`${step.task}-${i}`} task={step.task} time={step.time} />
          : <RunningStep key={`${step.task}-${i}`} task={step.task} />
      )}
    </div>
  );
}
