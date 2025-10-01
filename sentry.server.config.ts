/**
 * Sentry Server Configuration
 * Error tracking and performance monitoring for Node.js/Edge runtime
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profiling (detailed performance data)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(), // If using Prisma
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove env vars from context
    if (event.contexts?.runtime) {
      delete event.contexts.runtime
    }

    // Redact sensitive headers
    if (event.request?.headers) {
      const headers = event.request.headers as any
      if (headers.authorization) headers.authorization = '[REDACTED]'
      if (headers.cookie) headers.cookie = '[REDACTED]'
    }

    // Don't send if no DSN
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null
    }

    return event
  },
})
