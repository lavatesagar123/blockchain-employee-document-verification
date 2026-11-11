import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading data...', minHeight = '240px' }) => {
  return (
    <div className="loading-state-container" style={{ minHeight }}>
      <Loader2 size={32} className="loading-spinner animate-spin" />
      <p className="loading-message">{message}</p>
    </div>
  );
};
