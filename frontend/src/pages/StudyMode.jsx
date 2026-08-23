import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, RefreshCw, Download, UploadCloud } from 'lucide-react';
import Button from '../components/common/Button';
import '../styles/study.css';
import '../styles/study.css';

export default function StudyMode() {
  const [showUploadScreen, setShowUploadScreen] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  return (
    <div className="study-app">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="back-btn" title="Back to dashboard">
            <ChevronLeft size={16} stroke="#374151" strokeWidth={1.8} />
          </Link>
          <div className="doc-title-wrap">
            <div className="doc-title">Study Mode</div>
            <div className="doc-meta-sm">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
        <div className="topbar-right">
          <Button variant="ghost" onClick={() => setShowUploadScreen(true)}>
            <Plus size={15} stroke="#6B7280" strokeWidth={1.9} />
            <span className="lbltext">New Upload</span>
          </Button>
          <Button variant="secondary" disabled>
            <RefreshCw size={15} stroke="#111827" strokeWidth={1.9} />
            <span className="lbltext">Generate Again</span>
          </Button>
          <Button variant="primary" disabled>
            <Download size={15} stroke="#fff" strokeWidth={1.9} />
            <span className="lbltext">Export</span>
          </Button>
        </div>
      </div>

      {/* CONDITIONAL RENDER: UPLOAD SCREEN OR WORKSPACE */}
      {showUploadScreen ? (
        <div className="upload-screen">
          <div className="upload-wrap">
            <span className="eyebrow">Study Mode</span>
            <h1>Upload a document to get started</h1>
            <p>We'll turn it into a summary, smart notes, key points, flashcards, and a learning assistant.</p>
            <div 
              className="dropzone" 
              onClick={() => setUploadMessage('Study Mode AI processing will be available in Step 5.')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setUploadMessage('Study Mode AI processing will be available in Step 5.')}
            >
              <div className="dropzone-icon">
                <UploadCloud size={30} stroke="#4F46E5" strokeWidth={1.8} />
              </div>
              <div className="t">Drag &amp; drop your file here</div>
              <div className="s">or click to browse from your computer</div>
            </div>
            {uploadMessage && <div style={{ color: '#4F46E5', marginTop: '16px', fontWeight: 500 }}>{uploadMessage}</div>}
            <div className="format-row" style={{ marginTop: '24px' }}>
              <span className="format-chip">📄 PDF</span>
              <span className="format-chip">📝 DOCX</span>
              <span className="format-chip">📊 PPT</span>
              <span className="format-chip">🧾 TXT</span>
            </div>
            <p className="upload-hint">Max file size 25MB · Your document stays private to your account</p>
          </div>
        </div>
      ) : (
        <div className="workspace" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Study Mode is coming soon</h3>
            <p style={{ fontSize: 14 }}>AI-powered summaries, flashcards, and smart notes are part of the next phase.</p>
            <Button variant="primary" style={{ marginTop: 20 }} onClick={() => setShowUploadScreen(true)}>
              Notify me
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
