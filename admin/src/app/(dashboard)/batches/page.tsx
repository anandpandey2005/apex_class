'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { GraduationCap, Plus, BookOpen, Users, Loader2, AlertCircle, Trash2, Calendar, Clock, X, Pencil } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { useGetBatchesQuery, useCreateBatchMutation, useUpdateBatchMutation, useDeleteBatchMutation } from '../../../redux/api/batchApi';
import { useGetUsersQuery } from '../../../redux/api/userApi';
import { useAppDispatch } from '../../../redux/store';
import { showToast } from '../../../redux/slices/toastSlice';
import { Batch, User } from '../../../types';

const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BatchesPage() {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRosterBatch, setSelectedRosterBatch] = useState<Batch | null>(null);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const { data: batchesData, isLoading, isError, refetch } = useGetBatchesQuery();
  const { data: teachersData } = useGetUsersQuery({ role: 'TEACHER' });
  const [createBatchMutation, { isLoading: isCreating }] = useCreateBatchMutation();
  const [updateBatchMutation, { isLoading: isUpdating }] = useUpdateBatchMutation();
  const [deleteBatchMutation] = useDeleteBatchMutation();

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch "${name}"?`)) return;
    try {
      await deleteBatchMutation(id).unwrap();
      dispatch(showToast({ message: `Batch ${name} deleted successfully!`, type: 'info' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to delete batch', type: 'error' }));
    }
  };

  const batches: Batch[] = batchesData?.data || [];
  const teachers: User[] = teachersData?.data || [];

  const [newBatch, setNewBatch] = useState({
    name: '',
    code: '',
    subject: '',
    teacherId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2027-05-31',
    feeAmount: 4500,
    capacity: 30,
    subjects: [
      {
        name: 'Physics',
        teacherId: '',
        scheduleType: 'MWF' as 'MWF' | 'TTS' | 'CUSTOM',
        days: ['Mon', 'Wed', 'Fri'],
        startTime: '04:00 PM',
        endTime: '05:30 PM',
        schedule: 'Mon, Wed, Fri (04:00 PM - 05:30 PM)',
      },
      {
        name: 'Mathematics',
        teacherId: '',
        scheduleType: 'TTS' as 'MWF' | 'TTS' | 'CUSTOM',
        days: ['Tue', 'Thu', 'Sat'],
        startTime: '05:30 PM',
        endTime: '07:00 PM',
        schedule: 'Tue, Thu, Sat (05:30 PM - 07:00 PM)',
      },
    ],
  });

  const [editBatchForm, setEditBatchForm] = useState({
    name: '',
    code: '',
    subject: '',
    teacherId: '',
    startDate: '2026-08-01',
    endDate: '2027-05-31',
    feeAmount: 4500,
    capacity: 30,
    subjects: [] as any[],
  });

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    const teacherIdVal = typeof batch.teacherId === 'object' ? (batch.teacherId as any)?._id : batch.teacherId;
    setEditBatchForm({
      name: batch.name || '',
      code: batch.code || '',
      subject: batch.subject || '',
      teacherId: teacherIdVal || '',
      startDate: batch.startDate || '2026-08-01',
      endDate: batch.endDate || '2027-05-31',
      feeAmount: batch.feeAmount || 4500,
      capacity: batch.capacity || 30,
      subjects: batch.subjects && batch.subjects.length > 0
        ? batch.subjects.map((s: any) => ({
            name: s.name || '',
            teacherId: typeof s.teacherId === 'object' ? s.teacherId?._id : s.teacherId || teacherIdVal || '',
            scheduleType: s.scheduleType || 'MWF',
            days: s.days || ['Mon', 'Wed', 'Fri'],
            startTime: '04:00 PM',
            endTime: '05:30 PM',
            schedule: s.schedule || 'Mon, Wed, Fri (04:00 PM - 05:30 PM)',
          }))
        : [
            {
              name: batch.subject || 'General',
              teacherId: teacherIdVal || '',
              scheduleType: 'MWF' as 'MWF' | 'TTS' | 'CUSTOM',
              days: ['Mon', 'Wed', 'Fri'],
              startTime: '04:00 PM',
              endTime: '05:30 PM',
              schedule: batch.schedule || 'Mon, Wed, Fri (04:00 PM - 05:30 PM)',
            },
          ],
    });
  };

  const addSubjectRow = (isEdit = false) => {
    const newSub = {
      name: '',
      teacherId: '',
      scheduleType: 'MWF' as 'MWF' | 'TTS' | 'CUSTOM',
      days: ['Mon', 'Wed', 'Fri'],
      startTime: '04:00 PM',
      endTime: '05:30 PM',
      schedule: 'Mon, Wed, Fri (04:00 PM - 05:30 PM)',
    };
    if (isEdit) {
      setEditBatchForm((prev) => ({ ...prev, subjects: [...prev.subjects, newSub] }));
    } else {
      setNewBatch((prev) => ({ ...prev, subjects: [...prev.subjects, newSub] }));
    }
  };

  const removeSubjectRow = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditBatchForm((prev) => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }));
    } else {
      setNewBatch((prev) => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }));
    }
  };

  const updateSubjectField = (index: number, field: string, value: any, isEdit = false) => {
    const updateFn = isEdit ? setEditBatchForm : setNewBatch;
    updateFn((prev: any) => {
      const updated = [...prev.subjects];
      const sub = { ...updated[index], [field]: value };

      if (field === 'scheduleType') {
        if (value === 'MWF') sub.days = ['Mon', 'Wed', 'Fri'];
        else if (value === 'TTS') sub.days = ['Tue', 'Thu', 'Sat'];
        sub.schedule = `${sub.days.join(', ')} (${sub.startTime} - ${sub.endTime})`;
      } else if (field === 'startTime' || field === 'endTime') {
        sub.schedule = `${sub.days.join(', ')} (${sub.startTime} - ${sub.endTime})`;
      }

      updated[index] = sub;
      return { ...prev, subjects: updated };
    });
  };

  const toggleSubjectDay = (index: number, day: string, isEdit = false) => {
    const updateFn = isEdit ? setEditBatchForm : setNewBatch;
    updateFn((prev: any) => {
      const updated = [...prev.subjects];
      const sub = { ...updated[index] };
      const exists = sub.days.includes(day);
      sub.days = exists ? sub.days.filter((d: string) => d !== day) : [...sub.days, day];
      sub.schedule = `${sub.days.join(', ')} (${sub.startTime} - ${sub.endTime})`;
      updated[index] = sub;
      return { ...prev, subjects: updated };
    });
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const primaryTeacher = newBatch.teacherId || newBatch.subjects[0]?.teacherId || (teachers[0]?._id ?? '');
      const primarySubject = newBatch.subjects.map((s) => s.name).filter(Boolean).join(', ');
      const computedAggregateSchedule = newBatch.subjects
        .map((s) => `${s.name}: ${s.schedule}`)
        .join(' | ');

      const payload = {
        name: newBatch.name,
        code: newBatch.code,
        startDate: newBatch.startDate,
        endDate: newBatch.endDate,
        feeAmount: newBatch.feeAmount,
        capacity: newBatch.capacity,
        subject: primarySubject || 'General',
        teacherId: primaryTeacher,
        schedule: computedAggregateSchedule || 'Subject-based alternate day schedule',
        subjects: newBatch.subjects.map((s) => ({
          name: s.name,
          teacherId: s.teacherId || primaryTeacher,
          scheduleType: s.scheduleType,
          days: s.days,
          schedule: s.schedule,
        })),
      };

      await createBatchMutation(payload as any).unwrap();
      dispatch(
        showToast({
          message: `Batch ${newBatch.code} created successfully!`,
          type: 'success',
        })
      );
      setIsModalOpen(false);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to create batch', type: 'error' }));
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    try {
      const primaryTeacher = editBatchForm.teacherId || editBatchForm.subjects[0]?.teacherId || (teachers[0]?._id ?? '');
      const primarySubject = editBatchForm.subjects.map((s) => s.name).filter(Boolean).join(', ');
      const computedAggregateSchedule = editBatchForm.subjects
        .map((s) => `${s.name}: ${s.schedule}`)
        .join(' | ');

      const payload = {
        name: editBatchForm.name,
        code: editBatchForm.code,
        startDate: editBatchForm.startDate,
        endDate: editBatchForm.endDate,
        feeAmount: editBatchForm.feeAmount,
        capacity: editBatchForm.capacity,
        subject: primarySubject || 'General',
        teacherId: primaryTeacher,
        schedule: computedAggregateSchedule || 'Subject-based alternate day schedule',
        subjects: editBatchForm.subjects.map((s) => ({
          name: s.name,
          teacherId: s.teacherId || primaryTeacher,
          scheduleType: s.scheduleType,
          days: s.days,
          schedule: s.schedule,
        })),
      };

      await updateBatchMutation({ id: editingBatch._id, data: payload as any }).unwrap();
      dispatch(
        showToast({
          message: `Batch "${editBatchForm.name}" (${editBatchForm.code}) updated successfully!`,
          type: 'success',
        })
      );
      setEditingBatch(null);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to update batch', type: 'error' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white mb-2">Subject-Level Alternate-Day Batch Desk</h1>
          <p className="text-xs md:text-sm text-zinc-400">Configure alternate-day class schedules (MWF, TTS, Custom) independently for each subject within a tuition batch.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Batch
        </Button>
      </div>

      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Querying batches from MongoDB database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to fetch batches from database.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Query
          </Button>
        </Card>
      )}

      {/* Batch Cards Grid */}
      {!isLoading && !isError && (
        <>
          {batches.length === 0 ? (
            <Card className="border-zinc-800 p-8 text-center text-zinc-500 text-xs">
              No active batches registered in MongoDB database.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((b) => (
                <Card key={b._id} className="border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge variant="solid" className="mb-1.5">{b.code}</Badge>
                        <h3 className="text-base font-bold text-white mb-0">{b.name}</h3>
                      </div>
                      <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-3 text-xs text-zinc-400 my-3 border-y border-zinc-900 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Monthly Tuition Fee:</span>
                        <span className="font-bold text-white">{formatCurrency(b.feeAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Batch Duration:</span>
                        <span className="font-mono text-zinc-300">{b.startDate || '2026-08-01'} to {b.endDate || '2027-05-31'}</span>
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
                                    {sub.days && sub.days.length > 0 ? sub.days.join('/') : sub.scheduleType || 'MWF'}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                  <span>Prof. {sub.teacherId?.name || 'Faculty Assigned'}</span>
                                  <span className="font-mono text-zinc-300">
                                    {sub.schedule || `${sub.days?.join(', ') || 'MWF'}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 bg-zinc-900 rounded">
                            <span className="font-semibold text-white">{b.subject}</span>
                            <div className="text-[11px] text-zinc-400 font-mono">{b.schedule}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-zinc-900">
                    <div className="flex items-center text-xs text-zinc-400">
                      <Users className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                      <span>
                        {b.studentIds?.length || 0} / {b.capacity} Enrolled
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRosterBatch(b)}>
                        View Roster
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(b)}
                        className="text-amber-400 hover:text-amber-300 border-amber-900/60 hover:border-amber-700 bg-amber-950/20"
                        title="Edit Batch Details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBatch(b._id, b.name)}
                        className="text-zinc-400 hover:text-rose-400 hover:border-rose-900"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Roster Modal */}
      {selectedRosterBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-base font-bold text-white mb-0">{selectedRosterBatch.name}</h3>
                <p className="text-xs text-zinc-400 mb-0 font-mono">
                  Roster: {selectedRosterBatch.code} ({selectedRosterBatch.studentIds?.length || 0} Students)
                </p>
              </div>
              <button onClick={() => setSelectedRosterBatch(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {selectedRosterBatch.studentIds && selectedRosterBatch.studentIds.length > 0 ? (
                selectedRosterBatch.studentIds.map((st: any) => (
                  <div key={st._id} className="p-2.5 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white mb-0">{st.name}</p>
                      <p className="text-[11px] text-zinc-500 mb-0">{st.email}</p>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">{st.phone || 'N/A'}</span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-xs text-center py-4">No students currently enrolled in this batch.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedRosterBatch(null)}>
                Close Roster
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white mb-0 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" /> Edit Batch: {editingBatch.code}
                </h3>
                <p className="text-xs text-zinc-400 mb-0 font-mono">Update batch configuration, subject schedules, and dates</p>
              </div>
              <button onClick={() => setEditingBatch(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBatch} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Batch Name</label>
                <Input
                  required
                  placeholder="e.g. Class 12th IIT-JEE Super 30"
                  value={editBatchForm.name}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Batch Code</label>
                  <Input
                    required
                    placeholder="JEE-30-2026"
                    value={editBatchForm.code}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Primary Teacher / Head</label>
                  <select
                    value={editBatchForm.teacherId}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, teacherId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                  >
                    <option value="">Select Primary Faculty...</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Per-Subject Schedule Configuration Container */}
              <div className="p-3 border border-zinc-800 bg-zinc-900/60 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Subjects & Alternate-Day Schedule Builder</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => addSubjectRow(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Subject
                  </Button>
                </div>

                {editBatchForm.subjects.map((sub, idx) => (
                  <div key={idx} className="p-3 border border-zinc-800 bg-zinc-900 rounded-md space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        placeholder="Subject Name (e.g. Physics)"
                        value={sub.name}
                        onChange={(e) => updateSubjectField(idx, 'name', e.target.value, true)}
                        className="flex-1 font-bold text-white"
                      />
                      <select
                        value={sub.teacherId}
                        onChange={(e) => updateSubjectField(idx, 'teacherId', e.target.value, true)}
                        className="flex-1 h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                      >
                        <option value="">Select Subject Teacher...</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      {editBatchForm.subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubjectRow(idx, true)}
                          className="text-zinc-400 hover:text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Subject Alternate Days Controls */}
                    <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-400 text-[11px]">Schedule Preset:</span>
                        <button
                          type="button"
                          onClick={() => updateSubjectField(idx, 'scheduleType', 'MWF', true)}
                          className={`px-2 py-0.5 text-[10px] rounded border font-mono ${
                            sub.scheduleType === 'MWF' ? 'bg-white text-black border-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          MWF (Mon,Wed,Fri)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubjectField(idx, 'scheduleType', 'TTS', true)}
                          className={`px-2 py-0.5 text-[10px] rounded border font-mono ${
                            sub.scheduleType === 'TTS' ? 'bg-white text-black border-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          TTS (Tue,Thu,Sat)
                        </button>
                      </div>

                      {/* Day Toggles for Subject */}
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_LIST.map((day) => {
                          const isChecked = sub.days.includes(day);
                          return (
                            <button
                              type="button"
                              key={day}
                              onClick={() => toggleSubjectDay(idx, day, true)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                                isChecked ? 'bg-white text-black border-white font-bold' : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-zinc-400 text-[10px] block mb-0.5">Start Time</label>
                          <Input
                            className="h-8 text-xs"
                            value={sub.startTime}
                            onChange={(e) => updateSubjectField(idx, 'startTime', e.target.value, true)}
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-[10px] block mb-0.5">End Time</label>
                          <Input
                            className="h-8 text-xs"
                            value={sub.endTime}
                            onChange={(e) => updateSubjectField(idx, 'endTime', e.target.value, true)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Batch Start Date</label>
                  <Input
                    type="date"
                    value={editBatchForm.startDate}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Batch End Date</label>
                  <Input
                    type="date"
                    value={editBatchForm.endDate}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Monthly Fee (INR)</label>
                  <Input
                    type="number"
                    required
                    value={editBatchForm.feeAmount}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, feeAmount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Max Student Capacity</label>
                  <Input
                    type="number"
                    required
                    value={editBatchForm.capacity}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setEditingBatch(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isUpdating}>
                  {isUpdating ? 'Saving Changes...' : 'Save Batch Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Batch Modal with Per-Subject Alternate Day Schedules */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:p-6 text-white shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-0">Create Batch with Per-Subject Alternate Schedules</h3>
            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Batch Name</label>
                <Input
                  required
                  placeholder="e.g. Class 12th IIT-JEE Super 30"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Batch Code</label>
                  <Input
                    required
                    placeholder="JEE-30-2026"
                    value={newBatch.code}
                    onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Primary Teacher / Head</label>
                  <select
                    value={newBatch.teacherId}
                    onChange={(e) => setNewBatch({ ...newBatch, teacherId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                  >
                    <option value="">Select Primary Faculty...</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Per-Subject Schedule Configuration Container */}
              <div className="p-3 border border-zinc-800 bg-zinc-900/60 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Subjects & Alternate-Day Schedule Builder</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => addSubjectRow(false)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Subject
                  </Button>
                </div>

                {newBatch.subjects.map((sub, idx) => (
                  <div key={idx} className="p-3 border border-zinc-800 bg-zinc-900 rounded-md space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        placeholder="Subject Name (e.g. Physics)"
                        value={sub.name}
                        onChange={(e) => updateSubjectField(idx, 'name', e.target.value, false)}
                        className="flex-1 font-bold text-white"
                      />
                      <select
                        value={sub.teacherId}
                        onChange={(e) => updateSubjectField(idx, 'teacherId', e.target.value, false)}
                        className="flex-1 h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                      >
                        <option value="">Select Subject Teacher...</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      {newBatch.subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubjectRow(idx, false)}
                          className="text-zinc-400 hover:text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Subject Alternate Days Controls */}
                    <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-400 text-[11px]">Schedule Preset:</span>
                        <button
                          type="button"
                          onClick={() => updateSubjectField(idx, 'scheduleType', 'MWF', false)}
                          className={`px-2 py-0.5 text-[10px] rounded border font-mono ${
                            sub.scheduleType === 'MWF' ? 'bg-white text-black border-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          MWF (Mon,Wed,Fri)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubjectField(idx, 'scheduleType', 'TTS', false)}
                          className={`px-2 py-0.5 text-[10px] rounded border font-mono ${
                            sub.scheduleType === 'TTS' ? 'bg-white text-black border-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          TTS (Tue,Thu,Sat)
                        </button>
                      </div>

                      {/* Day Toggles for Subject */}
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_LIST.map((day) => {
                          const isChecked = sub.days.includes(day);
                          return (
                            <button
                              type="button"
                              key={day}
                              onClick={() => toggleSubjectDay(idx, day, false)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                                isChecked ? 'bg-white text-black border-white font-bold' : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-zinc-400 text-[10px] block mb-0.5">Start Time</label>
                          <Input
                            className="h-8 text-xs"
                            value={sub.startTime}
                            onChange={(e) => updateSubjectField(idx, 'startTime', e.target.value, false)}
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-[10px] block mb-0.5">End Time</label>
                          <Input
                            className="h-8 text-xs"
                            value={sub.endTime}
                            onChange={(e) => updateSubjectField(idx, 'endTime', e.target.value, false)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Batch Start Date</label>
                  <Input
                    type="date"
                    value={newBatch.startDate}
                    onChange={(e) => setNewBatch({ ...newBatch, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Batch End Date</label>
                  <Input
                    type="date"
                    value={newBatch.endDate}
                    onChange={(e) => setNewBatch({ ...newBatch, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Monthly Fee (INR)</label>
                  <Input
                    type="number"
                    required
                    value={newBatch.feeAmount}
                    onChange={(e) => setNewBatch({ ...newBatch, feeAmount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Max Student Capacity</label>
                  <Input
                    type="number"
                    required
                    value={newBatch.capacity}
                    onChange={(e) => setNewBatch({ ...newBatch, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isCreating}>
                  {isCreating ? 'Creating Batch...' : 'Create Batch with Subject Schedules'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

