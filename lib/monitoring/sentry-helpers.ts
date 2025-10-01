/**
 * Sentry monitoring helpers
 * Stub implementation - integrate with @sentry/nextjs when ready
 */

export function captureException(error: Error, context?: Record<string, any>) {
  // In production, this would send to Sentry
  console.error('[Sentry] Exception:', error.message, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  // In production, this would send to Sentry
  console.log(`[Sentry] ${level.toUpperCase()}: ${message}`);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  // In production, this would set Sentry user context
  console.log('[Sentry] User context set:', user.id);
}

export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}) {
  // In production, this would add Sentry breadcrumb
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry] Breadcrumb:', breadcrumb.message);
  }
}

// Alias for captureException
export function captureError(error: Error, context?: Record<string, any>) {
  captureException(error, context);
}
