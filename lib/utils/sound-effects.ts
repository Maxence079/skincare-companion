/**
 * Sound Effects System
 * Subtle audio feedback for user interactions
 * All sounds are optional and can be toggled by user
 */

/**
 * Sound types
 */
export type SoundType =
  | 'click'           // Button clicks
  | 'success'         // Success actions
  | 'error'           // Error states
  | 'notification'    // Notifications
  | 'message-sent'    // Message sent
  | 'message-received'// AI response received
  | 'celebration'     // Progress milestones
  | 'toggle-on'       // Toggle switches on
  | 'toggle-off'      // Toggle switches off
  | 'swipe';          // Swipe gestures

/**
 * Sound preferences stored in localStorage
 */
const SOUND_ENABLED_KEY = 'skincare-ai-sound-enabled';
const SOUND_VOLUME_KEY = 'skincare-ai-sound-volume';

/**
 * Get sound enabled preference
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored === null ? true : stored === 'true'; // Default enabled
}

/**
 * Set sound enabled preference
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
}

/**
 * Get volume preference (0-1)
 */
export function getSoundVolume(): number {
  if (typeof window === 'undefined') return 0.3;
  const stored = localStorage.getItem(SOUND_VOLUME_KEY);
  return stored ? parseFloat(stored) : 0.3; // Default 30%
}

/**
 * Set volume preference (0-1)
 */
export function setSoundVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, volume));
  localStorage.setItem(SOUND_VOLUME_KEY, clamped.toString());
}

/**
 * Simple audio context for generating tones
 * More lightweight than loading audio files
 */
class SoundGenerator {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return this.audioContext;
  }

  /**
   * Play a tone
   */
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Smooth attack and release
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Attack
    gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Play multiple tones (chord/sequence)
   */
  private playChord(frequencies: number[], duration: number, volume: number = 0.3): void {
    frequencies.forEach(freq => {
      this.playTone(freq, duration, 'sine', volume / frequencies.length);
    });
  }

  /**
   * Sound definitions - all subtle and pleasant
   */
  public play(type: SoundType): void {
    if (!isSoundEnabled()) return;

    const volume = getSoundVolume();

    switch (type) {
      case 'click':
        // Subtle click - single tone
        this.playTone(800, 0.05, 'sine', volume * 0.3);
        break;

      case 'success':
        // Pleasant ascending chord
        this.playChord([523, 659, 784], 0.15, volume * 0.4);
        break;

      case 'error':
        // Gentle descending tone
        this.playTone(400, 0.1, 'sine', volume * 0.3);
        setTimeout(() => {
          this.playTone(350, 0.1, 'sine', volume * 0.3);
        }, 80);
        break;

      case 'notification':
        // Subtle two-tone
        this.playTone(600, 0.08, 'sine', volume * 0.3);
        setTimeout(() => {
          this.playTone(700, 0.08, 'sine', volume * 0.3);
        }, 70);
        break;

      case 'message-sent':
        // Soft swoosh up
        this.playTone(500, 0.12, 'sine', volume * 0.25);
        setTimeout(() => {
          this.playTone(600, 0.08, 'sine', volume * 0.2);
        }, 50);
        break;

      case 'message-received':
        // Gentle notification
        this.playTone(650, 0.1, 'sine', volume * 0.3);
        break;

      case 'celebration':
        // Happy ascending arpeggio
        [523, 659, 784, 1047].forEach((freq, i) => {
          setTimeout(() => {
            this.playTone(freq, 0.15, 'sine', volume * 0.3);
          }, i * 80);
        });
        break;

      case 'toggle-on':
        // Soft high tone
        this.playTone(800, 0.08, 'sine', volume * 0.25);
        break;

      case 'toggle-off':
        // Soft low tone
        this.playTone(400, 0.08, 'sine', volume * 0.25);
        break;

      case 'swipe':
        // Quick swoosh
        this.playTone(600, 0.06, 'sine', volume * 0.2);
        break;

      default:
        break;
    }
  }
}

// Singleton instance
let soundGenerator: SoundGenerator | null = null;

/**
 * Play a sound effect
 */
export function playSound(type: SoundType): void {
  if (typeof window === 'undefined') return;

  if (!soundGenerator) {
    soundGenerator = new SoundGenerator();
  }

  try {
    soundGenerator.play(type);
  } catch (e) {
    console.warn('Failed to play sound:', e);
  }
}

/**
 * Preload audio context (call on first user interaction)
 */
export function initializeSounds(): void {
  if (typeof window === 'undefined') return;
  if (!soundGenerator) {
    soundGenerator = new SoundGenerator();
  }
}
