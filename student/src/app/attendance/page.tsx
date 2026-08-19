'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Loader2, AlertCircle, Calendar as CalendarIcon, List } from 'lucide-react';
import { useGetMyAttendanceQuery } from '../../redux/api/attendanceApi';
import { AttendanceCalendar } from '../../components/shared/AttendanceCalendar';

export default function StudentAttendancePage() {
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'TABLE'>('CALENDAR');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
            My Attendance Register
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Personal attendance telemetry and date-wise session log synced live from database.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'CALENDAR' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('CALENDAR')}
          >
            <CalendarIcon className="w-4 h-4 mr-1.5" />
            Calendar View
          </Button>
          <Button
            variant={viewMode === 'TABLE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('TABLE')}
          >
            <List className="w-4 h-4 mr-1.5" />
            List Log View
          </Button>
        </div>
      </div>

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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
            <Card className="border-zinc-800 p-4">
              <p className="text-[10px] md:text-xs text-zinc-400 mb-1 uppercase tracking-wider">TOTAL CLASSES</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-0">{stats.totalClasses}</h2>
            </Card>
            <Card className="border-zinc-800 p-4">
              <p className="text-[10px] md:text-xs text-emerald-400 mb-1 uppercase tracking-wider font-semibold">PRESENT</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-0">{stats.present}</h2>
            </Card>
            <Card className="border-zinc-800 p-4">
              <p className="text-[10px] md:text-xs text-amber-400 mb-1 uppercase tracking-wider font-semibold">LATE ARRIVAL</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-0">{stats.late}</h2>
            </Card>
            <Card className="border-zinc-800 p-4">
              <p className="text-[10px] md:text-xs text-rose-400 mb-1 uppercase tracking-wider font-semibold">ABSENT</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-0">{stats.absent}</h2>
            </Card>
            <Card className="border-zinc-800 p-4 col-span-2 sm:col-span-1">
              <p className="text-[10px] md:text-xs text-zinc-400 mb-1 uppercase tracking-wider">ATTENDANCE RATE</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-0">{stats.attendancePercentage}%</h2>
            </Card>
          </div>

          {viewMode === 'CALENDAR' ? (
            <AttendanceCalendar
              records={stats.records}
              startDate={data?.data?.startDate}
              endDate={data?.data?.endDate}
            />
          ) : (
            <Card className="border-zinc-800">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[500px]">
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
                            <td className="font-mono text-xs text-white whitespace-nowrap">{r.date}</td>
                            <td className="text-zinc-300 font-bold">{r.batchId?.name || 'Batch Session'}</td>
                            <td>
                              <Badge
                                variant={r.status === 'PRESENT' ? 'solid' : 'outline'}
                                className={
                                  r.status === 'LATE'
                                    ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                                    : r.status === 'ABSENT'
                                    ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                                    : ''
                                }
                              >
                                {r.status}
                              </Badge>
                            </td>
                            <td className="text-xs text-zinc-400">{r.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
