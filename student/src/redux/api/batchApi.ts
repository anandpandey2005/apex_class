import { apiSlice } from './apiSlice';
import { Batch } from '../../types';

export const batchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBatches: builder.query<{ success: boolean; data: Batch[] }, void>({
      query: () => '/batches',
      providesTags: ['Batch'],
    }),
  }),
});

export const { useGetBatchesQuery } = batchApi;
