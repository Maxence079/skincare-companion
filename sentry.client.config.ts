/**
 * Sentry Client Configuration
 * Error tracking and performance monitoring for browser
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod

  // Session Replay (captures user sessions for debugging)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    Sentry.browserTracingIntegration({
      // Enable automatic instrumentation
      traceFetch: true,
      traceXHR: true,
    }),
    Sentry.replayIntegration({
      // Privacy settings
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
  ],

  // Filter out sensitive data before sending
  beforeSend(event, hint) {
    // Remove sensitive data from request
    if (event.request) {
      delete event.request?.cookies

      if (event.request.data) {
        // Redact API keys and tokens
        const data = event.request.data as any
        if (data.apiKey) data.apiKey = '[REDACTED]'
        if (data.token) data.token = '[REDACTED]'
        if (data.password) data.password = '[REDACTED]'
      }
    }

    // Don't send events if no DSN configured
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null
    }

    return event
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Network errors (user's connection issues)
    'NetworkError',
    'Network request failed',
  ],
})
