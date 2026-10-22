import React, { useEffect } from 'react';

export default function Modal({ children, onClose, wide }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {onClose && <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>}
        {children}
      </div>
    </div>
  );
}
