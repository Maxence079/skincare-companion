/**
 * Signup Page
 *
 * User registration with email/password via Supabase Auth
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Leaf, Mail, Lock, User, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      // Sign up with Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (signupError) {
        setError(signupError.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: formData.email,
            full_name: formData.fullName,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't block signup if profile creation fails
        }

        // Success! Show confirmation message
        setSuccess(true)

        // Redirect to onboarding after 2 seconds
        setTimeout(() => {
          router.push('/onboarding/fully-ai')
        }, 2000)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white border border-warm-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-8 h-8 text-sage-700" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-warm-900 mb-3">
            Welcome aboard
          </h2>
          <p className="text-sm text-warm-600 mb-6">
            Your account has been created successfully.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-warm-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to consultation...
          </div>
        </div>
      </div>
    )
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
            Begin Your Journey
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-warm-900 mb-3">
            Create your account
          </h1>
          <p className="text-sm text-warm-600">
            Start your personalized skincare consultation
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
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs uppercase tracking-wider font-medium text-warm-600 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-11 pr-4 h-12 border border-warm-300 rounded-full focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition-all text-warm-900 placeholder:text-warm-400"
                placeholder="Jane Doe"
                required
              />
            </div>
          </div>

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
            <label htmlFor="password" className="block text-xs uppercase tracking-wider font-medium text-warm-600 mb-2">
              Password
            </label>
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
                minLength={6}
              />
            </div>
            <p className="text-xs text-warm-500 mt-2 ml-4">Must be at least 6 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-wider font-medium text-warm-600 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-warm-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-sage-600 hover:text-sage-700 font-medium">
              Log in
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className="mt-6 text-center">
          <p className="text-xs text-warm-500">
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:text-warm-700">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-warm-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}