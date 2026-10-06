# Pramāṇa AI — AI Engine (Phase 0 & Phase 1 Architecture)

> **Tagline:** Intelligent Verification. Self-Healing Tests.

## Overview

The `ai-engine` is the cognitive layer of Pramāṇa AI. In subsequent phases, it will interpret test run failures, inspect DOM snapshots and network logs, generate resilient element selectors, synthesize executable Playwright test scripts from natural language specifications, and automatically diagnose flaky tests.

**Phase 1 Status:**  
Architectural blueprint and data contract definitions only. No external LLM providers (OpenAI, Anthropic, Gemini, Ollama, etc.) are integrated in this phase, and no mock or synthetic responses are returned.

---

## Future Architectural Responsibilities

The AI Engine is structured into six decoupled operational modules:

```
                  ┌───────────────────────────────┐
                  │    Test Execution Failure     │
                  │   (Playwright Trace / DOM)    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  1. Failure Analysis      │
                    │  (Categorization & Scope) │
                    └─────────────┬─────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│2. Root Cause     │    │3. Selector       │    │4. Bug Report     │
│   Analysis (RCA) │    │   Healing Engine │    │   Generator      │
│(App vs Test Bug) │    │(DOM diff + ranks)│    │(Repro steps & md)│
└──────────────────┘    └─────────┬────────┘    └──────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ Confidence Gate  │
                        │ (Score >= 0.85?) │
                        └─────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            [Apply Auto-Heal]           [Flag for QA Review]
```

### 1. `FailureAnalysis`
- Ingests test run artifacts (Playwright stack trace, DOM snapshot, console logs, network HAR).
- Classifies the failure into taxonomies: `SELECTOR_NOT_FOUND`, `ASSERTION_FAILED`, `TIMEOUT`, `NETWORK_FAILURE`, `ENVIRONMENT_DOWN`.

### 2. `RootCauseAnalysis` (RCA)
- Dissects whether a failure is an **Application Bug** (regression in product code), a **Test Debt Bug** (brittle test specification or outdated flow), or an **Environmental Flake**.
- Contextualizes commit history and code diffs against the observed test behavior.

### 3. `SelectorGeneration` & Self-Healing
- When an element cannot be resolved via its original locator (e.g. CSS, XPath, `data-testid`), the engine parses the current DOM tree.
- Uses semantic heuristic matching (attributes, role, hierarchy, text content, sibling relations) to discover candidate elements.
- Produces ranked selector proposals with associated confidence scores (0.00 – 1.00).
- If confidence >= threshold (e.g. 0.85), a self-healing retry is scheduled.

### 4. `TestGeneration`
- Translates natural language requirements (e.g., Gherkin / BDD stories or user journey descriptions) into robust, idiomatic JavaScript Playwright specs.
- Utilizes Page Object Model (POM) patterns and best-practice locator strategies.

### 5. `BugReportGeneration`
- Automatically generates actionable, engineering-ready bug tickets (Markdown / Jira / GitHub Issues).
- Synthesizes exact reproduction steps, expected vs. actual outcomes, environment metadata, failed assertions, and attached trace links.

### 6. `FlakyTestAnalysis`
- Mines historical test execution matrices across branches and environments.
- Computes entropy scores, timing variances, and race condition probabilities.
- Recommends selector stabilizers or network wait assertions.

---

## Contract Specifications

All engine contracts are declared in modern JavaScript in [`src/contracts.js`](./src/contracts.js).
These schemas serve as the contract boundary between the backend test execution worker and the AI inference engine.

---

## Integration Strategy (Phase 2+)

1. **Provider Agnostic**: LLM provider interface (`adapters/llm-provider.js`) will support multi-model routing (Google Gemini, OpenAI, Claude, local models via Ollama/vLLM).
2. **Context Compression**: Raw DOM trees can exceed token limits; a pre-processing DOM pruning utility will strip irrelevant SVG nodes and scripts before reasoning.
3. **Auditability**: Every AI inference, confidence calculation, and auto-heal mutation will be permanently recorded in `HealingRecord` and `AIAnalysis` collections with audit trails.
