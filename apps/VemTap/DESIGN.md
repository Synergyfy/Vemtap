---
name: Experience Orchestrator
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#474651'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#777682'
  outline-variant: '#c8c5d3'
  surface-tint: '#5654a8'
  primary: '#1a146b'
  on-primary: '#ffffff'
  primary-container: '#312e81'
  on-primary-container: '#9c9af4'
  inverse-primary: '#c3c0ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#20252a'
  on-tertiary: '#ffffff'
  tertiary-container: '#363a40'
  on-tertiary-container: '#a0a4ab'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100563'
  on-primary-fixed-variant: '#3e3c8f'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#dfe2ea'
  tertiary-fixed-dim: '#c3c6ce'
  on-tertiary-fixed: '#181c21'
  on-tertiary-fixed-variant: '#43474d'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  grid-columns: '12'
  container-max: 1280px
---

## Brand & Style

The design system is built to bridge the gap between complex customer data and intuitive experience building. It targets marketing professionals and product owners who value efficiency and aesthetic clarity over technical granularity. 

The visual direction follows a **Corporate / Modern** style with strong **Minimalist** influences. By prioritizing clarity and generous whitespace, the UI feels less like a database and more like a creative canvas. The aesthetic draws inspiration from the approachability of Linktree and the functional elegance of Shopify, ensuring that even complex workflows feel manageable and premium.

## Colors

The palette is anchored by a deep Indigo primary, conveying authority and stability. This is paired with a more vibrant secondary blue for interactive elements to guide the user's eye. 

A heavy emphasis is placed on "Off-White" and "Soft Gray" surfaces to reduce eye strain and create a sophisticated "app-within-a-browser" feel. Tertiary colors are reserved for subtle background washes to differentiate content blocks without the need for heavy borders. Success, warning, and error states should utilize desaturated versions of green, amber, and red to maintain the professional tone.

## Typography

The design system utilizes **Inter** for its exceptional readability and neutral, utilitarian character. The type scale is designed to create a clear information hierarchy, using semi-bold weights for headlines to contrast against the lighter body text.

To maintain the "non-technical" feel, line heights are kept generous, and letter spacing is slightly tightened on larger display text to maintain a premium, editorial look. Small labels and metadata should use the uppercase style to provide visual variety without introducing a second typeface.

## Layout & Spacing

This design system employs a **Fluid Grid** model with a standard 12-column layout. Spacing follows an 8px baseline, ensuring all components align to a predictable rhythm. 

Generous margins (48px+) are encouraged around primary canvas areas to provide the "white space" characteristic of premium tools like Canva. Content should be grouped in logical containers with internal padding that mirrors the external margins, creating a nested, cohesive structure.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Rather than using harsh borders, the design system uses extremely soft, multi-layered shadows (0% to 4% opacity) to lift cards off the background.

Interactive elements like hoverable cards or active builder blocks should transition to a slightly deeper shadow to simulate physical proximity. A "layer 0" (background) uses a subtle gray-blue tint, while "layer 1" (content containers) is pure white, and "layer 2" (modals/popovers) uses a crisp shadow with a 1px soft stroke.

## Shapes

The shape language is defined by **gentle rounding**. A standard radius of 12px is applied to buttons and inputs, while larger card-based sections and containers use a 16px radius. 

This consistent rounding removes the "industrial" feel of sharp corners, making the Experience Builder feel more like a consumer-friendly tool. Interactive components like toggles and badges use a full pill-shape (radius: 999px) to distinguish them from structural layout elements.

## Components

### Buttons
Primary buttons use the deep Indigo fill with white text. Ghost buttons use a subtle gray-200 border that only becomes prominent on hover. All buttons feature a 12px corner radius and a 2px vertical offset shadow to provide a tactile "pressable" feel.

### Cards & Sections
Cards are the primary structural unit. They feature a white background, 16px radius, and a 1px gray-100 border. Drag handles for moving sections should appear as a 2x3 grid of dots (6px diameter) positioned on the left-center of the card, visible only on hover or when the section is "unlocked."

### Inputs & Toggles
Text inputs feature a soft 1px border that transitions to the secondary Indigo on focus. Toggle switches follow the "pill" shape, with a smooth sliding animation and a subtle color shift from gray-200 to secondary Indigo when enabled.

### Drag-and-Drop Handles
For the experience builder, drag handles should be styled as subtle "grabbers." Use a vertical bar or a dotted pattern that utilizes the neutral color at 30% opacity. Upon interaction, the handle and its parent container should scale slightly (1.02x) to indicate it is "active."

### Lists & Items
Lists within builder panels should have generous 12px padding between items. Use a soft background highlight (tertiary Indigo) on hover to provide clear feedback.