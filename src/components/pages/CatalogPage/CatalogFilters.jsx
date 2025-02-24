import React from 'react';
import TagsInput from '../../../components/common/TagsInput';

export default function CatalogFilters({ filters, onChange }) {
  const handleTypeChange = (type) => {
    onChange({ ...filters, type });
  };

  const handleTagsChange = (tags) => {
    onChange({ ...filters, tags });
  };

  return (
    <div className="flex gap-4 items-center">
      <select
        value={filters.type}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="all">All Types</option>
        <option value="bot">Bots</option>
        <option value="queue">Queues</option>
        <option value="system">Systems</option>
      </select>
      <TagsInput
        value={filters.tags}
        onChange={handleTagsChange}
        placeholder="Filter by tags..."
      />
    </div>
  );
}
