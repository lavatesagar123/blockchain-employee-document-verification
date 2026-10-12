import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Home } from 'lucide-react';
import '../styles/dashboard.css';

export const NotFoundPage = () => {
  return (
    <div className="standalone-error-container">
      <div className="error-card-box animate-fade-in">
        <div className="error-icon-shield" style={{ background: '#f1f5f9', borderColor: '#cbd5e1', color: '#64748b' }}>
          <SearchX size={48} />
        </div>

        <h2>Page Not Found</h2>

        <p>
          The page or blockchain resource you are looking for does not exist or may have been relocated.
        </p>

        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Go to Home
        </Link>
      </div>
    </div>
  );
};
