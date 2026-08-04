import React, { useState } from 'react';
import { FileText, Check, Loader2 } from 'lucide-react';
import { difficulties, questionTypes, questionCounts, documentMeta } from '../../../data/questionData';

export default function QuestionConfig({ 
  difficulty, setDifficulty, 
  selectedTypes, setSelectedTypes, 
  questionCount, setQuestionCount 
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleType = (typeId) => {
    if (selectedTypes.includes(typeId)) {
      if (selectedTypes.length > 1) { // prevent deselecting all
        setSelectedTypes(selectedTypes.filter(t => t !== typeId));
      }
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
    }, 1400);
  };

  return (
    <aside className="config-panel">
      <div className="config-inner">

        <div className="config-section">
          <div className="config-label">
            Source document
            <span className="sub">Used to ground every generated question</span>
          </div>
          <div className="src-card">
            <div className="src-icon">
              <FileText size={16} stroke="#4F46E5" strokeWidth={1.6} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="src-name">{documentMeta.title}</div>
              <div className="src-meta">{documentMeta.pages} pages · {documentMeta.size}</div>
            </div>
          </div>
        </div>

        <div className="config-section">
          <div className="config-label">Difficulty</div>
          <div className="diff-row">
            {difficulties.map(diff => (
              <button 
                key={diff.id}
                className={`diff-btn ${diff.id} ${difficulty === diff.id ? 'active' : ''}`}
                onClick={() => setDifficulty(diff.id)}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        <div className="config-section">
          <div className="config-label">
            Question types
            <span className="sub">Select one or more</span>
          </div>
          <div className="qtype-grid">
            {questionTypes.map(type => (
              <div 
                key={type.id}
                className={`qtype-chip ${selectedTypes.includes(type.id) ? 'active' : ''}`}
                onClick={() => toggleType(type.id)}
              >
                <div className="box">
                  {selectedTypes.includes(type.id) && (
                    <Check size={10} stroke="#fff" strokeWidth={3} />
                  )}
                </div>
                <span className="qt-text">{type.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="config-section">
          <div className="config-label">Number of questions</div>
          <div className="count-row">
            {questionCounts.map(count => (
              <button 
                key={count}
                className={`count-btn ${questionCount === count ? 'active' : ''}`}
                onClick={() => setQuestionCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

      </div>
      <div className="config-footer">
        <button 
          className="btn btn-primary generate-btn" 
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" size={16} stroke="#fff" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v6l4-2M12 3v6l-4-2M12 3a9 9 0 106.4 2.6" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isGenerating ? ' Generating...' : ' Generate Questions'}
        </button>
      </div>
    </aside>
  );
}
