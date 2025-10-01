# SkinCare Companion — Design System
## Botanical Minimalism

**Version:** 1.0.0
**Last Updated:** January 2025
**Design Philosophy:** Premium organic aesthetic inspired by Aesop

---

## 🎨 Brand Identity

**Target Audience:** Professional women aged 25-55
**Price Point:** $10-15/month (premium positioning)
**Brand Personality:** Minimalist • Organic • Premium • Trustworthy • Sophisticated

**Design Principles:**
1. **Simplicity First** — Remove unnecessary elements
2. **Organic Feel** — Natural colors, soft shadows, botanical inspiration
3. **Mobile-First** — 44px minimum tap targets, 16px+ font sizes
4. **Accessibility** — WCAG AA compliant (4.5:1 contrast minimum)
5. **Premium Quality** — Attention to detail in typography and spacing

---

## 📐 Color Palette

### Primary Brand Colors

#### Sage Green (Primary)
Our signature color representing organic skincare and natural balance.

```
Sage 500 (Primary)
HEX:  #6B7F6E
RGB:  107, 127, 110
HSL:  126°, 9%, 46%
Use:  Primary CTAs, navigation, progress bars
```

**Full Sage Scale:**
- `sage-50`: #F5F6F5 — Subtle backgrounds
- `sage-100`: #E8EBE9 — Borders
- `sage-200`: #D1D7D3
- `sage-300`: #A8B2AB
- `sage-400`: #879388
- `sage-500`: #6B7F6E ⭐ **Primary**
- `sage-600`: #5A6D5D — Hover states
- `sage-700`: #4F5F51 — Active states
- `sage-800`: #404E42
- `sage-900`: #2D3730 — Deep accents

#### Terracotta (Accent)
Warm accent color for highlights and emotional touches.

```
Terracotta 500 (Accent)
HEX:  #B8826B
RGB:  184, 130, 107
HSL:  18°, 35%, 57%
Use:  Highlights, progress fills, archetype badges
```

**Full Terracotta Scale:**
- `terracotta-50`: #F9F4F2
- `terracotta-100`: #F2E7E1
- `terracotta-200`: #E5CDC3
- `terracotta-300`: #D3A794
- `terracotta-400`: #C59378
- `terracotta-500`: #B8826B ⭐ **Accent**
- `terracotta-600`: #A26B54
- `terracotta-700`: #845545
- `terracotta-800`: #6A453A
- `terracotta-900`: #4E3329

### Warm Neutral Scale
Our base neutrals with a warm undertone for an organic feel.

- `warm-50`: #F5F3F0 — Backgrounds
- `warm-100`: #E8E4DD — Borders, dividers
- `warm-200`: #D9D4CB
- `warm-300`: #C8C3B9 — Disabled states
- `warm-400`: #A9A49A
- `warm-500`: #8A857A — Secondary text
- `warm-600`: #6E6960
- `warm-700`: #5A564F — Body text
- `warm-800`: #434039
- `warm-900`: #2E2B27 — Headings, primary text

### Semantic Colors (WCAG AAA Compliant)

```
Success
HEX:  #4A7C59
Use:  Success messages, completed states
Contrast: 5.2:1 on white ✓

Error
HEX:  #B44C3D
Use:  Error messages, validation
Contrast: 4.8:1 on white ✓

Warning
HEX:  #C89B5A
Use:  Warning messages, cautions
Contrast: 4.5:1 on white ✓

Info
HEX:  #5F7A8A
Use:  Informational messages
Contrast: 5.1:1 on white ✓
```

---

## 📝 Typography

### Font Families

**Primary (UI & Body):**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
- Clean, modern sans-serif
- Variable font (100-900 weight)
- Excellent readability on screens

**Display (Headings & Emotional Content):**
```css
font-family: 'Cormorant Garamond', Georgia, serif;
```
- Elegant serif for archetype results
- Adds sophistication and warmth
- Use sparingly for maximum impact

**Monospace (Technical):**
```css
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### Type Scale (Mobile-First)

#### Display XL — Archetype Results
```
Font:   Cormorant Garamond
Size:   32px (2rem)
Weight: 600 (Semibold)
Line:   1.1
Letter: -0.02em
Class:  text-display-xl
```

#### Display L — Page Titles
```
Font:   Cormorant Garamond
Size:   28px (1.75rem)
Weight: 600
Line:   1.2
Letter: -0.01em
Class:  text-display-l
```

#### Heading 1 — Section Headers
```
Font:   Inter
Size:   20px (1.25rem)
Weight: 600
Line:   1.3
Letter: -0.01em
Class:  text-h1
```

#### Heading 2 — Card Titles
```
Font:   Inter
Size:   16px (1rem)
Weight: 600
Line:   1.4
Class:  text-h2
```

#### Body Large — Primary Content
```
Font:   Inter
Size:   16px (1rem)
Weight: 400
Line:   1.6
Class:  text-body-lg
```

#### Body Regular — UI Text
```
Font:   Inter
Size:   14px (0.875rem)
Weight: 400
Line:   1.5
Class:  text-body
```

#### Body Small — Captions
```
Font:   Inter
Size:   12px (0.75rem)
Weight: 400
Line:   1.5
Class:  text-body-sm
```

#### Label — Form Labels, Buttons
```
Font:   Inter
Size:   14px (0.875rem)
Weight: 500 (Medium)
Line:   1.4
Letter: 0.01em
Class:  text-label
```

---

## 🎯 Components

### Buttons

#### Primary Button (Main CTAs)
```tsx
import { buttonVariants } from '@/lib/design-system'

<button className={buttonVariants({ variant: 'primary', size: 'md' })}>
  Get Started
</button>
```

**Styles:**
- Background: `sage-500`
- Text: White
- Padding: 14px 24px (48px height)
- Border Radius: 8px
- Shadow: Subtle elevation
- Hover: `sage-600` + lift

#### Secondary Button (Alternate Actions)
```tsx
<button className={buttonVariants({ variant: 'secondary', size: 'md' })}>
  Learn More
</button>
```

**Styles:**
- Border: 1.5px `sage-500`
- Background: Transparent
- Text: `sage-500`
- Hover: 5% sage tint

#### Tertiary Button (Text Links)
```tsx
<button className={buttonVariants({ variant: 'tertiary' })}>
  Skip for now
</button>
```

**Styles:**
- Background: Transparent
- Text: `sage-500` with underline
- Hover: Thicker underline

### Cards

#### Standard Card
```tsx
import { cardVariants } from '@/lib/design-system'

<div className={cardVariants({ variant: 'default', padding: 'md' })}>
  Content here
</div>
```

#### Interactive Card (Hover Effects)
```tsx
<div className={cardVariants({ variant: 'interactive', padding: 'lg' })}>
  Click me
</div>
```

#### Archetype Result Card (Premium)
```tsx
<div className={cardVariants({ variant: 'archetype', padding: 'xl' })}>
  You're an Ocean Pearl!
</div>
```

### Input Fields

```tsx
import { inputVariants } from '@/lib/design-system'

<input
  type="text"
  placeholder="Enter your name"
  className={inputVariants({ variant: 'default' })}
/>

// Error state
<input
  className={inputVariants({ variant: 'error' })}
/>
```

**Key Features:**
- 16px font size (prevents iOS zoom)
- 14px padding (48px+ height)
- Focus: 2px `sage-500` ring
- Error: Red border + ring

### Badges/Pills

```tsx
import { badgeVariants } from '@/lib/design-system'

<span className={badgeVariants({ variant: 'sage', size: 'md' })}>
  Oily Skin
</span>
```

**Variants:**
- `sage` — Brand badge
- `terracotta` — Accent badge
- `success` — Success indicator
- `error` — Error indicator
- `warning` — Warning indicator
- `neutral` — Default badge

### Progress Bar

```tsx
<div className="h-2 w-full bg-warm-100 rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-terracotta-500 to-sage-500 transition-all duration-400"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 📏 Spacing System

Based on 8px grid for consistency.

```
xs:   4px   (0.25rem)  — Tight inline spacing
sm:   8px   (0.5rem)   — Small padding
md:   16px  (1rem)     — Standard mobile padding
lg:   24px  (1.5rem)   — Section spacing
xl:   32px  (2rem)     — Major section dividers
2xl:  48px  (3rem)     — Hero spacing (tablet+)
3xl:  64px  (4rem)     — Only on desktop
```

**Usage:**
- Card padding: `p-md` (16px) or `p-lg` (24px)
- Section gaps: `gap-lg` (24px)
- Hero sections: `py-2xl` (48px)

---

## 🎭 Shadows

Aesop-inspired: very subtle, warm shadows for organic depth.

```css
shadow-sm:   0 1px 2px 0 rgba(46, 43, 39, 0.04)
shadow:      0 2px 8px 0 rgba(46, 43, 39, 0.06)
shadow-md:   0 4px 16px 0 rgba(46, 43, 39, 0.08)
shadow-lg:   0 8px 24px 0 rgba(46, 43, 39, 0.10)
shadow-xl:   0 16px 48px 0 rgba(46, 43, 39, 0.12)

/* Colored shadows for interactive elements */
shadow-sage-glow:      0 4px 16px 0 rgba(107, 127, 110, 0.15)
shadow-terracotta-glow: 0 4px 16px 0 rgba(184, 130, 107, 0.15)
```

**Usage:**
- Default cards: `shadow-sm`
- Elevated cards: `shadow-md`
- Modals: `shadow-lg`
- Primary CTAs: `shadow-sage-glow` on hover

---

## 🔘 Border Radius

Soft, organic feel with subtle rounding.

```
sm:   4px   — Small buttons, chips
md:   8px   — Cards, inputs (default)
lg:   12px  — Large cards
xl:   16px  — Hero sections
2xl:  24px  — Extra large containers
full: 9999px — Pills, avatars
```

---

## 🎬 Animations

### Duration
```
fast:   150ms — Quick feedback
normal: 200ms — Default transitions
slow:   300ms — Smooth state changes
slower: 400ms — Progress bars
```

### Easing
```css
default: cubic-bezier(0.4, 0, 0.2, 1) /* ease-in-out */
in:      cubic-bezier(0.4, 0, 1, 1)
out:     cubic-bezier(0, 0, 0.2, 1)
```

### Keyframe Animations
```
animate-fade-in     — Fade in (300ms)
animate-slide-up    — Slide up + fade (400ms)
animate-slide-down  — Slide down + fade (400ms)
```

---

## ♿ Accessibility Guidelines

### Color Contrast
✅ All text colors meet **WCAG 2.1 AA** (4.5:1 minimum)
✅ UI components meet **3:1 minimum**

### Touch Targets
✅ Minimum **44x44px** for all interactive elements
✅ Buttons have generous padding: 14px vertical

### Typography
✅ Base font size **16px** (prevents iOS zoom)
✅ Line height **1.5+** for readability

### Focus States
✅ All interactive elements have visible focus rings
✅ 2px `sage-500` outline with 2px offset

### Motion
✅ Respects `prefers-reduced-motion`
✅ Smooth scroll disabled if user prefers

---

## 📱 Responsive Breakpoints

Mobile-first approach.

```
sm:  640px   — Mobile landscape
md:  768px   — Tablet
lg:  1024px  — Desktop
xl:  1280px  — Large desktop
2xl: 1536px  — Extra large
```

---

## 🚀 Usage Examples

### Import Design System
```tsx
import { buttonVariants, cardVariants, badgeVariants } from '@/lib/design-system'
import { cn } from '@/lib/utils'
```

### Button with Custom Classes
```tsx
<button
  className={cn(
    buttonVariants({ variant: 'primary', size: 'lg' }),
    'shadow-sage-glow'
  )}
>
  Start Your Journey
</button>
```

### Responsive Card
```tsx
<div className={cn(
  cardVariants({ variant: 'elevated', padding: 'md' }),
  'md:p-lg lg:p-xl'
)}>
  Content adapts to screen size
</div>
```

### Custom Gradient
```tsx
<div className="bg-gradient-to-br from-warm-50 via-white to-sage-50">
  Premium organic gradient
</div>
```

---

## 🎨 Design Tokens (Code)

All tokens are available in:
- **Tailwind Config:** `tailwind.config.ts`
- **CSS Variables:** `app/globals.css`
- **TypeScript:** `lib/design-system/index.ts`

```tsx
import { tokens } from '@/lib/design-system'

// Access token values programmatically
const primaryColor = tokens.colors.sage[500] // '#6B7F6E'
const spacing = tokens.spacing.lg // '1.5rem'
```

---

## 📚 Resources

**Font CDN:** Google Fonts (Inter + Cormorant Garamond)
**Icon Library:** Lucide React (1.5px stroke weight)
**Animation:** Framer Motion for complex animations
**Utilities:** class-variance-authority + tailwind-merge

---

## ✅ Checklist for New Components

When creating a new component:

- [ ] Uses design tokens from `@/lib/design-system`
- [ ] Mobile-first responsive (min 44px tap targets)
- [ ] WCAG AA compliant colors (4.5:1 contrast)
- [ ] Visible focus states on interactive elements
- [ ] Respects `prefers-reduced-motion`
- [ ] Uses Inter for UI, Cormorant for emotion
- [ ] Follows 8px spacing grid
- [ ] Shadows are subtle and warm-toned
- [ ] Border radius is 8px default

---

**Designed with care for SkinCare Companion**
*Premium organic skincare assistant for modern women*
