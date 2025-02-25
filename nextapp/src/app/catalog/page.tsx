'use client'
import CatalogPage from '@/components/catalog/CatalogPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function Catalog() {
  return (
    <ProtectedRoute>
      <CatalogPage />
    </ProtectedRoute>
  );
} 