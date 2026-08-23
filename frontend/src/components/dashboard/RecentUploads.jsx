import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom icons to match exact design
const FileIconSvg = ({ type }) => {
  if (type === 'pdf') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#4F46E5" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M15 3v5h5" stroke="#4F46E5" strokeWidth="1.6" />
      </svg>
    );
  }
  if (type === 'ppt') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="4" width="17" height="16" rx="2.2" stroke="#06B6D4" strokeWidth="1.6" />
        <path d="M3.5 9.5h17" stroke="#06B6D4" strokeWidth="1.6" />
      </svg>
    );
  }
  if (type === 'docx') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#22C55E" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 12h6M9 15h6" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
};

export default function RecentUploads({ documents = [] }) {
  const displayDocs = documents.slice(0, 4);
  
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Recent Uploads</h3>
        <Link className="link" to="/uploads">View all</Link>
      </div>
      <div>
        {displayDocs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
            No documents uploaded yet.
          </div>
        ) : (
          displayDocs.map((doc, idx) => {
            const ext = doc.filename.split('.').pop().toLowerCase();
            const type = ext === 'pdf' ? 'pdf' : ext.includes('doc') ? 'docx' : ext.includes('ppt') ? 'ppt' : 'pdf';
            
            // format bytes
            const bytes = doc.file_size_bytes || 0;
            const mb = (bytes / (1024 * 1024)).toFixed(1);
            const sizeStr = mb > 0 ? `${mb} MB` : `${Math.round(bytes / 1024)} KB`;
            
            const dateStr = new Date(doc.created_at).toLocaleDateString();
            
            const tagClass = doc.status === 'Processed' ? 'tag-summary' : 'tag-questions';
            const tagText = doc.status;

            return (
              <div className="doc-row" key={idx}>
                <div className={`doc-icon ${type}`}>
                  <FileIconSvg type={type} />
                </div>
                <div className="doc-info">
                  <div className="doc-name">{doc.filename}</div>
                  <div className="doc-meta">Uploaded {dateStr} · {sizeStr}</div>
                </div>
                <span className={`doc-tag ${tagClass}`}>{tagText}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
