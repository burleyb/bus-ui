'use client'
import TracePage from '@/components/trace/TracePage';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function Trace() {
  return (
    <ProtectedRoute>
      <TracePage />
    </ProtectedRoute>
  );
} 