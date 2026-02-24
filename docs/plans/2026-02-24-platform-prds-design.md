# ANAVI Platform PRD Suite — v1.0

**Date:** 2026-02-24
**Author:** Product / Engineering
**Status:** Approved for implementation planning
**Scope:** Six PRDs covering production unblocking (P1) and platform differentiation (P2)

---

## Table of Contents

| # | PRD | Tier | Status |
|---|-----|------|--------|
| 1 | Deal Pipeline & Stage Management | P1 | Spec Ready |
| 2 | Document Data Room (Production-Ready) | P1 | Spec Ready |
| 3 | Contact Intelligence & Communication Sync | P1 | Spec Ready |
| 4 | AI Deal Intelligence Layer | P2 | Spec Ready |
| 5 | LP Portal & Fund Communications | P2 | Spec Ready |
| 6 | Compliance, Attribution & Payout Automation | P2 | Spec Ready |

---

## PRD-1: Deal Pipeline & Stage Management

### Problem

ANAVI stores deal records but has no visual pipeline management. Deal professionals run their books mentally across stages (Sourced → NDA → Diligence → Term Sheet → Closed). Without a kanban view, custom stages, or stale-deal visibility, the `/deals` page is a flat list with no actionable structure. Any competitor CRM (Affinity, DealCloud, Pipedrive) has this as baseline functionality.

### Solution

A new `/pipeline` route with a kanban board as the primary view. Configurable stage templates per deal type. Deal cards with key metadata. Bulk operations. Conversion analytics.

### Features

#### 1.1 Kanban Board

- **Column structure**: each column = one pipeline stage, configurable per template
- **Default stages**: Sourced | Intro Made | NDA Signed | Diligence | Term Sheet | Closed | Passed
- **Deal cards** show: deal name, counterparty name, size tier, sector badge, assigned user avatar, days-in-stage counter, last-touched date
- **Drag-and-drop** moves deal between stages; on drop: update `deals.stage`, log to `audit_log`, update `deals.stageEnteredAt`
- **Column header**: stage name, deal count, aggregate size (e.g., "4 deals · $24M")
- **Add deal** button at bottom of each column (pre-fills stage)

#### 1.2 Deal Card Detail (Slide-out Panel)

- Click card → slide-out panel with full detail
- Tabs: Overview | Participants | Documents (count) | Notes | Activity
- Quick actions: advance stage, add note, assign user, mark urgent, archive
- **Days-in-stage warning**: amber border >14 days, red border >30 days

#### 1.3 Pipeline Templates

- Templates ship for: M&A, Real Estate, Venture, Debt/Credit, Infrastructure
- Each template defines: stage names, stage order, required fields per stage, default checklist items
- Users can create custom templates in Settings → Pipeline
- Assigning a template to a deal applies its stage set

#### 1.4 Bulk Operations

- Checkbox multi-select on cards
- Bulk actions toolbar: update stage, assign owner, add tag, export CSV, archive
- Confirmation dialog for destructive bulk actions

#### 1.5 Pipeline Analytics

- New sub-tab on `/analytics`: Pipeline
- Charts: deals by stage (count + value), stage-to-stage conversion rates, average days per stage, deal velocity (deals added/closed per month), win/loss breakdown
- Date range filter

#### 1.6 Stale Deal Alerts

- Nightly job: find deals where `stageEnteredAt` < 14 days ago with no activity
- Dashboard widget: "X deals need attention" → links to filtered pipeline view
- Weekly digest email includes stale deal list

### Technical Requirements

**Schema changes:**
```sql
-- Modify deals table
ALTER TABLE deals ADD COLUMN pipelineTemplateId INT NULL REFERENCES pipeline_templates(id);
ALTER TABLE deals ADD COLUMN assignedToUserId INT NULL REFERENCES users(id);
ALTER TABLE deals ADD COLUMN lastTouchedAt TIMESTAMP DEFAULT NOW();
ALTER TABLE deals ADD COLUMN stageEnteredAt TIMESTAMP DEFAULT NOW();
ALTER TABLE deals ADD COLUMN priority ENUM('normal','urgent') DEFAULT 'normal';

-- New table
CREATE TABLE pipeline_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  dealType VARCHAR(50),
  stages JSON NOT NULL, -- [{id, name, order, color, requiredFields[]}]
  isDefault BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**New tRPC procedures:**
- `deal.getPipeline(templateId?)` → deals grouped by stage
- `deal.moveStage(dealId, newStage)` → update + audit log
- `deal.bulkUpdate(dealIds[], updates)` → batch stage/owner/tag
- `deal.getStaleDeals(thresholdDays)` → deals without stage change
- `pipelineTemplate.list`, `pipelineTemplate.create`, `pipelineTemplate.update`, `pipelineTemplate.delete`

**Frontend:**
- New `/pipeline` route in App.tsx, wrapped in ShellRoute
- `DealKanban` component — use `@dnd-kit/core` (lighter than react-beautiful-dnd, better React 19 compat)
- `DealCard` component
- `PipelineAnalytics` subview

### Acceptance Criteria

- [ ] User can see all active deals in kanban view, grouped by correct stage
- [ ] Dragging a deal card to a new column updates `deals.stage` in DB and creates `audit_log` entry
- [ ] Deal card displays last-touched date; updates within 5s of note/stage change
- [ ] Amber indicator appears on cards with no stage change in >14 days; red at >30 days
- [ ] Bulk stage update applies to all selected deals in one API call
- [ ] Pipeline analytics conversion funnel shows accurate counts and values
- [ ] Custom pipeline template can be created with 3–10 custom stages and applied to a deal

### Implementation Phases

| Phase | Scope |
|-------|-------|
| P1 | Kanban with default stages, drag-to-move, deal cards, slide-out panel |
| P2 | Custom templates, bulk operations, stale deal alerts |
| P3 | Pipeline analytics, mobile-responsive kanban |

---

## PRD-2: Document Data Room (Production-Ready)

### Problem

The deal room document UI exists but is entirely cosmetic — no file persists across sessions. For any real deal, the data room IS the deal: pitch decks, financials, cap tables, diligence responses all need to live there. `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` are already in `package.json` but unused. The document UI has settings for watermarking and download controls that are not enforced.

### Solution

Wire S3-backed file storage with presigned uploads. Add viewer engagement analytics. Enforce watermarking and download controls. Integrate an e-signature provider. Make the data room production-grade.

### Features

#### 2.1 File Upload & Storage

- **Presigned upload**: client requests upload URL from tRPC → gets S3 presigned PUT URL → uploads directly to S3 (no file transits server)
- **File limits**: 500MB per file, 5GB per deal room
- **Supported types**: PDF, DOCX, XLSX, PPTX, images (JPG, PNG), ZIP
- **Virus scan**: ClamAV or SentinelOne API check before confirming schema persistence; infected files deleted from S3
- **Schema persistence**: `files` record created only after upload confirmed + scan passed
- **File metadata**: name, size, type, uploader, uploaded_at, version, folder, checksum (SHA-256)

#### 2.2 Folder Organization

- Hierarchical folder structure within deal room
- **Default folders on room creation**: Overview, Financials, Legal, Diligence, Correspondence
- Drag-and-drop file/folder management
- Breadcrumb navigation

#### 2.3 Viewer Engagement Analytics

- Every file view/download logs: userId, fileId, action (view/download/print), timestamp, session duration
- **Document-level analytics**: total views, unique viewers, last viewed, download count
- **Per-viewer breakdown**: who viewed, when, how long (for PDFs: page-level time via client instrumentation)
- **Notification**: uploader receives in-app + email notification when counterparty opens their document for the first time
- Analytics visible to deal room owner and file uploader

#### 2.4 PDF Watermarking

- All PDF views and downloads automatically watermarked server-side using `pdf-lib`
- **Watermark content**: viewer's full name, date/time, deal room ID, "CONFIDENTIAL — DO NOT DISTRIBUTE"
- Non-watermarked source stored in S3; watermarked version generated on demand and cached for 1 hour
- Watermark rendered at 20% opacity diagonally across each page

#### 2.5 Secure Sharing Links

- "Share" action on any file or folder generates a link with a random token
- **Configurable expiry**: 24h, 7 days, 30 days, no expiry
- **Email gate option**: require email address entry before access; logged to `file_access_logs`
- **Per-link permissions**: view-only or download-allowed
- Link access revocable at any time (token invalidated)
- Access via share link logged independently of deal room participant access

#### 2.6 Version History

- Uploading a new file with same name as existing → version bump (v1, v2…)
- Version list with uploader, date, and optional change note
- Download any specific version (deal owner only)
- Current version served by default; older versions clearly labeled

#### 2.7 E-Signature Workflow

- "Request Signature" action on any PDF
- Integrates with **Dropbox Sign (HelloSign)** API
- Sender: specifies signers from deal room participants + optional external email, sets signature fields, deadline
- Status tracking: Pending / Opened / Signed / Declined / Expired
- On completion: signed PDF stored as new document version with embedded certificate
- All signatures logged to `document_signatures` table (existing schema)

#### 2.8 Download Controls (Enforced)

- Per-file toggle: allow download / view-only
- Deal room default setting applies to all new uploads
- View-only PDFs rendered in embedded PDF viewer with browser download APIs blocked
- Download-blocked files return 403 on direct S3 URL attempts (presigned URL scopes limited to GET with Content-Disposition inline)

### Technical Requirements

**Schema changes:**
```sql
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealRoomId INT NOT NULL REFERENCES deal_rooms(id),
  folderId INT NULL,
  s3Key VARCHAR(500) NOT NULL,
  name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  uploaderId INT NOT NULL REFERENCES users(id),
  version INT DEFAULT 1,
  checksum VARCHAR(64),
  allowDownload BOOLEAN DEFAULT TRUE,
  status ENUM('pending','scanned','infected','active','deleted') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE file_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fileId INT NOT NULL REFERENCES files(id),
  version INT NOT NULL,
  s3Key VARCHAR(500) NOT NULL,
  uploadedBy INT NOT NULL REFERENCES users(id),
  changeNote TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE file_access_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fileId INT NOT NULL REFERENCES files(id),
  userId INT NULL REFERENCES users(id),
  shareToken VARCHAR(100) NULL,
  action ENUM('view','download','print') NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  durationSeconds INT,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE file_shares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fileId INT NOT NULL REFERENCES files(id),
  token VARCHAR(100) NOT NULL UNIQUE,
  createdBy INT NOT NULL REFERENCES users(id),
  allowDownload BOOLEAN DEFAULT FALSE,
  requiresEmail BOOLEAN DEFAULT FALSE,
  expiresAt TIMESTAMP NULL,
  revokedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**New tRPC procedures:**
- `file.getUploadUrl(dealRoomId, fileName, fileSize, mimeType)` → `{ uploadUrl, fileId }`
- `file.confirmUpload(fileId)` → triggers virus scan → activates record
- `file.list(dealRoomId, folderId?)` → files with metadata
- `file.get(fileId)` → presigned GET URL (watermarked if PDF + view-only)
- `file.delete(fileId)`
- `file.createShare(fileId, options)` → share token
- `file.logAccess(fileId, action, duration)`
- `file.getEngagement(fileId)` → viewer analytics
- `file.requestSignature(fileId, signers[], deadline)` → HelloSign envelope
- `file.getSignatureStatus(fileId)` → envelope status

**Dependencies to add:**
- `pdf-lib` — PDF watermarking
- `@hellosign/dropbox-sign` — e-signature
- AWS S3 already in package.json

### Acceptance Criteria

- [ ] File uploaded via presigned URL persists and is retrievable by all deal room participants
- [ ] PDF viewer shows watermark with correct viewer identity and timestamp
- [ ] Virus-infected file is deleted from S3 and never creates a `files` record
- [ ] View analytics shows accurate view count, viewer names, and duration
- [ ] E-signature request creates envelope in Dropbox Sign; status updates via webhook
- [ ] Time-limited share link returns 403 after expiry
- [ ] View-only file cannot be downloaded via browser mechanisms

### Implementation Phases

| Phase | Scope |
|-------|-------|
| P1 | S3 upload/download, folder structure, basic file management |
| P2 | Viewer analytics, watermarking, download controls |
| P3 | Share links, version history, e-signature |

---

## PRD-3: Contact Intelligence & Communication Sync

### Problem

Relationships on ANAVI are cold snapshots. There is no way to import contacts in bulk, no communication history, no "last touched" awareness, and no enrichment. Affinity charges $50K/year per fund for exactly this functionality. ANAVI's relationship custody promise requires the relationship graph to stay warm automatically — not through manual entry.

### Solution

Gmail/Outlook OAuth for communication auto-logging. Contact enrichment via third-party API. Last-touched surface with staleness alerts. CSV bulk import. Relationship strength score computed from actual activity.

### Features

#### 3.1 Email Integration (Gmail / Outlook OAuth)

- OAuth scopes: **metadata only** (sender, recipient, subject, date, threadId — NOT email body)
- Auto-detect emails with known ANAVI contacts (match on email address)
- Create `contact_activities` record per email thread: type=email, participants, date, threadId
- Timeline on contact profile: "Email thread with [Name] on [Date] · [Subject line]"
- User controls: pause sync, disconnect, delete synced history (GDPR-compliant purge)
- Initial sync: last 90 days of email metadata
- Incremental sync: new emails checked every 15 minutes via background job

#### 3.2 Calendar Integration (Enhancement)

- Calendar schema already exists (`calendarConnections`, `calendarEvents`)
- Add: pull meetings where ANAVI contacts are attendees
- Create `contact_activities` entry per meeting: type=meeting, attendees, date, duration, subject
- Upcoming meetings widget on contact detail page
- "No meeting in 60 days" flag on contact card

#### 3.3 Contact Enrichment

- On contact creation (or manual trigger): auto-enrich via Clearbit/Apollo/Hunter API
- Populated fields: company name, title, LinkedIn URL, location, phone, company headcount, sector
- Company news: last 5 headlines for their company via news API
- Enrichment status badge on contact: Enriched (green), Partial (amber), Unknown (gray)
- **Credit system**: 100 enrichments/month free; additional at $0.10/enrichment (metered)
- Bulk enrich after CSV import (user confirmation required — shows credit cost)

#### 3.4 Last Touched & Staleness Surface

- `lastTouchedAt` = max of: email activity, calendar meeting, deal room event, manual note, or manual "Touched" button
- **Relationships page column**: "Last Touched" — sortable, filterable
- **Dashboard widget**: "X relationships not touched in 30+ days" → filtered view
- **Staleness tiers**: 30 days (amber), 60 days (red), 90+ days (critical)
- **Staleness alert email**: weekly digest listing contacts by staleness tier
- **Reconnect composer**: click "Reconnect" → opens outreach draft with AI-suggested opening line

#### 3.5 CSV / LinkedIn Import

- CSV import wizard: upload → map columns → preview → confirm
- Field mapping: name, email, company, title, phone, notes, tags
- **Duplicate detection**: match on email address → offer merge or skip
- **LinkedIn export import**: accepts LinkedIn's native connection export CSV format (columns: First Name, Last Name, Email Address, Company, Position, Connected On)
- Import history: previous imports with record counts, dates, errors
- Batch enrichment prompt after import

#### 3.6 Relationship Strength Score

- Score 0–100 based on weighted activity factors:
  - Email threads in last 90 days: 30 points max
  - Calendar meetings in last 90 days: 30 points max
  - Deal collaborations (shared deal rooms, matches): 25 points max
  - Platform activity (both parties active on ANAVI): 15 points max
- Score decays: no activity for 90 days → score halves
- Displayed as a subtle 5-bar indicator on contact cards and relationship list
- "Strongest Relationships" filter on /relationships page

#### 3.7 Manual Note & Activity Logging

- Quick-add activity on any contact: text + type (Call, Meeting, Email, Task, Note, Other)
- Activity type icons in timeline
- Pin important notes to top of timeline
- Reminder attachment: add a follow-up date to any note → creates calendar event

### Technical Requirements

**Schema changes:**
```sql
CREATE TABLE contact_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contactId INT NOT NULL REFERENCES contact_handles(id),
  userId INT NOT NULL,
  type ENUM('email','meeting','call','note','task','deal_event','platform') NOT NULL,
  summary TEXT,
  source ENUM('gmail','outlook','calendar','manual','platform') NOT NULL,
  externalId VARCHAR(255) NULL, -- email threadId or calendar eventId
  occurredAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE oauth_connections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL REFERENCES users(id),
  provider ENUM('gmail','outlook','google_calendar','outlook_calendar') NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  tokenExpiresAt TIMESTAMP,
  scopes TEXT,
  connectedAt TIMESTAMP DEFAULT NOW(),
  lastSyncAt TIMESTAMP NULL,
  isPaused BOOLEAN DEFAULT FALSE
);

CREATE TABLE enrichment_credits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL REFERENCES users(id),
  used INT DEFAULT 0,
  monthlyLimit INT DEFAULT 100,
  resetAt TIMESTAMP NOT NULL
);

-- Modify relationships table
ALTER TABLE relationships ADD COLUMN lastTouchedAt TIMESTAMP NULL;
ALTER TABLE relationships ADD COLUMN strengthScore TINYINT UNSIGNED DEFAULT 0;
ALTER TABLE relationships ADD COLUMN linkedinUrl VARCHAR(500) NULL;
ALTER TABLE relationships ADD COLUMN enrichedAt TIMESTAMP NULL;
ALTER TABLE relationships ADD COLUMN enrichmentStatus ENUM('none','partial','full') DEFAULT 'none';
```

**New tRPC procedures:**
- `oauth.connect(provider)` → OAuth URL
- `oauth.disconnect(provider)` → revoke + delete tokens
- `oauth.syncEmails` → trigger manual sync
- `contact.logActivity(contactId, type, summary, occurredAt)`
- `contact.getTimeline(contactId)` → paginated activity log
- `contact.importCsv(csvData, mappings)` → import job
- `contact.enrich(contactId)` → trigger enrichment
- `contact.getStale(days)` → contacts by staleness tier
- `contact.getStrengthRanking` → sorted by strength score

**Background jobs:**
- `syncEmailMetadata` — runs every 15 min per connected user
- `syncCalendarEvents` — runs every 30 min per connected user
- `recalculateStrengthScores` — runs nightly
- `sendStalenessDigest` — runs weekly (Monday 8am user timezone)

### Acceptance Criteria

- [ ] Gmail OAuth connection auto-detects emails with known contacts within 15 minutes
- [ ] Contact timeline shows emails, meetings, and manual notes in chronological order
- [ ] CSV import with 100 contacts: correct field mapping, duplicate detection, import summary
- [ ] "Last Touched" column on relationships page sorts correctly; updates within 60s of new activity
- [ ] Staleness email sent when contact crosses 30-day threshold
- [ ] Enrichment populates company and title for >70% of contacts with valid email addresses
- [ ] Strength score changes when email activity added; decays correctly after 90 days of inactivity

### Implementation Phases

| Phase | Scope |
|-------|-------|
| P1 | CSV import, manual activity logging, last-touched column |
| P2 | Gmail/Outlook OAuth, email metadata sync, calendar sync |
| P3 | Enrichment API, strength score, staleness alerts and digest |

---

## PRD-4: AI Deal Intelligence Layer

### Problem

ANAVI has 12+ AI procedures wired to Claude in the backend. None of them surface as user-facing workflows — they exist as API endpoints but have no UI entry points that guide users through them. Writing a deal memo is the most time-consuming task for any deal person (2–4 hours per memo). Entering a deal room without counterparty context is a consistent failure mode. Red flags are discovered late in diligence (after significant time invested).

### Solution

Wire the existing AI infrastructure into four concrete user workflows: deal memo generation, counterparty brief, red flag detection, and match score transparency.

### Features

#### 4.1 Deal Memo Generator

- **Entry point**: button in deal room → "Generate Deal Memo" modal
- **Input**: select uploaded documents to analyze (pitch deck, financials, CIM, or any PDF)
- **Processing**: streams Claude response with structured output
- **Output — seven sections**:
  1. Executive Summary (3–5 sentences)
  2. Company Overview (product, market, team highlights)
  3. Investment Thesis (bull case, key drivers)
  4. Key Risks & Red Flags (numbered list)
  5. Financial Highlights (extracted key figures: revenue, EBITDA, growth rate, burn, runway)
  6. Comparable Transactions (recent comps with deal size and multiples where available)
  7. Initial Diligence Questions (10–15 specific questions to ask the company)
- **Streaming**: section titles appear first; content streams in progressively (< 90 seconds total)
- **Editable output**: each section is an editable text block before saving
- **Save**: saved memo stored as a document in the deal room (type=`deal_memo`)
- **Regenerate**: upload new documents → regenerate replaces previous memo with version history

#### 4.2 Counterparty Brief

- **Trigger**: modal shown the first time a user opens a deal room, after a brief delay (3s)
- **Also accessible**: "View Brief" button on deal room header, and from any contact profile
- **AI generates 1-page structured brief**:
  - Company overview (product, founded, HQ, stage)
  - Recent news (last 90 days — synthesized from AI knowledge + enrichment data)
  - Known platform relationships (which ANAVI members are connected to this party)
  - Risk signals (negative press, regulatory actions, leadership departures, litigation mentions)
  - Suggested talking points (3 bullets, specific to this deal type)
- **Cache**: brief cached 24h per counterparty entity (keyed on dealRoomId + counterpartyId)
- **Refresh Brief** button forces regeneration

#### 4.3 Red Flag Detection

- **Trigger**: automatically runs when PDF documents are uploaded to a deal room
- **Scans for**:
  - Missing or unaudited financial statements
  - Founder vesting gaps (cliff missing, single-point equity concentration >60%)
  - Cap table anomalies (unusual rights, preferences, anti-dilution provisions)
  - Revenue recognition issues (e.g., recognizing upfront vs. over contract life)
  - Outstanding litigation, regulatory actions, or consent decrees mentioned
  - Conflicting metrics across documents (different revenue numbers in pitch vs. financials)
  - Related-party transactions not properly disclosed
- **Output**: list of flagged issues with severity (High / Medium / Low) + page reference
- **UI**: banner in deal room: "3 potential issues detected" with expandable list
- **Dismissable**: each flag can be dismissed with a note by the deal owner
- **Audit**: dismissed flags still visible in compliance tab with who dismissed and why

#### 4.4 Market Comparables Widget

- **Location**: sidebar widget in deal room, auto-triggered when deal has sector + size
- **AI returns**:
  - 3–5 recent comparable transactions in the same sector and size range
  - Typical valuation multiples for the sector (EV/Revenue, EV/EBITDA, P/E where applicable)
  - Current market conditions summary (2–3 sentences)
- **Framing**: "Based on [X] comparable transactions, this deal is priced at [X] vs. median of [Y]"
- Refreshes when deal metadata (sector, size, type) changes

#### 4.5 Match Score Transparency

- **Enhancement to existing match cards**: expand the compatibility score display
- Each match shows:
  - **Why this scores high**: 3 bullet reasons (specific: "Both seeking Series B real estate deals in Southeast US")
  - **Risk factors**: 1–2 reasons this match might not work ("Size range mismatch: you seek $5M+, they target <$3M")
  - **Shared connections**: "You and this party are both connected to [Name on ANAVI]" (without revealing identity if blind)
- **Toggle**: "Show reasoning" expander on match card
- Uses existing `ai.semanticMatch` procedure output — enhance to include `reasons`, `risks`, `sharedConnections`

### Technical Requirements

**New tRPC procedures:**
- `ai.generateDealMemo(dealRoomId, fileIds[])` → SSE stream of memo sections
- `ai.getCounterpartyBrief(dealRoomId)` → cached brief object
- `ai.detectRedFlags(dealRoomId, fileId)` → flagged issues array
- `ai.getComparables(dealId)` → comparables widget data
- `ai.explainMatch(matchId)` → reasons, risks, sharedConnections

**Schema changes:**
```sql
CREATE TABLE deal_memos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealRoomId INT NOT NULL REFERENCES deal_rooms(id),
  content JSON NOT NULL, -- {sections: [{title, body}]}
  sourceFileIds JSON, -- array of fileIds used to generate
  generatedBy INT NOT NULL REFERENCES users(id),
  generatedAt TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1
);

CREATE TABLE counterparty_briefs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealRoomId INT NOT NULL REFERENCES deal_rooms(id),
  content JSON NOT NULL,
  generatedAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP NOT NULL -- generatedAt + 24h
);

CREATE TABLE red_flags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealRoomId INT NOT NULL REFERENCES deal_rooms(id),
  fileId INT NULL REFERENCES files(id),
  severity ENUM('high','medium','low') NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  pageRef VARCHAR(50) NULL,
  dismissedAt TIMESTAMP NULL,
  dismissedBy INT NULL REFERENCES users(id),
  dismissNote TEXT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**Claude model**: use `claude-sonnet-4-6` for all AI procedures (already configured in `server/claude.ts`).

**Streaming**: deal memo uses Server-Sent Events (SSE) via a dedicated Express endpoint (not tRPC, which doesn't support streaming efficiently). Alternatively, use tRPC subscriptions.

### Acceptance Criteria

- [ ] Deal memo generates in < 90 seconds for a 20-page PDF
- [ ] Memo contains all 7 sections with data extracted from the source document
- [ ] Memo sections are editable before save; saved version appears in deal room Documents tab
- [ ] Counterparty brief renders before deal room entry with news items from past 90 days
- [ ] Red flag detection runs within 60 seconds of document upload
- [ ] Red flag correctly identifies at least 3 standard issues in a test document with known issues
- [ ] Match card "Show reasoning" toggle displays positive reasons AND risk factors

### Implementation Phases

| Phase | Scope |
|-------|-------|
| P1 | Deal memo generator (upload → stream → edit → save) |
| P2 | Counterparty brief, red flag detection |
| P3 | Market comparables widget, match score transparency |

---

## PRD-5: LP Portal & Fund Communications

### Problem

`/lp-portal` is a static page with no data or functionality. The "allocator" persona — fund managers with 10–50 LPs — has no end-to-end workflow on ANAVI. Managing LP communications (capital calls, distributions, quarterly reports, portfolio updates) is still done via email and PDF attachments by most mid-market managers. This is an entire sub-product that, once built, makes ANAVI indispensable to fund managers.

### Solution

A dual-access sub-product: **Fund Manager control panel** to draft and send communications, and **LP Portal** for LPs to receive and acknowledge. Both accessed via standard ANAVI login with role-based access.

### Features

#### 5.1 Fund Setup (Fund Manager)

- Create fund entity: name, vintage year, strategy (VC/PE/Real Estate/Credit/Hedge), currency, total commitment amount, status (raising/active/harvesting)
- Invite LPs by email (sends invitation email → creates user with `fund_lp` role for this fund)
- Set LP commitment amount and pro-rata percentage on invite
- Fund overview dashboard: total committed, total called, total distributed, current NAV, IRR, DPI, TVPI

#### 5.2 LP Portal (LP View)

- Clean, minimal interface — LP doesn't need full ANAVI navigation
- **Summary header**: committed capital, total called to date, distributed to date, current NAV, net IRR
- **Document inbox**: all communications received, filterable by type (Capital Call, Distribution, Report, Update) and date
- **Capital Account Statement**: running ledger showing every call, distribution, fee, and net position
- **Notification center**: unread count badge, email notifications for new items
- **One-click acknowledgment**: "Confirm Receipt" button on capital calls and distributions → logged to audit trail

#### 5.3 Capital Call Notices

- Fund manager creates call: total call amount, call date, due date, funding purpose (free text), wire instructions (bank name, ABI routing, account, reference), PDF attachment optional
- System auto-calculates per-LP amount based on their commitment % (rounded to 2 decimal places)
- Preview before send: shows each LP's calculated amount
- Send: creates `fund_communications` record (type=capital_call) + `capital_calls` record per LP
- LP receives email with their amount, due date, wire instructions, and link to portal
- **Status tracking**: each LP marked as: Notified → Confirmed → Funded (self-reported by LP)
- Manager dashboard: called vs. confirmed vs. funded count and totals

#### 5.4 Distribution Notices

- Fund manager creates distribution: total amount, distribution date, type (Return of Capital / Realized Gain / Interest / Dividend), tax year
- Per-LP amounts auto-calculated from pro-rata
- LP receives email and in-portal notification
- Distribution logged to LP capital account statement
- Tax document attachment option (K-1 stub)

#### 5.5 Quarterly Letters & NAV Statements

- Rich text editor (markdown) for quarterly letter body
- Attach PDF (e.g., audited financials, portfolio summary)
- NAV statement: fund manager inputs current quarter-end NAV → system updates per-LP NAV based on their ownership %
- Schedule delivery for future date/time
- LPs receive email notification + in-portal document

#### 5.6 Portfolio Update Posts

- Fund manager posts update about a portfolio company: title, body (rich text + images), attachments
- LPs subscribed to the fund receive email digest (immediate or batched daily)
- Chronological archive in LP portal
- Optional comment/reaction from LPs (configurable per fund)

#### 5.7 Performance Reporting

- Automatic calculation from call/distribution history:
  - **DPI** (Distributions to Paid-In Capital): total distributions / total capital called
  - **RVPI** (Residual Value to Paid-In): current NAV / total capital called
  - **TVPI** (Total Value to Paid-In): DPI + RVPI
  - **Net IRR**: XIRR calculation from dated cash flows
- Charts: capital deployment schedule (called by quarter), distribution timeline, NAV over time
- Export: PDF report package with all metrics and charts (for LP delivery)

### Technical Requirements

**New DB tables:**
```sql
CREATE TABLE funds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  managerId INT NOT NULL REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  vintageYear SMALLINT,
  strategy ENUM('venture','private_equity','real_estate','credit','hedge','other'),
  currency CHAR(3) DEFAULT 'USD',
  totalCommitment DECIMAL(20,2),
  currentNav DECIMAL(20,2),
  status ENUM('raising','active','harvesting','closed') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fund_lps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fundId INT NOT NULL REFERENCES funds(id),
  userId INT NOT NULL REFERENCES users(id),
  commitment DECIMAL(20,2) NOT NULL,
  proRataPct DECIMAL(8,6) NOT NULL, -- e.g. 0.125000 for 12.5%
  invitedAt TIMESTAMP DEFAULT NOW(),
  joinedAt TIMESTAMP NULL
);

CREATE TABLE fund_communications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fundId INT NOT NULL REFERENCES funds(id),
  type ENUM('capital_call','distribution','quarterly_letter','nav_statement','portfolio_update') NOT NULL,
  title VARCHAR(300),
  body TEXT,
  attachmentKeys JSON, -- S3 keys
  scheduledAt TIMESTAMP NULL,
  sentAt TIMESTAMP NULL,
  createdBy INT NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE capital_calls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  communicationId INT NOT NULL REFERENCES fund_communications(id),
  fundId INT NOT NULL REFERENCES funds(id),
  totalAmount DECIMAL(20,2) NOT NULL,
  callDate DATE NOT NULL,
  dueDate DATE NOT NULL,
  purpose TEXT,
  wireInstructions JSON
);

CREATE TABLE capital_call_lps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  callId INT NOT NULL REFERENCES capital_calls(id),
  lpId INT NOT NULL REFERENCES users(id),
  amount DECIMAL(20,2) NOT NULL,
  status ENUM('notified','confirmed','funded') DEFAULT 'notified',
  confirmedAt TIMESTAMP NULL,
  fundedAt TIMESTAMP NULL
);

CREATE TABLE distributions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  communicationId INT NOT NULL REFERENCES fund_communications(id),
  fundId INT NOT NULL REFERENCES funds(id),
  totalAmount DECIMAL(20,2) NOT NULL,
  distributionDate DATE NOT NULL,
  type ENUM('return_of_capital','realized_gain','interest','dividend') NOT NULL,
  taxYear SMALLINT
);
```

**New tRPC router:** `fund` with procedures:
- `fund.create`, `fund.get`, `fund.list`, `fund.update`
- `fund.inviteLp`, `fund.getLps`, `fund.updateLpCommitment`
- `fund.sendCapitalCall`, `fund.sendDistribution`, `fund.sendLetter`, `fund.updateNav`
- `fund.confirmCapitalCall(callId)` — LP action
- `fund.getCapitalAccountStatement(fundId)` — LP view
- `fund.getPerformanceMetrics(fundId)` — IRR, DPI, TVPI, RVPI
- `fund.exportReport(fundId, quarter, year)` → PDF generation

**New routes:**
- `/fund-management` — fund manager control panel (ShellRoute)
- `/fund-management/:fundId` — specific fund detail
- `/lp-portal/:fundId` — LP view (ShellRoute with restricted nav)

**IRR Calculation:** Implement XIRR using Newton-Raphson method (or use `financial.js` library). Takes array of `{date, amount}` pairs (negative for capital calls, positive for distributions + current NAV).

### Acceptance Criteria

- [ ] Fund manager creates fund, invites 2 LPs, sends capital call in < 10 minutes
- [ ] LPs receive email notification within 60 seconds of capital call send
- [ ] Per-LP call amount auto-calculated correctly from pro-rata percentage
- [ ] LP capital account statement reflects all calls and distributions in correct order
- [ ] LP confirming receipt creates audit log entry visible to fund manager
- [ ] IRR calculation matches Excel XIRR function for same inputs (within 0.01%)
- [ ] PDF report export contains fund metrics, LP table, and performance chart

### Implementation Phases

| Phase | Scope |
|-------|-------|
| P1 | Fund setup, LP invite, capital call send, LP portal view |
| P2 | Distribution notices, quarterly letters, NAV updates |
| P3 | Performance metrics (IRR/DPI/TVPI), PDF export, portfolio updates |

---

## PRD-6: Compliance, Attribution & Payout Automation

### Problem

ANAVI's core promise is "custody proof + automatic attribution + fair payout." Currently: compliance checks always pass (2-second simulated timeout), KYC/KYB is UI-only, payouts are DB records with no settlement, and attribution has no cryptographic guarantee. Without these being real, the platform cannot be trusted for actual financial transactions.

### Solution

Real identity verification via Stripe Identity or Persona.com. OFAC/sanctions screening. An append-only, hash-chained attribution ledger. Milestone-triggered Stripe Connect payouts. A printable attribution certificate artifact.

### Features

#### 6.1 Real KYC/KYB Integration

- **Provider**: Stripe Identity (primary) or Persona.com (alternative)
- **Individual KYC**: government ID upload + selfie → automated verification → webhook result
- **Business KYB**: company registration, beneficial owner declarations → manual review queue
- **Webhook handling**: `identity.verification_session.verified` → update `users.verificationTier`
- **Tier mapping**:
  - Tier 0: Email unverified
  - Tier 1: Email verified
  - Tier 2: KYC passed (individual identity confirmed)
  - Tier 3: KYC + KYB passed (business entity verified)
- **Re-verification**: required every 24 months or on compliance flag
- **Failed verification**: user shown actionable reason (document unclear, name mismatch) with retry option

#### 6.2 OFAC & Sanctions Screening

- **Screening sources**: OFAC SDN list, UN Consolidated List, EU Financial Sanctions
- **Provider**: ComplyAdvantage API (primary) or direct OFAC SDN XML feed (fallback, cron-synced daily)
- **Screening triggers**:
  - New user registration
  - New deal party added to a deal room
  - Periodic re-screen (monthly batch job)
- **Results**: Cleared / Potential Match (manual review) / Blocked
- **Potential match queue**: platform compliance admin reviews, approves/rejects with note
- **Blocked users**: cannot create intents, join deal rooms, or initiate payouts
- **All screening results**: appended to `compliance_checks` with immutability enforcement

#### 6.3 Immutable Attribution Ledger

- **Attribution events**: recorded for every relationship introduction, intent match, and deal room join
- **Append-only enforcement**: DB-level trigger prevents UPDATE/DELETE on `attribution_events`
- **Hash chain**: each event stores `hash` (SHA-256 of own data) and `prevHash` (previous event's hash in same deal) — lightweight tamper-evidence without blockchain
- **Attribution chain view**: visual timeline in deal room showing the full sequence of introductions and joins with timestamps and trust tiers
- **Verification endpoint**: `GET /api/verify/:hash` (public, no auth) → returns event data or "Invalid hash"
- **PDF export**: "Export Attribution Chain" button → generates PDF of full chain with hashes and QR codes

#### 6.4 Deal Milestone Triggers

- **Milestone definition**: deal owners define milestones on any deal with:
  - Trigger stage (e.g., "NDA Signed", "Closed")
  - Payout percentage (e.g., 50% on NDA, 50% on Close)
  - Recipient (from attribution chain participants)
- **Auto-trigger**: when `deals.stage` changes to a milestone's trigger stage → creates `payouts` record (status=pending)
- **Payout review**: deal owner reviews pending payouts before settlement; can approve or dispute
- **Dispute flow**: disputed payouts flagged for platform admin review

#### 6.5 Stripe Connect Integration

- **Setup**: originators/intermediaries connect Stripe account in Settings → Payments tab
- **Onboarding**: Stripe Connect Express onboarding flow (hosted by Stripe)
- **Payout approval flow**: deal owner approves → tRPC procedure calls `stripe.transfers.create` → `payouts.stripeTransferId` updated → status = processing
- **Stripe webhook**: `transfer.paid` → status = paid; `transfer.failed` → status = failed + retry notification
- **Platform commission**: configurable % deducted before transfer (held in platform Stripe account)
- **Payout ledger**: per-user transaction history with Stripe transfer IDs and statuses

#### 6.6 Attribution Certificate

- **Trigger**: "Generate Certificate" button available on a deal in Closed stage
- **Certificate contents** (PDF, A4):
  - Platform logo and certificate title
  - Deal name, close date, deal type, size tier
  - Full attribution chain: each participant with name, role, date joined, trust tier, custody hash
  - Platform digital signature (PDF /Sig field)
  - QR code linking to `GET /api/verify/:rootHash`
  - Disclaimer: "This certificate is issued by ANAVI Platform and represents the verified custody record as of [date]"
- **Generation**: < 10 seconds using `pdf-lib`
- **Distribution**: stored as deal room document + emailed to all attribution recipients

### Technical Requirements

**Schema changes:**
```sql
CREATE TABLE attribution_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealId INT NOT NULL REFERENCES deals(id),
  type ENUM('introduction','match','deal_room_join','intent_create','deal_close') NOT NULL,
  actorId INT NOT NULL REFERENCES users(id),
  subjectId INT NULL REFERENCES users(id),
  metadata JSON, -- context-specific data
  hash CHAR(64) NOT NULL, -- SHA-256 of (dealId+type+actorId+subjectId+metadata+prevHash+createdAt)
  prevHash CHAR(64) NULL, -- hash of previous event in this deal's chain
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
  -- No UPDATE or DELETE permitted: enforced via DB trigger
);

CREATE TABLE deal_milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealId INT NOT NULL REFERENCES deals(id),
  name VARCHAR(100) NOT NULL,
  triggerStage VARCHAR(50) NOT NULL,
  payoutPct DECIMAL(5,2) NOT NULL, -- e.g. 50.00
  recipientId INT NOT NULL REFERENCES users(id),
  status ENUM('pending','triggered','paid','disputed') DEFAULT 'pending',
  triggeredAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Modify payouts table
ALTER TABLE payouts ADD COLUMN milestoneId INT NULL REFERENCES deal_milestones(id);
ALTER TABLE payouts ADD COLUMN stripeTransferId VARCHAR(100) NULL;
ALTER TABLE payouts ADD COLUMN approvedById INT NULL REFERENCES users(id);
ALTER TABLE payouts ADD COLUMN approvedAt TIMESTAMP NULL;
ALTER TABLE payouts MODIFY COLUMN status ENUM('pending','approved','processing','paid','failed','disputed');

-- Modify users table
ALTER TABLE users ADD COLUMN stripeAccountId VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN stripeOnboardingComplete BOOLEAN DEFAULT FALSE;
```

**DB trigger for attribution immutability:**
```sql
CREATE TRIGGER prevent_attribution_update
BEFORE UPDATE ON attribution_events
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attribution events are immutable';

CREATE TRIGGER prevent_attribution_delete
BEFORE DELETE ON attribution_events
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attribution events cannot be deleted';
```

**New tRPC procedures:**
- `compliance.startVerification(type: 'kyc'|'kyb')` → Stripe Identity session URL
- `compliance.getVerificationStatus` → current tier + last verified date
- `compliance.screenParty(userId)` → run OFAC/sanctions check on demand
- `compliance.getPendingReviews` → admin: potential matches awaiting review
- `payout.approvePayout(payoutId)` → validate + initiate Stripe transfer
- `payout.disputePayout(payoutId, reason)`
- `attribution.getChain(dealId)` → full hash-linked event chain
- `attribution.verifyHash(hash)` → verify any attribution event
- `attribution.generateCertificate(dealId)` → PDF bytes (base64)
- `stripe.connectAccount` → Stripe Connect Express onboarding URL
- `stripe.getAccountStatus` → connected, pending, restricted

**Public endpoint (no auth):**
```
GET /api/verify/:hash
→ 200: { eventType, date, dealId, actorRole, hash, prevHash, platformSignature }
→ 404: { error: "Hash not found" }
```

**Dependencies to add:**
- `stripe` npm package (for Connect transfers + Identity)
- `@persona-kyc/client` or use Stripe Identity webhooks
- Existing `pdf-lib` (added in PRD-2)

### Acceptance Criteria

- [ ] Stripe Identity KYC flow completes end-to-end: user submits ID → webhook fires → `verificationTier` updated
- [ ] OFAC screening runs on new user registration and returns result within 30 seconds
- [ ] Two consecutive attribution events for the same deal have hash linkage: `event2.prevHash === event1.hash`
- [ ] Attribution UPDATE trigger raises error (verified via DB-level test)
- [ ] Public verify endpoint returns correct event data for a valid hash, 404 for invalid hash
- [ ] Milestone trigger creates pending payout automatically when deal stage matches trigger condition
- [ ] Stripe Connect transfer initiated within 60 seconds of payout approval
- [ ] Attribution certificate PDF generates in < 10 seconds; QR code resolves to correct verify endpoint

### Implementation Phases

| Phase | Scope |
|-------|-------|
| P1 | Attribution event logging with hash chain; attribution chain view; verify endpoint |
| P2 | Stripe Identity KYC; OFAC screening integration; deal milestones |
| P3 | Stripe Connect payout settlement; attribution certificate PDF |

---

## Cross-PRD Dependencies

| PRD | Depends On |
|-----|-----------|
| PRD-2 (Documents) | None — can start immediately (S3 SDK already in package.json) |
| PRD-4 (AI Intelligence) | PRD-2 (needs documents to analyze) |
| PRD-1 (Pipeline) | None — can start immediately |
| PRD-3 (Contact Sync) | None — can start immediately |
| PRD-5 (LP Portal) | PRD-2 (for LP document delivery) |
| PRD-6 (Compliance/Payout) | PRD-2 (for certificate PDF), Stripe SDK install |

## Recommended Execution Order

1. **PRD-2** — Documents (unlocks PRD-4 and PRD-5; most foundational gap)
2. **PRD-1** — Pipeline (independent, high daily-use value)
3. **PRD-3** — Contact Intelligence (independent, high daily-use value)
4. **PRD-6 Phase 1** — Attribution ledger (no external dependencies)
5. **PRD-4** — AI Intelligence (depends on documents being real)
6. **PRD-5** — LP Portal (depends on documents; complex sub-product)
7. **PRD-6 Phases 2–3** — KYC + Stripe (requires vendor contracts)
