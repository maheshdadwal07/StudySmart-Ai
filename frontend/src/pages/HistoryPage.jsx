import React from 'react';
import { History, Search, Filter, MoreHorizontal } from 'lucide-react';
import '../styles/dashboard.css';

const HISTORY_DATA = [
  { id: 1, title: 'Operating Systems — Unit 4 Notes', type: 'PDF', date: '2 hours ago', action: 'Question generation' },
  { id: 2, title: 'Machine Learning — Chapter 7', type: 'DOCX', date: 'Yesterday', action: 'Summary generated' },
  { id: 3, title: 'Database Management Systems', type: 'PPTX', date: '3 days ago', action: 'Flashcards created' },
  { id: 4, title: 'Data Structures & Algorithms', type: 'PDF', date: 'Last week', action: 'Study session' },
];

export default function HistoryPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p>Review your past study sessions and generated materials.</p>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div className="input-wrap" style={{ flex: 1, maxWidth: 300 }}>
            <span className="input-icon"><Search size={16} /></span>
            <input type="text" className="auth-input" placeholder="Search history..." style={{ paddingLeft: 40 }} />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Document</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {HISTORY_DATA.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text)' }}>{item.title}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{item.type}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{item.action}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{item.date}</td>
                  <td style={{ padding: '16px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
