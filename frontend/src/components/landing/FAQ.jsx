import React, { useState, useRef, useEffect } from 'react';
import Reveal from './Reveal';

const FAQ_DATA = [
  {
    q: 'Which file types can I upload?',
    a: 'PDF, DOCX, PPTX, and plain text files are all supported natively — just drag and drop.'
  },
  {
    q: 'How accurate are the generated questions?',
    a: 'Every question is grounded directly in your uploaded document, with an explanation you can check against the source.'
  },
  {
    q: 'Do I need a credit card for the free trial?',
    a: 'No. You get 7 days of full access with no card required. Upgrade anytime from your account settings.'
  },
  {
    q: 'Can I use StudySmart AI for interview prep?',
    a: 'Yes — upload a job description and Question Mode generates role-specific interview, behavioral, and scenario-based questions.'
  },
  {
    q: 'Can I export my notes and questions?',
    a: 'Everything can be exported as PDF or DOCX, copied to your clipboard, or shared with a link.'
  }
];

function FaqItem({ question, answer, isOpen, onClick }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState('0px');

  useEffect(() => {
    if (isOpen) {
      setHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setHeight('0px');
    }
  }, [isOpen]);

  return (
    <Reveal className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-q" onClick={onClick}>
        {question}
        <span className="chev">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div 
        className="faq-a" 
        style={{ maxHeight: height }}
        ref={contentRef}
      >
        <div className="faq-a-inner">{answer}</div>
      </div>
    </Reveal>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (idx) => {
    setOpenIndex(prev => prev === idx ? null : idx);
  };

  return (
    <section id="faq">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="section-eyebrow">Questions</span>
          <h2>Frequently asked questions</h2>
        </Reveal>
        
        <div className="faq-list">
          {FAQ_DATA.map((item, idx) => (
            <FaqItem
              key={idx}
              question={item.q}
              answer={item.a}
              isOpen={openIndex === idx}
              onClick={() => handleToggle(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
