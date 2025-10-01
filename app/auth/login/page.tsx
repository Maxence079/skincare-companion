/**
 * Login Page
 *
 * User authentication with email/password via Supabase Auth
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Leaf, Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) {
        setError(loginError.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed_at')
          .eq('id', data.user.id)
          .single()

        if (profile?.onboarding_completed_at) {
          // Onboarding complete → go to dashboard
          router.push('/dashboard')
        } else {
          // Onboarding not complete → continue onboarding
          router.push('/onboarding/fully-ai')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <div className="bg-white border border-warm-200 rounded-2xl shadow-sm p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center group-hover:bg-sage-200 transition-colors">
              <Leaf className="w-5 h-5 text-sage-700" />
            </div>
            <span className="font-display text-xl text-warm-900">SkinCare Companion</span>
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-warm-500 font-medium mb-4">
            Welcome Back
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-warm-900 mb-3">
            Continue your journey
          </h1>
          <p className="text-sm text-warm-600">
            Log in to access your personalized skincare profile
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-terracotta-50 border border-terracotta-200 rounded-xl">
            <p className="text-sm text-terracotta-900">{error}</p>
          </div>
        )}

        {/* Social Auth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true)
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/onboarding/fully-ai`,
                },
              })
            }}
            className="w-full h-12 px-4 border border-warm-300 rounded-full font-medium text-warm-700 hover:border-sage-500 hover:text-sage-700 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={async () => {
              setIsLoading(true)
              await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                  redirectTo: `${window.location.origin}/onboarding/fully-ai`,
                },
              })
            }}
            className="w-full h-12 px-4 border border-warm-300 rounded-full font-medium text-warm-700 hover:border-sage-500 hover:text-sage-700 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-warm-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="px-4 bg-white text-warm-500 font-medium">Or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-wider font-medium text-warm-600 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 h-12 border border-warm-300 rounded-full focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition-all text-warm-900 placeholder:text-warm-400"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-xs uppercase tracking-wider font-medium text-warm-600">
                Password
              </label>
              <Link
                href="/auth/reset-password"
                className="text-xs text-sage-600 hover:text-sage-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-4 h-12 border border-warm-300 rounded-full focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition-all text-warm-900"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-6 bg-sage-600 text-white rounded-full font-medium hover:bg-sage-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-warm-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="px-4 bg-white text-warm-500 font-medium">New to SkinCare Companion?</span>
          </div>
        </div>

        {/* Sign Up Link */}
        <Link
          href="/auth/signup"
          className="block w-full h-12 border border-sage-600 text-sage-600 rounded-full font-medium hover:bg-sage-50 transition-all text-center flex items-center justify-center"
        >
          Create an Account
        </Link>
      </div>
    </div>
  )
}