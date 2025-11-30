# Allium Admin UI - Visual Design Reference

## Color Palette

### Primary Colors (Indigo)

```
#eef2ff  --primary-50   (Very Light)
#e0e7ff  --primary-100
#c7d2fe  --primary-200
#a5b4fc  --primary-300
#818cf8  --primary-400
#6366f1  --primary-500  ⭐ Main Primary
#4f46e5  --primary-600  ⭐ Primary Dark (Buttons)
#4338ca  --primary-700
#3730a3  --primary-800
#312e81  --primary-900
```

### Accent Colors (Cyan)

```
#ecfeff  --accent-50
#cffafe  --accent-100
#a5f3fc  --accent-200
#67e8f9  --accent-300
#22d3ee  --accent-400
#06b6d4  --accent-500   ⭐ Main Accent
#0891b2  --accent-600
#0e7490  --accent-700
#155e75  --accent-800
#164e63  --accent-900
```

### Semantic Colors

```
#10b981  --success-500  ✅ Success/Positive
#f59e0b  --warning-500  ⚠️  Warning/Caution
#ef4444  --danger-500   ❌ Error/Danger
#3b82f6  --info-500     ℹ️  Information
```

### Neutral Colors (Grays)

```
#f9fafb  --gray-50      (Text Primary - Light mode)
#f3f4f6  --gray-100
#e5e7eb  --gray-200
#d1d5db  --gray-300     ⭐ Text Secondary
#9ca3af  --gray-400     ⭐ Text Tertiary
#6b7280  --gray-500
#4b5563  --gray-600
#374151  --gray-700     ⭐ Borders
#1f2937  --gray-800     ⭐ Surface/Cards
#111827  --gray-900     ⭐ Background Secondary
#030712  --gray-950
#0a0a0a  --bg-primary   ⭐ Main Background
```

## Typography

### Font Family

**Nunito Sans** - Modern, friendly, highly legible sans-serif

- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Extra Bold), 900 (Black)

### Font Sizes

```
12px  --text-xs     Small labels, captions
14px  --text-sm     Secondary text, helper text
16px  --text-base   ⭐ Body text, inputs
18px  --text-lg     Emphasized text
20px  --text-xl     Subheadings
24px  --text-2xl    Section titles
30px  --text-3xl    Page subtitles
36px  --text-4xl    ⭐ Page titles
48px  --text-5xl    Hero text
```

### Usage Examples

```css
/* Page Title */
h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

/* Section Title */
h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* Body Text */
p {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--text-secondary);
}

/* Small Text */
.caption {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
```

## Spacing System

Based on 4px increments:

```
0px   --space-0
4px   --space-1   Tight spacing
8px   --space-2   ⭐ Default gap between elements
12px  --space-3   Small padding
16px  --space-4   ⭐ Standard padding
20px  --space-5   Medium padding
24px  --space-6   ⭐ Card padding
32px  --space-8   ⭐ Section spacing
40px  --space-10  Large spacing
48px  --space-12  XL spacing
64px  --space-16  Page margins
80px  --space-20  Hero spacing
96px  --space-24  XXL spacing
```

## Component Styles

### Button Variants

#### Primary Button

```css
background: var(--primary-600);
color: white;
padding: var(--space-3) var(--space-6);
border-radius: var(--radius-lg);
font-weight: var(--font-medium);

/* Hover */
background: var(--primary-500);
box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
transform: translateY(-1px);
```

#### Secondary Button

```css
background: var(--gray-700);
color: white;
/* Same padding and radius as primary */

/* Hover */
background: var(--gray-600);
```

#### Danger Button

```css
background: var(--danger-600);
color: white;

/* Hover */
background: var(--danger-500);
box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
```

#### Ghost Button

```css
background: transparent;
color: var(--gray-300);

/* Hover */
background: var(--gray-800);
```

### Card Styles

#### Standard Card

```css
background: var(--gray-800);
border: 1px solid var(--gray-700);
border-radius: var(--radius-xl);
padding: var(--space-6);
```

#### Glass Card (Glassmorphism)

```css
background: rgba(31, 41, 55, 0.8);
backdrop-filter: blur(16px);
border: 1px solid rgba(75, 85, 99, 0.3);
border-radius: var(--radius-xl);
padding: var(--space-6);
```

#### Hover Effect

```css
transition: all 200ms ease;

/* On hover */
box-shadow: var(--shadow-lg);
transform: translateY(-4px);
```

### Input Styles

```css
background: var(--gray-800);
border: 1px solid var(--gray-700);
border-radius: var(--radius-lg);
padding: var(--space-2) var(--space-4);
color: var(--text-primary);
font-size: var(--text-base);

/* Focus */
outline: none;
border-color: transparent;
box-shadow: 0 0 0 2px var(--primary-500);
```

### Modal/Dialog

```css
/* Backdrop */
background: rgba(0, 0, 0, 0.7);
backdrop-filter: blur(4px);

/* Content */
background: var(--gray-900);
border: 1px solid var(--gray-700);
border-radius: var(--radius-2xl);
padding: var(--space-8);
max-width: 600px;
box-shadow: var(--shadow-2xl);
```

## Layout Structure

### Sidebar

```
Width: 256px (16rem)
Background: var(--gray-800)
Border Right: 1px solid var(--gray-700)
Position: Fixed left

Logo Section:
  Padding: var(--space-6)
  Border Bottom: 1px solid var(--gray-700)

Navigation:
  Padding: var(--space-4)
  Gap: var(--space-1)

Nav Item:
  Padding: var(--space-3) var(--space-4)
  Border Radius: var(--radius-lg)

  Active:
    Background: var(--primary-600)
    Box Shadow: 0 0 20px rgba(99, 102, 241, 0.4)

  Hover:
    Background: var(--gray-700)
```

### Main Content Area

```
Margin Left: 256px (sidebar width)
Background: var(--bg-primary)
Min Height: 100vh
Padding: var(--space-8)
```

### Header/Page Title

```
Margin Bottom: var(--space-8)

Title (h1):
  Font Size: var(--text-4xl)
  Font Weight: var(--font-bold)
  Margin Bottom: var(--space-2)

Subtitle:
  Font Size: var(--text-base)
  Color: var(--text-tertiary)
```

## Gradient Backgrounds

### Primary Gradient

```css
background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
```

### Accent Gradient

```css
background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
```

### Primary to Accent Gradient (Hero)

```css
background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
```

### Dark Gradient

```css
background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
```

## Shadow Effects

### Standard Shadows

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05)
--shadow-md:  0 4px 6px rgba(0,0,0,0.1)
--shadow-lg:  0 10px 15px rgba(0,0,0,0.1)
--shadow-xl:  0 20px 25px rgba(0,0,0,0.1)
--shadow-2xl: 0 25px 50px rgba(0,0,0,0.25)
```

### Glow Shadows (for hover effects)

```css
Primary Glow:  0 0 20px rgba(99, 102, 241, 0.4)
Accent Glow:   0 0 20px rgba(6, 182, 212, 0.4)
Success Glow:  0 0 20px rgba(16, 185, 129, 0.4)
Danger Glow:   0 0 20px rgba(239, 68, 68, 0.4)
```

## Animations

### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
/* Duration: 200ms */
```

### Slide In Up

```css
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
/* Duration: 200ms */
```

### Scale In

```css
@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
/* Duration: 200ms */
```

### Hover Lift

```css
transition: transform 200ms ease;

/* On hover */
transform: translateY(-4px);
```

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Stack grids to single column */
  /* Hide sidebar, show mobile menu */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2 columns for grids */
  /* Collapsible sidebar */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layout with sidebar */
  /* 3-4 columns for grids */
}
```

## Icon Usage

### Lucide React Icons

```tsx
import {
  Home, // Dashboard
  Box, // Models
  Table, // Data
  Key, // API Keys
  Database, // Database
  Settings, // Settings
  Plus, // Add/Create
  Edit, // Edit
  Trash2, // Delete
  Save, // Save
  X, // Close
  Check, // Success
  AlertCircle, // Warning
  Info, // Information
  Search, // Search
  Filter, // Filter
  ChevronDown, // Dropdown
  MoreVertical, // More options
  Loader2, // Loading spinner
} from 'lucide-react';
```

### Icon Sizes

```tsx
<Icon size={16} />  // Small (buttons, inline)
<Icon size={20} />  // Medium (navigation, cards)
<Icon size={24} />  // Large (headers, stats)
<Icon size={32} />  // XL (hero sections)
```

## Accessibility

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### Color Contrast

- Text on dark backgrounds: Use `--text-primary` (#f9fafb)
- Secondary text: Use `--text-secondary` (#d1d5db)
- Tertiary text: Use `--text-tertiary` (#9ca3af)
- All combinations meet WCAG AA standards

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should be logical
- Escape key closes modals
- Enter key submits forms

## Best Practices

1. **Always use design tokens** - Never hardcode colors or spacing
2. **Consistent spacing** - Use the spacing scale (4px increments)
3. **Smooth transitions** - 200ms for most interactions
4. **Hover feedback** - All interactive elements should have hover states
5. **Loading states** - Show spinners for async operations
6. **Error handling** - Display clear error messages
7. **Responsive design** - Test on mobile, tablet, desktop
8. **Accessibility** - Add ARIA labels, keyboard support

---

**Use this reference when building components to ensure visual consistency! 🎨**
