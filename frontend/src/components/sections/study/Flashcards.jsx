import React, { useState } from 'react';
import { flashcardsData } from '../../../data/studyData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Flashcards() {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    setIsFlipped(false);
    // slight timeout to allow flip back before changing content (optional, but good UX)
    setTimeout(() => {
      setCurrentCard((prev) => (prev + 1) % flashcardsData.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard((prev) => (prev - 1 + flashcardsData.length) % flashcardsData.length);
    }, 150);
  };

  const card = flashcardsData[currentCard];

  return (
    <div className="tab-panel active">
      <div className="fc-wrap">
        <div 
          className={`fc-card ${isFlipped ? 'flipped' : ''}`} 
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="fc-inner">
            <div className="fc-face fc-front">
              <span className="lbl">Question</span>
              <div className="txt">{card.q}</div>
            </div>
            <div className="fc-face fc-back">
              <span className="lbl" style={{ opacity: 0.8 }}>Answer</span>
              <div className="txt">{card.a}</div>
            </div>
          </div>
        </div>
        
        <div className="fc-nav">
          <button className="icon-btn" onClick={prevCard}>
            <ChevronLeft size={15} stroke="#374151" strokeWidth={1.8} />
          </button>
          <div className="fc-dots">
            {flashcardsData.map((_, idx) => (
              <div 
                key={idx} 
                className={`fc-dot ${idx === currentCard ? 'active' : ''}`} 
              />
            ))}
          </div>
          <button className="icon-btn" onClick={nextCard}>
            <ChevronRight size={15} stroke="#374151" strokeWidth={1.8} />
          </button>
        </div>
        
        <p className="fc-hint">
          Click the card to flip · Card <span>{currentCard + 1}</span> of {flashcardsData.length}
        </p>
      </div>
    </div>
  );
}
