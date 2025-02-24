import { useState, useMemo } from 'react';

export default function useNodeFilters(nodes) {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    tags: [],
    status: 'all'
  });

  const filteredNodes = useMemo(() => {
    return Object.values(nodes).filter(node => {
      if (filters.search && !node.label.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.type !== 'all' && node.type !== filters.type) {
        return false;
      }
      if (filters.tags.length && !filters.tags.some(tag => node.tags.includes(tag))) {
        return false;
      }
      if (filters.status !== 'all') {
        if (filters.status === 'active' && node.archived) return false;
        if (filters.status === 'archived' && !node.archived) return false;
      }
      return true;
    });
  }, [nodes, filters]);

  return { filters, setFilters, filteredNodes };
}
