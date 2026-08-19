'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/shared/Sidebar';
import { Header } from '../../components/shared/Header';
import { useAppSelector } from '../../redux/store';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Auth Guard: If not logged in, redirect to /login
    if (!token && !isAuthenticated) {
      router.replace('/login');
    } else if (user && user.role === 'STUDENT') {
      // Students redirected out of Admin portal
      router.replace('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [token, isAuthenticated, user, router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <p className="text-xs text-zinc-400">Verifying session security clearance...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="p-4 md:p-6 flex-1 bg-black overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
