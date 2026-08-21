'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import {
  UserPlus,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Edit3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  X,
  Filter,
} from 'lucide-react';
import { useAppDispatch } from '../../../redux/store';
import { showToast } from '../../../redux/slices/toastSlice';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../../../redux/api/userApi';
import { useGetBatchesQuery } from '../../../redux/api/batchApi';
import { User, UserRole, Batch } from '../../../types';
import { formatCurrency } from '../../../lib/utils';

const ITEMS_PER_PAGE = 10;

const PERMISSION_OPTIONS = [
  { key: 'MANAGE_PERMISSIONS', label: 'Director Permission Control (Grant/Revoke Roles)' },
  { key: 'MARK_ATTENDANCE', label: 'Mark Attendance Register' },
  { key: 'MANAGE_FEES', label: 'Manage Fee Dues & Issue Receipts' },
  { key: 'MANAGE_BATCHES', label: 'Create & Schedule Tuition Batches' },
  { key: 'MANAGE_USERS', label: 'Manage Staff & Student Accounts' },
  { key: 'BROADCAST_ANNOUNCEMENTS', label: 'Broadcast Class Announcements' },
];

export default function UserManagementPage() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIRECTOR' | 'ADMIN' | 'TEACHER' | 'STUDENT'>('ALL');
  const [duesFilter, setDuesFilter] = useState<'ALL' | 'PENDING' | 'CLEARED'>('ALL');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, isLoading, isError, refetch } = useGetUsersQuery({
    role: activeTab !== 'ALL' ? activeTab : undefined,
    batchId: selectedBatchFilter !== 'ALL' ? selectedBatchFilter : undefined,
    hasPendingDues: duesFilter === 'PENDING' ? 'true' : duesFilter === 'CLEARED' ? 'false' : undefined,
  });
  const { data: batchesData } = useGetBatchesQuery();

  const [createUserMutation, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUserMutation, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUserMutation] = useDeleteUserMutation();

  const users: User[] = data?.data || [];
  const batches: Batch[] = batchesData?.data || [];

  // Summary Metrics calculations
  const totalStudents = users.filter((u) => u.role === 'STUDENT').length;
  const studentsWithDues = users.filter((u) => u.role === 'STUDENT' && (u.feeSummary?.pendingDues || 0) > 0);
  const totalDuesAmount = users.reduce((acc, curr) => acc + (curr.feeSummary?.pendingDues || 0), 0);
  const totalCollectedAmount = users.reduce((acc, curr) => acc + (curr.feeSummary?.totalPaid || 0), 0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as UserRole,
    phone: '',
    aadharNumber: '',
    password: 'password123',
    permissions: ['MARK_ATTENDANCE', 'BROADCAST_ANNOUNCEMENTS'] as string[],
    batchIds: [] as string[],
  });

  const togglePermission = (permissionKey: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permissionKey);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== permissionKey) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permissionKey] };
      }
    });
  };

  const toggleBatchSelection = (batchId: string) => {
    setFormData((prev) => {
      const exists = prev.batchIds.includes(batchId);
      if (exists) {
        return { ...prev, batchIds: prev.batchIds.filter((b) => b !== batchId) };
      } else {
        return { ...prev, batchIds: [...prev.batchIds, batchId] };
      }
    });
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'STUDENT',
      phone: '',
      aadharNumber: '',
      password: 'password123',
      permissions: ['MARK_ATTENDANCE', 'BROADCAST_ANNOUNCEMENTS'],
      batchIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    const existingBatchIds = user.batchIds?.map((b: any) => typeof b === 'string' ? b : b._id) || [];
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      aadharNumber: user.aadharNumber || '',
      password: '',
      permissions: user.permissions || [],
      batchIds: existingBatchIds,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUserMutation({
          id: editingUser._id,
          ...formData,
        }).unwrap();
        dispatch(
          showToast({
            message: `User ${formData.name} updated! Role: ${formData.role}, Assigned Batches: ${formData.batchIds.length}`,
            type: 'success',
          })
        );
      } else {
        await createUserMutation(formData).unwrap();
        dispatch(
          showToast({
            message: `User created! Role: ${formData.role} with ${formData.batchIds.length} batch enrollments.`,
            type: 'success',
          })
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Operation failed', type: 'error' }));
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete account for ${name}?`)) return;
    try {
      await deleteUserMutation(id).unwrap();
      dispatch(showToast({ message: `Removed ${name} from MongoDB directory`, type: 'info' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Failed to delete user', type: 'error' }));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery) ||
      (u.aadharNumber && u.aadharNumber.includes(searchQuery));

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, duesFilter, selectedBatchFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-0">User & Academic Staff Directory</h1>
              <p className="text-xs text-zinc-400 mb-0">
                Manage roles (Admin, Faculty, Student), fee dues status, Aadhar card numbers, and batch enrollments.
              </p>
            </div>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Assign Role & Add User
        </Button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Total System Users
              </p>
              <h3 className="text-2xl font-black text-white font-mono mb-0">{users.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">Directors, Admins, Faculty, Students</p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Enrolled Students
              </p>
              <h3 className="text-2xl font-black text-cyan-400 font-mono mb-0">{totalStudents}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">Active batch enrollments</p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Students With Pending Dues
              </p>
              <h3 className="text-2xl font-black text-rose-400 font-mono mb-0">{studentsWithDues.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">
            Total Dues: <span className="text-rose-400 font-bold font-mono">{formatCurrency(totalDuesAmount)}</span>
          </p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Total Fees Cleared
              </p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono mb-0">
                {formatCurrency(totalCollectedAmount)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 mb-0">Cleared student receipts</p>
        </Card>
      </div>

      {isLoading && (
        <Card className="border-zinc-800 p-8 text-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
          <p className="text-xs mb-0">Fetching user directory & dues calculations from MongoDB database...</p>
        </Card>
      )}

      {isError && (
        <Card className="border-zinc-800 p-6 text-center text-zinc-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-white" />
          <p className="text-xs mb-2">Unable to fetch users from database.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Query
          </Button>
        </Card>
      )}

      {/* Control Tabs & Search with Filtering */}
      {!isLoading && !isError && (
        <Card className="border-zinc-800 flex flex-col justify-between">
          <CardHeader className="space-y-4">
            {/* Top Filter Row: Role Tabs & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'ADMIN', 'TEACHER', 'STUDENT'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className="text-xs"
                  >
                    {tab === 'ADMIN' ? 'ADMINS' : tab === 'TEACHER' ? 'FACULTY' : tab === 'STUDENT' ? 'STUDENTS' : 'ALL USERS'}
                  </Button>
                ))}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <Input
                  placeholder="Search by name, email, phone, UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Bottom Filter Row: Dues Status & Batch Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-900 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-zinc-500 font-semibold flex items-center mr-1">
                  <Filter className="w-3.5 h-3.5 mr-1" /> Fee Dues Filter:
                </span>
                <button
                  onClick={() => setDuesFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    duesFilter === 'ALL'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-900'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => setDuesFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                    duesFilter === 'PENDING'
                      ? 'bg-rose-950/80 text-rose-200 border border-rose-800'
                      : 'text-rose-400 hover:text-rose-200 bg-zinc-950 border border-zinc-900'
                  }`}
                >
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>Pending Dues Only ({studentsWithDues.length})</span>
                </button>
                <button
                  onClick={() => setDuesFilter('CLEARED')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                    duesFilter === 'CLEARED'
                      ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800'
                      : 'text-emerald-400 hover:text-emerald-200 bg-zinc-950 border border-zinc-900'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Fully Cleared</span>
                </button>
              </div>

              {/* Batch Selector Filter */}
              <div className="flex items-center space-x-2 text-xs text-zinc-400">
                <span>Filter Batch:</span>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="h-8 px-2 rounded bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Batches</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
                <Users className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                <p className="text-zinc-400 font-semibold mb-1">No user accounts matching query.</p>
                <p className="text-[11px] text-zinc-600 mb-0">Try clearing filters or changing search terms.</p>
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto rounded-lg border border-zinc-800 bg-black">
                  <table className="w-full text-left min-w-[950px]">
                    <thead>
                      <tr>
                        <th className="no-break">User Name & Email</th>
                        <th className="no-break">System Role</th>
                        <th>Assigned Batches / Scope</th>
                        <th className="no-break">Contact & Aadhar UID</th>
                        <th className="no-break">Tuition Fee / Dues</th>
                        <th className="no-break">Account Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user) => {
                        const isStudent = user.role === 'STUDENT';
                        const feeInfo = user.feeSummary;
                        const hasDues = feeInfo && feeInfo.pendingDues > 0;

                        return (
                          <tr key={user._id} className="hover:bg-zinc-900/50 transition-colors">
                            <td>
                              <div className="font-bold text-white text-sm no-break">{user.name}</div>
                              <div className="text-xs text-zinc-400 font-mono no-break">{user.email}</div>
                            </td>

                            <td>
                              <Badge
                                variant={
                                  user.role === 'DIRECTOR'
                                    ? 'solid'
                                    : user.role === 'ADMIN'
                                    ? 'solid'
                                    : 'outline'
                                }
                                className="no-break"
                              >
                                {user.role}
                              </Badge>
                            </td>

                            <td>
                              {user.role === 'DIRECTOR' ? (
                                <Badge variant="solid" className="text-[10px] no-break">
                                  FULL SYSTEM ACCESS
                                </Badge>
                              ) : isStudent ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {user.batchIds && user.batchIds.length > 0 ? (
                                    user.batchIds.map((b: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[10px] no-break">
                                        {typeof b === 'object' ? b.code || b.name : 'Batch'}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-zinc-500 italic no-break">No batches assigned</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-zinc-400 font-mono no-break">
                                  {user.permissions?.length
                                    ? `${user.permissions.length} Permissions Granted`
                                    : 'Standard Permissions'}
                                </span>
                              )}
                            </td>

                            <td>
                              <div className="text-zinc-300 font-mono text-xs no-break">{user.phone || 'N/A'}</div>
                              {user.aadharNumber ? (
                                <div className="text-[10px] text-zinc-400 font-mono mt-0.5 no-break">
                                  UID: <span className="text-zinc-200 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{user.aadharNumber}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-zinc-600 italic no-break">UID: Optional</div>
                              )}
                            </td>

                            <td>
                              {isStudent ? (
                                hasDues ? (
                                  <div className="no-break">
                                    <div className="text-xs font-mono font-bold text-rose-400 flex items-center space-x-1">
                                      <Clock className="w-3.5 h-3.5 text-rose-400 mr-1 inline shrink-0" />
                                      <span>{formatCurrency(feeInfo.pendingDues)} DUE</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                      Paid: {formatCurrency(feeInfo.totalPaid)}
                                    </div>
                                  </div>
                                ) : feeInfo && feeInfo.totalPaid > 0 ? (
                                  <div className="no-break">
                                    <div className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1 inline shrink-0" />
                                      <span>Cleared</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                      {formatCurrency(feeInfo.totalPaid)} Cleared
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-zinc-500 no-break">No invoice created</span>
                                )
                              ) : (
                                <span className="text-[11px] text-zinc-500 font-mono no-break">N/A (Staff)</span>
                              )}
                            </td>

                            <td>
                              <div className="flex items-center space-x-2 no-break">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(user)}
                                  className="text-zinc-300 hover:text-white text-xs"
                                >
                                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user._id, user.name)}
                                  className="text-zinc-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-900 text-xs gap-3">
                  <span className="text-zinc-500 no-break">
                    Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> (
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} Users)
                  </span>

                  <div className="flex items-center space-x-2 no-break">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      Prev
                    </Button>
                    <div className="px-3 py-1 bg-zinc-900 rounded font-mono text-xs text-white border border-zinc-800">
                      {currentPage} / {totalPages}
                    </div>
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

      {/* Add / Edit User & Assign Permissions / Batches Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold text-white mb-0">
                  {editingUser ? `Edit Account: ${editingUser.name}` : 'Role & Permission Desk'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none"
                >
                  <option value="STUDENT">STUDENT (Student Portal & Multi-Batch Enrollment)</option>
                  <option value="TEACHER">TEACHER / INSTRUCTOR (Staff Desk Access)</option>
                  <option value="ADMIN">ADMINISTRATOR (Gated Employee Access)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Full Name</label>
                <Input
                  required
                  placeholder="Full Name"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Mobile Phone Number</label>
                <Input
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">
                  Aadhar Card Number <span className="text-zinc-500 text-[11px] font-normal">(Optional - 12 Digits)</span>
                </label>
                <Input
                  placeholder="e.g. 542012345678"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="text-zinc-400 block mb-1">Initial Login Password</label>
                  <Input
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}

              {/* Multi-Batch Enroller for Students */}
              {formData.role === 'STUDENT' && (
                <div className="p-3 border border-zinc-800 bg-zinc-900/60 rounded-md space-y-2">
                  <p className="font-bold text-white mb-1">Enroll in Tuition Batches (Select Multiple Batches):</p>
                  {batches.length === 0 ? (
                    <p className="text-zinc-500 text-[11px] mb-0">No active batches available to assign.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {batches.map((batch) => {
                        const isChecked = formData.batchIds.includes(batch._id);
                        return (
                          <label
                            key={batch._id}
                            className="flex items-center space-x-2.5 cursor-pointer text-zinc-300 hover:text-white py-1 px-2 rounded bg-zinc-900 border border-zinc-800"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleBatchSelection(batch._id)}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-0"
                            />
                            <div className="flex-1 flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{batch.name} ({batch.code})</span>
                              <span className="font-mono text-[10px] text-zinc-400">{batch.schedule}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Fine-Grained Permissions for Admin / Teacher */}
              {formData.role !== 'STUDENT' && (
                <div className="p-3 border border-zinc-800 bg-zinc-900/60 rounded-md space-y-2">
                  <p className="font-bold text-white mb-1">Assign Fine-Grained System Permissions:</p>
                  {PERMISSION_OPTIONS.map((p) => {
                    const isChecked = formData.permissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className="flex items-center space-x-2.5 cursor-pointer text-zinc-300 hover:text-white py-1"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(p.key)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-0"
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving...' : editingUser ? 'Update Account Permissions' : 'Assign Role & Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
