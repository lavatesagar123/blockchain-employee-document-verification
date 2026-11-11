import React from 'react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';

export const ErrorState = ({
  title = 'Backend Connection Unavailable',
  message = null,
  onRetry = null,
  retrying = false,
  isNetworkError = true,
  className = ''
}) => {
  const defaultMsg = isNetworkError
    ? `Unable to connect to the backend API at ${API_BASE_URL}. Ensure your Django REST Framework server is running (e.g. python manage.py runserver).`
    : 'An error occurred while loading data from the server.';

  return (
    <div className={`error-state-card ${className}`}>
      <div className="error-state-icon-wrap">
        {isNetworkError ? <WifiOff size={36} /> : <AlertCircle size={36} />}
      </div>
      <h4 className="error-state-title">{title}</h4>
      <p className="error-state-description">{message || defaultMsg}</p>

      <div className="error-state-server-badge">
        <span>Target API:</span>
        <code>{API_BASE_URL}</code>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="btn btn-outline-emerald btn-sm"
          style={{ marginTop: '1rem' }}
        >
          <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
          <span>{retrying ? 'Connecting...' : 'Retry Connection'}</span>
        </button>
      )}
    </div>
  );
};
