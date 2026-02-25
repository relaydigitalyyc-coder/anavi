# ANAVI 23 High-Leverage Improvements — Implementation + UI PRD Index

**Date:** 2026-02-24  
**Scope:** Full implementation + UI PRDs for 23 of 24 improvements (F4 GitHub OAuth excluded per request)  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](../ANAVI-PRD-24-High-Leverage-Improvements.md)

---

## Progress — Master Checklist

**Agents:** Check off when complete. Update both this index and the individual PRD.

| # | Feature | Impl | UI | Verified |
|---|---------|:----:|:--:|:--------:|
| F1 | KYB/KYC Verification | [x] | [x] | [ ] |
| F2 | Sanctions/PEP/Adverse-Media | [x] | [ ] | [ ] |
| F3 | Trust Score Automation | [x] | [x] | [ ] |
| F4 | ~~GitHub OAuth~~ | — | — | — |
| F5 | Attribution Payout Automation | [x] | [ ] | [ ] |
| F6 | External Custody Proofs | [x] | [x] | [ ] |
| F7 | Payout Statements | [x] | [x] | [ ] |
| F8 | Vector Embedding Pipeline | [x] | — | [ ] |
| F9 | Match Notifications | [x] | [x] | [x] |
| F10 | LP Portal Data-Backing | [x] | [x] | [ ] |
| F11 | Deal Room E-Signature | [x] | [x] | [ ] |
| F12 | Route-Level Auth | [x] | [x] | [x] |
| F13 | Immutable Audit Trail | [x] | [x] | [x] |
| F14 | CI Gates | [x] | — | [x] |
| F15 | Global Search | [x] | [x] | [x] |
| F16 | Guided Tour | [x] | [x] | [ ] |
| F17 | Intelligence Page | [x] | [x] | [ ] |
| F18 | Mobile Dashboard | [x] | [x] | [x] |
| F19 | Escrow Integrations | [x] | [x] | [ ] |
| F20 | Integration Tests | [x] | — | [x] |
| F21 | Observability | [x] | — | [ ] |
| F22 | Audit Logs Backend | [x] | [x] | [x] |
| F23 | Real Estate Module | [x] | [x] | [ ] |
| F24 | Deal Intelligence Pipeline | [x] | [x] | [ ] |

**Legend:** Impl = implementation complete | UI = UI complete | Verified = tests pass, manual check done. Use `[x]` when done; `—` when N/A (e.g. F14 has no UI).

---

## Index

| # | Feature | Doc | Domain |
|---|---------|-----|--------|
| F1 | KYB/KYC Verification Workflow | [2026-02-24-f1-kyb-kyc-impl-ui.md](2026-02-24-f1-kyb-kyc-impl-ui.md) | Identity |
| F2 | Real Sanctions/PEP/Adverse-Media | [2026-02-24-f2-sanctions-pep-impl-ui.md](2026-02-24-f2-sanctions-pep-impl-ui.md) | Identity |
| F3 | Trust Score Automation | [2026-02-24-f3-trust-score-impl-ui.md](2026-02-24-f3-trust-score-impl-ui.md) | Identity |
| F4 | ~~GitHub OAuth + SSO~~ | — | **EXCLUDED** |
| F5 | Attribution Payout Automation | [2026-02-24-f5-attribution-payout-impl-ui.md](2026-02-24-f5-attribution-payout-impl-ui.md) | Custody |
| F6 | External Custody Proofs | [2026-02-24-f6-external-custody-proofs-impl-ui.md](2026-02-24-f6-external-custody-proofs-impl-ui.md) | Custody |
| F7 | Counterparty-Facing Payout Statements | [2026-02-24-f7-payout-statements-impl-ui.md](2026-02-24-f7-payout-statements-impl-ui.md) | Custody |
| F8 | Vector Embedding Pipeline | [2026-02-24-f8-vector-embedding-impl-ui.md](2026-02-24-f8-vector-embedding-impl-ui.md) | Matching |
| F9 | Match Notifications | [2026-02-24-f9-match-notifications-impl-ui.md](2026-02-24-f9-match-notifications-impl-ui.md) | Matching |
| F10 | LP Portal Data-Backing | [2026-02-24-f10-lp-portal-impl-ui.md](2026-02-24-f10-lp-portal-impl-ui.md) | Matching |
| F11 | Deal Room E-Signature | [2026-02-24-f11-esignature-impl-ui.md](2026-02-24-f11-esignature-impl-ui.md) | Deal Flow |
| F12 | Route-Level Auth Enforcement | [2026-02-24-f12-route-auth-impl-ui.md](2026-02-24-f12-route-auth-impl-ui.md) | Security |
| F13 | Immutable Audit Trail | [2026-02-24-f13-immutable-audit-impl-ui.md](2026-02-24-f13-immutable-audit-impl-ui.md) | Security |
| F14 | CI Gates | [2026-02-24-f14-ci-gates-impl-ui.md](2026-02-24-f14-ci-gates-impl-ui.md) | Security |
| F15 | Global Search | [2026-02-24-f15-global-search-impl-ui.md](2026-02-24-f15-global-search-impl-ui.md) | Activation |
| F16 | Guided Tour + Restart | [2026-02-24-f16-guided-tour-impl-ui.md](2026-02-24-f16-guided-tour-impl-ui.md) | Activation |
| F17 | Intelligence Page Launch | [2026-02-24-f17-intelligence-page-impl-ui.md](2026-02-24-f17-intelligence-page-impl-ui.md) | Activation |
| F18 | Mobile-Responsive Dashboard | [2026-02-24-f18-mobile-dashboard-impl-ui.md](2026-02-24-f18-mobile-dashboard-impl-ui.md) | UX |
| F19 | Escrow/Payment Integrations | [2026-02-24-f19-escrow-impl-ui.md](2026-02-24-f19-escrow-impl-ui.md) | Operations |
| F20 | Integration Tests | [2026-02-24-f20-integration-tests-impl-ui.md](2026-02-24-f20-integration-tests-impl-ui.md) | Operations |
| F21 | Observability & Alerting | [2026-02-24-f21-observability-impl-ui.md](2026-02-24-f21-observability-impl-ui.md) | Operations |
| F22 | Audit Logs Backend Wiring | [2026-02-24-f22-audit-logs-backend-impl-ui.md](2026-02-24-f22-audit-logs-backend-impl-ui.md) | Polish |
| F23 | Real Estate Module Data-Backing | [2026-02-24-f23-real-estate-impl-ui.md](2026-02-24-f23-real-estate-impl-ui.md) | Polish |
| F24 | Deal Intelligence Pipeline | [2026-02-24-f24-deal-intelligence-impl-ui.md](2026-02-24-f24-deal-intelligence-impl-ui.md) | Polish |

---

## Relation to 02-24 Platform PRDs

| Platform PRD | Covers | Overlap with F-items |
|--------------|--------|----------------------|
| [PRD-1](2026-02-24-prd1-deal-pipeline-impl.md) | Deal Pipeline | — |
| [PRD-2](2026-02-24-prd2-document-data-room-impl.md) | Document Data Room | F11 (E-Signature) |
| [PRD-3](2026-02-24-prd3-contact-intelligence-impl.md) | Contact Intelligence | — |
| [PRD-4](2026-02-24-prd4-ai-deal-intelligence-impl.md) | AI Deal Intelligence | F17, F24 |
| [PRD-5](2026-02-24-prd5-lp-portal-impl.md) | LP Portal & Fund Comms | F10 |
| [PRD-6](2026-02-24-prd6-compliance-attribution-impl.md) | Compliance, Attribution | F1, F2, F5, F6, F13 |

---

## Document Structure (per improvement)

Each PRD contains:

1. **Implementation PRD**
   - Goal, Architecture, Tech Stack
   - Pre-flight (codebase landmarks)
   - Phases + Tasks (TDD, code snippets, verification)
   - Dependency map
   - File index

2. **UI PRD**
   - User story
   - Entry points
   - Component specs
   - Design tokens
   - Empty/loading states
   - Trust signals (where applicable)

---

## Execution

- Use [superpowers:executing-plans](https://github.com/superpowers-marketplace/superpowers) or [superpowers:subagent-driven-development](https://github.com/superpowers-marketplace/superpowers) for implementation.
- Implement one improvement at a time; verify before moving to next.
- Cross-references: F10 → PRD-5 for full LP Portal; F11 → PRD-2 for document storage.
- **Update checkboxes** in this index and the individual PRD when work completes.

## CI Status Badge

After pushing to GitHub, add to README:
```
![CI](https://github.com/relaydigitalyyc-coder/anavi/actions/workflows/ci.yml/badge.svg)
```
