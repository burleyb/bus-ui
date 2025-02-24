import React from 'react';
// import { Timeline } from 'react-timeline-pro';

export default function TraceTimeline({ data, isLoading }) {
  if (isLoading) {
    return <div className="w-64 animate-pulse">Loading...</div>;
  }

  return (
    <div className="w-64 border-r">
      {/* <Timeline
        items={data?.map(event => ({
          id: event.id,
          content: event.type,
          start: new Date(event.timestamp),
          end: new Date(event.timestamp + event.duration),
          group: event.nodeId
        }))}
        groups={data?.reduce((acc, event) => {
          if (!acc.find(g => g.id === event.nodeId)) {
            acc.push({
              id: event.nodeId,
              content: event.nodeName
            });
          }
          return acc;
        }, [])}
        options={{
          height: '100%',
          verticalScroll: true,
        }}
      /> */}
    </div>
  );
}
