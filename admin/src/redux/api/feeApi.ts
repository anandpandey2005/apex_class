import { apiSlice } from './apiSlice';
import { FeeRecord } from '../../types';

export const feeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFeeDuesDesk: builder.query<
      {
        success: boolean;
        data: FeeRecord[];
        meta: { totalCollected: number; totalPending: number; totalRecords: number };
      },
      { status?: string; studentId?: string; batchId?: string }
    >({
      query: (params) => ({
        url: '/fees',
        params,
      }),
      providesTags: ['Fee'],
    }),
    getMyFees: builder.query<
      {
        success: boolean;
        data: FeeRecord[];
        meta: { totalPaid: number; totalPending: number };
      },
      void
    >({
      query: () => '/fees/my-fees',
      providesTags: ['Fee'],
    }),
    createFeeRecord: builder.mutation<
      { success: boolean; data: FeeRecord },
      {
        studentId: string;
        batchId: string;
        month: string;
        amountDue: number;
        dueDate: string;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: '/fees',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Fee'],
    }),
    recordPayment: builder.mutation<
      { success: boolean; data: FeeRecord },
      {
        id: string;
        amountPaid: number;
        paymentMethod: string;
        paidDate?: string;
        transactionTime?: string;
        transactionId: string;
        senderName: string;
        bankName: string;
        declarationAccepted?: boolean;
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}/pay`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Fee'],
    }),
    approvePaymentProof: builder.mutation<
      { success: boolean; data: FeeRecord },
      string
    >({
      query: (id) => ({
        url: `/fees/${id}/approve-proof`,
        method: 'POST',
      }),
      invalidatesTags: ['Fee'],
    }),
    rejectPaymentProof: builder.mutation<
      { success: boolean; data: FeeRecord },
      { id: string; rejectionReason: string }
    >({
      query: ({ id, rejectionReason }) => ({
        url: `/fees/${id}/reject-proof`,
        method: 'POST',
        body: { rejectionReason },
      }),
      invalidatesTags: ['Fee'],
    }),
    createRazorpayOrder: builder.mutation<
      {
        success: boolean;
        data: {
          orderId: string;
          amount: number;
          amountPaise: number;
          currency: string;
          keyId: string;
          receipt: string;
          fee: FeeRecord;
        };
      },
      string
    >({
      query: (id) => ({
        url: `/fees/${id}/create-razorpay-order`,
        method: 'POST',
      }),
    }),
    verifyRazorpayPayment: builder.mutation<
      { success: boolean; data: FeeRecord },
      {
        id: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature?: string;
        senderName?: string;
        bankName?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}/verify-razorpay-payment`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Fee'],
    }),
  }),
});

export const {
  useGetFeeDuesDeskQuery,
  useGetMyFeesQuery,
  useCreateFeeRecordMutation,
  useRecordPaymentMutation,
  useApprovePaymentProofMutation,
  useRejectPaymentProofMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} = feeApi;


