import React, { useState } from 'react';

export default function ProgressCard({ progress }) {
  const [range, setRange] = useState('weekly');
  
  if (!progress) return null;
  
  const data = range === 'weekly' ? progress.weekly : progress.monthly;
  
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Overall Progress</h3>
        <div className="segmented">
          {['weekly', 'monthly'].map((r) => (
            <button 
              key={r}
              className={range === r ? 'active' : ''}
              onClick={() => setRange(r)}
              style={{ textTransform: 'capitalize' }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '24px 20px', height: 240, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: 16, position: 'relative' }}>
          {/* Y-axis */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', fontSize: 11, color: 'var(--text-muted)', paddingRight: 10 }}>
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          
          {/* Chart area */}
          <div style={{ flex: 1, display: 'flex', height: '100%', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(val => (
              <div key={val} style={{ position: 'absolute', left: 0, right: 0, bottom: `${val}%`, height: 1, backgroundColor: 'var(--border)', zIndex: 0 }} />
            ))}
            
            {/* Bars */}
            {data?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1, height: '100%', justifyContent: 'flex-end' }}>
                {item.value !== null ? (
                  <div 
                    style={{ 
                      width: '60%', 
                      maxWidth: 30,
                      height: `${Math.max(item.value, 4)}%`, // at least 4% for visibility if not null
                      backgroundColor: 'var(--primary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }} 
                    title={`${item.label}: ${item.value}%`}
                  />
                ) : (
                  <div 
                    style={{ 
                      width: '60%', 
                      maxWidth: 30,
                      height: '2px', // very thin bar to indicate "no data" rather than 0%
                      backgroundColor: 'var(--border)',
                      borderRadius: '2px 2px 0 0'
                    }} 
                    title={`${item.label}: No activity`}
                  />
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
