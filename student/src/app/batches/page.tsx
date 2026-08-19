'use client';

import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BookOpen, Calendar, Users, Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useGetBatchesQuery } from '../../redux/api/batchApi';
import { Batch } from '../../types';

export default function StudentBatchesPage() {
  const { data, isLoading, isError, refetch } = useGetBatchesQuery();
  const batches: Batch[] = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
          My Enrolled Batches & Faculty Timetable
        </h1>
        <p className="text-xs md:text-sm text-zinc-400">
          View your enrolled tuition batches, subject-wise alternate-day class schedules, assigned faculty, and duration.
        </p>
      </div>

      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Querying your enrolled batches from database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to fetch enrolled batches from backend database.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Query
          </Button>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          {batches.length === 0 ? (
            <Card className="border-zinc-800 p-8 text-center text-zinc-500 text-xs">
              No active batches registered for your student account in MongoDB.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((b) => (
                <Card key={b._id} className="border-zinc-800 flex flex-col justify-between">
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
                        <span className="font-bold text-white">{formatCurrency(b.feeAmount)}</span>
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

                  {/* Footer: Student Enrollment Count ONLY (View Roster, Edit, Delete hidden for students) */}
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-900">
                    <div className="flex items-center text-xs text-zinc-400">
                      <Users className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                      <span>
                        {b.studentIds?.length || 0} / {b.capacity} Enrolled
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
