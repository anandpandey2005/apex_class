import { apiSlice } from './apiSlice';
import { Batch } from '../../types';

export const batchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBatches: builder.query<{ success: boolean; data: Batch[] }, void>({
      query: () => '/batches',
      providesTags: ['Batch'],
    }),
    getBatchById: builder.query<{ success: boolean; data: Batch }, string>({
      query: (id) => `/batches/${id}`,
      providesTags: ['Batch'],
    }),
    createBatch: builder.mutation<
      { success: boolean; data: Batch },
      Partial<Batch>
    >({
      query: (body) => ({
        url: '/batches',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Batch'],
    }),
    updateBatch: builder.mutation<
      { success: boolean; data: Batch },
      { id: string; data: Partial<Batch> }
    >({
      query: ({ id, data }) => ({
        url: `/batches/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Batch'],
    }),
    assignStudent: builder.mutation<
      { success: boolean; data: Batch },
      { batchId: string; studentId: string }
    >({
      query: ({ batchId, studentId }) => ({
        url: `/batches/${batchId}/assign-student`,
        method: 'POST',
        body: { studentId },
      }),
      invalidatesTags: ['Batch'],
    }),
    deleteBatch: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/batches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Batch', 'User'],
    }),
  }),
});

export const {
  useGetBatchesQuery,
  useGetBatchByIdQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useAssignStudentMutation,
  useDeleteBatchMutation,
} = batchApi;

