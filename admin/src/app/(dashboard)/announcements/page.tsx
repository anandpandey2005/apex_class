'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Plus, Trash2, Loader2, AlertCircle, Megaphone, Users, Calendar, GraduationCap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { showToast } from '../../../redux/slices/toastSlice';
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} from '../../../redux/api/announcementApi';
import { useGetBatchesQuery } from '../../../redux/api/batchApi';
import { Announcement, Batch } from '../../../types';

export default function AnnouncementsPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'ALL' | 'URGENT' | 'EXAM' | 'GENERAL'>('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const queryParams: { priority?: string; batchId?: string } = {};
  if (selectedPriority !== 'ALL') queryParams.priority = selectedPriority;
  if (selectedBatchId) queryParams.batchId = selectedBatchId;

  const { data, isLoading, isError, refetch } = useGetAnnouncementsQuery(queryParams);
  const { data: batchesData } = useGetBatchesQuery();
  const [createAnnouncementMutation, { isLoading: isPosting }] = useCreateAnnouncementMutation();
  const [deleteAnnouncementMutation] = useDeleteAnnouncementMutation();

  const allBatches: Batch[] = batchesData?.data || [];
  const rawAnnouncements: Announcement[] = data?.data || [];
  const announcements = [...rawAnnouncements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Role-Based Batch Scoping: Director/Admin sees all batches. Teacher sees only assigned batches.
  const availableBatches = allBatches.filter((b) => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'DIRECTOR') return true;
    if (currentUser?.role === 'TEACHER') {
      const teacherIdStr = b.teacherId?._id ? b.teacherId._id.toString() : b.teacherId?.toString();
      const isTeacherInCharge = teacherIdStr === currentUser._id;
      const isSubjectTeacher = b.subjects?.some((s: any) => {
        const subTeacherIdStr = s.teacherId?._id ? s.teacherId._id.toString() : s.teacherId?.toString();
        return subTeacherIdStr === currentUser._id;
      });
      return isTeacherInCharge || isSubjectTeacher;
    }
    return true;
  });

  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [newNotice, setNewNotice] = useState({
    title: '',
    message: '',
    priority: 'GENERAL',
  });

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.message.trim()) {
      dispatch(showToast({ message: 'Title and Message content are required.', type: 'error' }));
      return;
    }

    try {
      await createAnnouncementMutation({
        title: newNotice.title,
        message: newNotice.message,
        priority: newNotice.priority,
        targetBatchId: selectedBatchIds.length === 1 ? selectedBatchIds[0] : null,
        targetBatchIds: selectedBatchIds,
      }).unwrap();

      const batchTargetName = selectedBatchIds.length === 0
        ? 'All Batches (Institute-Wide)'
        : `${selectedBatchIds.length} Selected Batch(es)`;

      dispatch(showToast({ message: `Announcement broadcasted to ${batchTargetName}!`, type: 'success' }));
      setIsModalOpen(false);
      setNewNotice({ title: '', message: '', priority: 'GENERAL' });
      setSelectedBatchIds([]);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to post announcement', type: 'error' }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncementMutation(id).unwrap();
      dispatch(showToast({ message: 'Notice removed from board', type: 'info' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to delete notice', type: 'error' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white mb-2">Notice Board & Broadcast Center</h1>
          <p className="text-xs md:text-sm text-zinc-400">
            {currentUser?.role === 'TEACHER'
              ? 'Broadcast notices to your assigned tuition batches using multi-checkbox selection.'
              : 'Post targeted notices to specific batches or issue institute-wide announcements synced live from MongoDB.'}
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Broadcast New Notice
        </Button>
      </div>

      {/* Category & Batch Filter Controls */}
      <Card className="border-zinc-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-400 mr-1">Category:</span>
            {(['ALL', 'URGENT', 'EXAM', 'GENERAL'] as const).map((prio) => (
              <Button
                key={prio}
                variant={selectedPriority === prio ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority(prio)}
              >
                {prio === 'ALL' ? 'ALL NOTICES' : prio}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-72">
            <span className="text-xs font-semibold text-zinc-400 whitespace-nowrap">Filter Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
            >
              <option value="">All Batches (Institute-Wide)</option>
              {availableBatches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.code || 'BATCH'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Querying notice board from MongoDB database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to fetch announcements from database.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Query
          </Button>
        </Card>
      )}

      {/* Announcements List (Newest First) */}
      {!isLoading && !isError && (
        <>
          {announcements.length === 0 ? (
            <Card className="border-zinc-800 p-8 text-center text-zinc-500 text-xs">
              No active announcements logged in MongoDB matching filter criteria.
            </Card>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => {
                const dateObj = new Date(a.createdAt);
                const dateFormatted = dateObj.toISOString().split('T')[0];
                const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <Card key={a._id} className="border-zinc-800">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center space-x-3 text-xs">
                          <Badge variant={a.priority === 'URGENT' ? 'solid' : 'outline'}>
                            {a.priority} PRIORITY
                          </Badge>
                          <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60 font-semibold inline-flex flex-wrap items-center gap-1">
                            {a.targetBatchIds && a.targetBatchIds.length > 0 ? (
                              a.targetBatchIds.map((b: any) => (
                                <span key={b._id || b} className="inline-flex items-center gap-1 mr-1">
                                  <GraduationCap className="w-3 h-3 text-amber-400" />
                                  {b.name || b}
                                </span>
                              ))
                            ) : a.targetBatchId?.name ? (
                              <>
                                <GraduationCap className="w-3 h-3 text-amber-400" />
                                {a.targetBatchId.name} ({a.targetBatchId.code || 'BATCH'})
                              </>
                            ) : (
                              <>
                                <Megaphone className="w-3 h-3 text-emerald-400" />
                                ALL BATCHES (Institute-Wide)
                              </>
                            )}
                          </span>
                          <span className="text-zinc-800">•</span>
                          <span className="font-mono text-zinc-400">
                            {dateFormatted} at {timeFormatted}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{a.title}</h3>
                        <p className="text-sm text-zinc-300 leading-relaxed mb-0">{a.message}</p>
                        <div className="text-[11px] text-zinc-500 pt-2 flex items-center space-x-2 border-t border-zinc-900 mt-2">
                          <span>Posted by <strong className="text-zinc-300">{a.authorId?.name || 'Director Anand Pandey'}</strong></span>
                          <span className="font-mono text-emerald-400">({a.authorId?.phone || '+91 9876543210'})</span>
                        </div>
                      </div>

                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(a._id)}
                          className="text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Broadcast Modal with Role-Scoped Multi-Batch Checkboxes */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-lg font-bold text-white mb-0 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" /> Broadcast New Announcement
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-400 font-semibold block">Target Audience / Batches (Checkboxes) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedBatchIds.length === availableBatches.length) {
                        setSelectedBatchIds([]);
                      } else {
                        setSelectedBatchIds(availableBatches.map((b) => b._id));
                      }
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-mono"
                  >
                    {selectedBatchIds.length === availableBatches.length ? 'Deselect All' : 'Select All Batches'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto p-3 rounded-md border border-zinc-800 bg-zinc-900/90 space-y-2">
                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'DIRECTOR') && (
                    <label className="flex items-center space-x-2.5 cursor-pointer pb-2 border-b border-zinc-800 text-amber-300 font-bold text-xs">
                      <input
                        type="checkbox"
                        checked={selectedBatchIds.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBatchIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>ALL BATCHES (Institute-Wide Broadcast)</span>
                    </label>
                  )}

                  {availableBatches.map((b) => {
                    const isChecked = selectedBatchIds.includes(b._id);
                    return (
                      <label key={b._id} className="flex items-center space-x-2.5 cursor-pointer text-zinc-300 text-xs hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedBatchIds(selectedBatchIds.filter((id) => id !== b._id));
                            } else {
                              setSelectedBatchIds([...selectedBatchIds, b._id]);
                            }
                          }}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="font-mono text-zinc-300">
                          <strong>{b.name}</strong> ({b.code || 'BATCH'})
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 mb-0 font-mono">
                  {selectedBatchIds.length === 0
                    ? 'Institute-Wide (Broadcasting to All Batches)'
                    : `Broadcasting to ${selectedBatchIds.length} selected batch(es).`}
                </p>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Notice Title *</label>
                <Input
                  required
                  placeholder="e.g. Class Test Schedule / Holiday Announcement"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Priority Category *</label>
                <select
                  value={newNotice.priority}
                  onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="EXAM">EXAM</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type official notice message here..."
                  value={newNotice.message}
                  onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isPosting} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold">
                  {isPosting ? 'Broadcasting...' : 'Post Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

