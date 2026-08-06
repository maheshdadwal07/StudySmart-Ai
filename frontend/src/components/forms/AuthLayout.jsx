import React from 'react';

/**
 * AuthLayout
 * Shared two-column shell for Login and Sign Up pages.
 * Left: gradient branding panel  |  Right: white form slot
 */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      {/* ── LEFT BRANDING PANEL ─────────────────────── */}
      <div className="auth-brand">
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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

        <div className="auth-brand-body">
          <h2 className="auth-brand-tagline">
            Study smarter.<br />Learn faster.<br />Score higher.
          </h2>
          <p className="auth-brand-sub">
            Turn any document into summaries, flashcards, and exam-ready
            questions in seconds — powered by AI.
          </p>

          <ul className="auth-features">
            {[
              'Instant AI-generated summaries',
              'Smart flashcards & spaced repetition',
              'Exam-style question generation',
              'Multi-format document support',
              'Track progress across all topics',
            ].map((feat) => (
              <li key={feat} className="auth-feature-item">
                <span className="auth-feature-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {feat}
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-brand-foot">
          Trusted by 50,000+ students worldwide
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────── */}
      <div className="auth-panel">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
