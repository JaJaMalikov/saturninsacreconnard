import React from 'react';

/**
 * Simple Card wrapper for le container
 */
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Contenu à l’intérieur d’une Card
 */
export function CardContent({ children, className = '' }) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

