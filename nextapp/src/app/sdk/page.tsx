'use client'
import SdkPage from '@/components/sdk/SdkPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function Sdk() {
  return (
    <ProtectedRoute>
      <SdkPage />
    </ProtectedRoute>
  );
} 