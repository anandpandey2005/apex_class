'use client';

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppSelector } from '../redux/store';
import { ToastContainer } from '../components/ui/Toast';
import { StudentSidebar } from '../components/shared/StudentSidebar';
import { StudentHeader } from '../components/shared/StudentHeader';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Student Portal | Apex Coaching Institute</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="Dedicated Student Portal for Tuition Management" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="bg-black text-white antialiased">
        <Provider store={store}>
          <MainContent>{children}</MainContent>
          <ToastContainer />
        </Provider>
      </body>
    </html>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoginPage && !token && !isAuthenticated) {
      router.replace('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [isLoginPage, token, isAuthenticated, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <p className="text-xs text-zinc-400">Verifying student security clearance...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <StudentSidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="p-4 md:p-6 flex-1 bg-black overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
