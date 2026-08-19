'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ClipboardCheck, CreditCard, GraduationCap, Megaphone, Loader2, Calendar, Clock, BookOpen, Users } from 'lucide-react';
import { useGetMyAttendanceQuery } from '../redux/api/attendanceApi';
import { useGetMyFeesQuery } from '../redux/api/feeApi';
import { useGetBatchesQuery } from '../redux/api/batchApi';
import { useGetAnnouncementsQuery } from '../redux/api/announcementApi';

export default function StudentDashboardPage() {
  const [noticeCategory, setNoticeCategory] = useState<'ALL' | 'URGENT' | 'EXAM' | 'GENERAL'>('ALL');

  const { data: attData, isLoading: isAttLoading } = useGetMyAttendanceQuery();
  const { data: feesData, isLoading: isFeeLoading } = useGetMyFeesQuery();
  const { data: batchesData, isLoading: isBatchLoading } = useGetBatchesQuery();
  const { data: noticesData, isLoading: isNoticeLoading } = useGetAnnouncementsQuery(
    noticeCategory !== 'ALL' ? { priority: noticeCategory } : {}
  );

  const isLoading = isAttLoading || isFeeLoading || isBatchLoading || isNoticeLoading;

  const attendancePct = attData?.data?.attendancePercentage ?? 100;
  const isLow = attData?.data?.isLowAttendance ?? false;
  const feesList = feesData?.data || [];
  const latestFee = feesList[0];
  const batches = batchesData?.data || [];
  const rawNotices = noticesData?.data || [];
  const notices = [...rawNotices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 border border-zinc-800 bg-zinc-950 rounded-lg space-y-2">
        <h1 className="text-2xl font-extrabold text-white mb-1">Student Portal Telemetry 👋</h1>
        <p className="text-xs text-zinc-400 mb-0">
          Track your academic attendance, check your enrolled multi-batch alternate-day schedules, and stay updated with class notices.
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
              <h2 className="text-2xl font-bold text-white mt-2 mb-1">
                {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
              </h2>
              <p className="text-xs text-zinc-500 mb-0">
                {batches.map((b) => b.code).join(', ') || 'Active Tuition Program'}
              </p>
            </Card>
          </div>

          {/* Enrolled Batches & Alternate Day Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  My Enrolled Batches & Alternate-Day Timetable ({batches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    No active batches assigned in database.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batches.map((b) => (
                      <div key={b._id} className="p-4 border border-zinc-800 bg-zinc-950 rounded-lg flex flex-col justify-between space-y-3">
                        <div>
                          {/* Top Bar: Code Badge & Book Icon */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Badge variant="solid" className="mb-1.5">
                                {b.code}
                              </Badge>
                              <h3 className="text-base font-bold text-white mb-0">{b.name}</h3>
                            </div>
                            <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Fee & Duration */}
                          <div className="space-y-3 text-xs text-zinc-400 my-3 border-y border-zinc-900 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500">Monthly Tuition Fee:</span>
                              <span className="font-bold text-white">₹{b.feeAmount?.toLocaleString('en-IN') || '1,500'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500">Batch Duration:</span>
                              <span className="font-mono text-zinc-300">
                                {b.startDate || '2026-08-01'} to {b.endDate || '2027-05-31'}
                              </span>
                            </div>

                            {/* Subject-Wise Alternate Days Schedule Breakdown */}
                            <div className="space-y-2 pt-1">
                              <p className="text-zinc-400 text-xs mb-1 font-semibold flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-400" /> Subject Schedules & Faculty:
                              </p>
                              {b.subjects && b.subjects.length > 0 ? (
                                <div className="space-y-2">
                                  {b.subjects.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2.5 bg-zinc-900/90 rounded border border-zinc-800 space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-white text-xs">{sub.name}</span>
                                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                          {sub.days && sub.days.length > 0
                                            ? sub.days.join('/')
                                            : sub.scheduleType || 'MWF'}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                        <span>
                                          {sub.teacherId?.name
                                            ? `Prof. ${sub.teacherId.name}`
                                            : 'Faculty Assigned'}
                                        </span>
                                        <span className="font-mono text-zinc-300">
                                          {sub.schedule || `${sub.days?.join(', ') || 'MWF'}`}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-2.5 bg-zinc-900/90 rounded border border-zinc-800 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-white text-xs">{b.subject}</span>
                                    <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                      {b.scheduleType || 'MWF'}
                                    </Badge>
                                  </div>
                                  <div className="text-[11px] text-zinc-300 font-mono">{b.schedule}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer: Enrollment Count ONLY */}
                        <div className="pt-2 flex items-center justify-between border-t border-zinc-900">
                          <div className="flex items-center text-xs text-zinc-400">
                            <Users className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                            <span>
                              {b.studentIds?.length || 0} / {b.capacity} Enrolled
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notices for Student */}
            <Card className="border-zinc-800 space-y-3">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center text-white">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Class Notices & Announcements ({notices.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['ALL', 'URGENT', 'EXAM', 'GENERAL'] as const).map((cat) => (
                      <Button
                        key={cat}
                        variant={noticeCategory === cat ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setNoticeCategory(cat)}
                      >
                        {cat === 'ALL' ? 'ALL' : cat}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {notices.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    No announcements posted under "{noticeCategory}" category.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notices.map((notice) => {
                      const dObj = new Date(notice.createdAt);
                      const dFormatted = dObj.toISOString().split('T')[0];
                      const tFormatted = dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={notice._id} className="p-3.5 border border-zinc-800 bg-zinc-900 rounded-md space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant={notice.priority === 'URGENT' ? 'solid' : 'outline'}>
                                {notice.priority}
                              </Badge>
                              {notice.targetBatchId && (
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  [{notice.targetBatchId.code || notice.targetBatchId.name}]
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {dFormatted} at {tFormatted}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-white mb-1">{notice.title}</h5>
                          <p className="text-xs text-zinc-400 mb-0">{notice.message}</p>
                          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>
                              Posted by: <strong className="text-zinc-300">{notice.authorId?.name || 'Director Anand Pandey'}</strong>
                            </span>
                            <span className="font-mono text-emerald-400">
                              {notice.authorId?.phone || '+91 9876543210'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
