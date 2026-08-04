import React from 'react';

export default function Button({ children, variant = 'primary', className = '', onClick, ...props }) {
  // variants: primary, secondary, ghost (optional based on landing page)
  return (
    <button 
      className={`btn btn-${variant} ${className}`} 
      onClick={onClick} 
      {...props}
    >
      {children}
    </button>
  );
}
