import React from 'react';
import { useReveal } from '../../hooks/useReveal';

export default function Reveal({ children, className = '' }) {
  const { ref, isIn } = useReveal();
  
  return (
    <div ref={ref} className={`reveal ${isIn ? 'in ' : ''}${className}`}>
      {children}
    </div>
  );
}
