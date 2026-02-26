/**
 * Demo/GuidedTour only. Main app tour: @/tour/definitions.ts (TourOverlay, useTour)
 */
export interface TourStep {
  targetSelector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** When true, user can click the highlighted area; show "Try it" hint */
  interactive?: boolean;
  /** Optional hint for interactive steps (e.g. "Click Enter Deal Room below") */
  actionHint?: string;
}

export const onboardingTour: TourStep[] = [
  {
    targetSelector: '[data-tour="dashboard"]',
    title: 'Dashboard Overview',
    content:
      'This is your command center. Every deal, relationship, and payout starts here. Let us show you where everything lives.',
  },
  {
    targetSelector: '[data-tour="trust-score"]',
    title: 'Your Trust Score',
    content:
      'This is your Trust Score — the number that determines your access and matching priority. Click it anytime to see your full breakdown and how to improve it.',
  },
  {
    targetSelector: '[data-tour="relationships"]',
    title: 'Your Custodied Relationships',
    content:
      'This is where your protected relationships live. The timestamp you see is your legal priority claim. Each relationship now has lifetime value.',
  },
  {
    targetSelector: '[data-tour="deal-matching"]',
    title: 'Deal Matching',
    content:
      'This is where your matches appear. Once your intent is active, you will get notified here every time a qualified counterparty is found.',
  },
  {
    targetSelector: '[data-tour="activity-feed"]',
    title: 'Activity Feed',
    content:
      'Your activity feed is your deal nervous system — every match, update, attribution, and verification event appears here in real time.',
  },
  {
    targetSelector: '[data-tour="create-intent"]',
    title: 'Create Intent',
    content:
      'This button is your fastest path to your next deal. Create an intent anytime — it takes 3 minutes and starts matching immediately.',
  },
  {
    targetSelector: '[data-tour="completion"]',
    title: 'You Are Ready',
    content:
      'Your relationships are protected. Your profile is active. The network is waiting. Create your first intent to start matching.',
  },
];

import type { PersonaKey } from "@/lib/copy";
import { TOUR } from "@/lib/copy";

/** Whitepaper-aligned persona-aware tour steps for the demo experience. */
export function buildDemoTourSteps(persona: PersonaKey): TourStep[] {
  return [
    {
      targetSelector: '[data-tour="trust-score"]',
      title: TOUR.trustScore.title,
      content: TOUR.trustScore.body,
      position: "bottom",
    },
    {
      targetSelector: '[data-tour="relationships"]',
      title: TOUR.relationships[persona].title,
      content: TOUR.relationships[persona].body,
      position: "right",
    },
    {
      targetSelector: '[data-tour="match-card"]',
      title: TOUR.blindMatch.title,
      content: TOUR.blindMatch.body,
      position: "bottom",
    },
    {
      targetSelector: '[data-tour="deal-room"]',
      title: TOUR.dealRoom.title,
      content: TOUR.dealRoom.body,
      position: "top",
      interactive: true,
      actionHint: "Enter the deal room to see the full audit trail.",
    },
    {
      targetSelector: '[data-tour="payout"]',
      title: TOUR.attribution[persona].title,
      content: TOUR.attribution[persona].body,
      position: "top",
    },
    {
      targetSelector: '[data-tour="verification"]',
      title: TOUR.compliance.title,
      content: TOUR.compliance.body,
      position: "right",
    },
  ];
}

export const demoTour: TourStep[] = [
  {
    targetSelector: '[data-tour="demo-nav"]',
    title: 'Navigate Freely',
    content:
      'Use the sidebar to jump to any section — or click Next to follow the guided path. You can explore on your own anytime.',
    interactive: true,
    actionHint: 'Click any sidebar item, or Next to continue.',
  },
  {
    targetSelector: '[data-tour="dashboard"]',
    title: 'The Problem Solved',
    content:
      'This is ANAVI — the operating system for private markets. Your dashboard shows protected relationships, AI matches, deal rooms, and attribution. Let us walk you through each piece.',
  },
  {
    targetSelector: '[data-tour="relationships"]',
    title: 'Custodied Relationships',
    content:
      'These are your custodied relationships — each one is timestamped, encrypted, and protected. The custody hash proves when you introduced the parties. Someone in our network is ready to deal.',
  },
  {
    targetSelector: '[data-tour="match-card"]',
    title: 'The Match',
    content:
      'This is what a match looks like. A verified counterparty with a high compatibility score. Identity stays hidden until you both consent. No exposure. No wasted time.',
  },
  {
    targetSelector: '[data-tour="deal-room"]',
    title: 'The Deal Room',
    content:
      'Each active deal has an "Enter Deal Room" button. Click it now to explore the interior — NDA signed, documents shared, compliance verified, escrow staged. Everything you need to close, in one secure workspace.',
    interactive: true,
    actionHint: 'Click "Enter Deal Room" below, then Next when done exploring.',
  },
  {
    targetSelector: '[data-tour="payout"]',
    title: 'The Payout',
    content:
      'When a deal closes, your payout triggers automatically. Agreed upfront, executes automatically. No chasing. No negotiating after the fact.',
  },
  {
    targetSelector: '[data-tour="verification"]',
    title: 'Verification & Trust',
    content:
      'Your Trust Score and compliance passport unlock deal access and matching priority. Tier 2 gives you institutional-grade verification and counterparty confidence.',
  },
  {
    targetSelector: '[data-tour="payouts"]',
    title: 'Payouts & Attribution',
    content:
      'Automatic attribution when deals close. Your relationships generate lifetime value. See total earned, next payout, and the full attribution history.',
  },
  {
    targetSelector: '[data-tour="apply"]',
    title: 'Apply for Access',
    content:
      'You have seen the full picture: relationships protected, matches found, deal rooms secured, payouts automated. What would your relationships be worth if they were protected like this?',
  },
];
