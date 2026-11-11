import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { SearchX, Home, Search } from 'lucide-react';
import '../styles/dashboard.css';

export const NotFoundPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <div className="standalone-error-container" style={{ flex: 1 }}>
        <div className="error-card-box animate-fade-in">
          <div
            className="error-icon-shield"
            style={{ background: '#f1f5f9', borderColor: '#cbd5e1', color: '#64748b' }}
          >
            <SearchX size={48} />
          </div>

          <h2>Page Not Found (404)</h2>

          <p>
            The requested page or resource could not be found. Please verify the URL or return to the main portal.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-primary">
              <Home size={16} /> Return to Home
            </Link>
            <Link to="/verify" className="btn btn-secondary">
              <Search size={16} /> Public Verifier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
