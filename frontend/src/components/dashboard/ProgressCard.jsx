import React from 'react';
import { progressStats } from '../../data/dashboardData';

export default function ProgressCard() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Overall Progress</h3>
      </div>
      <div className="progress-ring-wrap">
        <div className="progress-ring">
          <svg width="104" height="104" viewBox="0 0 104 104">
            <circle cx="52" cy="52" r="44" stroke="#E5E7EB" strokeWidth="10" fill="none" />
            <circle 
              cx="52" cy="52" r="44" 
              stroke="url(#g1)" 
              strokeWidth="10" 
              fill="none"
              strokeDasharray="276.5" 
              strokeDashoffset={276.5 - (276.5 * progressStats.percent) / 100} 
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="progress-ring-label">
            <span className="pct">{progressStats.percent}%</span>
            <span className="cap">complete</span>
          </div>
        </div>
        
        <div className="mini-stat-list">
          <div className="mini-stat-item">
            <span className="lbl">
              <span className="mini-dot" style={{ background: 'var(--primary)' }}></span>
              Study Mode
            </span>
            <span className="val">{progressStats.studySessions} sessions</span>
          </div>
          <div className="mini-stat-item">
            <span className="lbl">
              <span className="mini-dot" style={{ background: 'var(--accent)' }}></span>
              Question Mode
            </span>
            <span className="val">{progressStats.questionSessions} sessions</span>
          </div>
          <div className="mini-stat-item">
            <span className="lbl">
              <span className="mini-dot" style={{ background: 'var(--success)' }}></span>
              Flashcards reviewed
            </span>
            <span className="val">{progressStats.flashcards} cards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
