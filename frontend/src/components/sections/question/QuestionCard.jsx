import React, { useState } from 'react';
import { Copy, Bookmark, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function QuestionCard({ question }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(question.isBookmarked);

  return (
    <div className="q-card">
      <div className="q-card-top">
        <div className="q-badges">
          <span className="q-num">{question.id.toUpperCase()}</span>
          <span className={`badge ${question.badgeTypeClass}`}>{question.type}</span>
          <span className={`badge ${question.badgeDiffClass}`}>{question.difficulty}</span>
        </div>
        <div className="q-actions">
          <button className="icon-btn" title="Copy">
            <Copy size={14} stroke="#374151" strokeWidth={1.6} />
          </button>
          <button 
            className={`icon-btn bookmark-btn ${isBookmarked ? 'on' : ''}`} 
            title="Bookmark"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark 
              size={14} 
              stroke={isBookmarked ? "#4F46E5" : "#374151"} 
              fill={isBookmarked ? "#4F46E5" : "none"}
              strokeWidth={1.6} 
            />
          </button>
          <button className="icon-btn" title="Regenerate">
            <RefreshCw size={14} stroke="#374151" strokeWidth={1.6} />
          </button>
        </div>
      </div>
      
      <p className="q-text">{question.text}</p>
      
      {/* Code Block if available */}
      {question.code && (
        <div className="q-code">
          {question.code}
        </div>
      )}

      {/* MCQ Options if available */}
      {question.options && (
        <div className="mcq-options">
          {question.options.map((opt, idx) => (
            <div className={`mcq-opt ${opt.isCorrect ? 'correct' : ''}`} key={idx}>
              <span className="letter">{opt.letter}</span>
              {opt.text}
            </div>
          ))}
        </div>
      )}

      <div className="reveal-row">
        <button 
          className="reveal-btn" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <EyeOff size={13} stroke="#4F46E5" strokeWidth={1.6} />
          ) : (
            <Eye size={13} stroke="#4F46E5" strokeWidth={1.6} />
          )}
          {isExpanded 
            ? (question.options ? 'Hide explanation' : 'Hide model answer') 
            : (question.options ? 'Show explanation' : 'Reveal model answer')
          }
        </button>
        
        {isExpanded && (
          <div className="answer-box">
            <span className="lbl">{question.explanationTitle || 'Explanation'}</span>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
