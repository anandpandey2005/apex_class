import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

const getApiBaseUrl = () => {
  const envUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_SERVER_URI ||
    process.env.NEXT_PUBLIC_SERVER_URL;

  if (envUrl) {
    const cleanUrl = envUrl.trim().replace(/\/$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }

  return '/api/v1';
};

const baseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Auth', 'Batch', 'Attendance', 'Fee', 'Announcement', 'User', 'Alumni'],
  endpoints: () => ({}),
});
