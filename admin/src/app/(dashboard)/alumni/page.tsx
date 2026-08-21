'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import {
  Award,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  GraduationCap,
  Calendar,
  Building2,
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  X,
  FileText,
  UserCheck,
  Briefcase,
  Layers,
  Edit3,
} from 'lucide-react';
import { useAppDispatch } from '../../../redux/store';
import { showToast } from '../../../redux/slices/toastSlice';
import {
  useGetAlumniListQuery,
  useGetAlumniByIdQuery,
  useGetAlumniStatsQuery,
  useGraduateStudentMutation,
  useCreateAlumniMutation,
  useUpdateAlumniMutation,
  useDeleteAlumniMutation,
} from '../../../redux/api/alumniApi';
import { useGetUsersQuery } from '../../../redux/api/userApi';
import { useGetBatchesQuery } from '../../../redux/api/batchApi';
import { Alumni, AlumniStatus, User } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { FeeReceiptModal } from '../../../components/shared/FeeReceiptModal';

export default function AlumniManagementPage() {
  const dispatch = useAppDispatch();

  // Filters and Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPassingYear, setSelectedPassingYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDuesFilter, setSelectedDuesFilter] = useState<'ALL' | 'PENDING' | 'CLEARED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [isGraduateModalOpen, setIsGraduateModalOpen] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAlumniId, setSelectedAlumniId] = useState<string | null>(null);
  const [alumniToEdit, setAlumniToEdit] = useState<Alumni | null>(null);
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<any | null>(null);

  // Query Alumni List with server-side pagination & indexed search
  const {
    data: alumniData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAlumniListQuery({
    page: currentPage,
    limit: limit,
    search: searchQuery || undefined,
    passingYear: selectedPassingYear !== 'ALL' ? parseInt(selectedPassingYear) : undefined,
    currentStatus: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    hasPendingDues: selectedDuesFilter === 'PENDING' ? 'true' : selectedDuesFilter === 'CLEARED' ? 'false' : undefined,
  });

  // Query Alumni Aggregate Stats
  const { data: statsData } = useGetAlumniStatsQuery();

  // Query Active Students for graduation workflow
  const { data: studentsData } = useGetUsersQuery({ role: 'STUDENT' });
  const { data: batchesData } = useGetBatchesQuery();

  // Mutations
  const [graduateStudentMutation, { isLoading: isGraduating }] = useGraduateStudentMutation();
  const [createAlumniMutation, { isLoading: isCreating }] = useCreateAlumniMutation();
  const [updateAlumniMutation, { isLoading: isUpdating }] = useUpdateAlumniMutation();
  const [deleteAlumniMutation] = useDeleteAlumniMutation();

  // Single Alumni Detail query
  const { data: detailData, isLoading: isLoadingDetail } = useGetAlumniByIdQuery(
    selectedAlumniId || '',
    { skip: !selectedAlumniId }
  );

  const alumniList: Alumni[] = alumniData?.data || [];
  const pagination = alumniData?.meta?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };
  const stats = statsData?.data;
  const activeStudents: User[] = studentsData?.data || [];

  // Graduation Form State
  const [gradForm, setGradForm] = useState({
    studentId: '',
    passingYear: new Date().getFullYear(),
    graduationDate: new Date().toISOString().split('T')[0],
    currentStatus: 'HIGHER_STUDIES' as AlumniStatus,
    organizationOrCollege: '',
    notes: '',
  });

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    aadharNumber: '',
    batchName: '',
    courseName: 'General Studies & Science',
    passingYear: new Date().getFullYear(),
    graduationDate: new Date().toISOString().split('T')[0],
    currentStatus: 'HIGHER_STUDIES' as AlumniStatus,
    organizationOrCollege: '',
    totalPaid: 35000,
    totalPendingDues: 0,
    notes: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    aadharNumber: '',
    batchName: '',
    courseName: '',
    passingYear: 2026,
    graduationDate: '',
    currentStatus: 'HIGHER_STUDIES' as AlumniStatus,
    organizationOrCollege: '',
    notes: '',
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPassingYear, selectedStatus, selectedDuesFilter, limit]);

  const handleOpenGraduateModal = () => {
    setGradForm({
      studentId: activeStudents.length > 0 ? activeStudents[0]._id : '',
      passingYear: new Date().getFullYear(),
      graduationDate: new Date().toISOString().split('T')[0],
      currentStatus: 'HIGHER_STUDIES',
      organizationOrCollege: '',
      notes: '',
    });
    setIsGraduateModalOpen(true);
  };

  const handleGraduateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradForm.studentId) {
      dispatch(showToast({ message: 'Please select an active student to graduate', type: 'error' }));
      return;
    }
    try {
      const res = await graduateStudentMutation({
        studentId: gradForm.studentId,
        passingYear: Number(gradForm.passingYear),
        graduationDate: gradForm.graduationDate,
        currentStatus: gradForm.currentStatus,
        organizationOrCollege: gradForm.organizationOrCollege,
        notes: gradForm.notes,
      }).unwrap();

      dispatch(
        showToast({
          message: res.message || 'Student graduated and archived into Alumni directory!',
          type: 'success',
        })
      );
      setIsGraduateModalOpen(false);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Graduation failed', type: 'error' }));
    }
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAlumniMutation({
        ...manualForm,
        passingYear: Number(manualForm.passingYear),
        totalPaid: Number(manualForm.totalPaid),
        totalPendingDues: Number(manualForm.totalPendingDues),
      }).unwrap();

      dispatch(showToast({ message: 'Alumni record created successfully!', type: 'success' }));
      setIsManualAddModalOpen(false);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Creation failed', type: 'error' }));
    }
  };

  const handleOpenEditModal = (alumni: Alumni) => {
    setAlumniToEdit(alumni);
    setEditForm({
      name: alumni.name,
      email: alumni.email,
      phone: alumni.phone || '',
      aadharNumber: alumni.aadharNumber || '',
      batchName: alumni.batchName,
      courseName: alumni.courseName || '',
      passingYear: alumni.passingYear,
      graduationDate: alumni.graduationDate,
      currentStatus: alumni.currentStatus,
      organizationOrCollege: alumni.organizationOrCollege || '',
      notes: alumni.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumniToEdit) return;
    try {
      await updateAlumniMutation({
        id: alumniToEdit._id,
        ...editForm,
        passingYear: Number(editForm.passingYear),
      }).unwrap();

      dispatch(showToast({ message: 'Alumni record updated!', type: 'success' }));
      setIsEditModalOpen(false);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Update failed', type: 'error' }));
    }
  };

  const handleDeleteAlumni = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from Alumni records?`)) return;
    try {
      await deleteAlumniMutation(id).unwrap();
      dispatch(showToast({ message: `Removed ${name} from Alumni records`, type: 'info' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Delete failed', type: 'error' }));
    }
  };

  const selectedStudentObj = activeStudents.find((s) => s._id === gradForm.studentId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-0">Alumni & Passed-Out Students Hub</h1>
              <p className="text-xs text-zinc-400 mb-0">
                Archived student profiles, historical fee receipts, monthly dues, batch details, and Aadhar UID records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button variant="outline" size="sm" onClick={() => setIsManualAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Historical Alumni
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenGraduateModal}>
            <GraduationCap className="w-4 h-4 mr-1.5 text-amber-400" />
            Graduate Active Student
          </Button>
        </div>
      </div>

      {/* Quick Metrics Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Total Alumni Graduated
              </p>
              <h3 className="text-2xl font-black text-white font-mono mb-0">
                {stats?.totalAlumni || pagination.total || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">Indexed in local MongoDB store</p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Alumni Revenue Cleared
              </p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono mb-0">
                {formatCurrency(stats?.totalRevenue || 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">Total tuition fees paid</p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Pending / Overdue Dues
              </p>
              <h3 className="text-2xl font-black text-rose-400 font-mono mb-0">
                {formatCurrency(stats?.totalPendingDues || 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">Unresolved dues carried forward</p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Active Enrolled Students
              </p>
              <h3 className="text-2xl font-black text-cyan-400 font-mono mb-0">
                {activeStudents.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">Eligible for graduation</p>
        </Card>
      </div>

      {/* Search, Filter Bar & Pagination Limit Control */}
      <Card className="border-zinc-800">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <Input
                placeholder="Search by name, email, phone, Aadhar UID, batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Passing Year Filter */}
              <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
                <span>Year:</span>
                <select
                  value={selectedPassingYear}
                  onChange={(e) => setSelectedPassingYear(e.target.value)}
                  className="h-9 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Passing Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="HIGHER_STUDIES">Higher Studies</option>
                  <option value="EMPLOYED">Employed / Working</option>
                  <option value="PREPARING">Competitive Prep</option>
                  <option value="ENTREPRENEUR">Entrepreneur</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Dues Filter */}
              <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
                <span>Fee Dues:</span>
                <select
                  value={selectedDuesFilter}
                  onChange={(e) => setSelectedDuesFilter(e.target.value as 'ALL' | 'PENDING' | 'CLEARED')}
                  className="h-9 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Dues Status</option>
                  <option value="PENDING">With Pending Dues (₹)</option>
                  <option value="CLEARED">Fully Cleared Only (✓)</option>
                </select>
              </div>

              {/* Page Size selector */}
              <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
                <span>Show:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-9 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                >
                  <option value="10">10 / page</option>
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && (
            <div className="py-12 text-center text-zinc-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" />
              <p className="text-xs">Fetching Alumni database records with server-side pagination...</p>
            </div>
          )}

          {isError && (
            <div className="py-8 text-center text-zinc-400 space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
              <p className="text-xs">Failed to load alumni records from server.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry Fetch
              </Button>
            </div>
          )}

          {!isLoading && !isError && alumniList.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
              <GraduationCap className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
              <p className="text-zinc-400 font-semibold mb-1">No alumni records found.</p>
              <p className="text-[11px] text-zinc-600 mb-0">
                Try refining search query or graduate an active student using the button above.
              </p>
            </div>
          )}

          {!isLoading && !isError && alumniList.length > 0 && (
            <>
              <div className="w-full overflow-x-auto rounded-lg border border-zinc-800 bg-black">
                <table className="w-full text-left min-w-[950px]">
                  <thead>
                    <tr>
                      <th className="no-break">Alumni Name & Contact</th>
                      <th className="no-break">Batch Name & Course</th>
                      <th className="no-break">Passing Year / Date</th>
                      <th className="no-break">Aadhar Card UID</th>
                      <th className="no-break">Tuition Paid / Dues</th>
                      <th className="no-break">Current Path</th>
                      <th className="no-break">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumniList.map((alumni) => (
                      <tr key={alumni._id} className="hover:bg-zinc-900/50 transition-colors">
                        <td>
                          <div className="font-bold text-white text-sm no-break">{alumni.name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono no-break">{alumni.email}</div>
                          <div className="text-[11px] text-zinc-500 font-mono no-break">{alumni.phone || 'No Phone'}</div>
                        </td>

                        <td>
                          <div className="font-semibold text-white text-xs no-break">{alumni.batchName}</div>
                          <div className="text-[10px] text-zinc-400 max-w-xs">{alumni.courseName || 'Science & Foundation'}</div>
                        </td>

                        <td>
                          <Badge variant="outline" className="font-mono text-[11px] bg-zinc-900 text-amber-300 border-amber-900/50 no-break">
                            Class of {alumni.passingYear}
                          </Badge>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5 no-break">
                            {alumni.graduationDate}
                          </div>
                        </td>

                        <td>
                          {alumni.aadharNumber ? (
                            <span className="font-mono text-xs text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 no-break">
                              {alumni.aadharNumber}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[11px] italic no-break">Not provided</span>
                          )}
                        </td>

                        <td>
                          <div className="text-xs font-mono font-bold text-emerald-400 no-break">
                            Paid: {formatCurrency(alumni.totalPaid || 0)}
                          </div>
                          {alumni.totalPendingDues > 0 ? (
                            <div className="text-[10px] font-mono font-bold text-rose-400 no-break">
                              Due: {formatCurrency(alumni.totalPendingDues)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-500 flex items-center no-break">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1 inline shrink-0" /> All Dues Cleared
                            </div>
                          )}
                        </td>

                        <td>
                          <Badge variant="outline" className="text-[10px] uppercase no-break">
                            {alumni.currentStatus?.replace('_', ' ') || 'HIGHER STUDIES'}
                          </Badge>
                          {alumni.organizationOrCollege && (
                            <div className="text-[10px] text-zinc-400 mt-0.5 max-w-xs">
                              {alumni.organizationOrCollege}
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="flex items-center space-x-1.5 no-break">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAlumniId(alumni._id)}
                              className="text-white hover:bg-zinc-800"
                              title="View Full Record & Receipts"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                              View File
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(alumni)}
                              className="text-zinc-400 hover:text-white"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAlumni(alumni._id, alumni.name)}
                              className="text-zinc-500 hover:text-rose-400"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-900 text-xs gap-3">
                <span className="text-zinc-500">
                  Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
                  <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} Total Alumni Records)
                </span>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isFetching}
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <div className="px-3 py-1 bg-zinc-900 rounded font-mono text-xs text-white border border-zinc-800">
                    {currentPage} / {pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage >= pagination.totalPages || isFetching}
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

      {/* ========================================================================= */}
      {/* 1. GRADUATE STUDENT MODAL */}
      {/* ========================================================================= */}
      {isGraduateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white mb-0">Graduate Active Student</h3>
              </div>
              <button onClick={() => setIsGraduateModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Graduating a student compiles all historical monthly fee receipts, dues, batch assignments, and attendance into an official archive record.
            </p>

            <form onSubmit={handleGraduateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Select Active Student *</label>
                <select
                  value={gradForm.studentId}
                  onChange={(e) => setGradForm({ ...gradForm, studentId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none"
                  required
                >
                  <option value="">-- Choose student from directory --</option>
                  {activeStudents.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email}) {s.phone ? `- ${s.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentObj && (
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-md space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Enrolled Batches:</span>
                    <span className="text-white font-semibold">
                      {selectedStudentObj.batchIds?.length || 0} Batch(es)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Aadhar UID on File:</span>
                    <span className="text-white font-mono">
                      {selectedStudentObj.aadharNumber || 'None (optional)'}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Passing Year *</label>
                  <Input
                    type="number"
                    required
                    value={gradForm.passingYear}
                    onChange={(e) => setGradForm({ ...gradForm, passingYear: parseInt(e.target.value) || 2026 })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Graduation Date *</label>
                  <Input
                    type="date"
                    required
                    value={gradForm.graduationDate}
                    onChange={(e) => setGradForm({ ...gradForm, graduationDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Post-Graduation Path</label>
                <select
                  value={gradForm.currentStatus}
                  onChange={(e) => setGradForm({ ...gradForm, currentStatus: e.target.value as AlumniStatus })}
                  className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none"
                >
                  <option value="HIGHER_STUDIES">HIGHER STUDIES (College / University)</option>
                  <option value="EMPLOYED">EMPLOYED (Job / Internship)</option>
                  <option value="PREPARING">COMPETITIVE EXAM PREPARATION</option>
                  <option value="ENTREPRENEUR">ENTREPRENEUR / STARTUP</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">College / Organization Name (Optional)</label>
                <Input
                  placeholder="e.g. IIT Bombay, AIIMS, Microsoft, etc."
                  value={gradForm.organizationOrCollege}
                  onChange={(e) => setGradForm({ ...gradForm, organizationOrCollege: e.target.value })}
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Graduation / Academic Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleared 10th Board with 97%, Top 1% in Batch."
                  value={gradForm.notes}
                  onChange={(e) => setGradForm({ ...gradForm, notes: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setIsGraduateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isGraduating}>
                  {isGraduating ? 'Processing Graduation...' : 'Complete Graduation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MANUAL HISTORICAL ALUMNI CREATION MODAL */}
      {/* ========================================================================= */}
      {isManualAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white mb-0">Add Historical Alumni Record</h3>
              </div>
              <button onClick={() => setIsManualAddModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Full Student Name *</label>
                <Input
                  required
                  placeholder="e.g. Rohit Sharma"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Email Address *</label>
                  <Input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Phone Number</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">
                    Aadhar UID <span className="text-zinc-500">(Optional)</span>
                  </label>
                  <Input
                    placeholder="12-digit UID"
                    value={manualForm.aadharNumber}
                    onChange={(e) => setManualForm({ ...manualForm, aadharNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Passing Year *</label>
                  <Input
                    type="number"
                    required
                    value={manualForm.passingYear}
                    onChange={(e) => setManualForm({ ...manualForm, passingYear: parseInt(e.target.value) || 2025 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Batch Name *</label>
                  <Input
                    required
                    placeholder="Class 12 Advanced Science"
                    value={manualForm.batchName}
                    onChange={(e) => setManualForm({ ...manualForm, batchName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Course / Subjects</label>
                  <Input
                    placeholder="Physics, Chemistry, Maths"
                    value={manualForm.courseName}
                    onChange={(e) => setManualForm({ ...manualForm, courseName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Total Fees Paid (₹)</label>
                  <Input
                    type="number"
                    value={manualForm.totalPaid}
                    onChange={(e) => setManualForm({ ...manualForm, totalPaid: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Pending Dues (₹)</label>
                  <Input
                    type="number"
                    value={manualForm.totalPendingDues}
                    onChange={(e) => setManualForm({ ...manualForm, totalPendingDues: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">College / Organization</label>
                <Input
                  placeholder="e.g. IIT Delhi, Google, AIIMS"
                  value={manualForm.organizationOrCollege}
                  onChange={(e) => setManualForm({ ...manualForm, organizationOrCollege: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setIsManualAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isCreating}>
                  {isCreating ? 'Saving...' : 'Save Alumni Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT ALUMNI MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && alumniToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold text-white mb-0">Edit Alumni Profile: {alumniToEdit.name}</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Full Name</label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Phone Number</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Aadhar UID Number (Optional)</label>
                  <Input
                    placeholder="12-digit UID"
                    value={editForm.aadharNumber}
                    onChange={(e) => setEditForm({ ...editForm, aadharNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Passing Year</label>
                  <Input
                    type="number"
                    value={editForm.passingYear}
                    onChange={(e) => setEditForm({ ...editForm, passingYear: parseInt(e.target.value) || 2025 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Batch Name</label>
                  <Input
                    value={editForm.batchName}
                    onChange={(e) => setEditForm({ ...editForm, batchName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Current Status</label>
                  <select
                    value={editForm.currentStatus}
                    onChange={(e) => setEditForm({ ...editForm, currentStatus: e.target.value as AlumniStatus })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                  >
                    <option value="HIGHER_STUDIES">HIGHER STUDIES</option>
                    <option value="EMPLOYED">EMPLOYED</option>
                    <option value="PREPARING">COMPETITIVE PREPARATION</option>
                    <option value="ENTREPRENEUR">ENTREPRENEUR</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">College / Organization Name</label>
                <Input
                  value={editForm.organizationOrCollege}
                  onChange={(e) => setEditForm({ ...editForm, organizationOrCollege: e.target.value })}
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Update Alumni Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ALUMNI FULL DOSSIER & RECEIPTS MODAL */}
      {/* ========================================================================= */}
      {selectedAlumniId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-7 text-white shadow-2xl space-y-6">
            {isLoadingDetail || !detailData ? (
              <div className="py-16 text-center text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-white mb-2" />
                <p className="text-xs">Loading complete alumni history & fee receipts...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-white mb-0">{detailData.data.name}</h2>
                        <Badge variant="outline" className="font-mono text-[10px] text-amber-300 border-amber-900/50">
                          Class of {detailData.data.passingYear}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mb-0 font-mono">
                        {detailData.data.email} • {detailData.data.phone || 'No phone'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAlumniId(null)}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Identity & Batch Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                      Aadhar Card UID
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {detailData.data.aadharNumber || 'Not on record'}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                      Passed Out Batch
                    </span>
                    <span className="text-xs font-bold text-emerald-400 block truncate">
                      {detailData.data.batchName}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">Graduated: {detailData.data.graduationDate}</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                      Current Placement
                    </span>
                    <span className="text-xs font-bold text-cyan-400 block">
                      {detailData.data.currentStatus.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-300 block truncate">
                      {detailData.data.organizationOrCollege || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Lifetime Financial Audit Card */}
                <div className="p-4 bg-black border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Lifetime Tuition Fee Audit
                      </span>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Total Paid</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(detailData.data.totalPaid || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Pending Dues</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            detailData.data.totalPendingDues > 0 ? 'text-rose-400' : 'text-zinc-500'
                          }`}
                        >
                          {formatCurrency(detailData.data.totalPendingDues || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historical Month-by-Month Receipts & Dues */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 mb-0">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Historical Monthly Receipts & Dues History ({detailData.data.feeHistory?.length || 0} Records)</span>
                    </h4>
                  </div>

                  {(!detailData.data.feeHistory || detailData.data.feeHistory.length === 0) ? (
                    <div className="p-4 text-center text-zinc-500 text-xs border border-zinc-800 rounded-md">
                      No historical receipt records attached to this alumni file.
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/80 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-zinc-400">Month / Period</th>
                            <th className="py-2 px-3 text-zinc-400">Receipt No.</th>
                            <th className="py-2 px-3 text-zinc-400">Amount Due</th>
                            <th className="py-2 px-3 text-zinc-400">Amount Paid</th>
                            <th className="py-2 px-3 text-zinc-400">Payment Status</th>
                            <th className="py-2 px-3 text-zinc-400">UTR / Mode</th>
                            <th className="py-2 px-3 text-zinc-400">Receipt PDF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {detailData.data.feeHistory.map((fee, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/40">
                              <td className="py-2 px-3 font-semibold text-white">{fee.month}</td>
                              <td className="py-2 px-3 font-mono text-zinc-400 text-[11px]">
                                {fee.receiptNumber || 'N/A'}
                              </td>
                              <td className="py-2 px-3 font-mono text-zinc-300">
                                {formatCurrency(fee.amountDue)}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                                {formatCurrency(fee.amountPaid)}
                              </td>
                              <td className="py-2 px-3">
                                <Badge
                                  variant={fee.status === 'PAID' ? 'solid' : 'outline'}
                                  className="text-[10px]"
                                >
                                  {fee.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-zinc-400 font-mono text-[10px]">
                                {fee.paymentMethod ? `${fee.paymentMethod} ` : ''}
                                {fee.transactionId ? `(${fee.transactionId})` : ''}
                              </td>
                              <td className="py-2 px-3">
                                {fee.receiptNumber ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedReceiptForPreview({
                                        _id: fee.feeId || `ALUMNI-${idx}`,
                                        receiptNumber: fee.receiptNumber,
                                        paidDate: fee.paidDate || fee.dueDate,
                                        studentId: { name: detailData.data.name },
                                        batchId: { name: detailData.data.batchName },
                                        month: fee.month,
                                        amountDue: fee.amountDue,
                                        amountPaid: fee.amountPaid,
                                        status: fee.status,
                                        paymentMethod: fee.paymentMethod || 'UPI',
                                        transactionId: fee.transactionId,
                                      })
                                    }
                                    className="text-[10px] h-7 px-2"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Receipt
                                  </Button>
                                ) : (
                                  <span className="text-zinc-600 text-[10px]">Unpaid</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Attendance Summary */}
                {detailData.data.attendanceSummary && (
                  <div className="p-3.5 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-white">Historical Academic Attendance:</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-zinc-400">
                        {detailData.data.attendanceSummary.attendedClasses} / {detailData.data.attendanceSummary.totalClasses} Classes
                      </span>
                      <Badge variant="outline" className="font-mono text-emerald-400 border-emerald-900/50">
                        {detailData.data.attendanceSummary.percentage}% Attendance Record
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Academic Notes */}
                {detailData.data.notes && (
                  <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-xs space-y-1">
                    <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px] block">
                      Institutional Record Notes:
                    </span>
                    <p className="text-zinc-300 mb-0 italic">{detailData.data.notes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setSelectedAlumniId(null)}>
                    Close Dossier
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FEE RECEIPT MODAL PREVIEW */}
      {/* ========================================================================= */}
      {selectedReceiptForPreview && (
        <FeeReceiptModal
          fee={selectedReceiptForPreview}
          onClose={() => setSelectedReceiptForPreview(null)}
        />
      )}
    </div>
  );
}
