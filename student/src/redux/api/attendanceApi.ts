import { apiSlice } from './apiSlice';
import { AttendanceRecord } from '../../types';

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyAttendance: builder.query<
      {
        success: boolean;
        data: {
          totalClasses: number;
          present: number;
          absent: number;
          late: number;
          excused: number;
          attendancePercentage: number;
          isLowAttendance: boolean;
          startDate?: string;
          endDate?: string;
          records: AttendanceRecord[];
        };
      },
      void
    >({
      query: () => '/attendance/my-attendance',
      providesTags: ['Attendance'],
    }),
  }),
});

export const { useGetMyAttendanceQuery } = attendanceApi;
