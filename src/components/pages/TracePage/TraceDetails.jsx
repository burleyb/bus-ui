import React from 'react';
import { formatDuration } from '../../../utils/format';

export default function TraceDetails({ data, isLoading }) {
  if (isLoading) {
    return <div className="flex-1 animate-pulse">Loading...</div>;
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select an event to view details
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Event Details</h3>
          <dl className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">ID</dt>
              <dd className="text-sm font-medium">{data.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Type</dt>
              <dd className="text-sm font-medium">{data.type}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Duration</dt>
              <dd className="text-sm font-medium">{formatDuration(data.duration)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="text-sm font-medium">{data.status}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-medium">Payload</h3>
          <pre className="mt-2 p-4 bg-gray-50 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(data.payload, null, 2)}
          </pre>
        </div>

        {data.error && (
          <div>
            <h3 className="text-lg font-medium text-red-600">Error</h3>
            <pre className="mt-2 p-4 bg-red-50 text-red-700 rounded-lg overflow-auto">
              {data.error.stack || data.error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
