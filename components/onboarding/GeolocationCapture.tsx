'use client';

import { useState, useEffect } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationCaptureProps {
  onCaptured: (data: GeolocationData) => void;
  onDismissed: () => void;
  autoRequest?: boolean;
}

export function GeolocationCapture({
  onCaptured,
  onDismissed,
  autoRequest = false
}: GeolocationCaptureProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser');
      return;
    }

    setStatus('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('granted');
        onCaptured({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (err) => {
        setStatus('denied');

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission was denied. We\'ll continue without environmental data.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
        }

        // Auto-dismiss after showing error
        setTimeout(() => onDismissed(), 3000);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // Accept cached positions up to 5 minutes old
      }
    );
  };

  useEffect(() => {
    if (autoRequest && status === 'idle') {
      requestGeolocation();
    }
  }, [autoRequest, status]);

  // Don't show anything if permission already granted
  if (status === 'granted') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        {status === 'requesting' ? (
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
        ) : (
          <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {status === 'requesting' ? 'Getting your location...' :
             status === 'denied' || status === 'error' ? 'Location unavailable' :
             'Personalize your experience'}
          </h3>

          {status === 'denied' || status === 'error' ? (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {error}
            </p>
          ) : status === 'requesting' ? (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              This helps us understand your climate and environment
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Share your location to get recommendations tailored to your climate, UV index, and pollution levels.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={requestGeolocation}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  Share Location
                </button>
                <button
                  onClick={onDismissed}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>

        {(status === 'denied' || status === 'error') && (
          <button
            onClick={onDismissed}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {status === 'idle' && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex-shrink-0 mt-0.5">🔒</div>
            <p>
              Your location is only used to fetch local environmental data. It's never stored or shared.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to get geolocation data
 */
export function useGeolocation() {
  const [data, setData] = useState<GeolocationData | null>(null);
  const [requested, setRequested] = useState(false);

  const capture = (geolocationData: GeolocationData) => {
    setData(geolocationData);
  };

  const dismiss = () => {
    setRequested(true);
  };

  return {
    geolocation: data,
    showCapture: !requested && !data,
    capture,
    dismiss
  };
}
