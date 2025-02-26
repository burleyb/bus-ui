"use client";

import React, { useState } from 'react';
import { RefreshCw, ChevronRight, ChevronDown, X, PlusCircle } from 'lucide-react';

interface QueueEventsTabProps {
  nodeData: any;
}

const QueueEventsTab: React.FC<QueueEventsTabProps> = ({ nodeData }) => {
  const [expandedEventIds, setExpandedEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventData, setNewEventData] = useState('{\n  "type": "custom",\n  "data": {\n    \n  }\n}');
  
  // Mock events data if not provided in nodeData
  const events = nodeData.events || [
    {
      id: 'evt-12345',
      timestamp: new Date().toISOString(),
      type: 'user.created',
      status: 'pending',
      data: { userId: 'user-123', name: 'John Doe', email: 'john@example.com' }
    },
    {
      id: 'evt-12346',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'order.placed',
      status: 'processing',
      data: { orderId: 'order-456', items: 3, total: 99.99 }
    },
    {
      id: 'evt-12347',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'payment.confirmed',
      status: 'completed',
      data: { paymentId: 'pay-789', method: 'credit_card', amount: 99.99 }
    }
  ];
  
  const toggleEventExpanded = (eventId: string) => {
    setExpandedEventIds(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };
  
  const refreshEvents = () => {
    setLoading(true);
    // In a real implementation, this would fetch the latest events
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };
  
  const handleAddEvent = () => {
    // In a real implementation, this would add a new event to the queue
    try {
      JSON.parse(newEventData); // Validate that it's valid JSON
      alert('Event added to queue');
      setShowAddEvent(false);
      setNewEventData('{\n  "type": "custom",\n  "data": {\n    \n  }\n}');
    } catch (error) {
      alert("Invalid JSON: " + (error as Error).message);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Recent Events
        </h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowAddEvent(!showAddEvent)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium 
                     rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100
                     dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            <PlusCircle size={14} className="mr-1" />
            Add Event
          </button>
          <button
            type="button"
            onClick={refreshEvents}
            disabled={loading}
            className="inline-flex items-center px-2 py-1 text-xs font-medium 
                     rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200
                     dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {showAddEvent && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Event</h4>
            <button
              type="button"
              onClick={() => setShowAddEvent(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
          
          <textarea
            value={newEventData}
            onChange={(e) => setNewEventData(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                     bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={8}
            placeholder="Enter event data as JSON"
          />
          
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleAddEvent}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium 
                       rounded-md bg-blue-600 text-white hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add to Queue
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-md">
        {events.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event: any) => (
              <li key={event.id} className="block hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleEventExpanded(event.id)}
                      className="flex items-center text-left text-sm font-medium text-blue-600 hover:text-blue-800 
                               dark:text-blue-400 dark:hover:text-blue-300 w-full"
                    >
                      {expandedEventIds.includes(event.id) ? (
                        <ChevronDown size={16} className="mr-1 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="mr-1 flex-shrink-0" />
                      )}
                      <span className="font-mono">{event.id}</span>
                    </button>
                    <div className="ml-2 flex flex-shrink-0">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {event.type}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                      <p>
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {expandedEventIds.includes(event.id) && (
                    <div className="mt-3">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                        <pre className="text-xs overflow-auto font-mono text-gray-800 dark:text-gray-200">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-2 py-1 text-xs font-medium 
                                   rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100
                                   dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        >
                          Replay
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-2 py-1 text-xs font-medium 
                                   rounded-md bg-red-50 text-red-700 hover:bg-red-100
                                   dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 px-4 text-gray-500 dark:text-gray-400">
            <p>No events in queue</p>
            <p className="text-sm mt-1">Events will appear here once they are added to the queue</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Showing {events.length} of {nodeData.length || events.length} events</span>
        {events.length > 0 && (
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View All
          </button>
        )}
      </div>
    </div>
  );
};

export default QueueEventsTab; 