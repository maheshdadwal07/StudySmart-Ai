import React, { useState } from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';

export default function WeeklyActivityChart({ activity }) {
  const [range, setRange] = useState('7 days');
  
  const rangeKey = range === '7 days' ? '7d' : range === '30 days' ? '30d' : '90d';
  const data = activity ? activity[rangeKey] : { study: 0, quiz: 0 };
  
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Activity</h3>
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
      
      {!activity ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 13.5 }}>Activity tracking will be available when you complete your first study session.</p>
        </div>
      ) : (
        <div style={{ padding: '24px 20px' }}>
          {data.study === 0 && data.quiz === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 13.5 }}>No activity in this period yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text)' }}>Study Mode</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Generated materials</p>
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>
                  {data.study}
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                    {data.study === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--info-bg)', color: 'var(--info-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text)' }}>Question Mode</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Quizzes generated</p>
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>
                  {data.quiz}
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                    {data.quiz === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
