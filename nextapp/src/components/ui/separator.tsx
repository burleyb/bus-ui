"use client";

import * as React from "react";

interface SeparatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const Separator: React.FC<SeparatorProps> = ({ 
  className = "", 
  orientation = "horizontal" 
}) => {
  return (
    <div
      className={`
        ${orientation === "horizontal" ? "h-px w-full" : "h-full w-px"} 
        bg-gray-200 dark:bg-gray-700 my-2
        ${className}
      `}
      role="separator"
    />
  );
};

export default Separator; 