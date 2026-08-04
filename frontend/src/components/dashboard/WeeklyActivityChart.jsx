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
      
      <div className="chart-area">
        {weeklyActivityData.map((data, idx) => (
          <div className="chart-col" key={idx}>
            <div className="chart-bar-wrap">
              <div className="chart-bar docs" style={{ height: `${data.docs}%` }}></div>
              <div className="chart-bar questions" style={{ height: `${data.questions}%` }}></div>
            </div>
            <div className="chart-day">{data.day}</div>
          </div>
        ))}
      </div>
      
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--primary)' }}></span>
          Documents processed
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent)' }}></span>
          Questions generated
        </div>
      </div>
    </div>
  );
}
