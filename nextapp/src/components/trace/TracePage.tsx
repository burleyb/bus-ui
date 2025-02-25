'use client'
import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useLogs } from '@/hooks/useQueries';
import moment from 'moment';

export default function TracePage() {
  const { selected, timePeriod } = useData();
  const [traceId, setTraceId] = useState('');
  const [customTimeFrame, setCustomTimeFrame] = useState<{ begin: string; end: string } | undefined>(
    timePeriod.begin && timePeriod.end 
      ? { begin: timePeriod.begin, end: timePeriod.end }
      : undefined
  );
  
  // Use the first selected bot for logs if available
  const botId = selected.length > 0 ? selected[0] : '';
  const { data: logs, isLoading } = useLogs(botId, customTimeFrame);

  const handleTraceSearch = () => {
    // In a real implementation, this would trigger a search for the specific trace ID
    console.log('Searching for trace:', traceId);
  };

  const handleTimeFrameChange = (range: string) => {
    let begin: string;
    let end = moment().toISOString();
    
    switch (range) {
      case 'hour':
        begin = moment().subtract(1, 'hour').toISOString();
        break;
      case 'day':
        begin = moment().subtract(1, 'day').toISOString();
        break;
      case 'week':
        begin = moment().subtract(1, 'week').toISOString();
        break;
      case 'month':
        begin = moment().subtract(1, 'month').toISOString();
        break;
      default:
        begin = moment().subtract(1, 'hour').toISOString();
    }
    
    setCustomTimeFrame({ begin, end });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Trace</h1>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="traceId" className="block text-sm font-medium text-gray-700 mb-1">
            Trace ID
          </label>
          <div className="flex">
            <input
              type="text"
              id="traceId"
              placeholder="Enter trace ID..."
              value={traceId}
              onChange={(e) => setTraceId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleTraceSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Range
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleTimeFrameChange('hour')}
              className={`px-3 py-2 text-sm rounded-md ${
                customTimeFrame && moment().diff(moment(customTimeFrame.begin), 'hours') === 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last Hour
            </button>
            <button
              onClick={() => handleTimeFrameChange('day')}
              className={`px-3 py-2 text-sm rounded-md ${
                customTimeFrame && moment().diff(moment(customTimeFrame.begin), 'days') === 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last Day
            </button>
            <button
              onClick={() => handleTimeFrameChange('week')}
              className={`px-3 py-2 text-sm rounded-md ${
                customTimeFrame && moment().diff(moment(customTimeFrame.begin), 'weeks') === 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last Week
            </button>
          </div>
        </div>
      </div>

      {!botId && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please select a bot from the sidebar to view its logs.
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : logs && logs.events && logs.events.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trace ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.events.map((event, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(event.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        event.type === 'error' ? 'bg-red-100 text-red-800' : 
                        event.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.traceId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => {
                          // In a real implementation, this would show event details
                          console.log('Event details:', event);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          {botId ? 'No events found for the selected time range.' : 'Select a bot to view events.'}
        </div>
      )}
    </div>
  );
} 