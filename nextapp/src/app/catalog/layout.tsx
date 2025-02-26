import { ReactNode } from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
} 