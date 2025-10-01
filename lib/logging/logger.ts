/**
 * Simple logger utility
 * Replace with Winston, Pino, or your preferred logging library
 */

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta || '');
  },

  error: (message: string, error?: any, meta?: any) => {
    console.error(`[ERROR] ${message}`, error, meta || '');
  },

  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta || '');
  },

  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  },
};

// Additional exports for compatibility
export function logQuery(query: string, params?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB Query]', query, params);
  }
}

export function logError(message: string, error?: any, context?: any) {
  console.error(`[ERROR] ${message}`, error, context || '');
}

export function logEvent(event: string, data?: any) {
  console.log(`[EVENT] ${event}`, data || '');
}
