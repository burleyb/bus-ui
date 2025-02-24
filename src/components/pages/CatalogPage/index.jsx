import React from 'react';
import { useData } from '../../../stores/DataContext';
import useNodeFilters from '../../hooks/useNodeFilters';
import CatalogList from './CatalogList';
import CatalogFilters from './CatalogFilters';

export default function CatalogPage() {
  const { nodes } = useData();
  const { filters, setFilters, filteredNodes } = useNodeFilters(nodes);

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <CatalogFilters filters={filters} onChange={setFilters} />
      <CatalogList nodes={filteredNodes} />
    </div>
  );
}
