'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Check, X, Clock, Save, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCheck, Palmtree, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useGetAttendanceStatsQuery, useGetAttendanceRegisterQuery, useMarkBatchAttendanceMutation } from '../../../redux/api/attendanceApi';
import { useGetBatchesQuery } from '../../../redux/api/batchApi';
import { useAppDispatch } from '../../../redux/store';
import { showToast } from '../../../redux/slices/toastSlice';
import { Batch } from '../../../types';

const ITEMS_PER_PAGE = 10;

export default function AttendanceRegisterPage() {
  const dispatch = useAppDispatch();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const isFutureDate = selectedDate > todayStr;

  const { data: batchesData } = useGetBatchesQuery();
  const batches: Batch[] = batchesData?.data || [];

  useEffect(() => {
    if (batches.length > 0 && !selectedBatch) {
      setSelectedBatch(batches[0]._id);
    }
  }, [batches, selectedBatch]);

  const activeBatchObj = batches.find((b) => b._id === selectedBatch);

  const { data: registerData, refetch: refetchRegister } = useGetAttendanceRegisterQuery(
    { batchId: selectedBatch || undefined, date: selectedDate || undefined },
    { skip: !selectedBatch }
  );

  const { data, isLoading, isError, refetch: refetchStats } = useGetAttendanceStatsQuery({ batchId: selectedBatch || undefined });
  const [markBatchAttendanceMutation, { isLoading: isSaving }] = useMarkBatchAttendanceMutation();

  const studentsList = data?.data?.students || [];

  const [localStatuses, setLocalStatuses] = useState<{ [id: string]: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY' }>({});
  const [localRemarks, setLocalRemarks] = useState<{ [id: string]: string }>({});

  const isDateSavedInDB = Boolean(registerData?.data && registerData.data.length > 0);

  // Sync saved database records into localStatuses whenever selectedDate or selectedBatch changes or data loads
  useEffect(() => {
    const statusMap: { [id: string]: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY' } = {};
    const remarksMap: { [id: string]: string } = {};

    if (registerData?.data && registerData.data.length > 0) {
      registerData.data.forEach((r: any) => {
        const studentId = typeof r.studentId === 'object' ? r.studentId?._id : r.studentId;
        if (studentId) {
          statusMap[studentId] = r.status;
          if (r.remarks) remarksMap[studentId] = r.remarks;
        }
      });
    }

    setLocalStatuses(statusMap);
    setLocalRemarks(remarksMap);
  }, [selectedDate, selectedBatch, registerData?.data]);

  const handleStatusChange = (id: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY') => {
    if (isFutureDate) {
      dispatch(showToast({ message: 'Attendance cannot be marked for future dates.', type: 'info' }));
      return;
    }
    setLocalStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const handleRemarksChange = (id: string, remarks: string) => {
    setLocalRemarks((prev) => ({ ...prev, [id]: remarks }));
  };

  const handleMarkAllPresent = () => {
    if (isFutureDate) {
      dispatch(showToast({ message: 'Attendance cannot be marked for future dates.', type: 'info' }));
      return;
    }
    const updated: { [id: string]: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY' } = {};
    studentsList.forEach((s: any) => {
      const studentId = s.student?._id || s.student;
      if (studentId) updated[studentId] = 'PRESENT';
    });
    setLocalStatuses(updated);
    dispatch(showToast({ message: 'Marked all students as Present!', type: 'info' }));
  };

  const handleMarkHoliday = () => {
    if (isFutureDate) {
      dispatch(showToast({ message: 'Attendance cannot be marked for future dates.', type: 'info' }));
      return;
    }
    const updated: { [id: string]: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY' } = {};
    studentsList.forEach((s: any) => {
      const studentId = s.student?._id || s.student;
      if (studentId) updated[studentId] = 'HOLIDAY';
    });
    setLocalStatuses(updated);
    dispatch(showToast({ message: `Marked ${selectedDate} as Institute Holiday for all students!`, type: 'info' }));
  };

  const handleSaveAttendance = async () => {
    if (isFutureDate) {
      dispatch(showToast({ message: 'Future dates cannot be saved into database.', type: 'info' }));
      return;
    }

    if (studentsList.length === 0) return;

    const recordsPayload = studentsList.map((s: any) => ({
      studentId: s.student?._id || s.student,
      status: localStatuses[s.student?._id || s.student] || 'PRESENT',
      remarks: localRemarks[s.student?._id || s.student] || '',
    }));

    try {
      await markBatchAttendanceMutation({
        date: selectedDate,
        batchId: selectedBatch,
        records: recordsPayload,
      }).unwrap();

      refetchRegister();
      refetchStats();

      dispatch(showToast({ message: `Attendance for ${selectedDate} saved & synced to MongoDB!`, type: 'success' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to save attendance', type: 'error' }));
    }
  };

  const filteredStudents = studentsList.filter(
    (s: any) =>
      s.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Batch Attendance Register</h1>
          <p>Mark batch-wise attendance (Present, Absent, Late, Holiday), monitor &lt;75% threshold flags, and view historical logs synced live from MongoDB.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkHoliday} disabled={isLoading || isFutureDate || studentsList.length === 0}>
            <Palmtree className="w-4 h-4 mr-1.5 text-purple-400" />
            Mark Class Holiday
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAllPresent} disabled={isLoading || isFutureDate || studentsList.length === 0}>
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All Present
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveAttendance} disabled={isSaving || isFutureDate || isLoading}>
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? 'Syncing...' : 'Save & Sync Attendance'}
          </Button>
        </div>
      </div>

      {/* Control Bar: Batch Selector & Date */}
      <Card className="border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Select Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none min-w-[220px]"
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Attendance Date</label>
              <Input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs flex flex-wrap items-center gap-4">
            <div>
              <span className="text-zinc-400">Database Status: </span>
              {isDateSavedInDB ? (
                <Badge variant="solid" className="bg-emerald-950 text-emerald-300 border border-emerald-800 ml-1">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" /> SAVED IN DB
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-950/60 text-amber-300 border border-amber-800 ml-1">
                  UNSAVED DRAFT
                </Badge>
              )}
            </div>
            <div className="border-l border-zinc-800 pl-3">
              <span className="text-zinc-400">Batch Duration: </span>
              <strong className="text-white font-mono">{activeBatchObj?.startDate || '2026-08-01'} to {activeBatchObj?.endDate || '2027-05-31'}</strong>
            </div>
            <div className="border-l border-zinc-800 pl-3">
              <span className="text-zinc-400">Enrolled Roster: </span>
              <strong className="text-white text-sm">{studentsList.length} Students</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* Future Date Lock Warning */}
      {isFutureDate && (
        <Card className="border-amber-800 bg-amber-950/40 p-4 text-amber-200 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="font-bold block text-white text-sm">Future Date Lock ({selectedDate})</strong>
            <span>Attendance cannot be marked for future dates according to industry calendar standards. Please select today ({todayStr}) or a previous date.</span>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Loading roster & statistics from database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to fetch attendance statistics from database.</p>
          <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchRegister(); }}>
            Retry Query
          </Button>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card className="border-zinc-800 flex flex-col justify-between">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>Batch Roster ({filteredStudents.length} Students)</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <Input
                  placeholder="Search student by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No enrolled students found matching query or empty batch roster.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr>
                        <th>Student Profile</th>
                        <th>Monthly Attendance %</th>
                        <th>Mark Status</th>
                        <th>Remarks / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((s: any) => {
                        const studentId = s.student?._id || s.student;
                        const studentName = s.student?.name || 'Student';
                        const studentEmail = s.student?.email || 'N/A';
                        const currentStatus = localStatuses[studentId]; // undefined if not set yet

                        return (
                          <tr key={studentId}>
                            <td>
                              <div className="font-bold text-white flex items-center">
                                {studentName}
                                {s.isLowAttendance && (
                                  <Badge variant="solid" className="ml-2 text-[10px]">
                                    &lt;75% FLAG
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500">{studentEmail}</div>
                            </td>
                            <td>
                              <div className="font-mono text-sm font-bold text-white">{s.attendancePercentage}%</div>
                              <div className="w-24 h-1.5 bg-zinc-900 rounded-full mt-1 overflow-hidden border border-zinc-800">
                                <div
                                  className="h-full bg-white transition-all"
                                  style={{ width: `${s.attendancePercentage}%` }}
                                />
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-wrap items-center gap-1">
                                <Button
                                  type="button"
                                  variant={currentStatus === 'PRESENT' ? 'primary' : 'outline'}
                                  size="sm"
                                  disabled={isFutureDate}
                                  onClick={() => handleStatusChange(studentId, 'PRESENT')}
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  Present
                                </Button>
                                <Button
                                  type="button"
                                  variant={currentStatus === 'ABSENT' ? 'primary' : 'outline'}
                                  size="sm"
                                  disabled={isFutureDate}
                                  onClick={() => handleStatusChange(studentId, 'ABSENT')}
                                >
                                  <X className="w-3.5 h-3.5 mr-1" />
                                  Absent
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isFutureDate}
                                  onClick={() => handleStatusChange(studentId, 'LATE')}
                                  className={currentStatus === 'LATE' ? 'bg-amber-500 text-black border-amber-400 font-bold' : ''}
                                >
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  Late
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isFutureDate}
                                  onClick={() => handleStatusChange(studentId, 'HOLIDAY')}
                                  className={currentStatus === 'HOLIDAY' ? 'bg-purple-600 text-white border-purple-500 font-bold' : ''}
                                >
                                  <Palmtree className="w-3.5 h-3.5 mr-1" />
                                  Holiday
                                </Button>
                              </div>
                            </td>
                            <td>
                              <Input
                                placeholder="Add remarks..."
                                disabled={isFutureDate}
                                value={localRemarks[studentId] || ''}
                                onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                                className="h-8 text-xs min-w-[140px]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-zinc-900 text-xs">
                  <span className="text-zinc-500">
                    Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> (
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} Students)
                  </span>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
