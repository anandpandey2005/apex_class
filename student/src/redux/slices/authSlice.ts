import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    try {
      const savedToken = localStorage.getItem('student_token');
      const savedUser = localStorage.getItem('student_user');
      if (savedToken && savedUser) {
        return {
          token: savedToken,
          user: JSON.parse(savedUser),
          isAuthenticated: true,
        };
      }
    } catch (e) {
      console.error('Error restoring student auth state from localStorage:', e);
    }
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('student_token', action.payload.token);
        localStorage.setItem('student_user', JSON.stringify(action.payload.user));
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
      }
    },
  },
});

export const { setCredentials, logoutUser } = authSlice.actions;
export default authSlice.reducer;
