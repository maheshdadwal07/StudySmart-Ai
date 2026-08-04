import React from 'react';
import Reveal from './Reveal';

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PRICING_TIERS = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '/ 7 days',
    desc: 'Try the core workflow with limited uploads.',
    features: ['5 document uploads', 'Basic AI summaries', '10 questions per document'],
    btnText: 'Start Free Trial',
    btnClass: 'btn-secondary',
    isPopular: false
  },
  {
    name: 'Pro Monthly',
    price: '$19',
    period: '/ month',
    desc: 'For students and professionals studying every week.',
    features: ['Unlimited uploads', 'Advanced AI + priority processing', 'Full question generator suite', 'Notes generator + flashcards'],
    btnText: 'Upgrade to Pro',
    btnClass: 'btn-primary',
    isPopular: true
  },
  {
    name: 'Pro Yearly',
    price: '$15',
    period: '/ month',
    desc: 'Everything in Monthly — billed yearly, 20% off.',
    features: ['Everything in Pro Monthly', '20% yearly discount', 'Locked-in pricing'],
    btnText: 'Choose Yearly',
    btnClass: 'btn-secondary',
    isPopular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" style={{ background: 'var(--card)' }}>
      <div className="wrap">
        <Reveal className="section-head">
          <span className="section-eyebrow">Simple pricing</span>
          <h2>Start free, upgrade when you're ready</h2>
          <p>No credit card required for the trial. Cancel anytime.</p>
        </Reveal>

        <div className="pricing-grid">
          {PRICING_TIERS.map((tier, idx) => (
            <Reveal key={idx} className={`price-card ${tier.isPopular ? 'featured' : ''}`}>
              {tier.isPopular && <span className="badge-best">Most Popular</span>}
              <div className="price-name">{tier.name}</div>
              <div className="price-amt">
                <span className="num">{tier.price}</span>
                <span className="per">{tier.period}</span>
              </div>
              <p className="price-desc">{tier.desc}</p>
              
              <ul className="price-feats">
                {tier.features.map((feat, fIdx) => (
                  <li key={fIdx}>
                    <CheckIcon />
                    {feat}
                  </li>
                ))}
              </ul>
              
              <a href="#" className={`btn ${tier.btnClass}`} style={{ marginTop: 'auto', width: '100%' }}>
                {tier.btnText}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
