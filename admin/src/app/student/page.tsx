'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ClipboardCheck, CreditCard, GraduationCap, Megaphone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useGetMyAttendanceQuery } from '../../redux/api/attendanceApi';
import { useGetMyFeesQuery } from '../../redux/api/feeApi';
import { useGetBatchesQuery } from '../../redux/api/batchApi';
import { useGetAnnouncementsQuery } from '../../redux/api/announcementApi';

export default function StudentDashboardPage() {
  const { data: attData, isLoading: isAttLoading } = useGetMyAttendanceQuery();
  const { data: feesData, isLoading: isFeeLoading } = useGetMyFeesQuery();
  const { data: batchesData, isLoading: isBatchLoading } = useGetBatchesQuery();
  const { data: noticesData, isLoading: isNoticeLoading } = useGetAnnouncementsQuery({});

  const isLoading = isAttLoading || isFeeLoading || isBatchLoading || isNoticeLoading;

  const attendancePct = attData?.data?.attendancePercentage ?? 100;
  const isLow = attData?.data?.isLowAttendance ?? false;
  const feesList = feesData?.data || [];
  const latestFee = feesList[0];
  const batches = batchesData?.data || [];
  const notices = noticesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 border border-zinc-800 bg-zinc-950 rounded-lg space-y-2">
        <h1 className="text-2xl font-extrabold text-white mb-1">Student Portal Telemetry 👋</h1>
        <p className="text-xs text-zinc-400 mb-0">
          Track your academic attendance progress, download official tuition fee receipts, and stay updated with class notices synced live from database.
        </p>
      </div>

      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Fetching your personal telemetry from MongoDB database...</p>
        </Card>
      )}

      {!isLoading && (
        <>
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-zinc-800">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400 mb-0">MY ATTENDANCE AVERAGE</p>
                <ClipboardCheck className="w-4 h-4 text-zinc-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-1">{attendancePct}%</h2>
              <p className="text-xs text-zinc-500 mb-0">
                {isLow ? '⚠️ Below 75% cutoff threshold' : 'Above mandatory 75% cutoff'}
              </p>
            </Card>

            <Card className="border-zinc-800">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400 mb-0">LATEST FEE STATUS</p>
                <CreditCard className="w-4 h-4 text-zinc-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-1">
                {latestFee?.status || 'NO DUES'}
              </h2>
              <p className="text-xs text-zinc-500 mb-0">
                {latestFee ? `${latestFee.month} Billing Term` : 'No pending fee invoices'}
              </p>
            </Card>

            <Card className="border-zinc-800">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400 mb-0">ENROLLED BATCHES</p>
                <GraduationCap className="w-4 h-4 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-white mt-2 mb-1">
                {batches[0]?.code || 'STUDENT'}
              </h2>
              <p className="text-xs text-zinc-500 mb-0">{batches[0]?.name || 'Active Tuition Program'}</p>
            </Card>
          </div>

          {/* Enrolled Batches & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  My Enrolled Batches & Timetable ({batches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    No active batches assigned in database.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batches.map((b) => (
                      <div key={b._id} className="p-4 border border-zinc-800 bg-zinc-900 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white mb-0">{b.name}</h4>
                          <Badge variant="solid">{b.code}</Badge>
                        </div>
                        <p className="text-xs text-zinc-400 mb-0">Subject: {b.subject} | Faculty: {b.teacherId?.name || 'Faculty'}</p>
                        <div className="text-xs font-mono text-zinc-300 pt-1 border-t border-zinc-800">
                          Schedule: {b.schedule}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notices for Student */}
            <Card className="border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Recent Class Announcements ({notices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notices.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    No announcements posted in database.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notices.slice(0, 3).map((notice) => (
                      <div key={notice._id} className="p-3 border border-zinc-800 bg-zinc-900 rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant={notice.priority === 'URGENT' ? 'solid' : 'outline'}>
                            {notice.priority}
                          </Badge>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(notice.createdAt).toISOString().split('T')[0]}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white mb-1">{notice.title}</h5>
                        <p className="text-xs text-zinc-400 mb-0">{notice.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
