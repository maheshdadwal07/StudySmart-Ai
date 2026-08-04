import React from 'react';
import Reveal from './Reveal';

export default function CTA() {
  return (
    <section>
      <div className="wrap">
        <Reveal className="cta-banner">
          <h2>Ready to study smarter?</h2>
          <p>Join thousands turning documents into notes and questions every day.</p>
          <div className="hero-ctas">
            <a href="#" className="btn btn-secondary btn-lg" style={{ color: 'var(--primary)' }}>
              Start Free Trial
            </a>
            <a href="#" className="btn btn-ghost btn-lg">
              Watch Demo →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
