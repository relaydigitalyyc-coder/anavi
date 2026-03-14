# Product Requirements Document (PRD): @navi Core Platform

## 1. Executive Summary
The @navi platform (formerly ANAVI) is a Private Market Operating System designed to eliminate broker-chain friction and fraud through a verified trust layer. The platform unifies deal flow, relationship custody, compliance, and asset tokenization into a single, high-trust environment.

## 2. Platform Architecture & Unification
The system is divided into modular, highly interconnected layers that operate under a unified "Wall Street Luxury" aesthetic (dark slate, cream, and sky blue accents) using a central `DashboardLayout`.

### 2.1 The Trust Layer (Foundation)
- **Compliance (KYC/KYB)**: Multi-tier verification levels. Users cannot transact without a verified status badge.
- **Relationships & Knowledge Graph**: An Obsidian-style graph visualization tracking custodied connections. Introductions are cryptographically timestamped, ensuring attribution for follow-on deals.
- **Audit Logs**: Immutable tracking of system events, user actions, and compliance flags.

### 2.2 The Deal Flow Layer (Execution)
- **Intents & Matches**: AI-powered semantic matching of Buy/Sell/Invest intents using NLP classification.
- **Curated Deal Rooms (VDRs)**: Secure document sharing, version control, and granular access for active deals.
- **Operator Intake**: A structured submission flow for deal sponsors to list real-world assets.
- **Deal Intelligence**: Siphons transcripts from Fireflies.ai meetings and parses them into actionable "Primed," "In-Progress," or "Ready" deals.

### 2.3 The Financial & Capital Layer (Settlement)
- **SPV Generator**: A multi-step wizard for generating legal structures and cap tables for new investments.
- **LP Portal & Capital Management**: Dashboards tracking commitments, capital calls, and wire instructions.
- **Fee Management & Payouts**: Automated tracking of originator shares (40-60%) and contributor payouts based on lifetime attribution.
- **Crypto Assets**: Visualization of stablecoin backing, proof of reserves, and tokenized real-world assets.

### 2.4 Marketplace Modules (Assets)
- **Commodities**: Specialized tracking for gold, oil & gas, and minerals (including purity and logistics tracking).
- **Real Estate**: Property listings with AI underwriting, comps analysis, and tenant management.

### 2.5 AI Integration (The "Brain")
- **Claude AI Brain**: An intelligent assistant acting as a Deal Flow Partner, utilizing streaming SSE to answer queries, analyze market sentiment, and provide risk assessments.
- **n8n Memory**: A long-term memory system tracking conversation history to maintain context across sessions.

## 3. Product Roadmap to Production
1. **Unify Authentication**: Remove temporary public access bypasses and finalize the invite-only, manual KYC/accreditation pipeline.
2. **Solidify Deal Rooms**: Ensure the 5-10 curated live opportunities are fully instrumented with the "Indicate Interest" soft-allocation tracking.
3. **Deploy the Swarm**: Execute the final UI/UX polish waves and deploy the backend Claude/n8n services to production.