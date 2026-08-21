'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Megaphone,
  Building2,
  Users,
  Award,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Attendance Desk', href: '/attendance', icon: ClipboardCheck },
  { label: 'Fees & Receipts', href: '/fees', icon: CreditCard },
  { label: 'Batches & Timetable', href: '/batches', icon: GraduationCap },
  { label: 'User Directory', href: '/users', icon: Users },
  { label: 'Alumni & Passed Out', href: '/alumni', icon: Award },
  { label: 'Notice Board', href: '/announcements', icon: Megaphone },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const pathname = usePathname();
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
              <p className="text-[11px] text-zinc-500 mb-0 tracking-wide uppercase">TuitionPro Engine</p>
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

      <div className="p-4 border-t border-zinc-900 text-[11px] text-zinc-500">
        <p className="mb-0 text-zinc-400 font-semibold">AcademyOps v1.0.0</p>
        <p className="mb-0 text-[10px]">Strict Duo-Tone Architecture</p>
      </div>
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
