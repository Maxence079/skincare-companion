/**
 * Dashboard Page
 * Displays user's AI-generated skin profile from fully-driven onboarding
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Package, ChevronRight, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  skin_type: string;
  skin_concerns: string[];
  sensitivity_level: string;
  oil_production: string;
  hydration_level: string;
  pore_size: string;
  texture_issues: string[];
  climate_zone?: string;
  sun_exposure?: string;
  lifestyle_factors: {
    stress_level?: string;
    sleep_quality?: string;
    diet_quality?: string;
    exercise_frequency?: string;
  };
  current_routine: {
    morning?: string[];
    evening?: string[];
    frequency: string;
  };
  product_preferences: {
    textures_preferred?: string[];
    textures_disliked?: string[];
    ingredients_loved?: string[];
    ingredients_avoid?: string[];
  };
  profile_summary: string;
  key_recommendations: string[];
  archetype_id?: string;
  archetype_confidence?: number;
  confidence_scores: {
    overall: number;
    skin_type: number;
    concerns: number;
    routine: number;
  };
  conversation_metadata?: {
    message_count: number;
    duration_minutes: number;
    quality_score: number;
  };
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get profile from localStorage (saved from onboarding completion)
    const savedProfile = localStorage.getItem('userProfile');

    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to parse profile:', err);
        setError('Failed to load your profile');
      }
    } else {
      setError('No profile found. Please complete the onboarding first.');
    }

    setLoading(false);
  }, []);

  const handleRetakeAssessment = () => {
    // Clear saved profile and restart
    localStorage.removeItem('userProfile');
    router.push('/onboarding/fully-ai');
  };

  const handleViewProducts = () => {
    // TODO: Navigate to product recommendations page
    alert('Product recommendations coming soon! 🎉');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sage-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-warm-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-sage-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-terracotta-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-terracotta-600" />
          </div>
          <h2 className="text-2xl font-semibold text-warm-800 mb-2">No Profile Found</h2>
          <p className="text-warm-600 mb-6">{error || 'Complete your skincare assessment to get started.'}</p>
          <Button
            onClick={() => router.push('/onboarding/fully-ai')}
            className="w-full bg-sage-600 hover:bg-sage-700 text-white rounded-xl py-3"
          >
            Start Assessment
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <div className="bg-white border-b border-warm-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-warm-500 font-medium mb-2">
                Personal Profile
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-semibold text-warm-900">Your Skin Analysis</h1>
              <p className="text-sm text-warm-500 mt-2">
                Created {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <Button
              onClick={handleRetakeAssessment}
              variant="outline"
              className="border-warm-300 text-warm-700 hover:border-sage-500 hover:text-sage-700 rounded-full px-6 py-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        {/* Profile Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-sage-50 to-white rounded-2xl shadow-lg p-8 border-sage-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-warm-800 mb-2">Your Skin Story</h2>
                <p className="text-lg text-warm-700 italic leading-relaxed">
                  "{profile.profile_summary}"
                </p>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center gap-2 text-sm text-warm-600">
              <TrendingUp className="w-4 h-4" />
              <span>
                Profile Confidence: {Math.round(profile.confidence_scores.overall * 100)}%
              </span>
            </div>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Skin Analysis Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-white rounded-2xl shadow-lg p-6 h-full">
              <h3 className="text-xl font-semibold text-warm-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                Skin Analysis
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-warm-500 mb-1">Skin Type</div>
                  <div className="text-lg font-semibold text-warm-800 capitalize">
                    {profile.skin_type.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-warm-500 mb-1">Primary Concerns</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skin_concerns.map((concern, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-terracotta-100 text-terracotta-700 rounded-full text-sm font-medium"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-warm-200">
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Sensitivity</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.sensitivity_level}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Oil Production</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.oil_production.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Hydration</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.hydration_level.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Pore Size</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.pore_size}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Recommendations Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-terracotta-50 to-white rounded-2xl shadow-lg p-6 h-full border-terracotta-200">
              <h3 className="text-xl font-semibold text-warm-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-terracotta-500 rounded-full"></div>
                Personalized Recommendations
              </h3>

              <ul className="space-y-3">
                {profile.key_recommendations.map((rec, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 bg-terracotta-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-warm-700 leading-relaxed">{rec}</span>
                  </motion.li>
                ))}
              </ul>

              <Button
                onClick={handleViewProducts}
                className="w-full mt-6 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl py-3 font-medium"
              >
                <Package className="w-4 h-4 mr-2" />
                View Product Recommendations
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Lifestyle & Environment */}
        {(profile.climate_zone || profile.lifestyle_factors.stress_level) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-warm-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                Lifestyle & Environment
              </h3>

              <div className="grid md:grid-cols-4 gap-4">
                {profile.climate_zone && (
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Climate</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.climate_zone}
                    </div>
                  </div>
                )}
                {profile.sun_exposure && (
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Sun Exposure</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.sun_exposure}
                    </div>
                  </div>
                )}
                {profile.lifestyle_factors.stress_level && (
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Stress Level</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.lifestyle_factors.stress_level}
                    </div>
                  </div>
                )}
                {profile.lifestyle_factors.sleep_quality && (
                  <div>
                    <div className="text-xs text-warm-500 mb-1">Sleep Quality</div>
                    <div className="text-sm font-medium text-warm-800 capitalize">
                      {profile.lifestyle_factors.sleep_quality}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Current Routine */}
        {profile.current_routine.morning && profile.current_routine.morning.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-warm-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                Current Routine
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {profile.current_routine.morning && profile.current_routine.morning.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-warm-500 mb-2">Morning</div>
                    <ul className="space-y-1">
                      {profile.current_routine.morning.map((step, idx) => (
                        <li key={idx} className="text-warm-700 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-sage-400 rounded-full"></div>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {profile.current_routine.evening && profile.current_routine.evening.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-warm-500 mb-2">Evening</div>
                    <ul className="space-y-1">
                      {profile.current_routine.evening.map((step, idx) => (
                        <li key={idx} className="text-warm-700 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-sage-400 rounded-full"></div>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-warm-200">
                <div className="text-xs text-warm-500">
                  Routine Consistency: <span className="font-medium text-warm-700 capitalize">{profile.current_routine.frequency}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Product Preferences */}
        {(profile.product_preferences.ingredients_loved || profile.product_preferences.ingredients_avoid) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-warm-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                Product Preferences
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {profile.product_preferences.ingredients_loved && profile.product_preferences.ingredients_loved.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-warm-500 mb-2">Ingredients You Love</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.product_preferences.ingredients_loved.map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-xs font-medium"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.product_preferences.ingredients_avoid && profile.product_preferences.ingredients_avoid.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-warm-500 mb-2">Ingredients to Avoid</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.product_preferences.ingredients_avoid.map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-warm-100 text-warm-700 rounded-full text-xs font-medium"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Assessment Stats */}
        {profile.conversation_metadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-warm-50 rounded-2xl shadow-lg p-6 border-warm-200">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-warm-600">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">
                    {profile.conversation_metadata.message_count} messages exchanged
                  </span>
                </div>
                <div className="flex items-center gap-2 text-warm-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {profile.conversation_metadata.duration_minutes} minute conversation
                  </span>
                </div>
                <div className="flex items-center gap-2 text-warm-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">
                    {Math.round(profile.conversation_metadata.quality_score * 100)}% quality score
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
