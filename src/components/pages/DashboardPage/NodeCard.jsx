import React from 'react';
import { useNavigate } from 'react-router-dom';
import NodeIcon from '../../../components/common/NodeIcon';
import NodeMetrics from '../../../components/common/NodeMetrics';
import NodeStatus from '../../../components/common/NodeStatus';

export default function NodeCard({ node, style }) {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
      style={style}
      onClick={() => navigate(`/workflow/${node.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NodeIcon type={node.type} status={node.status} />
          <div>
            <h3 className="font-medium">{node.label}</h3>
            <p className="text-sm text-gray-500">{node.description}</p>
          </div>
        </div>
        <NodeStatus status={node.status} />
      </div>

      <div className="mt-4">
        <NodeMetrics metrics={node.metrics} />
      </div>

      {node.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {node.tags.map(tag => (
            <span 
              key={tag}
              className="px-2 py-1 bg-gray-100 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
