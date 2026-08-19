'use client';

import React from 'react';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Users,
  CreditCard,
  AlertTriangle,
  GraduationCap,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useGetAttendanceStatsQuery } from '../../redux/api/attendanceApi';
import { useGetFeeDuesDeskQuery } from '../../redux/api/feeApi';
import { useGetBatchesQuery } from '../../redux/api/batchApi';
import { useGetUsersQuery } from '../../redux/api/userApi';
import { useAppSelector } from '../../redux/store';
import { formatCurrency } from '../../lib/utils';

export default function AnalyticsDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const isTeacher = user?.role === 'TEACHER';
  const isDirector = user?.role === 'DIRECTOR';

  const { data: attendanceData, isLoading: isAttLoading } = useGetAttendanceStatsQuery({});
  const { data: feesData, isLoading: isFeesLoading } = useGetFeeDuesDeskQuery({});
  const { data: batchesData, isLoading: isBatchLoading } = useGetBatchesQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({ role: 'STUDENT' });

  const totalStudents = usersData?.data?.length || attendanceData?.data?.totalStudentsTracked || 0;
  const totalCollected = feesData?.meta?.totalCollected || 0;
  const totalPending = feesData?.meta?.totalPending || 0;
  const flaggedStudents = attendanceData?.data?.flaggedStudents || [];
  const batches = batchesData?.data || [];

  const isLoading = isAttLoading || isFeesLoading || isBatchLoading || isUsersLoading;

  const stats = [
    {
      title: isTeacher ? 'My Assigned Batches' : 'Total Enrolled Students',
      value: isTeacher ? batches.length.toString() : totalStudents.toString(),
      description: isTeacher ? 'Batches allocated to your faculty schedule' : 'Active enrolled student accounts',
      icon: isTeacher ? GraduationCap : Users,
      badgeText: isTeacher ? `${batches.length} ASSIGNED` : `${batches.length} ACTIVE BATCHES`,
    },
    {
      title: 'Monthly Fee Collections',
      value: formatCurrency(totalCollected),
      description: 'Total revenue collected in MongoDB',
      icon: CreditCard,
      badgeText: 'LIVE REVENUE',
    },
    {
      title: 'Pending Dues Desk',
      value: formatCurrency(totalPending),
      description: 'Unpaid/overdue balances',
      icon: TrendingUp,
      badgeText: totalPending > 0 ? 'ACTION REQUIRED' : 'ALL CLEAR',
    },
    {
      title: 'Low Attendance Flagged',
      value: `${flaggedStudents.length} Students`,
      description: 'Attendance dropped below 75%',
      icon: AlertTriangle,
      badgeText: '<75% THRESHOLD',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1>{isTeacher ? `Teacher Dashboard: Welcome ${user?.name || ''} 👋` : 'Academy Performance Analytics'}</h1>
            {isDirector && <Badge variant="solid" className="text-xs">DIRECTOR CONTROL</Badge>}
            {isTeacher && <Badge variant="outline" className="text-xs">FACULTY VIEW</Badge>}
          </div>
          <p>
            {isTeacher
              ? 'Telemetry, alternate-day schedule, and student attendance restricted to your assigned tuition batches.'
              : 'Real-time telemetry, alternate-day timetable management & fee desk monitoring synced live with MongoDB.'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/attendance">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          </Link>
          <Link href="/fees">
            <Button variant="primary" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Open Dues Desk
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Synchronizing live analytics telemetry from MongoDB database...</p>
        </Card>
      )}

      {!isLoading && (
        <>
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

          {/* Main Grid: Low Attendance Flags & Active Batches */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Low Attendance Warning Panel */}
            <Card className="lg:col-span-1 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-white">
                    <AlertTriangle className="w-4 h-4 mr-2 text-white" />
                    Low Attendance (&lt;75%)
                  </CardTitle>
                  <Badge variant="solid">WARNING</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-400 mb-4">
                  Automated alerts dispatched for students below mandatory 75% cutoff threshold.
                </p>
                {flaggedStudents.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    No students currently flagged below 75% attendance cutoff.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flaggedStudents.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 border border-zinc-800 bg-zinc-900 rounded-md flex items-center justify-between"
                      >
                        <div>
                          <h5 className="text-sm font-bold text-white mb-0">{item.student?.name || 'Student'}</h5>
                          <p className="text-[11px] text-zinc-500 mb-0">{item.student?.email || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="solid" className="text-xs font-bold">
                            {item.attendancePercentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-zinc-900">
                  <Link href="/attendance">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View Full Attendance Register <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Active Batches Timetable Grid */}
            <Card className="lg:col-span-2 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-white">
                    <GraduationCap className="w-4 h-4 mr-2 text-white" />
                    {isTeacher ? 'My Assigned Batches & Schedule' : 'Active Batches & Faculty Allocation'} ({batches.length})
                  </CardTitle>
                  <Link href="/batches">
                    <Button variant="outline" size="sm">
                      Manage Batches
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs">
                    No active batches found for your account in MongoDB database.
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th>Batch Code & Name</th>
                        <th>Faculty In-Charge</th>
                        <th>Schedule</th>
                        <th>Strength</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((batch) => (
                        <tr key={batch._id}>
                          <td>
                            <div className="font-bold text-white">{batch.name}</div>
                            <div className="text-[11px] font-mono text-zinc-500">{batch.code}</div>
                          </td>
                          <td className="text-zinc-300 font-medium text-xs">{batch.teacherId?.name || 'Faculty'}</td>
                          <td className="text-zinc-400 text-xs font-mono">{batch.schedule}</td>
                          <td>
                            <Badge variant="outline">
                              {batch.studentIds?.length || 0}/{batch.capacity}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
