import { apiSlice } from './apiSlice';
import { FeeRecord } from '../../types';

export const feeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
  useGetMyFeesQuery,
  useRecordPaymentMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} = feeApi;

