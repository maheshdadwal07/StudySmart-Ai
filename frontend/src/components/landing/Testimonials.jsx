import React from 'react';
import Reveal from './Reveal';

const TESTIMONIALS_DATA = [
  {
    quote: "I uploaded my entire semester's lecture slides and had flashcards and a full MCQ bank ready before my next class started.",
    initials: 'RA',
    name: 'Riya Agarwal',
    role: 'Final-year CS student'
  },
  {
    quote: "I dropped in a job description and got fifteen interview questions matched exactly to the role. Walked into the interview prepared.",
    initials: 'DM',
    name: 'Daniel Moreau',
    role: 'Product analyst, job seeker'
  },
  {
    quote: "Building quiz sets for my class used to eat my Sunday evenings. Now I generate a bank of questions in the time it takes to make coffee.",
    initials: 'PS',
    name: 'Priya Sharma',
    role: 'High school teacher'
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials">
      <div className="wrap">
        <Reveal className="section-head">
          <span className="section-eyebrow">Loved by learners</span>
          <h2>Trusted by students and teams preparing for what's next</h2>
        </Reveal>
        
        <div className="testi-grid">
          {TESTIMONIALS_DATA.map((testi, idx) => (
            <Reveal key={idx} className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="quote">{testi.quote}</p>
              <div className="testi-person">
                <div className="avatar">{testi.initials}</div>
                <div>
                  <div className="name">{testi.name}</div>
                  <div className="role">{testi.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
