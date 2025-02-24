import React from 'react';
import TagsInput from '../../../components/common/TagsInput';

export default function DashboardFilters({ filters, onChange }) {
  return (
    <div className="flex gap-4 items-center">
      <select
        value={filters.nodeType}
        onChange={e => onChange({ ...filters, nodeType: e.target.value })}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="all">All Types</option>
        <option value="bot">Bots</option>
        <option value="queue">Queues</option>
        <option value="system">Systems</option>
      </select>

      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="error">Error</option>
      </select>

      <TagsInput
        value={filters.tags}
        onChange={tags => onChange({ ...filters, tags })}
        placeholder="Filter by tags..."
        className="flex-1"
      />
    </div>
  );
}
