import { apiSlice } from './apiSlice';
import { User } from '../../types';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      { success: boolean; data: User[] },
      { role?: string; batchId?: string } | void
    >({
      query: (params) => ({
        url: '/users',
        params: params || {},
      }),
      providesTags: ['User'],
    }),
    createUser: builder.mutation<
      { success: boolean; data: User },
      {
        name: string;
        email: string;
        password?: string;
        role: string;
        phone?: string;
        batchIds?: string[];
        permissions?: string[];
      }
    >({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<
      { success: boolean; data: User },
      { id: string; [key: string]: any }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User', 'Batch'],
    }),
    deleteUser: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'Batch'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
