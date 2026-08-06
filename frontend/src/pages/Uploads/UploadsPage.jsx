import React from 'react';
import { Upload, File, FileText, FileSpreadsheet, Trash2 } from 'lucide-react';
import '../../styles/dashboard.css';

const UPLOADS_DATA = [
  { id: 1, title: 'Operating Systems — Unit 4 Notes.pdf', size: '3.2 MB', date: '2 hours ago', status: 'Processed' },
  { id: 2, title: 'Machine Learning — Chapter 7.docx', size: '1.5 MB', date: 'Yesterday', status: 'Processed' },
  { id: 3, title: 'Database Management Systems.pptx', size: '5.1 MB', date: '3 days ago', status: 'Failed' },
  { id: 4, title: 'Data Structures & Algorithms.pdf', size: '8.4 MB', date: 'Last week', status: 'Processed' },
];

export default function UploadsPage() {
  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Uploads</h1>
          <p>Manage your uploaded documents and study materials.</p>
        </div>
        <button className="btn btn-primary">
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      <div className="panel">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>File Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date Uploaded</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {UPLOADS_DATA.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,70,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={14} color="#4F46E5" />
                    </div>
                    {item.title}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{item.size}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                      background: item.status === 'Processed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: item.status === 'Processed' ? '#16A34A' : '#EF4444'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{item.date}</td>
                  <td style={{ padding: '16px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 size={16} />
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
