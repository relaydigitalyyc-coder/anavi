# ANAVI Brand Guidelines

## Brand Identity Assessment
*Date: 2026-03-14*

### Current State
**Color Palette:** Navy (#0A1628) as primary, with gold (#C4972A), green (#059669), blue (#2563EB), steel (#1E3A5F) accents. Background #F3F7FC.
**Typography:** Plus Jakarta Sans (sans), Instrument Serif (serif), JetBrains Mono (mono).
**Logo:** "@navi" logotype with sky blue dot. Light/dark SVG variants.
**Design System:** Navy/Gold Private Bank aesthetic with cinematic UI palette for dark mode.
**Implementation:** CSS custom properties in `index.css` via Tailwind v4 `@theme inline`. ThemeContext provides light/dark switching.

### Consistency Issues
1. Hardcoded color values in components (`text-[#C4972A]`, `text-gray-400`).
2. No centralized design token JSON file.
3. Typography scale undefined (font sizes, line heights, weights).
4. Missing logo usage guidelines (clear zone, minimum size, placement).
5. No documented brand guidelines.

### Improvement Proposals

#### 1. Color Palette Enhancement
- Expand core colors with shades (100-900 scales).
- Ensure AA accessibility contrast.
- Define semantic roles (success, warning, info, error).
- Add data visualization palette (5-7 distinct colors).
- Refine dark mode palette.

#### 2. Typography System
- Define typography scale: h1-h6, body, caption.
- Set line heights, letter spacing, font weights.
- Font pairing guidelines: sans-serif for UI, serif for headings.
- Font loading strategy.

#### 3. Logo Usage Guidelines
- Clear zone: minimum spacing equal to logo height.
- Minimum size: 24px height for digital.
- Placement: left-aligned in navigation, centered in marketing.
- Backgrounds: light/dark variants provided.
- Sub-brand lockups: @navi Core, @apital Capital, Nexus.

#### 4. Design Token Consolidation
- Create `design-tokens.json` as single source of truth.
- Generate CSS variables and Tailwind configuration.
- Include spacing, radius, shadow, animation tokens.
- Token versioning.

#### 5. Component Library Consistency
- Audit components for hardcoded values.
- Migrate to semantic token classes (`bg-primary`, `text-accent`).
- Consistent spacing/radius usage.
- Component variant system.

#### 6. Visual Style Enhancements
- Subtle gradients for cards and buttons.
- Shadow system (elevation levels).
- Interactive states (hover, focus, active).
- Cinematic UI elements for premium feel.

#### 7. Iconography System
- Line style icon set (16, 20, 24, 32px sizes).
- Consistent stroke width (1.5px).
- Brand-aligned symbolism.

#### 8. Data Visualization Palette
- Categorical colors (5-7 distinct).
- Sequential colors for heatmaps.
- Colorblind-friendly palette.

### Implementation Priority
**High:**
- Consolidate design tokens, fix hardcoded color usage.
- Define typography scale.

**Medium:**
- Create brand guidelines document (this file).
- Logo usage guidelines.

**Low:**
- Visual style enhancements (gradients, shadows).

### Files to Create/Modify
- `client/src/design-tokens.json` – design token source.
- `client/src/theme.css` – generated CSS variables (optional).
- `docs/brand-guidelines.md` – this document.
- Update `index.css` to reference token-generated variables.
- Update component files to use semantic classes.

### Next Steps
1. Design token consolidation (2 days).
2. Typography scale implementation (1 day).
3. Component audit and fix (3 days).
4. Logo guidelines documentation (1 day).
5. Visual style enhancement (2 days).

---

*Assessment conducted by Hydra agent. For questions, refer to design team.*