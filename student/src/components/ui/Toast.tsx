'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { removeToast, ToastMessage } from '../../redux/slices/toastSlice';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toast.toasts);
  const [isHovered, setIsHovered] = useState(false);

  if (!toasts.length) return null;

  // Newest toast sits on top of visual stack
  const reversedToasts = [...toasts].reverse();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none"
    >
      <div className="relative flex flex-col items-end w-full max-w-sm">
        {reversedToasts.map((toast, index) => (
          <StackedToastItem
            key={toast.id}
            toast={toast}
            index={index}
            total={reversedToasts.length}
            isHovered={isHovered}
            onClose={() => dispatch(removeToast(toast.id))}
          />
        ))}
      </div>
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  index: number;
  total: number;
  isHovered: boolean;
  onClose: () => void;
}

const StackedToastItem: React.FC<ToastItemProps> = ({
  toast,
  index,
  total,
  isHovered,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isTop = index === 0;
  const translateY = isHovered ? index * 10 : index * -8;
  const scale = isHovered ? 1 : 1 - index * 0.05;
  const opacity = isHovered ? 1 : index === 0 ? 1 : 1 - index * 0.25;
  const zIndex = total - index;

  return (
    <div
      style={{
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        zIndex,
      }}
      className={`pointer-events-auto w-full transition-all duration-300 ease-out origin-bottom-right ${
        !isTop && !isHovered ? 'absolute bottom-0 right-0' : 'relative mb-2'
      }`}
    >
      <div className="relative flex items-center justify-between p-3.5 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-x-3 group hover:border-white/20 overflow-hidden">
        {/* Subtle left indicator bar */}
        <div
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors ${
            toast.type === 'success'
              ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : toast.type === 'error'
              ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
              : 'bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.5)]'
          }`}
        />

        {/* Content */}
        <div className="flex items-center space-x-3 min-w-0 pl-1.5 pr-2">
          <div className="shrink-0 flex items-center justify-center">
            {toast.type === 'success' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Info className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {toast.type === 'error'
                  ? 'System Alert'
                  : toast.type === 'success'
                  ? 'Success'
                  : 'Notice'}
              </span>
              {toast.count && toast.count > 1 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ×{toast.count}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-zinc-100 leading-snug break-words">
              {toast.message}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-zinc-500 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800/80 transition-all shrink-0 -mr-1"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
