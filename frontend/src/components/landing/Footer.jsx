import React from 'react';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-mark">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h11l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              StudySmart AI
            </div>
            <p>Upload. Learn. Practice. Turn any document into smart notes and AI-generated questions.</p>
            
            <div className="footer-social" style={{ marginTop: '20px' }}>
              <a href="#" aria-label="Twitter">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 001.8-2.2 8 8 0 01-2.5 1 4 4 0 00-6.9 3.6A11.4 11.4 0 013 4.9a4 4 0 001.2 5.3 4 4 0 01-1.8-.5v.1a4 4 0 003.2 3.9 4 4 0 01-1.8.1 4 4 0 003.7 2.8A8 8 0 012 18.6a11.3 11.3 0 006.2 1.8c7.4 0 11.5-6.2 11.5-11.5v-.5A8.3 8.3 0 0022 5.9z" fill="#6B7280" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="#6B7280" />
                  <path d="M7.5 10v7M7.5 7.2v.01M11 10v7M11 13c0-1.8 1.2-3 2.8-3s2.7 1.2 2.7 3v4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </a>
              <a href="#" aria-label="GitHub">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a4 4 0 011-2.7 3.6 3.6 0 010-2.7s.9-.3 2.9 1a10 10 0 015.2 0c2-1.3 2.9-1 2.9-1a3.6 3.6 0 010 2.7 4 4 0 011 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10 10 0 0012 2z" fill="#6B7280" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="footer-col">
            <h5>Product</h5>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#">Study Mode</a>
            <a href="#">Question Mode</a>
          </div>
          
          <div className="footer-col">
            <h5>Company</h5>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </div>
          
          <div className="footer-col">
            <h5>Resources</h5>
            <a href="#faq">FAQ</a>
            <a href="#">Help Center</a>
            <a href="#">Guides</a>
            <a href="#">API Docs</a>
          </div>
          
          <div className="footer-col">
            <h5>Legal</h5>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
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
