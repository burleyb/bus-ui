import React from 'react';

const severityClasses = {
  low: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800'
};

const AlertBadge = ({ count, severity = 'low', onClick }) => {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`${severityClasses[severity]} 
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
    >
      {count}
    </button>
  );
};