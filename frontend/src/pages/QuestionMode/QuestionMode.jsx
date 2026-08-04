import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileDown } from 'lucide-react';
import Button from '../../components/common/Button';
import QuestionConfig from '../../components/sections/question/QuestionConfig';
import QuestionResults from '../../components/sections/question/QuestionResults';
import { documentMeta } from '../../data/questionData';
import '../../styles/question.css';

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
            <div className="doc-title">Question Mode — {documentMeta.title}</div>
            <div className="doc-meta-sm">{documentMeta.pages} pages · {documentMeta.status}</div>
          </div>
        </div>
        <div className="topbar-right">
          <Button variant="secondary">
            <FileDown size={15} stroke="#111827" strokeWidth={1.9} />
            <span className="lbltext">Export PDF</span>
          </Button>
          <Button variant="secondary">
            <FileDown size={15} stroke="#111827" strokeWidth={1.9} />
            <span className="lbltext">Export DOCX</span>
          </Button>
        </div>
      </div>

      <div className="question-body">
        {/* CONFIG PANEL */}
        <QuestionConfig 
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
        />

        {/* RESULTS AREA */}
        <QuestionResults 
          difficulty={difficulty}
          documentMeta={documentMeta}
        />
      </div>
    </div>
  );
}
