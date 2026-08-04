import React from 'react';
import Reveal from './Reveal';

const FEATURES_DATA = [
  {
    title: 'Upload Documents',
    desc: 'Drop in PDFs, DOCX, PPTX, or plain text — StudySmart reads it all in seconds.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'AI Summary',
    desc: 'Dense chapters condensed into clear, structured summaries you can actually retain.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h16M4 18h10" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Smart Notes',
    desc: 'Auto-organized notes with headings, definitions, and examples pulled straight from your source.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#4F46E5" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 11h6M9 15h4" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Question Generator',
    desc: 'MCQs, subjective, and coding questions with adjustable difficulty in one click.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#06B6D4" strokeWidth="1.8" />
        <path d="M9 12l2 2 4-4" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Interview Prep',
    desc: 'Turn a job description into role-specific interview questions with model answers.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 5h9l7 7-9 9-7-7V5z" stroke="#4F46E5" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.4" fill="#4F46E5" />
      </svg>
    )
  },
  {
    title: 'Flashcards',
    desc: 'Key terms and concepts turned into spaced-repetition-ready flashcards instantly.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="13" height="9" rx="1.6" stroke="#06B6D4" strokeWidth="1.8" />
        <rect x="7" y="10" width="13" height="9" rx="1.6" fill="#fff" stroke="#06B6D4" strokeWidth="1.8" />
      </svg>
    )
  },
  {
    title: 'MCQs',
    desc: 'Auto-graded multiple choice sets with explanations for every answer.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="7" height="7" rx="1.4" stroke="#4F46E5" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="7" rx="1.4" stroke="#4F46E5" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="1.4" stroke="#4F46E5" strokeWidth="1.8" />
        <path d="M15.5 16.5l1.2 1.2 2.3-2.4" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Learning Analytics',
    desc: "Track what you've studied, questions attempted, and where to focus next.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 19V10M11 19V5M18 19v-6" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
];

export default function Features() {
  return (
    <section id="features">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="section-eyebrow">Everything in one workspace</span>
          <h2>One upload, a complete study kit</h2>
          <p>Every tool students, job seekers, and teachers need to go from raw document to real understanding.</p>
        </Reveal>
        
        <div className="feature-grid">
          {FEATURES_DATA.map((feature, idx) => (
            <Reveal key={idx} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
