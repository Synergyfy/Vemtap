---
name: VEMTAP Digital
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#424655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#727786'
  outline-variant: '#c2c6d7'
  surface-tint: '#0058cb'
  primary: '#0055c4'
  on-primary: '#ffffff'
  primary-container: '#066cf4'
  on-primary-container: '#fcfaff'
  inverse-primary: '#b0c6ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#535a71'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b738a'
  on-tertiary-container: '#fcfaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001945'
  on-primary-fixed-variant: '#00429b'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  currency-display:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target-min: 44px
  margin-main: 1.25rem
  gutter-grid: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style
The design system is engineered for a premium, trustworthy local discovery experience. The aesthetic is **Corporate Modern** with a focus on mobile-native ergonomics. It emphasizes clarity and efficiency, ensuring that users can navigate local services with confidence.

The visual narrative relies on high-quality white space, authentic Nigerian photography, and a structured layout that feels professional yet accessible. By combining a "Safety-First" color palette with "Thumb-First" interactions, the design system evokes a sense of reliability and modern sophistication suitable for the Nigerian market.

## Colors
This design system utilizes a foundation of **VEMTAP Blue** (#066CF4) to signal trust and technology. The palette is intentionally restricted to maintain a premium feel.

- **Primary**: Used for key actions, active states, and brand recognition.
- **Secondary**: A cool-toned slate gray used for secondary icons and supporting text.
- **Surface**: The background uses a very light neutral gray (#F8FAFC) to reduce eye strain and differentiate from white card elements.
- **Success/Warning**: Standard semantic colors should be used for transaction status, but kept muted to avoid clashing with the primary brand blue.

## Typography
**Inter** is the sole typeface for this design system to ensure maximum legibility across all Android and iOS devices. 

- **Hierarchy**: Use `display-lg` sparingly for hero sections. `headline-sm` is the default for card titles.
- **Currency**: When displaying ₦ (Naira), use `fontWeight: 700` to ensure price visibility.
- **Readability**: Line heights are generous (150% for body text) to accommodate longer place names and service descriptions common in the local context.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile viewport widths.

- **Safe Zones**: A 20px (1.25rem) horizontal margin is maintained on all screens.
- **Thumb Zone**: All primary actions (CTA buttons, navigation triggers) must be placed in the bottom 40% of the screen.
- **Tap Targets**: No interactive element should be smaller than 44x44px.
- **Bottom Sheets**: Use for complex inputs, filters, and detailed discovery info to keep the user in context without full-screen transitions.

## Elevation & Depth
This design system uses **Tonal Layering** supplemented by extremely subtle ambient shadows to create a clean, modern hierarchy.

- **Level 0 (Background)**: #F8FAFC.
- **Level 1 (Cards/Sheets)**: Pure white (#FFFFFF) with a 1px border (#E2E8F0).
- **Level 2 (Floating)**: Soft shadows with a large blur radius (16px) and low opacity (4%) are reserved for floating action buttons and active bottom sheets.
- **Depth**: Preference is given to subtle borders over heavy shadows to maintain the "clean and premium" look.

## Shapes
The shape language is **Rounded**, conveying friendliness and approachability.

- **Standard Elements**: Buttons and input fields use a 0.5rem (8px) corner radius.
- **Feature Cards**: Larger cards and bottom sheets use `rounded-xl` (1.5rem / 24px) on top corners to create a soft, mobile-native container feel.
- **Avatars/Icons**: Small icons use 8px roundedness, while user profile images should be circular.

## Components

### Buttons
- **Primary**: Solid VEMTAP Blue with white text. Minimum height 48px.
- **Secondary**: Ghost style with 1px VEMTAP Blue border or light gray fill for less critical actions.

### Inputs
- **Text Fields**: 1px border (#CBD5E1) that thickens and changes to VEMTAP Blue on focus. Labels should always be visible (not just placeholders).
- **Selection**: Large-format radio cards are preferred over small circles for service selection, improving tap accuracy.

### Discovery Cards
- **Structure**: Top-aligned image (16:9 aspect ratio), followed by title, rating, and location label.
- **Badges**: Use "verified" badges in VEMTAP Blue to reinforce the "trustworthy" pillar.

### Bottom Sheets
- All discovery filters and service details must slide up from the bottom.
- Handle bars at the top of sheets should be subtle (#E2E8F0) and 40px wide.

### Navigation
- **Bottom Bar**: 4-5 fixed icons with clear text labels (`label-sm`). The active state uses the primary brand color for both icon and text.