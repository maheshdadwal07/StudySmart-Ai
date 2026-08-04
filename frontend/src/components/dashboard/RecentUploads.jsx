import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { recentUploadsData } from '../../data/dashboardData';

// Custom icons to match exact design
const FileIconSvg = ({ type }) => {
  if (type === 'pdf') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#4F46E5" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M15 3v5h5" stroke="#4F46E5" strokeWidth="1.6"/>
      </svg>
    );
  }
  if (type === 'ppt') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="4" width="17" height="16" rx="2.2" stroke="#06B6D4" strokeWidth="1.6"/>
        <path d="M3.5 9.5h17" stroke="#06B6D4" strokeWidth="1.6"/>
      </svg>
    );
  }
  if (type === 'docx') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#22C55E" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M9 12h6M9 15h6" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    );
  }
  return null;
};

export default function RecentUploads() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Recent Uploads</h3>
        <a className="link" href="#">View all</a>
      </div>
      <div>
        {recentUploadsData.map((doc, idx) => (
          <div className="doc-row" key={idx}>
            <div className={`doc-icon ${doc.type}`}>
              <FileIconSvg type={doc.type} />
            </div>
            <div className="doc-info">
              <div className="doc-name">{doc.name}</div>
              <div className="doc-meta">{doc.meta}</div>
            </div>
            <span className={`doc-tag ${doc.tagClass}`}>{doc.tagText}</span>
            <div className="doc-more">
              <MoreHorizontal size={16} color="#6B7280" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
