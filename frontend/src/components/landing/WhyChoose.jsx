import React from 'react';
import Reveal from './Reveal';

const WHY_ITEMS = [
  {
    title: 'Save hours of manual work',
    desc: 'What takes an afternoon of note-taking happens in under a minute.',
  },
  {
    title: 'Powered by frontier AI',
    desc: 'Grounded in your actual document, not generic web answers.',
  },
  {
    title: 'Supports multiple formats',
    desc: 'PDF, DOCX, PPTX, and plain text — all handled natively.',
  },
  {
    title: 'Accurate question generation',
    desc: 'Questions are grounded in your source, with answers you can verify.',
  },
  {
    title: 'Minimal learning curve',
    desc: 'Upload and go — no setup, no tutorials required.',
  },
];

export default function WhyChoose() {
  return (
    <section id="why" style={{ background: 'var(--card)' }}>
      <div className="wrap">
        <div className="why">
          <Reveal>
            <span className="section-eyebrow">Why StudySmart AI</span>
            <h2 style={{ fontSize: '34px', marginBottom: '28px' }}>
              Built to save you hours, not add more busywork
            </h2>
            
            <div className="why-list">
              {WHY_ITEMS.map((item, idx) => (
                <div className="why-item" key={idx}>
                  <div className="why-check">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          
          <Reveal className="why-visual">
            <div className="stat-row">
              <div className="stat-card">
                <div className="num">4.2 min</div>
                <div className="lbl">Avg. time to full study kit</div>
              </div>
              <div className="stat-card">
                <div className="num">96%</div>
                <div className="lbl">Question accuracy rate</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="lbl" style={{ marginBottom: '10px' }}>
                Weekly documents processed
              </div>
              <div className="mini-bars">
                <div className="bar" style={{ height: '35%' }}></div>
                <div className="bar" style={{ height: '52%' }}></div>
                <div className="bar" style={{ height: '40%' }}></div>
                <div className="bar" style={{ height: '70%' }}></div>
                <div className="bar" style={{ height: '58%' }}></div>
                <div className="bar" style={{ height: '88%' }}></div>
                <div className="bar" style={{ height: '100%' }}></div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
