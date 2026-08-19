import { apiSlice } from './apiSlice';
import { Announcement } from '../../types';

export const announcementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<
      { success: boolean; data: Announcement[] },
      { batchId?: string; priority?: string } | void
    >({
      query: (params) => ({
        url: '/announcements',
        params: params || {},
      }),
      providesTags: ['Announcement'],
    }),
  }),
});

export const { useGetAnnouncementsQuery } = announcementApi;
