import React from 'react';
import { progressStats } from '../../data/dashboardData';

export default function ProgressCard() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Overall Progress</h3>
      </div>
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
        <h4 style={{ color: 'var(--text)', marginBottom: 8 }}>Learning progress</h4>
        <p style={{ fontSize: 13.5 }}>Advanced analytics and progress tracking will be available soon.</p>
      </div>
    </div>
  );
}
