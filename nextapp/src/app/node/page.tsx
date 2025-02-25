'use client'
import NodeViewPage from '@/components/node/NodeViewPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function NodeView() {
  return (
    <ProtectedRoute>
      <NodeViewPage />
    </ProtectedRoute>
  );
} 