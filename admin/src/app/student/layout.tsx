'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  CreditCard,
  Building2,
  User,
  KeyRound,
  LogOut,
  Megaphone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ChangePasswordModal } from '../../components/shared/ChangePasswordModal';

const studentNavItems = [
  { label: 'My Dashboard', href: '/student', icon: LayoutDashboard },
  { label: 'My Attendance', href: '/student/attendance', icon: ClipboardCheck },
  { label: 'My Fee Receipts', href: '/student/fees', icon: CreditCard },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const instituteName = process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'Apex Coaching Institute';

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Student Dedicated Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-black flex flex-col justify-between h-screen sticky top-0">
        <div>
          {/* Institute Branding Header */}
          <div className="p-5 border-b border-zinc-900 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-white mb-0">{instituteName}</h2>
              <p className="text-[11px] text-zinc-500 mb-0 tracking-wide uppercase">Student Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

        {/* Student Profile & Password */}
        <div className="p-4 border-t border-zinc-900 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 mr-2" />
            Change Password
          </Button>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="w-full text-xs text-zinc-400">
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <Badge variant="solid" className="py-1 px-3">
              STUDENT PORTAL
            </Badge>
            <span className="text-xs text-zinc-400">Logged in as: <strong className="text-white">Rohan Mehta</strong> (Class 12th Physics)</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
            <User className="w-4 h-4 text-zinc-300" />
          </div>
        </header>

        <main className="p-6 flex-1 bg-black overflow-y-auto">{children}</main>
      </div>

      {isPasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
}
