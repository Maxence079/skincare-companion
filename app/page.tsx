import Link from 'next/link'
import { Leaf, ArrowRight } from 'lucide-react'

/**
 * Landing Page - Premium Botanical Minimalism
 * Aesop-inspired sophisticated design
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-warm-50">

      {/* Navigation - Minimalist */}
      <nav className="border-b border-warm-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center group-hover:bg-sage-200 transition-colors">
                <Leaf className="w-5 h-5 text-sage-700" />
              </div>
              <span className="font-display text-xl text-warm-900">SkinCare Companion</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/auth/login"
                className="text-sm text-warm-600 hover:text-warm-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding/fully-ai"
                className="px-6 py-3 bg-sage-600 text-white text-sm font-medium rounded-full hover:bg-sage-700 transition-all shadow-md hover:shadow-lg"
              >
                Begin Consultation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium */}
      <main>
        <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-24 pb-32">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-warm-500 font-medium mb-6">
              Personalized Skincare Intelligence
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold text-warm-900 mb-8 leading-[1.1]">
              Your skin,
              <br />
              <span className="text-sage-700">understood.</span>
            </h1>
            <p className="text-lg md:text-xl text-warm-600 mb-12 leading-relaxed max-w-2xl">
              A sophisticated AI consultation that creates a deeply personalized skincare strategy.
              No generic routines. Just intelligent guidance tailored to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/onboarding/fully-ai"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-sage-600 text-white text-base font-medium rounded-full hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Your Consultation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="inline-flex items-center justify-center px-8 py-4 border border-warm-300 text-warm-700 text-base font-medium rounded-full hover:border-sage-500 hover:text-sage-700 transition-all">
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Features - Minimal Grid */}
        <section className="bg-white border-y border-warm-200 py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-16">
              <Feature
                number="01"
                title="Intelligent Analysis"
                description="Advanced AI consultation that understands your unique skin behavior, lifestyle, and goals."
              />
              <Feature
                number="02"
                title="Expert Curation"
                description="Multi-expert framework drawing from dermatological science to create your strategy."
              />
              <Feature
                number="03"
                title="Adaptive Guidance"
                description="Evolves with you—continuous refinement based on your feedback and progress."
              />
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-warm-500 font-medium mb-4">
                The Approach
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-warm-900 mb-6">
                Beyond one-size-fits-all
              </h2>
              <p className="text-base text-warm-600 leading-relaxed mb-6">
                Your skin is unique. Generic archetypes and predefined categories
                can't capture its complexity. Our AI creates a truly individual profile
                based on your specific characteristics, environment, and needs.
              </p>
              <p className="text-base text-warm-600 leading-relaxed">
                The result: intelligent recommendations that actually work for you,
                not what worked for someone who vaguely shares your skin type.
              </p>
            </div>
            <div className="bg-sage-50 border border-sage-200 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-6">
                <Leaf className="w-10 h-10 text-sage-700" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-warm-900 mb-3">
                Personal Consultation
              </h3>
              <p className="text-sm text-warm-600 mb-8">
                3-5 minute conversation with our AI specialist
              </p>
              <Link
                href="/onboarding/fully-ai"
                className="inline-flex items-center gap-2 text-sage-700 font-medium hover:text-sage-800 transition-colors"
              >
                Begin now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Medical Disclaimer */}
        <section className="bg-white border-t border-warm-200 py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-warm-500 font-medium mb-4">
              Important Notice
            </p>
            <p className="text-sm text-warm-600 max-w-2xl mx-auto leading-relaxed">
              This service provides cosmetic guidance and product recommendations only.
              For medical concerns, skin conditions, or treatments, please consult
              a licensed dermatologist.
            </p>
          </div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-warm-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-sage-700" />
              </div>
              <span className="text-sm text-warm-500">SkinCare Companion</span>
            </div>
            <p className="text-xs text-warm-500">
              © 2025 All rights reserved. Not medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * Feature Component - Minimal numbered style
 */
function Feature({
  number,
  title,
  description
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div>
      <p className="text-xs text-warm-400 font-medium mb-4">{number}</p>
      <h3 className="text-xl font-display font-semibold text-warm-900 mb-3">{title}</h3>
      <p className="text-sm text-warm-600 leading-relaxed">{description}</p>
    </div>
  )
}
