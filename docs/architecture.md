# Pramāṇa AI — System Architecture

> **Tagline:** Intelligent Verification. Self-Healing Tests.

This document describes the high-level architecture of Pramāṇa AI, illustrating the flow of test authoring, execution, result collection, and future AI-powered self-healing.

---

## 1. Architectural Overview

Pramāṇa AI employs a modular, decoupled architecture where API serving, browser test execution, and AI reasoning are logically isolated.

```
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│     (React, Vite, JavaScript, Tailwind, TanStack)      │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│                    BACKEND API                         │
│     (Node.js, Express, JavaScript, Zod, JWT, Mongoose) │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│         DATABASE          │  │       TEST ENGINE       │
│         (MongoDB)         │  │ (Playwright, Chromium,  │
│  Users, Suites, TestRuns, │  │  Traces, Screenshots)   │
│  HealingRecords, BugLogs  │  └────────────┬────────────┘
└───────────────────────────┘               │
                                            ▼
                               ┌─────────────────────────┐
                               │    FUTURE AI ENGINE     │
                               │ (Failure Classification,│
                               │  RCA, Selector Healing) │
                               └─────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 Frontend (`frontend/`)
- **Technology:** React 18, Vite 6, JavaScript (JSX), Tailwind CSS, React Router v6, Axios, TanStack Query v5.
- **Design Philosophy:** Developer-focused, dark-first interface, minimal distraction, clear typography, and live telemetry badges.
- **Key Responsibilities:**
  - Test suite authoring and execution trigger.
  - Live observation of test runs with pass/fail and self-healing indicators.
  - Display of AI diagnostic cards and selector mutation diffs.

### 2.2 Backend API (`backend/`)
- **Technology:** Node.js (v24), Express 4, JavaScript (ES Modules), Mongoose, Zod, bcrypt, JWT.
- **Key Responsibilities:**
  - Exposes RESTful endpoints for authentication, project configuration, and test runs.
  - Centralized error handling and schema validation with Zod.
  - Graceful connection handling to MongoDB.
  - Decoupled job scheduling dispatch to the test engine.

### 2.3 Database (`database/` — MongoDB)
- **Technology:** MongoDB 7.0 via Mongoose.
- **Schema Strategy:** Document-based storage optimized for hierarchal test artifacts, DOM snapshots, selector healing records, and execution logs.

### 2.4 Test Engine (`test-engine/`)
- **Technology:** Playwright (v1.49), JavaScript.
- **Key Responsibilities:**
  - Launches headless Chromium, Firefox, or WebKit browsers.
  - Executes test steps deterministically with automatic waiting.
  - Captures execution artifacts: screenshots on failure, full trace zips, and DOM snapshots.
  - Emits normalized JSON test result reports back to the backend.

### 2.5 Future AI Engine (`ai-engine/`)
- **Key Responsibilities:**
  - Ingests failed test artifacts (trace + DOM diff + error stack).
  - Categorizes failure reasons (`SELECTOR_NOT_FOUND`, `APPLICATION_BUG`, `NETWORK_FAILURE`, `FLAKY`).
  - Synthesizes candidate replacement selectors using DOM tree heuristics.
  - Computes confidence scores (0.00 – 1.00); triggers auto-healing when score meets or exceeds confidence threshold (>= 0.85).

---

## 3. End-to-End Test Execution & Self-Healing Lifecycle

```
User (Frontend)
   │
   ├─► 1. Trigger Test Run (POST /api/runs)
   │
Backend API
   │
   ├─► 2. Persist TestRun record (Status: QUEUED)
   │
   ├─► 3. Dispatch Job to Test Engine
   │
Test Engine (Playwright)
   │
   ├─► 4. Launch Headless Browser & Execute Steps
   │
   ├─► 5. Step Fails (Locator #submit-order not found)
   │
   ├─► 6. Capture Failure Snapshot (DOM Tree + Screenshot + Trace)
   │
Future AI Engine
   │
   ├─► 7. Analyze Failure Context
   │        • Compare previous passing DOM with current DOM
   │        • Generate candidate: button[data-testid="confirm-order"]
   │        • Confidence Score: 0.94 (High)
   │
   ├─► 8. Self-Healing Decision Gate
   │        • If Confidence >= 0.85: Retry step with candidate locator
   │        • If Retry Succeeds: Mark test status as HEALED
   │        • Record Mutation in HealingRecord
   │
Backend API
   │
   ├─► 9. Update TestRun & TestResult in MongoDB
   │
Frontend Dashboard
   │
   └─► 10. Display Healed Test with Confidence Breakdown
```

---

## 4. Security & Isolation Principles

- **No Hardcoded Secrets:** All secrets, keys, and connection strings are managed via `.env` files and validated using Zod.
- **Isolated Process Boundaries:** Browser tests do not run inside the Node API event loop to avoid thread blocking and memory bloat.
- **Role-Based Access Control (RBAC):** Token-based authorization separating Admin, QA Engineer, and Viewer roles.
