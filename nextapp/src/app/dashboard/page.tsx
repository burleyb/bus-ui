'use client'
import DashboardPage from '@/components/dashboard/DashboardPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
} 