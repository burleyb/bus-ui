import React from 'react';

interface AWSLambdaIconProps {
  className?: string;
}

export const AWSLambdaIcon: React.FC<AWSLambdaIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      fill="none"
    >
      <path
        d="M9.798 13.358l-3.586 5.454h11.572l-2.37-5.454H9.798zm4.036-7.167l-2.54 5.457h5.4l-2.86-5.457zm-5.285 5.457l2.54-5.457h-5.43l-2.86 5.457h5.75z"
        fill="#FF9900"
        stroke="#FF9900"
        strokeWidth="0.5"
      />
    </svg>
  );
}; 