import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing.css'

import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'
import WhyChoose from '../components/landing/WhyChoose'
import Testimonials from '../components/landing/Testimonials'
import Pricing from '../components/landing/Pricing'
import FAQ from '../components/landing/FAQ'
import Reveal from '../components/landing/Reveal'
import Footer from '../components/landing/Footer'

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <WhyChoose />
      <Testimonials />
      <Pricing />
      <FAQ />
      <section>
        <div className="wrap">
          <Reveal className="cta-banner">
            <h2>Ready to study smarter?</h2>
            <p>Join thousands turning documents into notes and questions every day.</p>
            <div className="hero-ctas">
              <Link to="/signup" className="btn btn-secondary btn-lg" style={{ color: 'var(--primary)' }}>
                Start Free Trial
              </Link>
              <a href="#" className="btn btn-ghost btn-lg">
                Watch Demo →
              </a>
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
    </>
  )
}
