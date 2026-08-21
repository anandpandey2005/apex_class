import { apiSlice } from './apiSlice';
import { Alumni, AlumniStats, AlumniPagination } from '../../types';

export interface GetAlumniParams {
  page?: number;
  limit?: number;
  search?: string;
  passingYear?: number;
  batchId?: string;
  currentStatus?: string;
  hasPendingDues?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const alumniApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAlumniList: builder.query<
      { success: boolean; data: Alumni[]; meta: { pagination: AlumniPagination } },
      GetAlumniParams | void
    >({
      query: (params) => ({
        url: '/alumni',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Alumni' as const, id: _id })),
              { type: 'Alumni', id: 'LIST' },
            ]
          : [{ type: 'Alumni', id: 'LIST' }],
    }),

    getAlumniById: builder.query<{ success: boolean; data: Alumni }, string>({
      query: (id) => `/alumni/${id}`,
      providesTags: (result, error, id) => [{ type: 'Alumni', id }],
    }),

    getAlumniStats: builder.query<{ success: boolean; data: AlumniStats }, void>({
      query: () => '/alumni/stats',
      providesTags: [{ type: 'Alumni', id: 'STATS' }],
    }),

    graduateStudent: builder.mutation<
      { success: boolean; data: Alumni; message: string },
      {
        studentId: string;
        passingYear: number;
        graduationDate: string;
        currentStatus?: string;
        organizationOrCollege?: string;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: '/alumni/graduate',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Alumni', id: 'LIST' }, { type: 'Alumni', id: 'STATS' }, 'User', 'Batch'],
    }),

    createAlumni: builder.mutation<{ success: boolean; data: Alumni }, Partial<Alumni>>({
      query: (body) => ({
        url: '/alumni',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Alumni', id: 'LIST' }, { type: 'Alumni', id: 'STATS' }],
    }),

    updateAlumni: builder.mutation<
      { success: boolean; data: Alumni },
      { id: string; [key: string]: any }
    >({
      query: ({ id, ...body }) => ({
        url: `/alumni/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Alumni', id },
        { type: 'Alumni', id: 'LIST' },
        { type: 'Alumni', id: 'STATS' },
      ],
    }),

    deleteAlumni: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/alumni/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Alumni', id: 'LIST' }, { type: 'Alumni', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetAlumniListQuery,
  useGetAlumniByIdQuery,
  useGetAlumniStatsQuery,
  useGraduateStudentMutation,
  useCreateAlumniMutation,
  useUpdateAlumniMutation,
  useDeleteAlumniMutation,
} = alumniApi;
