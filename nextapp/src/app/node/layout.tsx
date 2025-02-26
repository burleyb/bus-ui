import { ReactNode } from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function NodeViewLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
} 