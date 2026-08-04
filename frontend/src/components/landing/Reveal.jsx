import React from 'react';
import { useReveal } from '../../hooks/useReveal';

export default function Reveal({ children, className = '' }) {
  const ref = useReveal();
  
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
