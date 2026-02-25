# F7: Counterparty-Facing Payout Statements — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Counterparty-Facing Payout Statements  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.2

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Generate PDF/HTML statement per period. Include deal refs, amounts, dates. Shareable link with expiry. Download. Generation <10s; templated; audit trail.

### Architecture

`payout.getStatement(userId, periodStart, periodEnd)` → aggregate payouts. Template (React-PDF, Puppeteer, or jsPDF). S3 or inline PDF. Shareable link: `payout.getStatementByToken(token)` — public, token expires.

### Tech Stack

Drizzle ORM, tRPC v11, React-PDF or Puppeteer, Resend (email statement link), Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `payouts`, `deals`, `users` |
| `anavi/server/db.ts` | getPayoutsByUser, date filter |

### Phase 1: Statement Generation

**Task 1 — Statement query**  
- `getStatementData(userId, startDate, endDate)`  
- Join payouts, deals; filter by date; sum by deal  
- Return: { user, period, items: [{ dealRef, amount, date, status }], total }

**Task 2 — PDF template**  
- Layout: header (ANAVI, period), user name, table of payouts, totals, footer  
- Use React-PDF `<Document><Page>` or HTML→Puppeteer  
- Output Buffer

**Task 3 — tRPC procedures**  
- `payout.getStatement(periodStart, periodEnd)` — protected; returns PDF buffer or presigned URL  
- `payout.requestStatementEmail(periodStart, periodEnd)` — email link to user

### Phase 2: Shareable Links

**Task 4 — Token-based access**  
- `statement_tokens` table: token (uuid), userId, periodStart, periodEnd, expiresAt  
- `payout.createStatementLink(periodStart, periodEnd, expiryDays)` — creates token; returns URL  
- `GET /api/statement/:token` — public; serves PDF; checks expiry

**Task 5 — Audit**  
- Log statement generation, link creation, access by token  
- `audit_log` or dedicated table

### Phase 3: Edge Cases

**Task 6 — Multi-currency**  
- Statement shows currency per payout; separate totals if mixed  
- Or: convert to single currency (config)

**Task 7 — Disputed payouts**  
- Include in statement with "Disputed" status; exclude from total or show separately  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5
Task 6, 7 (enhancements)
```

### Verification

- [ ] Statement PDF contains correct payouts
- [ ] Shareable link works until expiry
- [ ] Expired link returns 410

---

## UI PRD

### User Story

As a deal participant, I want a statement of payouts attributed to me so I can reconcile with my records.

### Entry Points

- Payouts page: "Download Statement" button  
- Email: "Your payout statement is ready" with link  
- Settings: "Statement preferences" (period, email frequency)  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `StatementPeriodPicker` | Start/end date selection | — |
| `StatementDownloadButton` | Triggers getStatement; download blob | loading, success, error |
| `ShareStatementLink` | Create link; copy; set expiry | — |

### Design Tokens

- Primary action: `btn-gold` or `bg-[#C4972A]`  
- Table: `card-elevated`; `data-label` for headers  
- Amounts: `font-data-hud` right-aligned  

### Empty States

- No payouts in period: "No payouts in this period. Select a different range."

### Trust Signals

- "Official ANAVI Payout Statement"  
- Period clearly displayed  
- Audit: "Generated on [date]"  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/statement.ts` | PDF generation |
| `anavi/server/db.ts` | getStatementData, statement_tokens |
| `anavi/server/routers.ts` | payout.getStatement, createStatementLink |
| `anavi/server/_core/index.ts` | GET /api/statement/:token |
| `anavi/client/src/pages/Payouts.tsx` | Statement section |
