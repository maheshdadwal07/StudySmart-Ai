import React, { useState } from 'react';
import { weeklyActivityData } from '../../data/dashboardData';

export default function WeeklyActivityChart() {
  const [range, setRange] = useState('7 days');

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Weekly Activity</h3>
        <div className="segmented">
          {['7 days', '30 days', '90 days'].map((r) => (
            <button 
              key={r}
              className={range === r ? 'active' : ''}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 13.5 }}>Activity tracking will be available when you complete your first study session.</p>
      </div>
    </div>
  );
}
