// Enhanced tabs system exports
export { Tabs } from "./tabs";
export { TabsList } from "./tabs-list";
export { TabsTrigger } from "./tabs-trigger";
export { TabsContent } from "./tabs-content";
export { ScrollableTabs } from "./scrollable-tabs";
export { VerticalTabs } from "./vertical-tabs";

// Re-export types
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  ScrollableTabsProps,
  VerticalTabsProps,
} from "./tabs.types";

// Re-export utilities
export {
  useReducedMotion,
  useTabAnnouncement,
  useTabsId,
  useKeyboardNavigation,
} from "./tabs.utils";

// Backward compatibility - also export the original tabs from the root
// This allows importing from "@/components/ui/tabs" for enhanced tabs
// and from "@/components/ui/tabs/original" for the original version if needed

// Note: The original tabs component at "@/components/ui/tabs.tsx" still exists
// and exports the original implementation. This enhanced system provides
// additional features while maintaining API compatibility.