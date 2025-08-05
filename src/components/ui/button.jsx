import React from 'react';

/**
 * Button avec variante par défaut ou “destructive”
 */
export function Button({ children, onClick, variant = 'default', className = '' }) {
  const base = 'px-4 py-2 rounded-md font-medium shadow-sm focus:outline-none';
  const styles = variant === 'destructive'
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <button onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

