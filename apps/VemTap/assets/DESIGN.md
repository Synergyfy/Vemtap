---
name: Vemtap Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#005338'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 1.25rem
  container-padding-desktop: 2.5rem
  gutter: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is engineered for a "Canva meets Stripe" aesthetic—bridging the gap between high-utility financial precision and intuitive, user-friendly creative tools. The brand personality is **Professional, Guided, and Effortless**. 

The style is **Corporate / Modern** with a heavy influence from **Minimalism**. It prioritizes clarity over decoration, using generous whitespace to reduce cognitive load in data-heavy environments. The UI should evoke a sense of "calm control," where the most important business metrics are always accessible but never overwhelming. 

Key principles include:
- **Guided Clarity:** Using progressive disclosure to show only what is necessary.
- **Precision Touch:** Combining the geometric rigor of SaaS with the soft, tactile friendliness of consumer apps.
- **Trust through Finish:** High-polish details like subtle gradients and refined typography that signal reliability.

## Colors

The palette is built on a foundation of **Deep Indigo** (#4F46E5), representing professional stability and intelligence. This is supported by a vibrant **Action Blue** (#0EA5E9) for secondary interactions and a **Success Emerald** (#10B981) for positive growth indicators.

The background system utilizes a "Stripe-inspired" neutral scale. Instead of pure grays, we use cool-tinted slates to keep the interface feeling fresh and modern.
- **Surface:** White (#FFFFFF) for primary cards and content areas.
- **Subtle Background:** A very soft tint (#F8FAFC) to create separation between the page and the elements.
- **Status Colors:** High-vibrancy reds and ambers are reserved strictly for critical alerts and warnings to maintain a low-stress environment.

## Typography

The typography system relies exclusively on **Inter** for its exceptional legibility and systematic feel. We employ a high-contrast hierarchy to ensure that headers immediately pop against background content.

- **Scale:** On mobile, large display type is aggressively scaled down to maintain layout integrity. 
- **Rhythm:** We use a tight tracking (-0.01em to -0.02em) for headlines to create a premium "editorial" feel.
- **Labels:** Small labels use increased letter spacing and uppercase styling to differentiate them from body copy, functioning as clear signposts in the dashboard.

## Layout & Spacing

This design system follows a **Mobile-First Fluid Grid**. Everything is based on an 8px base unit to ensure perfect alignment and visual rhythm.

- **Mobile (Default):** A single-column layout with 20px (1.25rem) side margins. Components stretch to full-width, utilizing vertical stacking.
- **Desktop:** A 12-column fluid grid that caps at 1440px. Gutters are fixed at 24px to provide "breathing room" between data cards.
- **Safe Targets:** For mobile accessibility, all interactive elements have a minimum height/width of 48px, even if the visual element (like a small icon) is smaller.

## Elevation & Depth

This design system uses **Tonal Layers** and **Ambient Shadows** to create a structured hierarchy without visual clutter.

- **The Base (Level 0):** The page background (#F8FAFC), completely flat.
- **The Card (Level 1):** White surfaces with a very soft, highly diffused shadow (Box Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05)). This is the primary container for all content.
- **The Interactive (Level 2):** Elevated state for active buttons or hovered cards. The shadow becomes deeper and slightly more opaque (Box Shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08)).
- **Overlays (Level 3):** Modals and drawers use a backdrop blur (12px) to dim the background, focusing the user's attention on the task at hand.

## Shapes

The shape language is consistently **Rounded**, creating an approachable and modern feel. 

- **Standard Elements:** 8px (0.5rem) radius for buttons and input fields.
- **Cards & Containers:** 16px (1rem) radius for the primary dashboard cards, providing a soft, frame-like appearance.
- **Large Sections:** 24px (1.5rem) radius for bottom sheets and major UI wrappers.

The use of "Pill" shapes is restricted to Chips and Tags to clearly distinguish them from actionable buttons or data containers.

## Components

### Buttons
Primary buttons use a solid Indigo background with white text. Secondary buttons use a subtle gray ghost-style border. All buttons have a minimum height of 48px for mobile-first accessibility.

### Cards
Cards are the primary structural unit. They should always have a white background, a 16px corner radius, and a subtle Level 1 shadow. Padding inside cards is a generous 24px.

### Visual Selection (Chips)
In place of traditional dropdowns, use **Selection Chips**. These are horizontal-scrolling or wrapped pill-shaped elements that allow users to tap a choice directly. Active chips are filled with the primary color, while inactive chips have a soft gray background.

### Input Fields
Inputs are large (48px height) with a light gray border (#E2E8F0) that transitions to Indigo on focus. Labels are placed above the field in `label-md` style.

### Skeleton Loaders
To maintain the feeling of speed, use skeleton loaders that mimic the exact shape of the cards and typography. Use a soft pulse animation (1.5s duration) with a subtle gray-to-white gradient.

### Empty States
Empty states should be guided. Instead of just saying "No Data," provide a centered illustration, a clear `headline-sm`, and a primary call-to-action button to help the user get started.