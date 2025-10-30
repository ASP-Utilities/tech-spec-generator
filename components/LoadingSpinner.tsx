
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-300"></div>
    </div>
  );
};
