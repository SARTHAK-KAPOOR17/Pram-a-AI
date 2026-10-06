# Pramāṇa AI — Test Engine (Phase 0 & Phase 1)

> **Tagline:** Intelligent Verification. Self-Healing Tests.

The `test-engine` is the decoupled execution environment responsible for launching browser instances, orchestrating Playwright test runs, intercepting DOM events, and capturing diagnostic telemetry (traces, screenshots, console logs, network HAR).

---

## Architecture & Communication Flow

In Phase 1, test execution is completely isolated from the main Express API server to prevent CPU-intensive browser automation from degrading API responsiveness.

### Future End-to-End Orchestration:

```
┌─────────────────────────────────┐
│       Frontend (React SPA)      │
└────────────────┬────────────────┘
                 │ 1. POST /api/runs (Create Run)
                 ▼
┌─────────────────────────────────┐
│       Backend (Express API)     │
└────────────────┬────────────────┘
                 │ 2. Dispatches Test Job
                 ▼
┌─────────────────────────────────┐
│           Test Job              │
└────────────────┬────────────────┘
                 │ 3. Ingests Job Specification
                 ▼
┌─────────────────────────────────┐
│     Pramāṇa Test Engine         │
└────────────────┬────────────────┘
                 │ 4. Spawns Browser Context
                 ▼
┌─────────────────────────────────┐
│          Playwright             │
└────────────────┬────────────────┘
                 │ 5. Drives Target Web App
                 ▼
┌─────────────────────────────────┐
│       Browser (Chromium)        │
└────────────────┬────────────────┘
                 │ 6. Emits Result & Traces
                 ▼
┌─────────────────────────────────┐
│          Test Result            │
│   (Passed, Failed, DOM Diff)    │
└────────────────┬────────────────┘
                 │ 7. POST /api/runs/:id/results (Callback)
                 ▼
┌─────────────────────────────────┐
│       Backend (Express API)     │
└────────────────┬────────────────┘
                 │ 8. Real-time Status / WebSocket
                 ▼
┌─────────────────────────────────┐
│       Frontend (React SPA)      │
└─────────────────────────────────┘
```

---

## Local Development Commands

### Install Dependencies:
```bash
npm install
```

### Install Playwright Browsers:
```bash
npx playwright install chromium
```

### Run Smoke Test:
```bash
npm test
```

### Run Tests in Headed Mode:
```bash
npm run test:headed
```

### View Interactive HTML Report:
```bash
npm run report
```
