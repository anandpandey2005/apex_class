'use client';

import React, { useState } from 'react';
import { User, ShieldCheck, Phone, KeyRound, Menu, LogOut } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { logoutUser } from '../../redux/slices/authSlice';
import { useLogoutMutation } from '../../redux/api/authApi';
import { useRouter } from 'next/navigation';
import { showToast } from '../../redux/slices/toastSlice';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [logoutMutation] = useLogoutMutation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const instituteName = process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'Apex Coaching Institute';
  const institutePhone = process.env.NEXT_PUBLIC_INSTITUTE_PHONE || '+91 98765 43210';

  const handleLogout = async () => {
    try {
      await logoutMutation({}).unwrap();
    } catch (e) {
      console.warn('Logout API warning:', e);
    } finally {
      dispatch(logoutUser());
      dispatch(showToast({ message: 'Signed out successfully.', type: 'info' }));
      router.replace('/login');
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h3 className="text-xs md:text-sm font-bold text-white mb-0 tracking-tight truncate max-w-[140px] sm:max-w-none">
          {instituteName}
        </h3>
        <span className="text-zinc-800 hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-zinc-400">
          <Phone className="w-3.5 h-3.5 text-zinc-500" />
          <span>{institutePhone}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPasswordModalOpen(true)}
          className="text-xs px-2 sm:px-3"
        >
          <KeyRound className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Password</span>
        </Button>
        <Badge variant="solid" className="py-1 px-2 text-[10px] sm:text-xs">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
          {user?.role ? `${user.role} DESK` : 'STAFF DESK'}
        </Badge>
        <div className="flex items-center space-x-2 border-l border-zinc-800 pl-2">
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
            <User className="w-4 h-4 text-zinc-300" />
          </div>
          {user?.name && (
            <span className="hidden md:inline text-xs font-semibold text-zinc-300 max-w-[120px] truncate">
              {user.name}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs px-2 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-900"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {isPasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </header>
  );
};
