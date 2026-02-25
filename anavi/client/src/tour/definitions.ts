export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  id: string;
  target: string;
  title: string;
  body: string;
  placement: TourPlacement;
}

export const TOUR_STORAGE_KEY = "anavi_tour_completed";
export const TOUR_SESSION_KEY = "anavi_tour_step";

export const tourDefinitions: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour-id='welcome']",
    title: "Welcome to ANAVI",
    body: "Your deal flow partner for private markets. This quick tour shows you the essentials.",
    placement: "center",
  },
  {
    id: "trust-score",
    target: "[data-tour-id='trust-score']",
    title: "Trust Score",
    body: "Your verification tier and trust score help counterparties know you're credible. Click to see the breakdown.",
    placement: "right",
  },
  {
    id: "relationships",
    target: "[data-tour-id='nav-relationships']",
    title: "Relationships",
    body: "Custody your deal relationships here. Verified counterparties appear in your network.",
    placement: "right",
  },
  {
    id: "deal-matching",
    target: "[data-tour-id='nav-deal-matching']",
    title: "Deal Matching",
    body: "Create intents (buy, sell, invest) and get matched with verified counterparties.",
    placement: "right",
  },
  {
    id: "deal-rooms",
    target: "[data-tour-id='nav-deal-rooms']",
    title: "Deal Rooms",
    body: "Secure spaces for active deals. Share documents, track stages, and close with confidence.",
    placement: "right",
  },
  {
    id: "search",
    target: "[data-tour-id='tour-search']",
    title: "Global Search",
    body: "Press Cmd+K (or Ctrl+K) anytime to search deals, contacts, and matches.",
    placement: "bottom",
  },
  {
    id: "done",
    target: "[data-tour-id='welcome']",
    title: "You're all set",
    body: "Explore the platform. Use 'Restart Tour' in Settings or Help when you need a refresher.",
    placement: "center",
  },
];
