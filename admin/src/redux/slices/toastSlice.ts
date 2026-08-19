import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  count?: number;
}

interface ToastState {
  toasts: ToastMessage[];
}

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{ message: string; type?: 'success' | 'error' | 'info' }>
    ) => {
      const { message, type = 'success' } = action.payload;
      const existingIndex = state.toasts.findIndex((t) => t.message === message);

      if (existingIndex !== -1) {
        const existing = state.toasts[existingIndex];
        state.toasts.splice(existingIndex, 1);
        state.toasts.push({
          id: Date.now().toString(),
          message,
          type,
          count: (existing.count || 1) + 1,
        });
      } else {
        state.toasts.push({
          id: Date.now().toString(),
          message,
          type,
          count: 1,
        });
      }

      if (state.toasts.length > 3) {
        state.toasts = state.toasts.slice(-3);
      }
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { showToast, removeToast, clearAllToasts } = toastSlice.actions;
export default toastSlice.reducer;
