'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Building2,
  KeyRound,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ChangePasswordModal } from './ChangePasswordModal';

const navItems = [
  { label: 'My Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'My Batches', href: '/batches', icon: GraduationCap },
  { label: 'My Attendance', href: '/attendance', icon: ClipboardCheck },
  { label: 'My Fee Receipts', href: '/fees', icon: CreditCard },
];

interface StudentSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const instituteName = process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'Apex Coaching Institute';

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-black">
      <div>
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-white mb-0">{instituteName}</h2>
              <p className="text-[11px] text-zinc-500 mb-0 tracking-wide uppercase">Student Portal</p>
            </div>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="text-zinc-400 hover:text-white md:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-colors',
                  isActive
                    ? 'bg-zinc-900 text-white border border-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
                )}
              >
                <Icon className="w-4 h-4 text-zinc-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-900 space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsPasswordModalOpen(true);
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full text-xs"
        >
          <KeyRound className="w-3.5 h-3.5 mr-2" />
          Change Password
        </Button>
        <Link href="/login" onClick={onCloseMobile}>
          <Button variant="ghost" size="sm" className="w-full text-xs text-zinc-400">
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
        </Link>
      </div>

      {isPasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800 bg-black flex-col h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-64 max-w-xs bg-black border-r border-zinc-800 h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
