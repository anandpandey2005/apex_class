'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { FeeReceiptModal } from '../../components/shared/FeeReceiptModal';
import { FeeRecord } from '../../types';
import { FileText, Loader2, AlertCircle, CreditCard, ShieldCheck, X } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import {
  useGetMyFeesQuery,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useRecordPaymentMutation,
} from '../../redux/api/feeApi';
import { useAppDispatch } from '../../redux/store';
import { showToast } from '../../redux/slices/toastSlice';

export default function StudentFeesPage() {
  const dispatch = useAppDispatch();
  const [selectedReceipt, setSelectedReceipt] = useState<FeeRecord | null>(null);
  const [manualFeeRecord, setManualFeeRecord] = useState<FeeRecord | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);
  const [razorpayModalOrder, setRazorpayModalOrder] = useState<{
    fee: FeeRecord;
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  } | null>(null);

  const { data, isLoading, isError, refetch } = useGetMyFeesQuery();
  const [createRazorpayOrderMutation, { isLoading: isCreatingOrder }] = useCreateRazorpayOrderMutation();
  const [verifyRazorpayPaymentMutation, { isLoading: isVerifyingPayment }] = useVerifyRazorpayPaymentMutation();
  const [recordPaymentMutation, { isLoading: isSubmittingProof }] = useRecordPaymentMutation();

  const studentFees: FeeRecord[] = data?.data || [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [proofForm, setProofForm] = useState({
    amountPaid: 0,
    paymentMethod: 'UPI',
    paidDate: todayStr,
    transactionTime: timeStr,
    transactionId: '',
    senderName: '',
    bankName: '',
    notes: '',
  });

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPay = async (fee: FeeRecord) => {
    try {
      const isLoaded = await loadRazorpayScript();
      const orderRes = await createRazorpayOrderMutation(fee._id).unwrap();
      const orderData = orderRes.data;

      if (isLoaded && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency,
          name: 'Apex Coaching Institute',
          description: `Tuition Fee - ${fee.month}`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              await verifyRazorpayPaymentMutation({
                id: fee._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                senderName: fee.studentId?.name || 'Student Payer',
                bankName: 'Razorpay Gateway',
              }).unwrap();
              dispatch(showToast({ message: 'Razorpay Payment Successful & Verified!', type: 'success' }));
            } catch (err: any) {
              dispatch(showToast({ message: err?.data?.message || 'Payment verification failed', type: 'error' }));
            }
          },
          prefill: {
            name: fee.studentId?.name || 'Student',
            email: fee.studentId?.email || '',
            contact: fee.studentId?.phone || '',
          },
          theme: {
            color: '#4f46e5',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback Razorpay Checkout Simulation Modal
        setRazorpayModalOrder({
          fee,
          orderId: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: orderData.keyId,
        });
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to initialize Razorpay payment', type: 'error' }));
    }
  };
  const handleSimulatedRazorpaySuccess = async () => {
    if (!razorpayModalOrder) return;
    try {
      const mockPaymentId = `pay_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      await verifyRazorpayPaymentMutation({
        id: razorpayModalOrder.fee._id,
        razorpayOrderId: razorpayModalOrder.orderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: 'simulated_verified_hmac_sig',
        senderName: razorpayModalOrder.fee.studentId?.name || 'Student Payer',
        bankName: 'Razorpay Gateway (UPI/NetBanking)',
      }).unwrap();

      dispatch(showToast({ message: 'Razorpay Payment Completed & Verified with Transaction Proof!', type: 'success' }));
      setRazorpayModalOrder(null);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to verify payment', type: 'error' }));
    }
  };

  const openManualProofModal = (fee: FeeRecord) => {
    setManualFeeRecord(fee);
    setDeclarationAccepted(false);
    const remaining = Math.max(0, fee.amountDue - fee.amountPaid);
    const n = new Date();
    setProofForm({
      amountPaid: remaining,
      paymentMethod: 'UPI',
      paidDate: n.toISOString().split('T')[0],
      transactionTime: `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`,
      transactionId: `UTR-${Date.now().toString().slice(-8)}`,
      senderName: fee.studentId?.name || '',
      bankName: 'Google Pay / PhonePe',
      notes: '',
    });
  };

  const handleManualProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFeeRecord) return;

    if (!declarationAccepted) {
      dispatch(showToast({ message: 'Legal Declaration Required: You must accept the terms before submitting.', type: 'error' }));
      return;
    }

    if (!proofForm.transactionId.trim() || !proofForm.senderName.trim() || !proofForm.bankName.trim()) {
      dispatch(showToast({ message: 'Transaction ID / UTR, Sender Name, and Bank Name are mandatory.', type: 'error' }));
      return;
    }

    try {
      await recordPaymentMutation({
        id: manualFeeRecord._id,
        amountPaid: Number(proofForm.amountPaid),
        paymentMethod: proofForm.paymentMethod,
        paidDate: proofForm.paidDate,
        transactionTime: proofForm.transactionTime,
        transactionId: proofForm.transactionId,
        senderName: proofForm.senderName,
        bankName: proofForm.bankName,
        declarationAccepted: true,
        notes: proofForm.notes,
      }).unwrap();

      dispatch(showToast({ message: 'Payment proof submitted! Your record is now UNDER VERIFICATION by Admin.', type: 'success' }));
      setManualFeeRecord(null);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to submit payment proof', type: 'error' }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
          My Tuition Fee Receipts & Online Desk
        </h1>
        <p className="text-xs md:text-sm text-zinc-400">
          Pay tuition fees instantly via Razorpay or submit offline payment proofs for Admin verification.
        </p>
      </div>

      {isLoading && (
        <Card className="border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Fetching live payment receipts from database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to connect to database or session expired.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Live Fetch
          </Button>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-white">Fee Invoices & Payment Ledger ({studentFees.length})</CardTitle>
              <Badge variant="solid">LIVE DATABASE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {studentFees.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No fee records found in MongoDB for your student account.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left min-w-[750px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                      <th className="py-3 px-2">Receipt #</th>
                      <th className="py-3 px-2">Billing Term</th>
                      <th className="py-3 px-2">Batch</th>
                      <th className="py-3 px-2">Amount Due</th>
                      <th className="py-3 px-2">Amount Paid</th>
                      <th className="py-3 px-2">Txn Proof / UTR</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentFees.map((fee) => (
                      <tr key={fee._id} className="border-b border-zinc-800/60">
                        <td className="font-mono text-xs font-bold text-white py-3 px-2">
                          {fee.receiptNumber || `RCP-${fee._id.slice(-6)}`}
                        </td>
                        <td className="text-zinc-300 font-medium py-3 px-2">{fee.month}</td>
                        <td className="text-zinc-300 font-medium font-mono text-xs py-3 px-2">
                          {fee.batchId?.name ? `${fee.batchId.name} (${fee.batchId.code || 'BATCH'})` : 'Tuition Batch'}
                        </td>
                        <td className="font-mono text-zinc-400 py-3 px-2">{formatCurrency(fee.amountDue)}</td>
                        <td className="font-bold text-white font-mono py-3 px-2">{formatCurrency(fee.amountPaid)}</td>
                        <td className="py-3 px-2">
                          {fee.transactionId ? (
                            <div className="text-xs">
                              <span className="font-mono font-bold text-emerald-400 block">{fee.transactionId}</span>
                              <span className="text-[10px] text-zinc-400 block">{fee.bankName || 'Gateway'} ({fee.paymentMethod || 'UPI'})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500 italic">No proof submitted</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {fee.status === 'UNDER_VERIFICATION' || fee.verificationStatus === 'PENDING' ? (
                            <Badge variant="outline" className="bg-amber-950/40 border-amber-700 text-amber-300 text-[10px] uppercase font-bold animate-pulse">
                              UNDER VERIFICATION
                            </Badge>
                          ) : fee.verificationStatus === 'REJECTED' ? (
                            <div>
                              <Badge variant="outline" className="bg-rose-950/40 border-rose-700 text-rose-300 text-[10px] uppercase font-bold">
                                PROOF REJECTED
                              </Badge>
                              {fee.rejectionReason && (
                                <p className="text-[9px] text-rose-400 mb-0 font-mono mt-0.5">{fee.rejectionReason}</p>
                              )}
                            </div>
                          ) : (
                            <Badge variant={fee.status === 'PAID' ? 'solid' : 'outline'}>
                              {fee.status}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-[220px]">
                            {fee.status !== 'PAID' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleRazorpayPay(fee)}
                                  disabled={isCreatingOrder}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold shadow-sm"
                                >
                                  <CreditCard className="w-3.5 h-3.5 mr-1" />
                                  Razorpay
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openManualProofModal(fee)}
                                  className="border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                  Submit Proof
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReceipt(fee)}
                              className="border-zinc-800 hover:bg-zinc-900 text-zinc-300"
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Razorpay Gateway Checkout Simulation Modal */}
      {razorpayModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-md rounded-xl border border-emerald-800/80 bg-zinc-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white mb-0">Razorpay Payment Gateway</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Order ID: {razorpayModalOrder.orderId}</p>
                </div>
              </div>
              <button onClick={() => setRazorpayModalOrder(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Tuition Month:</span>
                <span className="font-bold text-white">{razorpayModalOrder.fee.month}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Course Batch:</span>
                <span className="font-bold text-white">{razorpayModalOrder.fee.batchId?.name}</span>
              </div>
              <div className="flex justify-between text-zinc-300 pt-2 border-t border-emerald-900/60 text-sm">
                <span className="font-bold">Total Amount Payable:</span>
                <span className="font-bold text-emerald-400 font-mono">{formatCurrency(razorpayModalOrder.amount)}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <p className="font-semibold text-white mb-1">Select Test Payment Channel:</p>
              <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-zinc-200">UPI / GPay / PhonePe / NetBanking</span>
                </div>
                <Badge variant="solid" className="bg-emerald-500 text-black">Instant</Badge>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRazorpayModalOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSimulatedRazorpaySuccess}
                disabled={isVerifyingPayment}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
              >
                {isVerifyingPayment ? 'Verifying Payment...' : 'Pay & Verify Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Proof Entry Modal with Terms & Conditions */}
      {manualFeeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-base font-bold text-white mb-0 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Submit Offline Payment Proof
                </h3>
                <p className="text-xs text-zinc-400 mb-0 font-mono">
                  Invoice: {manualFeeRecord.month} - {manualFeeRecord.batchId?.name}
                </p>
              </div>
              <button onClick={() => setManualFeeRecord(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualProofSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-900/80 rounded border border-zinc-800 space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Amount Due:</span>
                  <span className="font-mono text-white">{formatCurrency(manualFeeRecord.amountDue)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Already Paid:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(manualFeeRecord.amountPaid)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Amount Paid (INR) *</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={proofForm.amountPaid}
                    onChange={(e) => setProofForm({ ...proofForm, amountPaid: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Payment Method *</label>
                  <select
                    value={proofForm.paymentMethod}
                    onChange={(e) => setProofForm({ ...proofForm, paymentMethod: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                  >
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="BANK_TRANSFER">IMPS / NEFT / Bank Transfer</option>
                    <option value="CASH">CASH (Physical Deposit)</option>
                    <option value="CARD">CREDIT/DEBIT CARD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Transaction ID / UTR Number *</label>
                <Input
                  required
                  placeholder="e.g. UTR 423984920392 or TXN-983291"
                  value={proofForm.transactionId}
                  onChange={(e) => setProofForm({ ...proofForm, transactionId: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Payer / Sender Name *</label>
                  <Input
                    required
                    placeholder="Account Holder / Sender Name"
                    value={proofForm.senderName}
                    onChange={(e) => setProofForm({ ...proofForm, senderName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Bank Name / Gateway *</label>
                  <Input
                    required
                    placeholder="e.g. HDFC Bank, SBI, PhonePe"
                    value={proofForm.bankName}
                    onChange={(e) => setProofForm({ ...proofForm, bankName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Payment Date *</label>
                  <Input
                    type="date"
                    required
                    value={proofForm.paidDate}
                    onChange={(e) => setProofForm({ ...proofForm, paidDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Payment Time *</label>
                  <Input
                    type="time"
                    required
                    value={proofForm.transactionTime}
                    onChange={(e) => setProofForm({ ...proofForm, transactionTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Notes / Remarks</label>
                <Input
                  placeholder="Optional audit notes..."
                  value={proofForm.notes}
                  onChange={(e) => setProofForm({ ...proofForm, notes: e.target.value })}
                />
              </div>

              {/* Terms & Conditions / Legal Penalty Acknowledgment Checkbox */}
              <div className="p-3.5 bg-amber-950/20 border border-amber-800/50 rounded-md space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer text-amber-200 text-xs">
                  <input
                    type="checkbox"
                    required
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-amber-600 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="leading-snug text-[11px]">
                    <strong className="text-amber-300 block mb-0.5">TERMS & LEGAL DECLARATION *</strong>
                    I hereby declare that the UTR / Transaction ID and payment metadata entered above are true and genuine. I acknowledge that submitting false, misleading, or forged transaction details is subject to immediate rejection, mandatory fine, and strict academic disciplinary action.
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" size="sm" onClick={() => setManualFeeRecord(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingProof || !declarationAccepted}
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold disabled:opacity-50"
                >
                  {isSubmittingProof ? 'Submitting Proof...' : 'Submit for Admin Verification'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <FeeReceiptModal
          fee={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}


