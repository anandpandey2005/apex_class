'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGetMyAttendanceQuery } from '../../../redux/api/attendanceApi';

export default function StudentAttendancePage() {
  const { data, isLoading, isError, refetch } = useGetMyAttendanceQuery();

  const stats = data?.data || {
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendancePercentage: 100,
    records: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>My Attendance Register</h1>
        <p>Personal attendance telemetry and date-wise session log synced live from database.</p>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Fetching live attendance records from database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to load attendance register from database.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Query
          </Button>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          {/* Stats Header Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-zinc-800">
              <p className="text-xs text-zinc-400 mb-1">TOTAL CLASSES</p>
              <h2 className="text-2xl font-extrabold text-white mb-0">{stats.totalClasses}</h2>
            </Card>
            <Card className="border-zinc-800">
              <p className="text-xs text-zinc-400 mb-1">SESSIONS PRESENT</p>
              <h2 className="text-2xl font-extrabold text-white mb-0">{stats.present}</h2>
            </Card>
            <Card className="border-zinc-800">
              <p className="text-xs text-zinc-400 mb-1">ABSENT / LATE</p>
              <h2 className="text-2xl font-extrabold text-white mb-0">{stats.absent + stats.late}</h2>
            </Card>
            <Card className="border-zinc-800">
              <p className="text-xs text-zinc-400 mb-1">ATTENDANCE RATE</p>
              <h2 className="text-2xl font-extrabold text-white mb-0">{stats.attendancePercentage}%</h2>
            </Card>
          </div>

          {/* Attendance History Table */}
          <Card className="border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Session History Log ({stats.records.length})</CardTitle>
                <Badge variant="solid">LIVE DATABASE</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {stats.records.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  No attendance records logged in database yet for your student profile.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Batch Name</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.records.map((r: any, idx: number) => (
                      <tr key={r._id || idx}>
                        <td className="font-mono text-xs text-white">{r.date}</td>
                        <td className="text-zinc-300 font-bold">{r.batchId?.name || 'Batch Session'}</td>
                        <td>
                          <Badge variant={r.status === 'PRESENT' ? 'solid' : 'outline'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="text-xs text-zinc-400">{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
