import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, RefreshCw, Download, UploadCloud } from 'lucide-react';
import Button from '../components/common/Button';
import DocumentPreview from '../components/sections/study/DocumentPreview';
import StudyWorkspace from '../components/sections/study/StudyWorkspace';
import { documentMeta } from '../data/studyData';
import '../styles/study.css';

export default function StudyMode() {
  const [showUploadScreen, setShowUploadScreen] = useState(false);

  return (
    <div className="study-app">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="back-btn" title="Back to dashboard">
            <ChevronLeft size={16} stroke="#374151" strokeWidth={1.8} />
          </Link>
          <div className="doc-title-wrap">
            <div className="doc-title">{documentMeta.title}</div>
            <div className="doc-meta-sm">
              <span className="status-pill">
                <span className="dot"></span>{documentMeta.status}
              </span>
              <span>· {documentMeta.pages} pages · {documentMeta.size}</span>
            </div>
          </div>
        </div>
        <div className="topbar-right">
          <Button variant="ghost" onClick={() => setShowUploadScreen(true)}>
            <Plus size={15} stroke="#6B7280" strokeWidth={1.9} />
            <span className="lbltext">New Upload</span>
          </Button>
          <Button variant="secondary">
            <RefreshCw size={15} stroke="#111827" strokeWidth={1.9} />
            <span className="lbltext">Generate Again</span>
          </Button>
          <Button variant="primary">
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
              onClick={() => setShowUploadScreen(false)}
            >
              <div className="dropzone-icon">
                <UploadCloud size={30} stroke="#4F46E5" strokeWidth={1.8} />
              </div>
              <div className="t">Drag &amp; drop your file here</div>
              <div className="s">or click to browse from your computer</div>
            </div>
            <div className="format-row">
              <span className="format-chip">📄 PDF</span>
              <span className="format-chip">📝 DOCX</span>
              <span className="format-chip">📊 PPT</span>
              <span className="format-chip">🧾 TXT</span>
            </div>
            <p className="upload-hint">Max file size 25MB · Your document stays private to your account</p>
          </div>
        </div>
      ) : (
        <div className="workspace">
          <DocumentPreview />
          <StudyWorkspace />
        </div>
      )}
    </div>
  );
}
