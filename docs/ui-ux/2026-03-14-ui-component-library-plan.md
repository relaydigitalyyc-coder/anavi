# ANAVI UI Component Library Plan

**Date:** March 14, 2026
**Owner:** UI/UX + Frontend Engineering
**Status:** Draft
**Supersedes:** None (complements PRD 2026-03-01 section 2.4)

## 1. Executive Summary

This document outlines the strategy for building a mature, scalable component library for the ANAVI platform. The component library will serve as the single source of truth for UI components, ensuring consistency, accelerating development, and maintaining the premium, institutional-grade design language defined in the master PRD.

## 2. Current State Analysis

### 2.1 Existing Assets
- **50+ shadcn/ui components** in `/anavi/client/src/components/ui/`
- **Design system specifications** defined in PRD 2026-03-01 (section 2.1, 2.4)
- **Color palette, typography, spacing** already established
- **Application components** in `/anavi/client/src/components/`

### 2.2 Strengths
- Consistent use of `class-variance-authority` for variant management
- TypeScript support with proper typing
- Good separation between primitive UI and business components
- Modern React patterns (hooks, compound components)

### 2.3 Gaps & Opportunities
1. **Flat structure**: UI components are not categorized by domain
2. **Missing primitives**: No low-level layout components (Box, Stack, Grid)
3. **Design tokens**: No centralized token system beyond Tailwind config
4. **Documentation**: No living component documentation (Storybook)
5. **Testing**: Limited component-level tests
6. **Versioning**: No versioning strategy for component library

## 3. Component Library Architecture

### 3.1 Folder Structure
```
anavi/client/src/ui/
├── tokens/           # Design tokens (colors, spacing, typography, shadows)
├── primitives/       # Low-level building blocks
│   ├── layout/      # Box, Container, Stack, Grid, Divider
│   ├── typography/  # Text, Heading, Label, Code
│   ├── feedback/    # Spinner, Progress, Skeleton
│   └── overlay/     # Portal, Backdrop, VisuallyHidden
├── components/       # Current shadcn components (reorganized)
│   ├── forms/       # Input, Select, Checkbox, Form, Field
│   ├── navigation/  # Button, Link, Breadcrumb, Tabs
│   ├── surface/     # Card, Modal, Dialog, Sheet
│   ├── data-display/# Table, List, Badge, Avatar
│   ├── feedback/    # Alert, Toast, Progress, Skeleton
│   └── overlay/     # Tooltip, Popover, Dropdown
├── patterns/        # Compound components for common patterns
│   ├── forms/      # SearchBar, FilterPanel, LoginForm
│   ├── navigation/ # Sidebar, Header, Pagination
│   └── data-display/# DataTable, ChartCard, MetricCard
└── utils/           # Shared utilities, hooks, constants
```

### 3.2 Design Token System
Extract design specifications from PRD into TypeScript tokens:

```typescript
// tokens/colors.ts
export const colors = {
  navy: {
    50: '#F3F7FC',
    100: '#D1DCF0',
    200: '#A3B9E1',
    300: '#7596D2',
    400: '#4773C3',
    500: '#0A1628', // Primary Navy
    600: '#081220',
    700: '#060E18',
    800: '#040A10',
    900: '#020608',
  },
  gold: {
    500: '#C4972A', // Trust Gold
  },
  // ... all colors from PRD
};

// tokens/spacing.ts
export const spacing = {
  px: '1px',
  0.5: '4px',
  1: '8px',
  1.5: '12px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
  8: '64px',
  10: '80px',
  12: '96px',
};

// tokens/typography.ts
export const typography = {
  fontFamilies: {
    sans: 'Arial, sans-serif',
    mono: 'Courier New, monospace',
  },
  fontSizes: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
  },
  // ... from PRD
};
```

### 3.3 Component API Patterns

#### Variant API (CVA)
```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-all',
  {
    variants: {
      variant: {
        primary: 'bg-navy-500 text-white hover:bg-navy-600',
        secondary: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
        gold: 'bg-gold-500 text-white hover:bg-gold-600',
        ghost: 'hover:bg-navy-50 text-navy-700',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

#### Compound Components
```typescript
// Card compound component
export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
  Action: CardAction,
};

// Usage
<Card.Root>
  <Card.Header>
    <Card.Title>Deal Summary</Card.Title>
    <Card.Description>VLCC crude oil cargo</Card.Description>
  </Card.Header>
  <Card.Content>...</Card.Content>
  <Card.Footer>
    <Card.Action>Review Details</Card.Action>
  </Card.Footer>
</Card.Root>
```

#### Props Design Principles
1. **Required props first**: `value`, `onChange`, `children`
2. **Optional props after**: `disabled`, `size`, `variant`, `className`
3. **DOM props spread**: Extend `React.ComponentProps<"element">`
4. **Forward refs**: All interactive components forward refs
5. **Slot support**: `asChild` prop for rendering flexibility

### 3.4 PRD-Specific Components
The following components are specified in PRD section 2.4 and require special implementation:

| Component | Spec from PRD | Implementation Notes |
|-----------|---------------|---------------------|
| Trust Score Chip | Inline badge showing 'XX / 100' with colored background. Variants: Large (dashboard), Medium (cards), Small (inline tables) | Color mapping: >70 Trust Green, 40-70 Warning Orange, <40 Alert Red |
| Verification Tier Badge | Pill badge: 'Tier 1 Basic', 'Tier 2 Enhanced', 'Tier 3 Institutional'. Color: gray / blue / gold. Icon: shield with tier number | Interactive: click expands verification details |
| Deal Status Pill | Status pills: NDA Pending / Active / Diligence / Closing / Completed / Declined. Color-coded consistently | Use `cva` with status variants |
| Match Score Indicator | Percentage display with color gradient: 90%+ (green), 70-89% (blue), 50-69% (orange), <50% (gray) | Include breakdown tooltip on hover |
| Intent Card | Structured card: intent type icon, deal parameters summary, status badge, match count, date, pause/edit/delete actions | Composite component using primitives |
| Relationship Card | Card: anonymized ID, sector tag, custody timestamp, match activity indicator, attribution earned, privacy controls | Key component for relationship custody |
| Action Button (Primary) | Navy background (#0A1628), white text, 8px radius, 48px height | Base button with variant="primary" |
| Action Button (Secondary) | White background, navy border 2px, navy text. Same sizing as primary | variant="secondary" |
| Gold CTA Button | Trust Gold background (#C4972A), white text. Used for 'Protect Relationship', founding member actions | variant="gold" |

## 4. Documentation Strategy

### 4.1 Storybook Setup
- **Version**: Storybook 8 with React + TypeScript + Vite
- **Addons**: Controls, Actions, Viewport, Accessibility, Figma
- **Deployment**: Chromatic for visual testing and collaboration
- **Structure**: Organize stories by category matching folder structure

### 4.2 Documentation Content
Each component story includes:
1. **Description**: Purpose and usage guidelines
2. **Props Table**: Auto-generated from TypeScript definitions
3. **Examples**: Basic usage, variants, states, compositions
4. **Accessibility**: Keyboard navigation, screen reader support
5. **Design**: Link to Figma component, design tokens used
6. **Related**: Links to related components

### 4.3 Design-Dev Collaboration
- **Figma integration**: Storybook displays Figma designs
- **Design tokens sync**: Automated token extraction from Figma
- **Component status**: Labels (Design Ready, In Development, Ready for Review, Approved)

## 5. Migration Strategy

### Phase 1: Foundation (Weeks 1-3)
- [ ] Set up tokens system (`/ui/tokens/`)
- [ ] Create primitive components (Box, Text, Stack, Grid)
- [ ] Configure Storybook with design tokens
- [ ] Set up CI/CD for component library
- [ ] Create PRD-specific components (Trust Score Chip, Verification Badge, etc.)

### Phase 2: Reorganization (Weeks 4-6)
- [ ] Move existing shadcn components to new structure
- [ ] Add missing UI components from PRD spec
- [ ] Create compound pattern components
- [ ] Update import paths with aliases for backward compatibility
- [ ] Write comprehensive Storybook documentation

### Phase 3: Integration (Weeks 7-9)
- [ ] Update application components to use new primitives
- [ ] Implement design token usage across all components
- [ ] Add component tests (unit, interaction, visual)
- [ ] Conduct accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization (tree shaking, code splitting)

### Phase 4: Adoption & Optimization (Weeks 10-12)
- [ ] Gradual adoption in feature development
- [ ] Developer training and documentation
- [ ] Monitor usage metrics and performance
- [ ] Establish contribution guidelines
- [ ] Versioning strategy (semantic versioning)

## 6. Success Metrics

### Technical Metrics
- **Test coverage**: >90% for component library
- **Bundle size**: <50KB gzipped for core components
- **Accessibility**: Zero WCAG 2.1 AA violations
- **Performance**: <100ms First Contentful Paint for component rendering
- **TypeScript**: Strict mode with no `any` types

### Adoption Metrics
- **Usage rate**: 100% of new components use library
- **Migration rate**: 80% of existing components migrated within 3 months
- **Developer satisfaction**: >4.5/5 in quarterly survey
- **Storybook usage**: >80% of frontend team uses weekly

### Quality Metrics
- **Bug rate**: <1 critical bug per 100 components
- **Documentation**: 100% of components documented in Storybook
- **Design consistency**: 100% alignment with Figma designs
- **Code review time**: <30 minutes average for component PRs

## 7. Risk Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Breaking changes in migration | High | High | Use aliases for backward compatibility; phased migration with feature flags |
| Performance regression | Medium | Medium | Bundle size monitoring; performance budgets; code splitting |
| Design-system drift | Medium | High | Regular design-dev sync; token synchronization; design linting |
| Low developer adoption | Low | High | Comprehensive documentation; developer training; tooling integration |
| Accessibility violations | Low | High | Automated accessibility testing; manual audit; screen reader testing |

## 8. Next Steps

### Immediate (Week 1)
1. [ ] Review this plan with design and engineering leads
2. [ ] Set up tokens architecture and Storybook
3. [ ] Create initial primitive components (Box, Text, Stack)
4. [ ] Document migration process for existing components

### Short-term (Month 1)
1. [ ] Complete Phase 1 foundation
2. [ ] Begin Storybook documentation for existing components
3. [ ] Train frontend team on new component patterns
4. [ ] Establish component contribution workflow

### Long-term (Quarter 1)
1. [ ] Full migration to new component library
2. [ ] Comprehensive documentation in Storybook
3. [ ] Automated design token synchronization
4. [ ] Performance optimization and bundle size reduction

---

**Appendix A: PRD Design System Reference**

### Color Palette (from PRD 2.1)
- Primary Navy: `#0A1628`
- Trust Gold: `#C4972A`
- Action Blue: `#2563EB`
- Trust Green: `#059669`
- Alert Red: `#DC2626`
- Data Steel: `#1E3A5F`
- Surface Light: `#F3F7FC`
- Border Blue: `#D1DCF0`

### Typography (from PRD 2.1)
- Display (H1): Arial Bold 32pt
- Heading (H2): Arial Bold 24pt
- Subheading (H3): Arial Bold 18pt
- Body: Arial Regular 14pt
- Label: Arial Medium 12pt Caps
- Micro: Arial Regular 11pt
- Data Mono: Courier New 13pt

### Spacing & Grid (from PRD 2.1)
- Base Unit: 8px
- Content Width: 1280px max
- Card Padding: 24px internal
- Section Spacing: 48px between major sections
- Form Inputs Height: 48px

**Appendix B: Component Inventory**
[See separate spreadsheet for complete component inventory and migration status]