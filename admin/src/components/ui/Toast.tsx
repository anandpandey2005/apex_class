'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { removeToast } from '../../redux/slices/toastSlice';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toast.toasts);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dispatch(removeToast(toast.id))} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: any; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-700 text-white rounded-lg shadow-2xl space-x-3">
      <div className="flex items-center space-x-2.5">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-white" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-zinc-400" />}
        <span className="text-xs font-semibold">{toast.message}</span>
      </div>
      <button onClick={onClose} className="text-zinc-400 hover:text-white p-0.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
