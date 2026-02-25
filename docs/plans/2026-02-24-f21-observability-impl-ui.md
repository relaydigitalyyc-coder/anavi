# F21: Observability & Alerting — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Observability & Alerting  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.6

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Structured logging (JSON). Log level config. Metrics (request count, latency, error rate). Alert on error spike, latency p99, job failures. Dashboard (Grafana/Datadog/custom). Log retention 30d; alert latency <5min; PagerDuty/Slack integration.

### Architecture

Winston or Pino for JSON logs. Express middleware: request ID, latency, status. Metrics: Prometheus or StatsD or Datadog agent. Alerts: threshold rules; notify via PagerDuty/Slack. Optional: custom /admin/metrics dashboard.

### Tech Stack

Node.js, Winston/Pino, Prometheus or Datadog, Express

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/server/_core/index.ts` | Express app |
| `package.json` | Dependencies |
| Env | LOG_LEVEL, METRICS_ENABLED, etc. |

### Phase 1: Logging

**Task 1 — Structured logger**  
- Replace console.log with logger (Winston or Pino)  
- JSON format: { timestamp, level, message, ...meta }  
- Log level from env (LOG_LEVEL=info)  
- Request ID in meta (from middleware)  

**Task 2 — Request middleware**  
- Assign requestId (uuid) to each request  
- Log: method, url, statusCode, duration, userId (if auth)  
- On error: log stack  
- Attach requestId to response header (X-Request-ID)  

**Task 3 — Log retention**  
- Log to stdout; orchestration (Docker, K8s) captures  
- Or: ship to CloudWatch, Datadog, etc.  
- Retention 30d in aggregator  

### Phase 2: Metrics

**Task 4 — Metrics collection**  
- Request count by path, method, status  
- Latency histogram (p50, p95, p99)  
- Error rate  
- Custom: tRPC procedure call count, DB query time  
- Prometheus /metrics endpoint or Datadog agent  

**Task 5 — Health check**  
- GET /health: DB ping, optional external deps  
- Returns 200 + { db: ok } or 503  

### Phase 3: Alerting

**Task 6 — Alert rules**  
- Error rate > 5% over 5min → alert  
- Latency p99 > 2s over 5min → alert  
- Job failure (e.g., payout worker) → alert  
- Config: threshold, window  
- Datadog/Grafana alerting or custom (cron that checks metrics)  

**Task 7 — Notification**  
- PagerDuty integration or Slack webhook  
- On alert: send to channel  
- Include: alert name, threshold, current value, link to dashboard  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5
Task 6 → Task 7
```

### Verification

- [ ] Logs are JSON with requestId
- [ ] /metrics exposes data
- [ ] /health returns correct status
- [ ] Alert fires on simulated error spike

---

## UI PRD

### User Story

As an operator, I want logging and alerts so I know when something breaks.

### Entry Points

- Log aggregator UI (Datadog, CloudWatch, etc.)  
- Optional: /admin/metrics — simple dashboard with key metrics  
- PagerDuty/Slack when alert fires  

### Component Specs (if custom dashboard)

| Component | Purpose | States |
|-----------|---------|--------|
| `MetricsCard` | Single metric: value, trend | — |
| `MetricsChart` | Line chart over time | — |
| `AlertsList` | Recent alerts; status | — |

### Design Tokens

- Green (healthy): #059669  
- Red (alert): #dc2626  
- Warning: #F59E0B  

### Optional Internal Dashboard

- Only if not using Datadog/Grafana  
- Simple React page: fetch /metrics or custom API  
- Cards: req/s, error rate, p99 latency, last alert  
- Admin-only route  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/_core/logger.ts` | Winston/Pino setup |
| `anavi/server/_core/middleware/logging.ts` | Request logging |
| `anavi/server/_core/middleware/metrics.ts` | Metrics collection |
| `anavi/server/_core/index.ts` | /health, /metrics routes |
| `anavi/server/alerts.ts` | Alert rules, notify (or config for Datadog) |
| `anavi/client/src/pages/admin/Metrics.tsx` | Optional dashboard |
