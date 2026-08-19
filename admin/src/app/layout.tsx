'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { ToastContainer } from '../components/ui/Toast';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Apex Coaching Institute | TuitionPro Platform</title>
        <meta name="description" content="Production-Ready Coaching & Tuition Management Platform" />
      </head>
      <body className="bg-black text-white antialiased">
        <Provider store={store}>
          {children}
          <ToastContainer />
        </Provider>
      </body>
    </html>
  );
}
