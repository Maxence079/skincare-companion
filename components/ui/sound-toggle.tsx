/**
 * Sound Toggle Component
 * Allows users to enable/disable sound effects
 */

'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { isSoundEnabled, setSoundEnabled, playSound } from '@/lib/utils/sound-effects';
import { interactive } from '@/lib/utils/animations';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function SoundToggle({ className, showLabel = true }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe
  useEffect(() => {
    setMounted(true);
    setEnabled(isSoundEnabled());
  }, []);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    setSoundEnabled(newValue);

    // Play sound to demonstrate
    if (newValue) {
      playSound('toggle-on');
    }
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <motion.button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        "bg-white border-2 border-sage-200",
        "hover:border-sage-300 transition-colors",
        className
      )}
      {...interactive.subtle}
      aria-label={enabled ? 'Disable sound effects' : 'Enable sound effects'}
      aria-pressed={enabled}
    >
      <motion.div
        animate={{
          scale: enabled ? 1 : 0.9,
          opacity: enabled ? 1 : 0.5
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {enabled ? (
          <Volume2 className="w-5 h-5 text-sage-600" />
        ) : (
          <VolumeX className="w-5 h-5 text-slate-400" />
        )}
      </motion.div>

      {showLabel && (
        <span className={cn(
          "text-sm font-medium transition-colors",
          enabled ? "text-sage-900" : "text-slate-400"
        )}>
          {enabled ? 'Sound On' : 'Sound Off'}
        </span>
      )}

      {/* Toggle indicator */}
      <div
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors",
          enabled ? "bg-sage-500" : "bg-slate-300"
        )}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
          animate={{
            x: enabled ? 20 : 4
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
        />
      </div>
    </motion.button>
  );
}
