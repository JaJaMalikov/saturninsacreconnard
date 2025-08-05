import React from 'react';

/**
 * Slider HTML natif stylé Tailwind
 */
export function Slider({
  min, max, step = 1, value, onValueChange, className = ''
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value ?? min}
      onChange={e => onValueChange(Number(e.target.value))}
      className={`w-full h-2 rounded-lg accent-blue-600 ${className}`}
    />
  );
}

