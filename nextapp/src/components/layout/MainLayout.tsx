"use client";

import React, { ReactNode } from 'react';
import Navigation from './Navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import InitGuard from '@/components/auth/InitGuard';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <InitGuard
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Initializing Application
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we set up the required services...
            </p>
          </div>
        </div>
      }
    >
      <AuthGuard
        fallback={
          <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Authentication Required
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Please log in to access this application.
              </p>
            </div>
          </div>
        }
      >
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
          <Navigation />
          
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </AuthGuard>
    </InitGuard>
  );
} 