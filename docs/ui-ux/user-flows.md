# UI/UX User Flows: @navi Platform

## 1. Design Philosophy
- **Aesthetic**: "Wall Street Luxury" (Dark slate backgrounds `#2D3748`, cream `#F7F5F0` text, and sky blue accents for interactive elements).
- **Typography**: Premium serif/sans-serif pairing with dramatic scale contrast (e.g., 120px+ headlines on landing pages).
- **Motion**: Studio-quality polish utilizing `framer-motion`. Includes staggered card reveals, floating geometric shapes, magnetic cursor effects, and smooth scroll-linked animations.

## 2. Primary User Flows

### Flow A: The Unauthenticated Visitor
1. **Landing Page**: Experiences the "manifesto" via premium scroll animations and morphing backgrounds.
2. **The Hook**: Reads essays on "Why this ecosystem exists" and the intersection of capital and culture.
3. **Call to Action**: Clicks "Request Access" (leads to a waitlist or Operator Intake form). *The platform is strictly invite-only.*

### Flow B: The Verified Member (Investor/LP)
1. **Login**: Authenticates and enters the `DashboardLayout`.
2. **Dashboard Overview**: Views key metrics, relationship strength alerts, and a summarized deal intelligence feed.
3. **Knowledge Graph Exploration**:
   - Navigates to the Knowledge Graph.
   - Pans/zooms through the D3.js force-directed graph to see how they are connected to other deals and sponsors.
4. **Deal Discovery**:
   - Navigates to **Curated Deal Rooms**.
   - Reviews a 1-page thesis, capital structure, and explicit risk disclosures.
   - Clicks "Indicate Interest" -> Selects a capital range ($100K - $2M) -> Receives off-platform wire instructions.

### Flow C: The Deal Sponsor / Operator
1. **Operator Intake**: Submits a deal via the public or authenticated form.
2. **SPV Generation**: Uses the multi-step SPV wizard to define the legal structure and generate disclosure documents.
3. **Virtual Deal Room Management**: Uploads documents, tracks which LP has viewed them, and manages access controls.

### Flow D: AI & Deal Intelligence
1. **Meeting Ingestion (Background)**: Fireflies.ai captures a Zoom call. The backend n8n workflow extracts transcripts.
2. **Deal Intelligence Dashboard**: The user opens the Deal Intelligence page to see newly parsed deals automatically generated from the meeting (e.g., "AI SaaS Suite", "Peptide E-commerce").
3. **AI Brain Chat**:
   - The user opens the AI Brain.
   - Queries: *"What is the risk profile of the Peptide E-commerce deal?"*
   - The Claude API streams a response in real-time with a ChatGPT-like typing effect, utilizing historical n8n memory to provide a highly contextual Wall Street-style assessment.