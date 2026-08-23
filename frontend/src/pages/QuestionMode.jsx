import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileDown } from 'lucide-react';
import Button from '../components/common/Button';
import '../styles/question.css';
import '../styles/question.css';

export default function QuestionMode() {
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedTypes, setSelectedTypes] = useState(["mcq", "long"]);
  const [questionCount, setQuestionCount] = useState(10);

  return (
    <div className="question-app">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="back-btn" title="Back to dashboard">
            <ChevronLeft size={16} stroke="#374151" strokeWidth={1.8} />
          </Link>
          <div>
            <div className="doc-title">Question Mode</div>
            <div className="doc-meta-sm">Coming Soon</div>
          </div>
        </div>
        <div className="topbar-right">
          <Button variant="secondary" disabled>
            <FileDown size={15} stroke="#111827" strokeWidth={1.9} />
            <span className="lbltext">Export PDF</span>
          </Button>
          <Button variant="secondary" disabled>
            <FileDown size={15} stroke="#111827" strokeWidth={1.9} />
            <span className="lbltext">Export DOCX</span>
          </Button>
        </div>
      </div>

      <div className="question-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Question Mode is coming soon</h3>
          <p style={{ fontSize: 14 }}>AI-generated quizzes, practice questions, and mock tests are part of the next phase.</p>
        </div>
      </div>
    </div>
  );
}
