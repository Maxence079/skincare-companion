# 🎨 Design System — Usage Guide

**Botanical Minimalism Design System for SkinCare Companion**

---

## Quick Start

```tsx
// 1. Import what you need
import { buttonVariants, cardVariants, badgeVariants } from '@/lib/design-system'
import { cn } from '@/lib/utils'

// 2. Use type-safe variants
<button className={buttonVariants({ variant: 'primary', size: 'lg' })}>
  Click Me
</button>

// 3. Combine with Tailwind classes
<button className={cn(
  buttonVariants({ variant: 'primary' }),
  'shadow-sage-glow'
)}>
  Enhanced Button
</button>
```

---

## Available Utilities

### Button Variants
```tsx
import { buttonVariants } from '@/lib/design-system'

// Variants: primary, secondary, tertiary, terracotta, ghost, outline
// Sizes: sm, md, lg, icon
// Options: fullWidth (boolean)

<button className={buttonVariants({
  variant: 'primary',
  size: 'lg',
  fullWidth: true
})}>
  Full Width CTA
</button>
```

### Card Variants
```tsx
import { cardVariants } from '@/lib/design-system'

// Variants: default, elevated, interactive, archetype
// Padding: none, sm, md, lg, xl

<div className={cardVariants({
  variant: 'elevated',
  padding: 'lg'
})}>
  Card content
</div>
```

### Input Variants
```tsx
import { inputVariants } from '@/lib/design-system'

// Variants: default, error, success

<input
  type="text"
  className={inputVariants({ variant: 'default' })}
/>
```

### Badge Variants
```tsx
import { badgeVariants } from '@/lib/design-system'

// Variants: sage, terracotta, success, error, warning, info, neutral
// Sizes: sm, md, lg

<span className={badgeVariants({
  variant: 'sage',
  size: 'md'
})}>
  Oily Skin
</span>
```

### Progress Bar Variants
```tsx
import { progressVariants, progressFillVariants } from '@/lib/design-system'

// Track variants: sm, md, lg
// Fill variants: gradient, sage, terracotta, success

<div className={progressVariants({ size: 'md' })}>
  <div
    className={progressFillVariants({ variant: 'gradient' })}
    style={{ width: '75%' }}
  />
</div>
```

### Alert Variants
```tsx
import { alertVariants } from '@/lib/design-system'

// Variants: info, success, warning, error, sage

<div className={alertVariants({ variant: 'success' })}>
  <span>Success message!</span>
</div>
```

---

## Design Tokens

Access design tokens programmatically:

```tsx
import { tokens } from '@/lib/design-system'

const primaryColor = tokens.colors.sage[500]        // '#6B7F6E'
const spacing = tokens.spacing.lg                   // '1.5rem'
const radius = tokens.borderRadius.md               // '0.5rem'
const fontFamily = tokens.typography.fontFamily.sans // 'Inter, ...'
```

---

## Tailwind Classes Reference

### Colors
```tsx
// Brand colors
bg-sage-500           // Primary green
bg-terracotta-500     // Accent terracotta
bg-warm-50            // Background

// Text colors
text-warm-900         // Headings
text-warm-700         // Body text
text-warm-500         // Secondary text

// Semantic
text-success          // Green
text-error            // Red
text-warning          // Amber
text-info             // Blue-gray
```

### Typography
```tsx
// Display (serif - emotional)
text-display-xl       // 32px - Archetype results
text-display-l        // 28px - Page titles

// Headings (sans - clarity)
text-h1               // 20px - Section headers
text-h2               // 16px - Card titles

// Body (sans)
text-body-lg          // 16px - Primary content
text-body             // 14px - UI text
text-body-sm          // 12px - Captions
text-label            // 14px - Form labels

// Font families
font-display          // Cormorant Garamond (serif)
font-sans             // Inter (default)
font-mono             // JetBrains Mono
```

### Spacing
```tsx
gap-xs, p-xs, m-xs    // 4px
gap-sm, p-sm, m-sm    // 8px
gap-md, p-md, m-md    // 16px
gap-lg, p-lg, m-lg    // 24px
gap-xl, p-xl, m-xl    // 32px
gap-2xl, p-2xl, m-2xl // 48px
gap-3xl, p-3xl, m-3xl // 64px
```

### Shadows
```tsx
shadow-sm             // Subtle
shadow                // Default
shadow-md             // Elevated
shadow-lg             // Prominent
shadow-xl             // Modal
shadow-sage-glow      // Colored glow (sage)
shadow-terracotta-glow // Colored glow (terracotta)
```

### Border Radius
```tsx
rounded-sm            // 4px
rounded               // 8px (default)
rounded-md            // 8px
rounded-lg            // 12px
rounded-xl            // 16px
rounded-2xl           // 24px
rounded-full          // 9999px
```

---

## Helper Functions

### Icon Sizes
```tsx
import { getIconSize } from '@/lib/design-system'

const size = getIconSize('md')  // Returns 20
// Sizes: xs(14), sm(16), md(20), lg(24), xl(32), 2xl(40)

// Usage with Lucide icons
<Icon size={getIconSize('md')} />
```

### Animations
```tsx
import { animations } from '@/lib/design-system'

<div className={animations.fadeIn}>
  Fade in animation
</div>

// Available: fadeIn, slideUp, slideDown
```

---

## Common Patterns

### Primary CTA Button
```tsx
<button className={cn(
  buttonVariants({ variant: 'primary', size: 'lg' }),
  'shadow-sage-glow'
)}>
  Get Started
</button>
```

### Interactive Card with Hover
```tsx
<div className={cardVariants({ variant: 'interactive', padding: 'lg' })}>
  <h3 className="text-h2 text-warm-900 mb-2">Title</h3>
  <p className="text-body text-warm-700">Description</p>
</div>
```

### Form Field with Label
```tsx
<div>
  <label className="block text-label text-warm-700 mb-2">
    Email Address
  </label>
  <input
    type="email"
    className={inputVariants({ variant: 'default' })}
    placeholder="you@example.com"
  />
</div>
```

### Progress Indicator
```tsx
<div>
  <div className="flex justify-between text-body mb-2">
    <span className="text-warm-700">Progress</span>
    <span className="font-semibold text-sage-600">75%</span>
  </div>
  <div className="h-2 w-full bg-warm-100 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-terracotta-500 to-sage-500 transition-all duration-400"
      style={{ width: '75%' }}
    />
  </div>
</div>
```

### Archetype Result Card
```tsx
<div className={cardVariants({ variant: 'archetype', padding: 'xl' })}>
  <div className="text-center space-y-4">
    <div className="text-7xl">🌊</div>
    <h1 className="text-display-xl font-display text-warm-900">
      You're an Ocean Pearl!
    </h1>
    <p className="text-body-lg text-warm-700">
      Combination skin with oily T-zone
    </p>
  </div>
</div>
```

---

## TypeScript Types

All variant props are fully typed:

```tsx
import type { ButtonVariants, CardVariants } from '@/lib/design-system'

// Use types for props
interface MyButtonProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
}

// TypeScript will autocomplete and validate
const variant: ButtonVariants['variant'] = 'primary' // ✅
const variant: ButtonVariants['variant'] = 'invalid' // ❌ Type error
```

---

## Composition with cn()

Combine variants with custom classes:

```tsx
import { cn } from '@/lib/utils'

<button className={cn(
  buttonVariants({ variant: 'primary' }),
  'mt-4',                    // Add margin
  'shadow-sage-glow',        // Add custom shadow
  isLoading && 'opacity-50'  // Conditional classes
)}>
  Submit
</button>
```

---

## Responsive Design

```tsx
// Mobile-first responsive classes
<div className={cn(
  cardVariants({ padding: 'md' }),
  'md:p-lg lg:p-xl'  // Larger padding on bigger screens
)}>
  Content
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
  {/* Cards */}
</div>
```

---

## Accessibility

All variants include accessible defaults:

- ✅ Focus rings on interactive elements
- ✅ WCAG AA compliant colors
- ✅ Semantic HTML support
- ✅ Touch-friendly sizes (44px+ targets)

```tsx
// Focus states are automatic
<button className={buttonVariants({ variant: 'primary' })}>
  Button has built-in focus ring
</button>

// Custom focus if needed
<div className="focus-visible:ring-2 focus-visible:ring-sage-500">
  Custom focus
</div>
```

---

## Full Documentation

- **[DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md)** — Complete design system guide
- **[DESIGN_QUICK_REFERENCE.md](../../docs/DESIGN_QUICK_REFERENCE.md)** — Copy-paste snippets
- **[COLOR_PALETTE.md](../../docs/COLOR_PALETTE.md)** — All colors with contrast ratios
- **[IMPLEMENTATION_SUMMARY.md](../../docs/IMPLEMENTATION_SUMMARY.md)** — What was implemented

---

## Component Showcase

View all components in action:

```tsx
import { ComponentShowcase } from '@/components/design-system/ComponentShowcase'

// Render this component to see all design system elements
<ComponentShowcase />
```

---

## Questions?

Check the full documentation or refer to existing components like:
- `components/onboarding/AdaptiveOnboarding.tsx` — Real-world usage example

**The design system is production-ready and fully typed for TypeScript!**
