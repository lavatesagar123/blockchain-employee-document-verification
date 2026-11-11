import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '680px',
  allowFullscreen = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset fullscreen when closed
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay modal-backdrop animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isFullscreen ? '0.5rem' : '1.25rem',
        overflow: 'auto'
      }}
    >
      <div
        className="modal-content modal-container"
        style={{
          maxWidth: isFullscreen ? '98vw' : maxWidth,
          width: isFullscreen ? '98vw' : '100%',
          height: isFullscreen ? '96vh' : 'auto',
          maxHeight: isFullscreen ? '96vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: isFullscreen ? '10px' : '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ padding: '0.85rem 1.25rem' }}>
          <h3 className="modal-title" style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {allowFullscreen && (
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label={isFullscreen ? 'Exit full screen' : 'Full screen preview'}
                title={isFullscreen ? 'Exit full screen' : 'Full screen preview'}
                style={{ cursor: 'pointer' }}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
              title="Close"
              style={{ cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          className="modal-body"
          style={{
            overflow: 'auto',
            flex: 1,
            padding: '1rem',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {children}
        </div>

        {footer && <div className="modal-footer" style={{ padding: '0.85rem 1.25rem' }}>{footer}</div>}
      </div>
    </div>
  );
};
