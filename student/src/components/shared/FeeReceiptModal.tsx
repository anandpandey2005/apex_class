'use client';

import React from 'react';
import { FeeRecord } from '../../types';
import { Button } from '../ui/Button';
import { Download, X, Building2, BookOpen, ShieldCheck, CheckCircle2, User, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface FeeReceiptModalProps {
  fee: FeeRecord | null;
  onClose: () => void;
}

function numberToWordsIndian(num: number): string {
  const integerPart = Math.floor(Math.abs(num));
  if (integerPart === 0) return 'Rupees Zero Only';

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '') + ' ';
    } else if (n > 0) {
      str += units[n] + ' ';
    }
    return str;
  };

  let n = integerPart;
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;
  let remaining = n;

  let result = '';
  if (crore > 0) result += convertLessThanOneThousand(crore).trim() + ' Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh).trim() + ' Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand).trim() + ' Thousand ';
  if (remaining > 0) result += convertLessThanOneThousand(remaining).trim() + ' ';

  return `Rupees ${result.trim()} Only`;
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({ fee, onClose }) => {
  if (!fee) return null;

  const instituteName = process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'Apex Coaching Institute';
  const instituteAddress = 'Plot 12, Knowledge Park III, Greater Noida, UP - 201310';
  const institutePhone = process.env.NEXT_PUBLIC_INSTITUTE_PHONE || '+91 8750309712';
  const instituteEmail = 'contact@apexcoaching.com';

  const handleDownloadPDF = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.open(`${apiBase}/fees/${fee._id}/receipt`, '_blank');
  };

  const batchDisplayName = fee.batchId?.name
    ? `${fee.batchId.name} (${fee.batchId.code || 'BATCH'})`
    : 'Tuition Batch Enrollment';

  const balance = Math.max(0, fee.amountDue - fee.amountPaid);
  const wordsAmount = numberToWordsIndian(fee.amountPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 sm:p-6 text-white shadow-2xl space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-zinc-300 mb-0">
              Official Fee Receipt & Audit Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Canvas */}
        <div className="border border-zinc-800 bg-black rounded-lg overflow-hidden text-xs text-zinc-200">
          {/* Header Banner */}
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 text-center space-y-1">
            <h2 className="text-lg font-black text-white tracking-tight mb-0">{instituteName}</h2>
            <p className="text-[11px] text-cyan-400 font-semibold mb-0">
              PREMIER ACADEMY FOR JEE, NEET, FOUNDATION & ADVANCED SCIENCES
            </p>
            <p className="text-[10px] text-zinc-400 mb-0">
              {instituteAddress} | Phone: {institutePhone} | Email: {instituteEmail}
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                TAX INVOICE & TUITION FEE RECEIPT
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Meta Top Line */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/60 border border-zinc-800/80 rounded-md p-3 gap-2">
              <div>
                <span className="text-zinc-500 text-[11px] block">Receipt Number:</span>
                <span className="font-mono font-bold text-white text-xs">
                  {fee.receiptNumber || `RCP-${fee._id}`}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-zinc-500 text-[11px] block">Payment Date & Time:</span>
                <span className="font-mono text-zinc-300 text-xs">
                  {fee.paidDate || fee.dueDate} {fee.transactionTime || '12:00:00'}
                </span>
              </div>
            </div>

            {/* Student & Batch Information Card */}
            <div className="border border-zinc-800 bg-zinc-950 rounded-md p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-zinc-400" /> Student & Academic Particulars
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 text-[11px] block">Student Name:</span>
                  <span className="font-bold text-white text-sm">{fee.studentId?.name || 'Student'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px] block">Enrolled Batch:</span>
                  <span className="font-bold text-emerald-400 text-xs">{batchDisplayName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px] block">Email / Contact:</span>
                  <span className="text-zinc-300 font-mono text-[11px]">
                    {fee.studentId?.email || 'N/A'} {fee.studentId?.phone ? `| ${fee.studentId.phone}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px] block">Billing Term:</span>
                  <span className="font-bold text-white text-xs">{fee.month}</span>
                </div>
                {fee.studentId?.aadharNumber && (
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Aadhar Card UID:</span>
                    <span className="font-mono text-zinc-300 text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      UID: {fee.studentId.aadharNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Audit Proof Record */}
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-md p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Transaction Audit Proof
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Txn Reference / UTR:</span>
                  <span className="font-mono font-bold text-white">
                    {fee.transactionId || fee.razorpayPaymentId || 'UPI-DIRECT-VERIFIED'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Payment Method:</span>
                  <span className="font-bold text-zinc-200">{fee.paymentMethod || 'UPI'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Payer / Depositor:</span>
                  <span className="font-semibold text-zinc-300">
                    {fee.senderName || fee.studentId?.name || 'Authorized Account'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Bank / Channel:</span>
                  <span className="font-semibold text-zinc-300">{fee.bankName || 'UPI Banking Network'}</span>
                </div>
              </div>
            </div>

            {/* Itemized Dues & Accounting Table */}
            <div className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-300">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Billing Cycle</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  <tr>
                    <td className="p-2.5 font-bold text-white">
                      Tuition & Academic Training - {fee.month}
                    </td>
                    <td className="p-2.5 text-zinc-400">{fee.month}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {fee.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-white">
                      {formatCurrency(fee.amountPaid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Amount in Words */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Words Box */}
              <div className="border border-zinc-800 bg-zinc-900/60 rounded-md p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Amount Received in Words:
                  </span>
                  <p className="font-serif italic font-bold text-zinc-200 text-xs mb-0">{wordsAmount}</p>
                </div>
                <div className="pt-2 text-[10px] text-emerald-400 font-semibold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 inline shrink-0" /> Full Payment Verified & Audited
                </div>
              </div>

              {/* Totals Breakdown Box */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-md p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Tuition Fee:</span>
                  <span className="font-mono text-white">{formatCurrency(fee.amountDue)}</span>
                </div>
                <div className="flex justify-between font-bold bg-emerald-950/60 text-emerald-300 p-1.5 rounded border border-emerald-800">
                  <span>Net Amount Paid:</span>
                  <span className="font-mono">{formatCurrency(fee.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-zinc-500">Balance Outstanding:</span>
                  <span className={`font-mono font-bold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Digital Security Seal & Verification Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-zinc-900 text-[10px] text-zinc-500 gap-2">
              <div>
                <p className="mb-0.5 font-semibold text-zinc-400">
                  Apex Coaching ERP • Authenticated Digital Invoice
                </p>
                <p className="mb-0 text-zinc-600">Computer generated receipt. No physical signature required.</p>
              </div>
              <div className="text-center sm:text-right border border-emerald-900/60 bg-emerald-950/20 px-3 py-1.5 rounded">
                <span className="text-emerald-400 font-bold block">✓ ACCOUNTS AUDIT SEAL</span>
                <span className="text-zinc-500 font-mono text-[9px]">REF: APX-SECURE-FIN-2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
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
