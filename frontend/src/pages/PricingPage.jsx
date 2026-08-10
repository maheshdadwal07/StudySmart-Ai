import React, { useState } from 'react';
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
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    period: '/ 7 days',
    note: null,
    desc: 'Try the full workflow with no commitment.',
    features: [
      '5 document uploads',
      'Basic AI summaries',
      '10 questions per document',
      'Standard processing speed',
    ],
    btnText: 'Start Free Trial',
    btnClass: 'btn-secondary',
    to: '/signup',
  },
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: '$19',
    period: '/ month',
    note: null,
    desc: 'For students and professionals studying daily.',
    features: [
      'Unlimited document uploads',
      'Advanced AI + priority processing',
      'Full question generator suite',
      'Flashcards & smart notes',
      'Interview prep mode',
      'Unlimited history & export',
    ],
    btnText: 'Upgrade to Pro',
    btnClass: 'btn-primary',
    to: '/signup',
  },
  {
    id: 'yearly',
    name: 'Pro Yearly',
    price: '$15',
    period: '/ month',
    note: 'Billed $180 / yr — save $48',
    desc: 'All of Pro Monthly, billed once a year.',
    features: [
      'Everything in Pro Monthly',
      'Save $48 vs monthly billing',
      'Annual invoice for taxes',
      'Locked-in pricing guarantee',
    ],
    btnText: 'Choose Yearly',
    btnClass: 'btn-secondary',
    to: '/signup',
  },
];

const COMPARISON = [
  {
    label: 'Documents & Processing',
    rows: [
      { feature: 'Monthly uploads',       free: '5 docs',           pro: 'Unlimited' },
      { feature: 'Max file size',          free: '10 MB',            pro: '100 MB' },
      { feature: 'Supported formats',      free: 'PDF, DOCX',        pro: 'PDF, DOCX, PPTX, TXT' },
      { feature: 'Processing speed',       free: 'Standard',         pro: 'Priority' },
    ],
  },
  {
    label: 'AI Features',
    rows: [
      { feature: 'AI summaries',           free: 'Basic',            pro: 'Advanced' },
      { feature: 'Smart notes generator',  free: true,               pro: true },
      { feature: 'Question generator',     free: '10 / document',    pro: 'Unlimited' },
      { feature: 'MCQs with explanations', free: false,              pro: true },
      { feature: 'Flashcard generator',    free: false,              pro: true },
      { feature: 'Interview prep mode',    free: false,              pro: true },
    ],
  },
  {
    label: 'Account & Export',
    rows: [
      { feature: 'History retention',      free: '7 days',           pro: 'Unlimited' },
      { feature: 'Export (PDF, DOCX)',     free: false,              pro: true },
      { feature: 'Customer support',       free: 'Community',        pro: 'Priority email' },
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
  const [billing, setBilling] = useState('monthly');

  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="pricing-hero">
        <div className="wrap">
          <Reveal className="pricing-hero-inner">
            <span className="section-eyebrow">Simple pricing</span>
            <h1>Start free, scale when you're ready</h1>
            <p>No credit card required for the trial. Cancel anytime.</p>

            <div className="billing-switch">
              <button
                id="billing-monthly"
                className={billing === 'monthly' ? 'active' : ''}
                onClick={() => setBilling('monthly')}
              >
                Monthly
              </button>
              <button
                id="billing-yearly"
                className={billing === 'yearly' ? 'active' : ''}
                onClick={() => setBilling('yearly')}
              >
                Yearly
                <span className="billing-badge">Save 20%</span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING CARDS ─────────────────────────────────── */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="wrap">
          <div className="pricing-grid">
            {TIERS.map(tier => {
              const isFeatured = tier.id === billing;
              return (
                <Reveal key={tier.id} className={`price-card${isFeatured ? ' featured' : ''}`}>
                  {isFeatured && <span className="badge-best">Most Popular</span>}
                  <div className="price-name">{tier.name}</div>
                  <div className="price-amt">
                    <span className="num">{tier.price}</span>
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

                  <Link
                    to={tier.to}
                    className={`btn ${tier.btnClass}`}
                    style={{ marginTop: 'auto', width: '100%', textDecoration: 'none', boxSizing: 'border-box' }}
                  >
                    {tier.btnText}
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)', marginTop: 24 }}>
            All plans include a 7-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────── */}
      <section style={{ background: 'var(--card)', padding: '80px 0' }}>
        <div className="wrap">
          <Reveal className="section-head">
            <span className="section-eyebrow">Compare plans</span>
            <h2>Everything included in each plan</h2>
          </Reveal>

          <div className="ct-scroll">
            <div className="ct-wrap">
              {/* Header */}
              <div className="ct-header">
                <div className="ct-feat-head">Feature</div>
                <div className="ct-col-head">Free Trial</div>
                <div className="ct-col-head ct-col-pro">
                  Pro Monthly<span>$19 / mo</span>
                </div>
                <div className="ct-col-head ct-col-pro">
                  Pro Yearly<span>$15 / mo</span>
                </div>
              </div>

              {/* Rows */}
              {COMPARISON.map(section => (
                <React.Fragment key={section.label}>
                  <div className="ct-section-label">{section.label}</div>
                  {section.rows.map(row => (
                    <div key={row.feature} className="ct-row">
                      <div className="ct-feat">{row.feature}</div>
                      <div className="ct-cell"><CellVal val={row.free} /></div>
                      <div className="ct-cell"><CellVal val={row.pro} /></div>
                      <div className="ct-cell"><CellVal val={row.pro} /></div>
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
            <p>Join 50,000+ students turning documents into knowledge every day.</p>
            <div className="hero-ctas">
              <Link to="/signup" className="btn btn-secondary btn-lg" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                Start Free Trial
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
