import React from 'react'
import '../../styles/landing.css'

import Navbar from '../../components/landing/Navbar'
import Hero from '../../components/landing/Hero'
import Features from '../../components/landing/Features'
import WhyChoose from '../../components/landing/WhyChoose'
import Testimonials from '../../components/landing/Testimonials'
import Pricing from '../../components/landing/Pricing'
import FAQ from '../../components/landing/FAQ'
import CTA from '../../components/landing/CTA'
import Footer from '../../components/landing/Footer'

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
      <CTA />
      <Footer />
    </>
  )
}
