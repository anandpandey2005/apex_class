'use client';

import React from 'react';
import { FeeRecord } from '../../types';
import { Button } from '../ui/Button';
import { Download, X, Building2, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface FeeReceiptModalProps {
  fee: FeeRecord | null;
  onClose: () => void;
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({ fee, onClose }) => {
  if (!fee) return null;

  const instituteName = process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'Apex Coaching Institute';
  const institutePhone = process.env.NEXT_PUBLIC_INSTITUTE_PHONE || '+91 98765 43210';

  const handleDownloadPDF = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
    window.open(`${apiBase}/fees/${fee._id}/receipt`, '_blank');
  };

  const batchDisplayName = fee.batchId?.name
    ? `${fee.batchId.name} (${fee.batchId.code || 'BATCH'})`
    : 'Tuition Batch Enrollment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:p-6 text-white shadow-2xl space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-zinc-400" />
            <h3 className="text-base font-bold mb-0 text-white">Fee Receipt Preview</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Body */}
        <div className="p-4 border border-zinc-800 bg-black rounded-md space-y-4 text-xs">
          <div className="text-center border-b border-zinc-900 pb-3 space-y-1">
            <h2 className="text-lg font-bold text-white mb-0">{instituteName}</h2>
            <p className="text-zinc-500 mb-0">Phone: {institutePhone}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 border border-zinc-700 font-bold bg-zinc-900 text-white rounded text-[11px]">
              OFFICIAL PAYMENT RECEIPT
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 mb-1">Receipt No.</p>
              <p className="font-mono font-bold text-white mb-0">{fee.receiptNumber || `RCP-${fee._id.slice(-6)}`}</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Payment Date</p>
              <p className="font-bold text-white mb-0">{fee.paidDate || fee.dueDate}</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Student Name</p>
              <p className="font-bold text-white mb-0">{fee.studentId?.name || 'Student'}</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1 flex items-center">
                <BookOpen className="w-3 h-3 mr-1 text-zinc-400" /> Enrolled Batch
              </p>
              <p className="font-bold text-emerald-400 mb-0">{batchDisplayName}</p>
            </div>
          </div>

          {/* Transaction Proof Audit Box */}
          <div className="border border-zinc-800 bg-zinc-900/80 rounded-md p-3 space-y-2">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              PROOF OF TRANSACTION AUDIT LOG
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-zinc-500 block">Txn ID / UTR:</span>
                <span className="font-mono font-bold text-white">{fee.transactionId || fee.razorpayPaymentId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Payment Time:</span>
                <span className="font-mono text-zinc-300">{fee.paidDate} {fee.transactionTime || ''}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Payer / Sender:</span>
                <span className="font-semibold text-white">{fee.senderName || fee.studentId?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Bank / Gateway:</span>
                <span className="font-semibold text-white">{fee.bankName || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Dues Breakdown Table */}
          <div className="border border-zinc-800 rounded p-3 space-y-2 bg-zinc-950">
            <div className="flex justify-between font-semibold border-b border-zinc-900 pb-1 text-zinc-400">
              <span>Billing Term & Batch</span>
              <span>Amount Paid</span>
            </div>
            <div className="flex justify-between font-bold text-white text-sm">
              <span>{fee.month} - {fee.batchId?.name || 'Tuition Fee'}</span>
              <span className="text-emerald-400">{formatCurrency(fee.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-zinc-500 pt-1 border-t border-zinc-900">
              <span>Total Batch Fee:</span>
              <span>{formatCurrency(fee.amountDue)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 font-bold">
              <span>Balance Dues:</span>
              <span>{formatCurrency(fee.amountDue - fee.amountPaid)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-zinc-900">
            <span>Payment Method: <strong className="text-white font-mono">{fee.paymentMethod || 'UPI'}</strong></span>
            <span>Status: <strong className="text-emerald-400 uppercase">{fee.status}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
          <Button variant="primary" onClick={handleDownloadPDF} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};
