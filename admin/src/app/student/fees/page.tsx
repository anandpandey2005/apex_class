'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FeeReceiptModal } from '../../../components/shared/FeeReceiptModal';
import { FeeRecord } from '../../../types';
import { CreditCard, FileText, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { useGetMyFeesQuery } from '../../../redux/api/feeApi';

export default function StudentFeesPage() {
  const [selectedReceipt, setSelectedReceipt] = useState<FeeRecord | null>(null);
  const { data, isLoading, isError, refetch } = useGetMyFeesQuery();

  const studentFees: FeeRecord[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1>My Tuition Fee Receipts</h1>
        <p>View fee payment statements and download official PDF receipts directly synced from live database.</p>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Fetching live payment receipts from database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to connect to database or session expired.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Live Fetch
          </Button>
        </Card>
      )}

      {/* Dues Ledger */}
      {!isLoading && !isError && (
        <Card className="border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fee Invoices & Payment Ledger ({studentFees.length})</CardTitle>
              <Badge variant="solid">LIVE DATABASE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {studentFees.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No fee records found in MongoDB for your student account.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Billing Term</th>
                    <th>Batch</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {studentFees.map((fee) => (
                    <tr key={fee._id}>
                      <td className="font-mono text-xs font-bold text-white">
                        {fee.receiptNumber || `RCP-${fee._id.slice(-6)}`}
                      </td>
                      <td className="text-zinc-300 font-medium">{fee.month}</td>
                      <td className="text-zinc-400 text-xs">{fee.batchId?.name || 'Assigned Batch'}</td>
                      <td className="font-bold text-white">{formatCurrency(fee.amountPaid)}</td>
                      <td>
                        <Badge variant={fee.status === 'PAID' ? 'solid' : 'outline'}>
                          {fee.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReceipt(fee)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          View Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
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
