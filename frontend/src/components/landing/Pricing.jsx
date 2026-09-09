import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PRICING_TIERS = [
  {
    name: 'Current Plan',
    price: 'Free',
    period: '',
    desc: 'Everything you need to study smarter right now.',
    features: [
      'Document uploads',
      'AI Study Material generation',
      'AI Quiz & Question generation',
      'Study and Quiz History',
      'Document management',
      'Dashboard progress tracking'
    ],
    btnText: 'Start Learning',
    btnClass: 'btn-secondary',
    to: '/signup',
    isPopular: true,
    disabled: false
  },
  {
    name: 'Premium',
    price: 'Coming Soon',
    period: '',
    desc: 'Advanced features for power users.',
    features: [
      'Higher AI usage limits',
      'Advanced AI + priority processing',
      'Additional export options',
      'Advanced analytics',
      'Premium learning modes'
    ],
    btnText: 'Coming Soon',
    btnClass: 'btn-ghost',
    to: '#',
    isPopular: false,
    disabled: true
  }
];

export default function Pricing() {
  return (
    <section id="pricing" style={{ background: 'var(--card)' }}>
      <div className="wrap">
        <Reveal className="section-head">
          <span className="section-eyebrow">Plans & Pricing</span>
          <h2>Start free, scale when you're ready</h2>
          <p>Access our core tools today. Premium features coming in the future.</p>
        </Reveal>

        <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 400px))', justifyContent: 'center' }}>
          {PRICING_TIERS.map((tier, idx) => (
            <Reveal key={idx} className={`price-card ${tier.isPopular ? 'featured' : ''}`}>
              {tier.isPopular && <span className="badge-best">Available Now</span>}
              <div className="price-name">{tier.name}</div>
              <div className="price-amt">
                <span className="num" style={{ fontSize: tier.price === 'Coming Soon' ? '28px' : undefined }}>{tier.price}</span>
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
              
              {tier.disabled ? (
                <button
                  className={`btn ${tier.btnClass}`}
                  style={{ marginTop: 'auto', width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
                  disabled
                >
                  {tier.btnText}
                </button>
              ) : (
                <Link
                  to={tier.to}
                  className={`btn ${tier.btnClass}`}
                  style={{ marginTop: 'auto', width: '100%', textDecoration: 'none', boxSizing: 'border-box' }}
                >
                  {tier.btnText}
                </Link>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
