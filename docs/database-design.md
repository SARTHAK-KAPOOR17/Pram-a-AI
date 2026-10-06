# Pramāṇa AI — Database Design & Domain Model

This document outlines the MongoDB schema design and relationships for Pramāṇa AI.

---

## 1. Entity-Relationship Overview

```
                     ┌──────────────────┐
                     │       User       │
                     └────────┬─────────┘
                              │ 1:N
                              ▼
                     ┌──────────────────┐
                     │     Project      │
                     └────────┬─────────┘
                              │ 1:N
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Environment    │ │    TestSuite     │ │     TestRun      │
└──────────────────┘ └────────┬─────────┘ └────────┬─────────┘
                              │ 1:N                │ 1:N
                              ▼                    ▼
                     ┌──────────────────┐ ┌──────────────────┐
                     │     TestCase     │ │    TestResult    │
                     └──────────────────┘ └────────┬─────────┘
                                                   │ 1:1
                              ┌────────────────────┼────────────────────┐
                              ▼                    ▼                    ▼
                     ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
                     │  HealingRecord   │ │    AIAnalysis    │ │    BugReport     │
                     └──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 2. Entity Specifications

### 2.1 `User` *(Implemented in Phase 1)*
Authentication, credentials, and tenant role.
- `_id`: ObjectId
- `name`: String (required)
- `email`: String (unique, indexed)
- `password`: String (bcrypt hash, excluded in query projections)
- `role`: Enum (`admin`, `qa_engineer`, `viewer`)
- `isActive`: Boolean (default: true)
- `createdAt`, `updatedAt`: Timestamps

### 2.2 `Project` *(Phase 2)*
Logical grouping of applications and repositories under test.
- `_id`: ObjectId
- `name`: String (required)
- `description`: String
- `repositoryUrl`: String (GitHub / GitLab repo URL)
- `ownerId`: ObjectId (ref: User)
- `createdAt`, `updatedAt`: Timestamps

### 2.3 `Environment` *(Phase 2)*
Target environments for test execution.
- `_id`: ObjectId
- `projectId`: ObjectId (ref: Project)
- `name`: String (`staging`, `production`, `local`, `qa`)
- `baseUrl`: String (`https://staging.myapp.com`)
- `headers`: Map / Object (auth tokens, custom headers)
- `variables`: Map / Object

### 2.4 `TestSuite` *(Phase 2)*
Group of related test cases executed collectively.
- `_id`: ObjectId
- `projectId`: ObjectId (ref: Project)
- `title`: String
- `description`: String
- `tags`: Array<String> (`smoke`, `regression`, `critical`)
- `testCaseIds`: Array<ObjectId> (ref: TestCase)

### 2.5 `TestCase` *(Phase 2)*
An individual automated test specification.
- `_id`: ObjectId
- `projectId`: ObjectId (ref: Project)
- `title`: String
- `description`: String
- `type`: Enum (`browser_playwright`, `api_rest`)
- `steps`: Array<{ order: Number, action: String, selector: String, value: String, expected: String }>
- `status`: Enum (`active`, `draft`, `deprecated`, `flaky`)
- `flakinessScore`: Number (0.0 to 1.0)

### 2.6 `TestRun` *(Phase 3)*
An execution instance of a suite or batch of test cases.
- `_id`: ObjectId
- `projectId`: ObjectId (ref: Project)
- `environmentId`: ObjectId (ref: Environment)
- `triggeredBy`: ObjectId (ref: User, or `ci_cd_webhook`)
- `status`: Enum (`queued`, `in_progress`, `passed`, `failed`, `cancelled`)
- `summary`: { total: Number, passed: Number, failed: Number, healed: Number }
- `startedAt`, `finishedAt`: Timestamps

### 2.7 `TestResult` *(Phase 3)*
Outcome of an individual test case inside a run.
- `_id`: ObjectId
- `testRunId`: ObjectId (ref: TestRun)
- `testCaseId`: ObjectId (ref: TestCase)
- `status`: Enum (`passed`, `failed`, `healed`, `skipped`)
- `durationMs`: Number
- `errorMessage`: String
- `stackTrace`: String
- `artifacts`: { screenshotUrl: String, traceUrl: String, domSnapshotUrl: String }

### 2.8 `HealingRecord` *(Phase 4)*
Audit trail of an AI-driven selector repair.
- `_id`: ObjectId
- `testResultId`: ObjectId (ref: TestResult)
- `originalSelector`: String
- `healedSelector`: String
- `confidenceScore`: Number (e.g. 0.94)
- `heuristicRationale`: String
- `autoApplied`: Boolean
- `status`: Enum (`accepted`, `rejected`, `pending_review`)

### 2.9 `AIAnalysis` *(Phase 4)*
Diagnostic failure breakdown and root cause attribution.
- `_id`: ObjectId
- `testResultId`: ObjectId (ref: TestResult)
- `category`: Enum (`SELECTOR_NOT_FOUND`, `APPLICATION_BUG`, `NETWORK_FAILURE`, `TIMEOUT`)
- `rootCause`: String
- `suggestedRemediation`: String

### 2.10 `BugReport` *(Phase 5)*
Synthesized issue ticket for developer remediation.
- `_id`: ObjectId
- `testResultId`: ObjectId (ref: TestResult)
- `title`: String
- `markdownBody`: String
- `reproductionSteps`: Array<String>
- `externalIssueId`: String (GitHub Issue # or Jira Key)
