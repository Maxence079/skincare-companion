/**
 * useRadioGroup Hook
 * Implements WCAG-compliant keyboard navigation for radio groups
 * WCAG 2.1.1 Keyboard - Arrow key navigation required for radio groups
 */

import { useRef, useCallback, KeyboardEvent } from 'react';

interface UseRadioGroupOptions<T> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function useRadioGroup<T extends string>({
  options,
  value,
  onChange,
  orientation = 'vertical'
}: UseRadioGroupOptions<T>) {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent, currentValue: T) => {
    const currentIndex = options.indexOf(currentValue);
    let nextIndex = currentIndex;

    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex]);
        break;

      case prevKey:
        e.preventDefault();
        nextIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
        onChange(options[nextIndex]);
        break;

      case 'Home':
        e.preventDefault();
        onChange(options[0]);
        break;

      case 'End':
        e.preventDefault();
        onChange(options[options.length - 1]);
        break;

      case ' ':
      case 'Enter':
        e.preventDefault();
        onChange(currentValue);
        break;
    }
  }, [options, onChange, orientation]);

  return {
    groupRef,
    getRadioProps: (optionValue: T) => ({
      onKeyDown: (e: KeyboardEvent) => handleKeyDown(e, optionValue),
      tabIndex: value === optionValue ? 0 : -1,
    }),
  };
}
