import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthenticatedFooter() {
  return (
    <footer>
      <div className="wrap">
        <div 
          className="footer-grid" 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between', 
            gap: '40px' 
          }}
        >
          <div className="footer-brand" style={{ flex: '1 1 300px', maxWidth: '500px' }}>
            <Link to="/dashboard" className="logo" style={{ textDecoration: 'none' }}>
              <div className="logo-mark">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h11l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              StudySmart AI
            </Link>
            <p>Upload. Learn. Practice. Turn any document into smart notes and AI-generated questions.</p>

            <div className="footer-social" style={{ marginTop: '20px' }}>
              <a href="https://www.linkedin.com/in/maheshdadwal07/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="#6B7280" />
                  <path d="M7.5 10v7M7.5 7.2v.01M11 10v7M11 13c0-1.8 1.2-3 2.8-3s2.7 1.2 2.7 3v4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </a>
              <a href="https://github.com/maheshdadwal07" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a4 4 0 011-2.7 3.6 3.6 0 010-2.7s.9-.3 2.9 1a10 10 0 015.2 0c2-1.3 2.9-1 2.9-1a3.6 3.6 0 010 2.7 4 4 0 011 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10 10 0 0012 2z" fill="#6B7280" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col" style={{ flex: '0 1 200px' }}>
            <h5>Navigation</h5>
            <Link to="/pricing" onClick={() => window.scrollTo(0, 0)}>Pricing</Link>
            <Link to="/study-mode">Study Mode</Link>
            <Link to="/question-mode">Question Mode</Link>
            <a href="#faq">FAQ</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 StudySmart AI. All rights reserved.</span>
          <span>Made for learners everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
