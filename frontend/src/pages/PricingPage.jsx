import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import Reveal from '../components/landing/Reveal';
import FAQ from '../components/landing/FAQ';
import Features from '../components/landing/Features';
import WhyChoose from '../components/landing/WhyChoose';
import Testimonials from '../components/landing/Testimonials';
import '../styles/landing.css';

/* ── SVG helpers ── */
function IconCheck({ primary }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke={primary ? 'var(--primary)' : '#22C55E'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCross() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="#9AA1AE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Data ── */
const TIERS = [
  {
    id: 'current',
    name: 'Current Plan',
    price: 'Free',
    period: '',
    note: null,
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
    disabled: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'Coming Soon',
    period: '',
    note: null,
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
    disabled: true
  }
];

const COMPARISON = [
  {
    label: 'Core Features',
    rows: [
      { feature: 'Document uploads', current: true, premium: true },
      { feature: 'AI Study Material generation', current: true, premium: true },
      { feature: 'AI Quiz generation', current: true, premium: true },
      { feature: 'Study History', current: true, premium: true },
    ],
  },
  {
    label: 'AI Capabilities',
    rows: [
      { feature: 'AI model', current: 'Standard', premium: 'Advanced' },
      { feature: 'Processing speed', current: 'Standard', premium: 'Priority' },
      { feature: 'Usage limits', current: 'Standard limits', premium: 'Higher limits' },
    ],
  },
  {
    label: 'Advanced & Export',
    rows: [
      { feature: 'Export options', current: false, premium: true },
      { feature: 'Advanced analytics', current: false, premium: true },
      { feature: 'Premium learning modes', current: false, premium: true },
    ],
  },
];

/* Renders a comparison cell value: boolean → icon, string → text */
function CellVal({ val }) {
  if (val === true)  return <IconCheck />;
  if (val === false) return <IconCross />;
  return <span>{val}</span>;
}

/* ============================================================
   PRICING PAGE
   ============================================================ */
export default function PricingPage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="pricing-hero">
        <div className="wrap">
          <Reveal className="pricing-hero-inner">
            <span className="section-eyebrow">Plans & Pricing</span>
            <h1>Start free, scale when you're ready</h1>
            <p>Access our core tools today. Premium features coming in the future.</p>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING CARDS ─────────────────────────────────── */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="wrap">
          <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 400px))', justifyContent: 'center' }}>
            {TIERS.map(tier => {
              const isFeatured = tier.id === 'current';
              return (
                <Reveal key={tier.id} className={`price-card${isFeatured ? ' featured' : ''}`}>
                  {isFeatured && <span className="badge-best">Available Now</span>}
                  <div className="price-name">{tier.name}</div>
                  <div className="price-amt">
                    <span className="num" style={{ fontSize: tier.price === 'Coming Soon' ? '28px' : undefined }}>{tier.price}</span>
                    <span className="per">{tier.period}</span>
                  </div>
                  {tier.note && (
                    <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, margin: '4px 0 0' }}>
                      {tier.note}
                    </p>
                  )}
                  <p className="price-desc">{tier.desc}</p>

                  <ul className="price-feats">
                    {tier.features.map((feat, i) => (
                      <li key={i}>
                        <IconCheck primary />
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
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────── */}
      <section style={{ background: 'var(--card)', padding: '80px 0' }}>
        <div className="wrap">
          <Reveal className="section-head">
            <span className="section-eyebrow">Compare plans</span>
            <h2>What to expect</h2>
          </Reveal>

          <div className="ct-scroll">
            <div className="ct-wrap" style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Header */}
              <div className="ct-header" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div className="ct-feat-head">Feature</div>
                <div className="ct-col-head">Current Plan</div>
                <div className="ct-col-head ct-col-pro">
                  Premium<span>Coming Soon</span>
                </div>
              </div>

              {/* Rows */}
              {COMPARISON.map(section => (
                <React.Fragment key={section.label}>
                  <div className="ct-section-label" style={{ gridColumn: 'span 3' }}>{section.label}</div>
                  {section.rows.map(row => (
                    <div key={row.feature} className="ct-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                      <div className="ct-feat">{row.feature}</div>
                      <div className="ct-cell"><CellVal val={row.current} /></div>
                      <div className="ct-cell"><CellVal val={row.premium} /></div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LANDING COMPONENTS ── */}
      <Features />
      <WhyChoose />
      <Testimonials />

      {/* ── FAQ ───────────────────────────────────────────── */}
      <FAQ />

      {/* ── CTA ───────────────────────────────────────────── */}
      <section>
        <div className="wrap">
          <Reveal className="cta-banner">
            <h2>Ready to study smarter?</h2>
            <p>Join students turning documents into knowledge every day.</p>
            <div className="hero-ctas">
              <Link to="/signup" className="btn btn-secondary btn-lg" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                Start Learning
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg" style={{ textDecoration: 'none' }}>
                Sign in →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
