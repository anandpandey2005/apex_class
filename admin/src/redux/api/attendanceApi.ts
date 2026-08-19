import { apiSlice } from './apiSlice';
import { AttendanceRecord, AttendanceStudentStat } from '../../types';

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceRegister: builder.query<
      { success: boolean; data: AttendanceRecord[] },
      { batchId?: string; date?: string; month?: string; studentId?: string }
    >({
      query: (params) => ({
        url: '/attendance/register',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceStats: builder.query<
      {
        success: boolean;
        data: {
          totalStudentsTracked: number;
          flaggedLowAttendanceCount: number;
          students: AttendanceStudentStat[];
          flaggedStudents: AttendanceStudentStat[];
        };
      },
      { batchId?: string }
    >({
      query: (params) => ({
        url: '/attendance/stats',
        params,
      }),
      providesTags: ['Attendance'],
    }),
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
          records: AttendanceRecord[];
        };
      },
      void
    >({
      query: () => '/attendance/my-attendance',
      providesTags: ['Attendance'],
    }),
    markBatchAttendance: builder.mutation<
      { success: boolean; message: string },
      {
        date: string;
        batchId: string;
        records: { studentId: string; status: string; remarks?: string }[];
      }
    >({
      query: (body) => ({
        url: '/attendance/mark',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetAttendanceRegisterQuery,
  useGetAttendanceStatsQuery,
  useGetMyAttendanceQuery,
  useMarkBatchAttendanceMutation,
} = attendanceApi;
