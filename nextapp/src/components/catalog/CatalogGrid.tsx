"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridReadyEvent, 
  RowSelectedEvent, 
  CellClickedEvent,
  ModuleRegistry
} from 'ag-grid-community';
import { 
  ClientSideRowModelModule, 
  CsvExportModule, 
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule
} from 'ag-grid-enterprise';
import { useAppContext } from '@/context/AppContext';
import { useDialogs } from '@/hooks/useDialogs';
import { CatalogNodeItem, BulkAction } from '@/types/catalog';
import NodeIcon from '@/components/node/NodeIcon';
import { GitFork, BookIcon } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BulkActionsMenu from './BulkActionsMenu';

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CsvExportModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule
]);

// Node ID/Name Cell Renderer
const NodeCellRenderer = (props: any) => {
  const { data } = props;
  if (!data) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0">
        <NodeIcon 
          node={{ 
            id: data.id, 
            type: data.type, 
            status: data.status,
            archived: data.isArchived,
            paused: data.isPaused,
            isAlarmed: data.isAlarmed,
            health: data.health,
            icon: data.icon
          }} 
          size={48} 
        />
      </div>
      <div className="flex flex-col w-full">
        <span className="font-medium cursor-pointer hover:text-primary hover:underline">{data.name}</span>
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {data.tags.map((tag: string) => (
              <span 
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Workflow Link Cell Renderer
const WorkflowLinkRenderer = (props: any) => {
  const { data } = props;
  if (!data) return null;
  
  // Create a properly formatted workflow hash URL
  const createWorkflowHashUrl = (nodeId: string) => {
    // Create a date range for the last 15 minutes
    const end = new Date();
    const begin = new Date(end.getTime() - 15 * 60 * 1000); // 15 minutes ago
    
    // Create the URL hash object
    const hashObj = {
      selected: [nodeId],
      view: "node",
      timePeriod: {
        interval: "minute_15",
        begin: begin.toISOString(),
        end: end.toISOString()
      },
      offset: [0, 0],
      node: nodeId
    };
    
    // Convert to JSON and encode for URL
    return `/workflow#${encodeURIComponent(JSON.stringify(hashObj))}`;
  };

  return (
    <a 
      href={createWorkflowHashUrl(data.id)}
      className="flex items-center justify-center h-full w-full text-primary hover:text-primary/80"
      title="View in workflow"
    >
        <div style={{ transform: 'rotate(90deg)' }}>
            <GitFork size={18} />
        </div>
    </a>
  );
};

// Number Cell Renderer
const NumberCellRenderer = (props: any) => {
  const { value } = props;
  if (value === undefined || value === null) return null;
  
  return (
    <div className="text-right">
      {value.toLocaleString()}
    </div>
  );
};

// Interface for component props
interface CatalogGridProps {
  showQueues: boolean;
  showBots: boolean;
  showSystems: boolean; 
  showArchived: boolean;
  pauseFilter: 'all' | 'paused' | 'unpaused';
  searchText: string;
  selectedTags: string[];
  onSelectionChanged?: (selectedNodes: CatalogNodeItem[]) => void;
  onBulkAction?: (action: BulkAction, selectedNodes: CatalogNodeItem[]) => void;
}

const CatalogGrid: React.FC<CatalogGridProps> = ({
  showQueues = true,
  showBots = true,
  showSystems = true,
  showArchived = false,
  pauseFilter = 'all',
  searchText = '',
  selectedTags = [],
  onSelectionChanged,
  onBulkAction
}) => {
  const [rowData, setRowData] = useState<CatalogNodeItem[]>([]);
  const [filteredData, setFilteredData] = useState<CatalogNodeItem[]>([]);
  const [typeCounts, setTypeCounts] = useState({ bot: 0, queue: 0, system: 0 });
  const [selectedNodes, setSelectedNodes] = useState<CatalogNodeItem[]>([]);
  
  const { state } = useAppContext();
  const { openNodeSettingsDialog } = useDialogs();
  const gridRef = useRef<AgGridReact>(null);
  
  // Define column definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    { 
      field: 'name', 
      headerName: 'Name',
      cellRenderer: NodeCellRenderer,
      filter: true,
      sortable: true,
      flex: 2,
      minWidth: 200,
      headerCheckboxSelection: true,
      checkboxSelection: true
    },
    {
      field: 'workflowLink',
      headerName: '',
      cellRenderer: WorkflowLinkRenderer,
      width: 60,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'lastAction',
      headerName: 'Last Action',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150
    },
    {
      field: 'errorCount',
      headerName: '# Errors',
      cellRenderer: NumberCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 120
    },
    {
      field: 'readCount',
      headerName: '# Reads',
      cellRenderer: NumberCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 120
    },
    {
      field: 'writeCount',
      headerName: '# Writes',
      cellRenderer: NumberCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 120
    },
    {
      field: 'executionCount',
      headerName: '# Executions',
      cellRenderer: NumberCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 120
    },
    {
      field: 'sourceLag',
      headerName: 'Source Lag',
      cellRenderer: NumberCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 120
    },
    {
      field: 'writeLag',
      headerName: 'Write Lag',
      cellRenderer: NumberCellRenderer,
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 120
    }
  ], []);

  // Grid options
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
      sortable: true,
      resizable: true,
    };
  }, []);

  // Add gridOptions for row selection
  const gridOptions = useMemo(() => {
    return {
      rowSelection: 'multiple' as const,
      rowMultiSelectWithClick: true,
      maintainScrollPosition: true,
      getRowId: (params: any) => {
        return params.data.id;
      }
    };
  }, []);

  // Process data from the state into the format for AG Grid
  useEffect(() => {
    if (!state.nodes) return;

    const processedData: CatalogNodeItem[] = Object.values(state.nodes).map((node: any) => {
      // Extract the name part (everything after the colon)
      const idParts = node.id.split(':');
      const name = idParts.length > 1 ? idParts.slice(1).join(':') : node.id;
      const type = idParts[0] === 'bot' || idParts[0] === 'queue' || idParts[0] === 'system' 
        ? idParts[0] 
        : 'bot';

      return {
        id: node.id,
        type: type as 'bot' | 'queue' | 'system',
        name,
        tags: node.tags || [],
        status: node.status,
        lastAction: node.lastAction || 'N/A',
        errorCount: node.stats?.errorCount || 0,
        readCount: node.stats?.readCount || 0,
        writeCount: node.stats?.writeCount || 0,
        executionCount: type === 'bot' ? (node.stats?.executionCount || 0) : undefined,
        sourceLag: node.stats?.sourceLag || 0,
        writeLag: node.stats?.writeLag || 0,
        isArchived: node.archived || node.status === 'archived',
        isPaused: node.paused || node.status === 'paused',
        isAlarmed: node.isAlarmed,
        health: node.health,
        icon: node.icon,
        description: node.description
      };
    });

    setRowData(processedData);
  }, [state.nodes]);

  // Apply filtering based on props
  useEffect(() => {
    if (!rowData.length) return;

    const filtered = rowData.filter(node => {
      // Filter by type
      if (node.type === 'bot' && !showBots) return false;
      if (node.type === 'queue' && !showQueues) return false;
      if (node.type === 'system' && !showSystems) return false;
      
      // Filter archived nodes
      if (node.isArchived && !showArchived) return false;
      
      // Filter based on pause status
      if (pauseFilter !== 'all' && node.type === 'bot') {
        if (pauseFilter === 'paused' && !node.isPaused) return false;
        if (pauseFilter === 'unpaused' && node.isPaused) return false;
      }
      
      // Search filter - check both name and tags
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        // Check if search term is in name or in any of the tags
        const nameMatch = node.name.toLowerCase().includes(searchLower);
        const tagMatch = node.tags && node.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!nameMatch && !tagMatch) {
          return false;
        }
      }
      
      // Tag filter
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(tag => node.tags.includes(tag));
        if (!hasTag) return false;
      }
      
      return true;
    });

    setFilteredData(filtered);
    
    // Update type counts
    setTypeCounts({
      bot: filtered.filter(node => node.type === 'bot').length,
      queue: filtered.filter(node => node.type === 'queue').length,
      system: filtered.filter(node => node.type === 'system').length
    });
  }, [rowData, showBots, showQueues, showSystems, showArchived, pauseFilter, searchText, selectedTags]);

  // Handle cell click - open node settings dialog when clicking on the name cell
  const handleCellClicked = useCallback((event: CellClickedEvent) => {
    if (event.column.getColId() === 'name') {
      openNodeSettingsDialog(event.data.id);
    }
  }, [openNodeSettingsDialog]);

  // Handle selection changes
  const handleSelectionChanged = useCallback(() => {
    const selectedRows = gridRef.current!.api.getSelectedRows();
    console.log('Selected rows:', selectedRows);
    setSelectedNodes(selectedRows);
    
    if (onSelectionChanged) {
      onSelectionChanged(selectedRows);
    }
  }, [onSelectionChanged]);

  // Grid ready handler
  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  // Define sample data for testing (replace with actual API data in production)
  const sampleData: CatalogNodeItem[] = [
    { 
      id: '1', 
      name: 'Order Processing Queue', 
      type: 'queue', 
      lastAction: '2023-12-01T14:30:00Z',
      errorCount: 12,
      readCount: 15042,
      writeCount: 14980,
      sourceLag: 5,
      writeLag: 3,
      tags: ['orders', 'processing', 'customer'],
      status: 'running',
      isArchived: false,
      isPaused: false,
      isAlarmed: false,
      health: { status: 'healthy' },
      description: 'Main queue for order processing',
      icon: 'queue'
    },
    { 
      id: '2', 
      name: 'Payment Verification Bot', 
      type: 'bot', 
      lastAction: '2023-12-02T11:15:00Z',
      errorCount: 3,
      readCount: 8732,
      writeCount: 8729,
      executionCount: 8735,
      sourceLag: 2,
      writeLag: 1,
      tags: ['payments', 'verification'],
      status: 'running',
      isArchived: false,
      isPaused: false,
      isAlarmed: false,
      health: { status: 'healthy' },
      description: 'Bot that verifies payment details',
      icon: 'bot'
    },
    { 
      id: '3', 
      name: 'Shipping System', 
      type: 'system', 
      lastAction: '2023-12-03T09:45:00Z',
      errorCount: 43,
      readCount: 12543,
      writeCount: 12500,
      sourceLag: 15,
      writeLag: 8,
      tags: ['shipping', 'logistics'],
      status: 'running',
      isArchived: false,
      isPaused: false,
      isAlarmed: true,
      health: { status: 'warning' },
      description: 'System that handles shipping logistics',
      icon: 'system'
    },
    { 
      id: '4', 
      name: 'Legacy Notification Service', 
      type: 'bot', 
      lastAction: '2023-11-20T16:30:00Z',
      errorCount: 13,
      readCount: 5423,
      writeCount: 5410,
      executionCount: 5430,
      sourceLag: 0,
      writeLag: 0,
      tags: ['notifications', 'legacy'],
      status: 'paused',
      isArchived: true,
      isPaused: true,
      isAlarmed: false,
      health: { status: 'offline' },
      description: 'Legacy service for sending notifications',
      icon: 'bot'
    },
    // Add more sample data as needed
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-4 py-3 flex flex-row justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {rowData.length} items
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900">
              Bots: {typeCounts.bot}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900">
              Queues: {typeCounts.queue}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">
              Systems: {typeCounts.system}
            </Badge>
          </div>
        </div>
        
        {selectedNodes.length > 0 ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10">
              {selectedNodes.length} items selected
            </Badge>
            <BulkActionsMenu
              selectedNodes={selectedNodes}
              onAction={(action) => onBulkAction?.(action, selectedNodes)}
            />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-0 flex-grow min-h-0">
        <div className="ag-theme-alpine h-full w-full dark:ag-theme-alpine-dark border-t border-border ag-custom-hover">
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            rowSelection="multiple"
            onGridReady={onGridReady}
            onCellClicked={handleCellClicked}
            onSelectionChanged={handleSelectionChanged}
            gridOptions={gridOptions}
            rowHeight={80}
            animateRows={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CatalogGrid; 