'use client';

/**
 * Skip Navigation Links
 * Allows keyboard users to skip repetitive content
 * WCAG 2.4.1 Bypass Blocks - Level A
 */

export function SkipNavigation() {
  return (
    <>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-to-main" style={{ left: '140px' }}>
        Skip to navigation
      </a>
      <a href="#footer" className="skip-to-main" style={{ left: '320px' }}>
        Skip to footer
      </a>
    </>
  );
}
