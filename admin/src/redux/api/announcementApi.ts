import { apiSlice } from './apiSlice';
import { Announcement } from '../../types';

export const announcementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<
      { success: boolean; data: Announcement[] },
      { batchId?: string; priority?: string }
    >({
      query: (params) => ({
        url: '/announcements',
        params,
      }),
      providesTags: ['Announcement'],
    }),
    createAnnouncement: builder.mutation<
      { success: boolean; data: Announcement },
      {
        title: string;
        message: string;
        targetBatchId?: string | null;
        targetBatchIds?: string[];
        priority: string;
        attachmentUrl?: string;
      }
    >({
      query: (body) => ({
        url: '/announcements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Announcement'],
    }),
    deleteAnnouncement: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/announcements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Announcement'],
    }),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = announcementApi;
