// Enhanced tabs system - re-exporting from the new tabs directory
// This provides backward compatibility while adding new features

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./tabs";

// Note: For advanced features like ScrollableTabs and VerticalTabs,
// import directly from "./tabs" directory:
// import { ScrollableTabs } from "@/components/ui/tabs"

// The original implementation is available at "./tabs-original.tsx"
// if needed for reference or fallback.

/**
 * Enhanced Tabs Component with:
 * - Variant system (default, outline, pill, underline)
 * - Size variants (sm, md, lg)
 * - Color themes (primary, secondary, gold, destructive)
 * - Icon support with positioning
 * - Badge support
 * - Loading states
 * - Accessibility enhancements
 * - Reduced motion support
 * - Scrollable tabs with auto-scroll buttons
 * - Vertical tabs orientation
 *
 * @example
 * ```tsx
 * // Basic usage (backward compatible)
 * <Tabs defaultValue="overview">
 *   <TabsList>
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *     <TabsTrigger value="analytics">Analytics</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">Overview content</TabsContent>
 *   <TabsContent value="analytics">Analytics content</TabsContent>
 * </Tabs>
 *
 * // Enhanced usage with variants
 * <Tabs variant="outline" size="sm" aria-label="Dashboard sections">
 *   <TabsList>
 *     <TabsTrigger value="overview" icon={<ChartIcon />} iconPosition="left">
 *       Overview
 *     </TabsTrigger>
 *     <TabsTrigger value="analytics" badge="3">
 *       Analytics
 *     </TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">Overview content</TabsContent>
 *   <TabsContent value="analytics">Analytics content</TabsContent>
 * </Tabs>
 * ```
 */