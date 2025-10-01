# 🎨 Design System — Quick Reference

**For developers who need colors/tokens fast**

---

## 🎯 Most Used Colors

```tsx
// Primary Actions
bg-sage-500 text-white         // Primary buttons
border-sage-500 text-sage-600  // Secondary buttons

// Backgrounds
bg-white                       // Cards
bg-warm-50                     // Page backgrounds
bg-sage-500/5                  // Subtle tints

// Text
text-warm-900                  // Headings
text-warm-700                  // Body text
text-warm-500                  // Secondary text

// Accents
text-terracotta-500           // Highlights
bg-gradient-to-r from-terracotta-500 to-sage-500  // Progress bars
```

---

## 🔘 Common Button Classes

```tsx
// Primary CTA
className="bg-sage-500 hover:bg-sage-600 text-white px-6 py-3.5 rounded-lg shadow-md transition-all"

// Secondary
className="border border-sage-500 text-sage-600 hover:bg-sage-500/5 px-6 py-3.5 rounded-lg transition-all"

// Ghost
className="text-sage-600 hover:bg-warm-50 px-4 py-2 rounded-lg transition-colors"
```

---

## 📦 Common Card Classes

```tsx
// Standard card
className="bg-white border border-warm-100 rounded-lg p-6 shadow-sm"

// Interactive card
className="bg-white border-2 border-warm-100 hover:border-sage-500 rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"

// Premium card (archetypes)
className="bg-gradient-to-b from-warm-50 to-white border-2 border-sage-500 rounded-xl p-8 shadow-sage-glow"
```

---

## 📝 Typography Classes

```tsx
// Display (emotional, serif)
className="font-display text-display-xl text-warm-900"      // 32px
className="font-display text-display-l text-warm-900"       // 28px

// Headings (UI, sans)
className="text-h1 font-semibold text-warm-900"             // 20px
className="text-h2 font-semibold text-warm-800"             // 16px

// Body text
className="text-body-lg text-warm-700"                      // 16px
className="text-body text-warm-700"                         // 14px
className="text-body-sm text-warm-500"                      // 12px
```

---

## 🎨 Color Palette Cheat Sheet

### Brand
- **Sage 500:** `#6B7F6E` — Primary brand
- **Terracotta 500:** `#B8826B` — Accent
- **Warm 50:** `#F5F3F0` — Background
- **Warm 700:** `#5A564F` — Body text
- **Warm 900:** `#2E2B27` — Headings

### Semantic
- **Success:** `#4A7C59` — Green
- **Error:** `#B44C3D` — Red
- **Warning:** `#C89B5A` — Amber
- **Info:** `#5F7A8A` — Blue-gray

---

## 📏 Spacing

```
gap-sm    (8px)   — Tight spacing
gap-md    (16px)  — Default spacing
gap-lg    (24px)  — Section spacing
gap-xl    (32px)  — Major sections

p-md      (16px)  — Standard card padding
p-lg      (24px)  — Comfortable padding
p-xl      (32px)  — Hero padding
```

---

## 🔘 Border Radius

```
rounded-lg    (8px)    — Default (cards, buttons)
rounded-xl    (16px)   — Large cards
rounded-full  (9999px) — Pills, avatars
```

---

## 🎭 Shadows

```
shadow-sm          — Subtle (default cards)
shadow-md          — Elevated (hover states)
shadow-lg          — Prominent (modals)
shadow-sage-glow   — Colored glow (CTAs)
```

---

## ⚡ Quick Component Copy-Paste

### Button
```tsx
<button className="bg-sage-500 hover:bg-sage-600 text-white px-6 py-3.5 rounded-lg shadow-md transition-all font-medium">
  Click Me
</button>
```

### Input
```tsx
<input
  type="text"
  className="w-full bg-white border border-warm-100 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/15 rounded-lg px-4 py-3.5 text-base text-warm-900 transition-all"
  placeholder="Enter text"
/>
```

### Card
```tsx
<div className="bg-white border border-warm-100 rounded-lg p-6 shadow-sm">
  Card content
</div>
```

### Badge
```tsx
<span className="inline-flex items-center bg-sage-500/10 text-sage-700 px-3 py-1.5 rounded-full text-sm font-medium">
  Badge
</span>
```

### Progress Bar
```tsx
<div className="h-2 w-full bg-warm-100 rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-terracotta-500 to-sage-500 transition-all duration-400" style={{width: '60%'}} />
</div>
```

---

## 🎨 Gradient Backgrounds

```tsx
// Premium organic gradient (pages)
className="bg-gradient-to-br from-warm-50 via-white to-sage-50"

// Subtle card gradient
className="bg-gradient-to-b from-warm-50 to-white"

// Brand gradient (text)
className="bg-gradient-to-r from-sage-600 to-terracotta-500 bg-clip-text text-transparent"
```

---

## 🔍 Hover & Focus States

```tsx
// Button hover
hover:bg-sage-600 hover:shadow-lg active:scale-98

// Card hover
hover:border-sage-500 hover:shadow-md hover:-translate-y-0.5

// Input focus
focus:border-sage-500 focus:ring-2 focus:ring-sage-500/15 focus:outline-none

// Link hover
hover:text-sage-600 hover:underline underline-offset-4
```

---

## 📱 Responsive Utilities

```tsx
// Mobile first
className="text-base md:text-lg lg:text-xl"
className="p-md md:p-lg lg:p-xl"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

---

## ✅ Accessibility Quick Checks

- ✓ Buttons: min-height 44px (`py-3.5` = 14px × 2 = 28px + content)
- ✓ Text: min 16px for body (`text-base` or `text-body-lg`)
- ✓ Focus: all interactive elements have `:focus-visible:ring-2`
- ✓ Contrast: use `text-warm-700` or darker for body text

---

**Need more details?** See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
