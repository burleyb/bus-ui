"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDialogs } from '@/hooks/useDialogs';
import { NodeData, Queue } from '@/types/node';
import NodeIcon from '../../node/NodeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

interface QueueEventData {
  id: string;
  name: string;
  type: string;
  counts: number[];
}

interface QueueEventsCardProps {
  title: string;
  queues: QueueEventData[];
  isLoading?: boolean;
  onClose?: () => void;
}

export default function QueueEventsCard({ title, queues, isLoading = false, onClose }: QueueEventsCardProps) {
  const router = useRouter();
  const { openNodeSettingsDialog } = useDialogs();

  // Handle clicking on a queue to view it in the workflow
  const handleViewQueueInWorkflow = (queueId: string) => {
    if (onClose) {
      onClose();
    }
    router.push(`/workflow?primaryNode=queue:${queueId}`);
  };

  // Handle opening the queue settings dialog
  const handleOpenQueueSettings = (queueId: string) => {
    if (onClose) {
      onClose();
    }
    openNodeSettingsDialog(`queue:${queueId}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : queues.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            No {title.toLowerCase()} found
          </div>
        ) : (
          <div className="overflow-auto max-h-[250px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="text-left py-2 font-medium">Queue</th>
                  <th className="text-center py-2 font-medium w-10">View</th>
                  <th className="text-right py-2 font-medium">Activity</th>
                  <th className="text-right py-2 font-medium">Events</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((queue) => (
                  <tr key={queue.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <NodeIcon node={{ type: 'queue' }} className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{queue.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <button
                        onClick={() => handleOpenQueueSettings(queue.id)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Open queue settings"
                      >
                        <NodeIcon node={{ type: 'queue' }} className="w-4 h-4 inline" />
                      </button>
                    </td>
                    <td className="py-2">
                      <div className="h-6 w-16 ml-auto">
                        {queue.counts.length > 0 ? (
                          <Sparklines data={queue.counts} height={20} margin={2}>
                            <SparklinesLine color="#3b82f6" />
                            <SparklinesSpots size={2} spotColors={{ '-1': '#ef4444', '0': '#22c55e', '1': '#3b82f6' }} />
                          </Sparklines>
                        ) : (
                          <div className="text-gray-400 text-center">No data</div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      {queue.counts.length > 0 
                        ? queue.counts.reduce((sum, count) => sum + count, 0).toLocaleString() 
                        : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 