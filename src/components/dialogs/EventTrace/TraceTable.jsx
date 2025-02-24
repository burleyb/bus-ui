import React from 'react';
import NodeIcon from '../../common/NodeIcon';
import { formatTimestamp } from '../../../utils/format';

const TraceTable = ({ events }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Node</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Timestamp</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Duration</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {events.map((event, index) => (
          <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-4 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <NodeIcon type={event.nodeType} className="h-5 w-5 mr-2" />
                <span className="text-sm text-gray-900">{event.nodeName}</span>
              </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatTimestamp(event.timestamp)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
              {event.duration}ms
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${event.status === 'success' ? 'bg-green-100 text-green-800' : 
                event.status === 'error' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'}`}>
                {event.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
