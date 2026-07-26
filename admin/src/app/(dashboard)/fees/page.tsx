'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { FeeReceiptModal } from '../../../components/shared/FeeReceiptModal';
import { FeeRecord } from '../../../types';
import {
  CreditCard,
  FileText,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  ShieldCheck,
  Check,
  XCircle,
  Eye,
} from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import {
  useGetFeeDuesDeskQuery,
  useRecordPaymentMutation,
  useApprovePaymentProofMutation,
  useRejectPaymentProofMutation,
} from '../../../redux/api/feeApi';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { showToast } from '../../../redux/slices/toastSlice';

const ITEMS_PER_PAGE = 10;

export default function FeesDeskPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isTeacher = currentUser?.role === 'TEACHER';

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNDER_VERIFICATION' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<FeeRecord | null>(null);
  const [payingFeeRecord, setPayingFeeRecord] = useState<FeeRecord | null>(null);
  const [reviewingProofRecord, setReviewingProofRecord] = useState<FeeRecord | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [isRejectingModal, setIsRejectingModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data, isLoading, isError, refetch } = useGetFeeDuesDeskQuery(
    activeTab !== 'ALL' ? { status: activeTab } : {}
  );
  const [recordPaymentMutation, { isLoading: isSubmittingPayment }] = useRecordPaymentMutation();
  const [approvePaymentProofMutation, { isLoading: isApproving }] = useApprovePaymentProofMutation();
  const [rejectPaymentProofMutation, { isLoading: isRejecting }] = useRejectPaymentProofMutation();

  const feeRecords: FeeRecord[] = data?.data || [];
  const totalCollected = data?.meta?.totalCollected || feeRecords.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalPending = data?.meta?.totalPending || feeRecords.reduce((acc, curr) => acc + (curr.amountDue - curr.amountPaid), 0);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentMethod: 'UPI',
    paidDate: todayStr,
    transactionTime: timeStr,
    transactionId: '',
    senderName: '',
    bankName: '',
    notes: '',
  });

  const openPaymentModal = (fee: FeeRecord) => {
    setPayingFeeRecord(fee);
    const amountRemaining = Math.max(0, fee.amountDue - fee.amountPaid);
    const n = new Date();
    setPaymentForm({
      amountPaid: amountRemaining,
      paymentMethod: 'UPI',
      paidDate: n.toISOString().split('T')[0],
      transactionTime: `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`,
      transactionId: `TXN-${Date.now().toString().slice(-8)}`,
      senderName: fee.studentId?.name || '',
      bankName: 'HDFC Bank / UPI',
      notes: '',
    });
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFeeRecord) return;

    if (!paymentForm.transactionId.trim() || !paymentForm.senderName.trim() || !paymentForm.bankName.trim()) {
      dispatch(showToast({ message: 'Transaction ID, Sender Name, and Bank Name are required for proof of payment.', type: 'error' }));
      return;
    }

    try {
      await recordPaymentMutation({
        id: payingFeeRecord._id,
        amountPaid: Number(paymentForm.amountPaid),
        paymentMethod: paymentForm.paymentMethod,
        paidDate: paymentForm.paidDate,
        transactionTime: paymentForm.transactionTime,
        transactionId: paymentForm.transactionId,
        senderName: paymentForm.senderName,
        bankName: paymentForm.bankName,
        notes: paymentForm.notes,
      }).unwrap();

      dispatch(
        showToast({
          message: `Payment of ${formatCurrency(Number(paymentForm.amountPaid))} recorded for ${payingFeeRecord.studentId?.name || 'Student'}!`,
          type: 'success',
        })
      );
      setPayingFeeRecord(null);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to record payment', type: 'error' }));
    }
  };

  const handleApproveProof = async (feeId: string) => {
    try {
      await approvePaymentProofMutation(feeId).unwrap();
      dispatch(showToast({ message: 'Student Payment Proof APPROVED & Receipt Issued!', type: 'success' }));
      setReviewingProofRecord(null);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to approve payment proof', type: 'error' }));
    }
  };

  const handleRejectProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingProofRecord) return;
    if (!rejectionReasonInput.trim()) {
      dispatch(showToast({ message: 'Rejection reason is required.', type: 'error' }));
      return;
    }

    try {
      await rejectPaymentProofMutation({
        id: reviewingProofRecord._id,
        rejectionReason: rejectionReasonInput,
      }).unwrap();

      dispatch(showToast({ message: 'Payment proof REJECTED and student notified!', type: 'success' }));
      setReviewingProofRecord(null);
      setIsRejectingModal(false);
      setRejectionReasonInput('');
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to reject payment proof', type: 'error' }));
    }
  };

  const filteredFees = feeRecords.filter((f) => {
    const matchesSearch =
      f.studentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.studentId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.batchId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredFees.length / ITEMS_PER_PAGE) || 1;
  const paginatedFees = filteredFees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white mb-2">Fee Dues & Invoicing Desk</h1>
          <p className="text-xs md:text-sm text-zinc-400">
            {isTeacher
              ? 'View revenue telemetry and pending tuition dues for your assigned tuition batches.'
              : 'Review student payment proofs, approve or reject manual submissions, and issue PDF receipts.'}
          </p>
        </div>
      </div>

      {/* Dues Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800">
          <p className="text-xs text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
            {isTeacher ? 'MY ASSIGNED BATCHES REVENUE' : 'TOTAL REVENUE COLLECTED'}
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-0">{formatCurrency(totalCollected)}</h2>
        </Card>
        <Card className="border-zinc-800">
          <p className="text-xs text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
            {isTeacher ? 'MY ASSIGNED BATCHES PENDING DUES' : 'TOTAL PENDING DUES'}
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-0">{formatCurrency(totalPending)}</h2>
        </Card>
        <Card className="border-zinc-800">
          <p className="text-xs text-zinc-400 mb-1 font-semibold uppercase tracking-wider">REGISTERED INVOICES</p>
          <h2 className="text-2xl font-extrabold text-white mb-0">{feeRecords.length} Bills</h2>
        </Card>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Querying live dues desk from MongoDB database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to fetch live fee records from backend database.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Query
          </Button>
        </Card>
      )}

      {/* Filter Tabs & Table with Pagination */}
      {!isLoading && !isError && (
        <Card className="border-zinc-800 flex flex-col justify-between">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'UNDER_VERIFICATION', 'PAID', 'PENDING', 'OVERDUE'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'UNDER_VERIFICATION' ? 'UNDER VERIFICATION' : `${tab} DUES`}
                  </Button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <Input
                  placeholder="Search by student, UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredFees.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No fee records found in MongoDB matching active criteria.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr>
                        <th>Student Profile</th>
                        <th>Billing Month</th>
                        <th>Amount Due</th>
                        <th>Amount Paid</th>
                        <th>Txn Proof / UTR</th>
                        <th>Verification</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFees.map((fee: any) => (
                        <tr key={fee._id}>
                          <td>
                            <div className="font-bold text-white">{fee.studentId?.name || 'Student'}</div>
                            <div className="text-xs text-zinc-500">{fee.studentId?.email || 'N/A'}</div>
                          </td>
                          <td className="text-zinc-300 font-medium">{fee.month}</td>
                          <td className="font-mono text-zinc-300">{formatCurrency(fee.amountDue)}</td>
                          <td className="font-mono font-bold text-white">{formatCurrency(fee.amountPaid)}</td>
                          <td>
                            {fee.transactionId ? (
                              <div className="text-xs">
                                <span className="font-mono font-bold text-emerald-400 block">{fee.transactionId}</span>
                                <span className="text-[10px] text-zinc-400 block">
                                  {fee.bankName || 'Bank'} ({fee.paymentMethod || 'UPI'})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-600 italic">Unverified</span>
                            )}
                          </td>
                          <td>
                            {fee.status === 'UNDER_VERIFICATION' || fee.verificationStatus === 'PENDING' ? (
                              <Badge variant="outline" className="bg-amber-950/40 border-amber-700 text-amber-300 text-[10px] uppercase font-bold animate-pulse">
                                UNDER VERIFICATION
                              </Badge>
                            ) : fee.verificationStatus === 'REJECTED' ? (
                              <Badge variant="outline" className="bg-rose-950/40 border-rose-700 text-rose-300 text-[10px] uppercase font-bold">
                                PROOF REJECTED
                              </Badge>
                            ) : (
                              <span className="text-xs text-zinc-500 font-mono">Verified</span>
                            )}
                          </td>
                          <td>
                            <Badge variant={fee.status === 'PAID' ? 'solid' : 'outline'}>
                              {fee.status}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex flex-wrap items-center gap-1.5 min-w-[220px]">
                              {fee.status === 'UNDER_VERIFICATION' || fee.verificationStatus === 'PENDING' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReviewingProofRecord(fee)}
                                    className="border-amber-700 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    Review
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleApproveProof(fee._id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setReviewingProofRecord(fee);
                                      setIsRejectingModal(true);
                                    }}
                                    className="border-rose-900 text-rose-400 hover:bg-rose-950"
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              ) : fee.status !== 'PAID' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openPaymentModal(fee)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                  Mark Paid
                                </Button>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReceipt(fee)}
                                className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                Receipt
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Bar */}
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-zinc-900 text-xs">
                  <span className="text-zinc-500">
                    Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> (
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredFees.length)} of {filteredFees.length} Invoices)
                  </span>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Student Payment Proof Modal */}
      {reviewingProofRecord && !isRejectingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-base font-bold text-white mb-0 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" /> Review Student Payment Proof
                </h3>
                <p className="text-xs text-zinc-400 mb-0 font-mono">
                  Invoice: {reviewingProofRecord.month} - {reviewingProofRecord.studentId?.name}
                </p>
              </div>
              <button onClick={() => setReviewingProofRecord(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span>Student Name:</span>
                  <span className="font-bold text-white">{reviewingProofRecord.studentId?.name}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Total Amount Due:</span>
                  <span className="font-mono text-white">{formatCurrency(reviewingProofRecord.amountDue)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Submitted Payment Amount:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatCurrency(reviewingProofRecord.pendingPaymentAmount || reviewingProofRecord.amountDue)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 rounded border border-zinc-800 space-y-2">
                <p className="font-bold text-white text-xs mb-1 uppercase tracking-wider">SUBMITTED PROOF METADATA</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Transaction ID / UTR:</span>
                    <span className="font-mono font-bold text-emerald-400">{reviewingProofRecord.transactionId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Payment Date & Time:</span>
                    <span className="font-mono text-zinc-300">{reviewingProofRecord.paidDate} {reviewingProofRecord.transactionTime || ''}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Sender / Payer Account:</span>
                    <span className="font-semibold text-white">{reviewingProofRecord.senderName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Bank / Gateway:</span>
                    <span className="font-semibold text-white">{reviewingProofRecord.bankName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {reviewingProofRecord.notes && (
                <div className="p-2.5 bg-zinc-900 rounded text-zinc-400">
                  <strong className="text-white block mb-0.5">Student Notes:</strong>
                  {reviewingProofRecord.notes}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button variant="outline" size="sm" onClick={() => setReviewingProofRecord(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectingModal(true)}
                  className="border-rose-900 text-rose-400 hover:bg-rose-950"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject Proof
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApproveProof(reviewingProofRecord._id)}
                  disabled={isApproving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {isApproving ? 'Approving...' : 'Approve & Mark Paid'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Proof Reason Modal */}
      {isRejectingModal && reviewingProofRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-md rounded-lg border border-rose-900 bg-zinc-950 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-base font-bold text-rose-400 mb-0">Reject Student Payment Proof</h3>
              <button onClick={() => setIsRejectingModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectProofSubmit} className="space-y-3 text-xs">
              <p className="text-zinc-400 mb-0">
                Please state the reason for rejecting student payment proof for <strong>{reviewingProofRecord.studentId?.name}</strong>.
              </p>
              <div>
                <label className="text-zinc-400 block mb-1">Rejection Reason / Audit Notes *</label>
                <Input
                  required
                  placeholder="e.g. UTR number not found in bank statement / Invalid amount"
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-900">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectingModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isRejecting} className="bg-rose-600 hover:bg-rose-500 text-white">
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Transaction Proof Entry Modal */}
      {payingFeeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-base font-bold text-white mb-0 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Record Fee Payment Proof
                </h3>
                <p className="text-xs text-zinc-400 mb-0 font-mono">
                  Invoice: {payingFeeRecord.month} - {payingFeeRecord.studentId?.name}
                </p>
              </div>
              <button onClick={() => setPayingFeeRecord(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-900/80 rounded border border-zinc-800 space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Student Name:</span>
                  <span className="font-bold text-white">{payingFeeRecord.studentId?.name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total Fee Due:</span>
                  <span className="font-mono text-white">{formatCurrency(payingFeeRecord.amountDue)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Already Paid:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(payingFeeRecord.amountPaid)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Amount Received (INR) *</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">CASH (Physical Counter)</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER (IMPS/NEFT)</option>
                    <option value="CARD">CREDIT/DEBIT CARD</option>
                    <option value="RAZORPAY">RAZORPAY GATEWAY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Transaction ID / UTR Number *</label>
                <Input
                  required
                  placeholder="e.g. UTR 423984920392 or TXN-983291"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Payer / Sender Name *</label>
                  <Input
                    required
                    placeholder="Account Holder / Sender Name"
                    value={paymentForm.senderName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, senderName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Bank Name / Gateway *</label>
                  <Input
                    required
                    placeholder="e.g. HDFC Bank, SBI, PhonePe"
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Payment Date *</label>
                  <Input
                    type="date"
                    required
                    value={paymentForm.paidDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Payment Time *</label>
                  <Input
                    type="time"
                    required
                    value={paymentForm.transactionTime}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Notes / Remarks</label>
                <Input
                  placeholder="Optional audit notes..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayingFeeRecord(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmittingPayment}>
                  {isSubmittingPayment ? 'Saving Proof...' : 'Confirm & Mark Paid'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for PDF Receipt View */}
      {selectedReceipt && (
        <FeeReceiptModal
          fee={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}


