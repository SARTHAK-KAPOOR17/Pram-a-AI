# Pramāṇa AI — Engineering Roadmap

> **Tagline:** Intelligent Verification. Self-Healing Tests.

This roadmap details the progressive delivery milestones for the Pramāṇa AI testing platform, transitioning from foundational scaffolding to an autonomous, self-healing QA enterprise solution.

---

## Phase 0: Architecture & Engineering Scaffolding
- [x] Establish modular JavaScript-first repository architecture (`frontend/`, `backend/`, `test-engine/`, `ai-engine/`, `docs/`, `docker/`).
- [x] Define architectural principles (separation of concerns, centralized error handling, Zod validation, graceful DB shutdown).
- [x] Design entity-relationship domain models for future database entities.
- [x] Establish containerization blueprints with Docker Compose.

---

## Phase 1: Development Environment & Application Foundation
- [x] **Backend API Foundation:**
  - Express.js with JSON parsing, CORS, Helmet, request logging, and graceful shutdown.
  - Health check endpoint `GET /api/health` returning standardized payload.
  - MongoDB connection manager with offline graceful degradation.
  - JWT authentication foundation (User model with bcrypt password hashing, auth controller, routes, and validation).
- [x] **Frontend Foundation:**
  - Vite + React + JavaScript (JSX) + Tailwind CSS + React Router + Axios + TanStack Query.
  - Dark-first developer UI design system with reusable components (`Button`, `Input`, `Card`, `Modal`, `Badge`, `LoadingState`, `ErrorState`).
  - Core views (`/`, `/login`, `/register`, `/dashboard`, `404`).
  - Live system health telemetry indicator polling `/api/health`.
- [x] **Test Engine Foundation:**
  - Playwright browser execution configuration with JavaScript.
  - Minimal headless Chromium smoke test suite verifying browser launch and DOM interactions.
  - Architectural blueprint for decoupled execution flow.
- [x] **AI Engine Blueprint:**
  - Core contract definitions and failure taxonomies without fake mock LLM facades.

---

## Phase 2: Project Management & Test Authoring (Completed)
- [x] **Database Models:** Mongoose schemas for `Project`, `Environment`, `TestSuite`, and `TestCase` with structured steps, locators, and assertions.
- [x] **Backend REST APIs:** Full CRUD with JWT authentication, role checks, and Zod validation for projects, environments, test suites, and test cases.
- [x] **Automated Tests:** 10 unit and integration tests covering validators and auth protection.
- [x] **Frontend Project Workspaces:** Complete dedicated workspace layout with sidebar, project overview, environment management, and suite list.
- [x] **Visual Test Case Builder & Editor:** Visual step authoring, reordering, duplicate, delete, and locator strategy configuration (CSS, XPath, ID, text, role, testid).
- [x] **Self-Healing Preparation:** Schema-level preservation of `elementText`, `elementRole`, `domFingerprint`, and `elementAttributes`.

---

## Phase 3: Decoupled Test Execution Pipeline
- [ ] Test Job Dispatch Queue (lightweight in-memory or background job runner).
- [ ] Execution worker pool for parallel Playwright sessions.
- [ ] Artifact persistence (saving screenshots, videos, and Playwright `.zip` traces).
- [ ] Real-time status streaming via Server-Sent Events (SSE) or WebSockets to the frontend.

---

## Phase 4: AI Failure Analysis & Self-Healing Engine
- [ ] Integration of LLM providers (Google Gemini / OpenAI / Anthropic / Local models).
- [ ] DOM tree pruning and snapshot diffing algorithms.
- [ ] Heuristic selector ranking with confidence scoring (0.00 – 1.00).
- [ ] Automated step retry with candidate locators when confidence >= 0.85.
- [ ] `HealingRecord` audit logs and review console for QA engineers.

---

## Phase 5: Natural Language Test Generation & Automated Bug Reports
- [ ] Natural Language → Executable Playwright code generation.
- [ ] Automated markdown bug report generator with exact reproduction steps.
- [ ] Flaky test detection based on historical entropy and variance analytics.

---

## Phase 6: CI/CD Integrations & Enterprise Cloud
- [ ] GitHub Actions / GitLab CI runner integrations and webhooks.
- [ ] Headless distributed container fleet for cloud execution.
- [ ] Visual regression testing with pixel and layout diffing.
- [ ] Enterprise SSO and multi-tenant billing.
