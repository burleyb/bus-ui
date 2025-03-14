"use client";

import React from 'react';
import { Suspense } from 'react';
import TracePage from '@/components/trace/TracePage';

export default function TracePageContainer() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<div className="h-screen bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
        <TracePage />
      </Suspense>
    </div>
  );
} 