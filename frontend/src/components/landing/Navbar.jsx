import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="logo">
          <div className="logo-mark">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path 
                d="M4 4h11l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" 
                stroke="#fff" 
                strokeWidth="1.8" 
                strokeLinejoin="round" 
              />
              <path 
                d="M9 12h6M9 16h6M9 8h2" 
                stroke="#fff" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
              />
            </svg>
          </div>
          StudySmart AI
        </div>
        
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#why">Why StudySmart</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        
        <div className="nav-cta">
          <Link to="/login" className="btn btn-secondary">Log in</Link>
          <Link to="/signup" className="btn btn-primary">Start Free Trial</Link>
        </div>
        
        <button className="nav-mobile-toggle" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path 
              d="M4 7h16M4 12h16M4 17h16" 
              stroke="#111827" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
