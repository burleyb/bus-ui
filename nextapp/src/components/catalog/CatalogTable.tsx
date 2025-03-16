"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  VisibilityState,
  ColumnResizeMode,
  Header as TanstackHeader,
} from '@tanstack/react-table';
import { useAppContext } from '@/context/AppContext';
import { useDialogs } from '@/hooks/useDialogs';
import { CatalogNodeItem, BulkAction } from '@/types/catalog';
import NodeIcon from '@/components/node/NodeIcon';
import { GitFork, ArrowUpDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BulkActionsMenu from './BulkActionsMenu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

// Sortable column header component
interface SortableHeaderProps {
  column: any;
  title: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ column, title }) => {
  return (
    <div className="flex items-center justify-center space-x-1">
      <span>{title}</span>
      <ArrowUpDown 
        className="ml-1 h-4 w-4 cursor-pointer opacity-50 hover:opacity-100" 
        onClick={() => column.toggleSorting()}
      />
    </div>
  );
};

// Node Name Cell Component with Icon
const NodeNameCell = ({ row }: { row: any }) => {
  const data = row.original;
  
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

// Function to format lag time in a human-readable format
const formatLagTime = (duration: number | undefined | null): string => {
  if (duration === undefined || duration === null || duration === 0) return '0';
  return moment.duration(duration).humanize();
};

// Function to format date time
const formatDateTime = (timestamp: string | number | null | undefined): string => {
  if (timestamp === undefined || timestamp === null || timestamp === 'N/A') return 'N/A';
  // Ensure we don't try to format objects
  if (typeof timestamp === 'object') return 'N/A';
  return moment(timestamp).format('MMM D, YYYY h:mm A');
};

// Workflow Link Cell Component
const WorkflowLinkCell = ({ row }: { row: any }) => {
  const data = row.original;
  
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
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ transform: 'rotate(90deg)' }}>
        <GitFork size={18} />
      </div>
    </a>
  );
};

// Interface for component props
interface CatalogTableProps {
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

const CatalogTable: React.FC<CatalogTableProps> = ({
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [visibleRowLimit, setVisibleRowLimit] = useState(100);
  
  const { state } = useAppContext();
  const { openNodeSettingsDialog } = useDialogs();
  
  // Define column definitions
  const columns = useMemo<ColumnDef<CatalogNodeItem>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              // Toggle all rows in the table
              table.toggleAllPageRowsSelected(!!value);
              
              // Update our direct tracking of selected nodes
              if (value) {
                // Select all visible rows
                const allRowIds = table.getRowModel().rows.map(r => r.original.id);
                setSelectedNodeIds(allRowIds);
                console.log("Selected all rows:", allRowIds.length);
              } else {
                // Deselect all
                setSelectedNodeIds([]);
                console.log("Deselected all rows");
              }
            }}
            aria-label="Select all"
            className="h-5 w-5 border-2 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div 
          className="flex justify-center items-center" 
          onClick={(e) => {
            e.stopPropagation();
            handleRowSelectionToggle(row, !row.getIsSelected());
          }}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              handleRowSelectionToggle(row, !!value);
            }}
            aria-label="Select row"
            className="h-5 w-5 border-2 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 50,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => <NodeNameCell row={row} />,
      enableSorting: true,
      enableResizing: true,
      size: 300,
    },
    {
      id: 'workflowLink',
      header: '',
      cell: ({ row }) => <WorkflowLinkCell row={row} />,
      enableSorting: false,
      enableResizing: false,
      size: 60,
    },
    {
      accessorKey: 'lastAction',
      header: ({ column }) => <SortableHeader column={column} title="Last Action" />,
      cell: ({ row }) => {
        // Get the value and handle empty objects safely
        const rawValue = row.getValue('lastAction');
        let value: string | number | null | undefined = null;
        
        // Check if it's a simple value we can use
        if (rawValue === null || rawValue === undefined || rawValue === 'N/A') {
          value = 'N/A';
        } else if (typeof rawValue !== 'object') {
          value = rawValue as string | number;
        } else {
          value = 'N/A'; // For object values
        }
        
        return (
          <div className="text-center">
            {value !== 'N/A' ? formatDateTime(value) : 'N/A'}
          </div>
        );
      },
      enableSorting: true,
      enableResizing: true,
      size: 150,
    },
    {
      accessorKey: 'errorCount',
      header: ({ column }) => <SortableHeader column={column} title="# Errors" />,
      cell: ({ row }) => {
        const value = row.getValue('errorCount');
        return (
          <div className="text-center">
            {value !== undefined && value !== null ? Number(value).toLocaleString() : '0'}
          </div>
        );
      },
      enableSorting: true,
      enableResizing: true,
      size: 100,
    },
    {
      accessorKey: 'readCount',
      header: ({ column }) => <SortableHeader column={column} title="# Reads" />,
      cell: ({ row }) => {
        const value = row.getValue('readCount');
        return (
          <div className="text-center">
            {value !== undefined && value !== null ? Number(value).toLocaleString() : '0'}
          </div>
        );
      },
      enableSorting: true,
      enableResizing: true,
      size: 100,
    },
    {
      accessorKey: 'writeCount',
      header: ({ column }) => <SortableHeader column={column} title="# Writes" />,
      cell: ({ row }) => {
        const value = row.getValue('writeCount');
        return (
          <div className="text-center">
            {value !== undefined && value !== null ? Number(value).toLocaleString() : '0'}
          </div>
        );
      },
      enableSorting: true,
      enableResizing: true,
      size: 100,
    },
    {
      accessorKey: 'executionCount',
      header: ({ column }) => <SortableHeader column={column} title="# Executions" />,
      cell: ({ row }) => {
        const value = row.getValue('executionCount');
        // Don't display executions for queues
        if (row.original.type !== 'bot') return null;
        return (
          <div className="text-center">
            {value !== undefined && value !== null ? Number(value).toLocaleString() : '0'}
          </div>
        );
      },
      enableSorting: true,
      enableResizing: true,
      size: 100,
    },
    {
      accessorKey: 'sourceLag',
      header: ({ column }) => <SortableHeader column={column} title="Source Lag" />,
      cell: ({ row }) => {
        // Get the value and handle empty objects safely
        const rawValue = row.getValue('sourceLag');
        let value: number | null = null;
        
        // Check if it's a number or can be converted to one
        if (rawValue === null || rawValue === undefined) {
          value = 0;
        } else if (typeof rawValue !== 'object') {
          value = Number(rawValue);
        } else {
          value = 0; // For object values
        }
        
        return (
          <div className="text-center">
            {formatLagTime(value)}
          </div>
        );
      },
      enableSorting: true,
      enableResizing: true,
      size: 100,
    },
    {
      accessorKey: 'writeLag',
      header: ({ column }) => <SortableHeader column={column} title="Write Lag" />,
      cell: ({ row }) => {
        // Get the value and handle empty objects safely
        const rawValue = row.getValue('writeLag');
        let value: number | null = null;
        
        // Check if it's a number or can be converted to one
        if (rawValue === null || rawValue === undefined) {
          value = 0;
        } else if (typeof rawValue !== 'object') {
          value = Number(rawValue);
        } else {
          value = 0; // For object values
        }
        
        return (
          <div className="text-center">
            {formatLagTime(value)}
          </div>
        );
      },
      enableSorting: true,
      enableResizing: true,
      size: 100,
    },
  ], []);

  // Process data from the state into the format for the table
  useEffect(() => {
    if (!state.nodes) return;
    
    const processedData: CatalogNodeItem[] = Object.values(state.nodes).map((node: any) => {
      // Extract the name part (everything after the colon)
      const idParts = node.id.split(':');
      const name = idParts.length > 1 ? idParts.slice(1).join(':') : node.id;
      const type = idParts[0] === 'bot' || idParts[0] === 'queue' || idParts[0] === 'system' 
        ? idParts[0] 
        : 'bot';
      
      // Handle potential deep nesting of stats
      const stats = typeof node.stats === 'object' ? node.stats : {};
      
      return {
        id: node.id,
        type: type as 'bot' | 'queue' | 'system',
        name,
        tags: node.tags || [],
        status: node.status,
        lastAction: node?.last_run?.start || 'N/A',
        errorCount: node.errors ?? 0,
        readCount: node?.queues?.read?.count ?? node?.readCount ?? 0,
        writeCount: node?.queues?.write?.count ?? node?.writeCount ?? 0,
        executionCount: type === 'bot' ? (node.executions ?? 0) : undefined,
        sourceLag: node?.queues?.read?.last_read_lag ?? 0,
        writeLag: node?.queues?.write?.last_write_lag ?? 0,
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

  // Modify the filteredData to respect the visible row limit
  const limitedVisibleRows = useMemo(() => {
    return filteredData.slice(0, visibleRowLimit);
  }, [filteredData, visibleRowLimit]);

  // Update the table configuration to use the limited rows
  const table = useReactTable({
    data: limitedVisibleRows,
    columns,
    state: {
      rowSelection,
      columnFilters,
      sorting,
      columnVisibility,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode,
    onRowSelectionChange: (updatedRowSelection) => {
      console.log("Row selection changed to:", updatedRowSelection);
      setRowSelection(updatedRowSelection);
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: 1,
  });

  // Handle click on cell - open node settings dialog when clicking on name cell
  const handleCellClick = useCallback((e: React.MouseEvent, row: any, columnId: string) => {
    if (columnId === 'name') {
      openNodeSettingsDialog(row.original.id);
    }
  }, [openNodeSettingsDialog]);

  // Replace the simplified handling with a more robust approach
  const handleRowSelectionToggle = useCallback((row: any, value: boolean) => {
    console.log(`Toggling row selection for row ID: ${row.id}, new value: ${value}`);
    
    // Update both TanStack's selection state and our direct tracking
    row.toggleSelected(value);
    
    // Update our direct tracking of selected nodes
    setSelectedNodeIds(prev => {
      const nodeId = row.original.id;
      
      if (value && !prev.includes(nodeId)) {
        return [...prev, nodeId];
      } else if (!value && prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      }
      
      return prev;
    });
    
    console.log(`Row selection state after toggle:`, row.getIsSelected());
  }, []);

  // Get all selected rows for bulk actions with improved logic
  const selectedNodes = useMemo(() => {
    // Use our direct tracking of selected nodes for more reliability
    console.log(`Using selectedNodeIds: ${selectedNodeIds.length}`, selectedNodeIds);
    
    // Map the selected node IDs to the actual node objects
    const selectedItems = filteredData.filter(node => {
      return selectedNodeIds.includes(node.id);
    });
    
    console.log(`Selected nodes after filtering: ${selectedItems.length}`, selectedItems);
    
    return selectedItems;
  }, [filteredData, selectedNodeIds]);

  // Update the effect that triggers onSelectionChanged
  useEffect(() => {
    if (!onSelectionChanged) return;
    onSelectionChanged(selectedNodes);
  }, [selectedNodes, onSelectionChanged]);

  // Remove debugging code that slows down the application
  useEffect(() => {
    // Add scroll event listener to handle header appearance
    const handleScroll = () => {
      const tableContainer = document.querySelector('.table-container');
      const header = document.querySelector('.table-header');
      
      if (tableContainer && header) {
        if (tableContainer.scrollTop > 0) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      }
    };
    
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      return () => {
        tableContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
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
        
        <div className="flex items-center gap-2">


          {selectedNodes.length > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10">
                {selectedNodes.length} item{selectedNodes.length !== 1 ? 's' : ''} selected
              </Badge>
              <div className="relative z-50">
                {(() => { console.log("*** DEBUG: Rendering BulkActionsMenu with selectedNodes:", selectedNodes); return null; })()}
                <BulkActionsMenu
                  selectedNodes={selectedNodes}
                  onAction={(action) => {
                    console.log("Bulk action triggered:", action);
                    if (onBulkAction) {
                      onBulkAction(action, selectedNodes);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Select items to perform bulk actions</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden relative h-full">
        <div className="absolute inset-0 border-t border-border flex flex-col">
          <div className="overflow-auto flex-1 table-container">
            <Table className="w-full table-fixed">
              <TableHeader className="sticky top-0 z-20 shadow-sm table-header transition-shadow duration-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-card border-b border-border">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id}
                        style={{ 
                          width: header.getSize(), 
                          position: 'relative',
                        }}
                        className="px-4 py-2 select-none bg-card backdrop-blur-sm bg-opacity-90"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-primary/40 hover:w-4 ${
                              header.column.getIsResizing() ? 'bg-primary/60 w-4' : 'bg-transparent'
                            }`}
                            title="Resize column"
                          />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : ""}
                      className="h-20 cursor-pointer" 
                      onClick={(e) => {
                        console.log(`Row clicked: ${row.id}, current selection state: ${row.getIsSelected()}`);
                        handleRowSelectionToggle(row, !row.getIsSelected());
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className="px-4 py-2"
                          onClick={(e) => {
                            if (cell.column.id === 'select' || cell.column.id === 'name') {
                              e.stopPropagation();
                              if (cell.column.id === 'name') {
                                handleCellClick(e, row, cell.column.id);
                              }
                            }
                          }}
                          style={{
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filteredData.length > visibleRowLimit && (
              <div className="p-4 flex justify-center border-t border-border bg-card">
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  onClick={() => setVisibleRowLimit(prev => prev + 100)}
                >
                  Load More ({visibleRowLimit} of {filteredData.length} rows loaded)
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CatalogTable; 