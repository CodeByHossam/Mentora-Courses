# Testing Implementation Plan

## Goal
Implement a complete testing strategy for Mentora covering unit, integration, and end-to-end (E2E) tests, with repeatable local and CI execution.

## Current Baseline
- Server uses Jest (`server/package.json`).
- Only one integration-style test exists: `server/tests/paymentSecurity.test.js`.
- Client has no automated test framework configured.
- Existing test database approach uses `mongodb-memory-server`.

## Test Types

### 1. Unit Tests
Scope: isolated logic with mocked dependencies.

Backend targets:
- Controllers: auth, courses, payments, enrollments, grading, live sessions, billing.
- Middleware: auth, CSRF, rate limiter, cache, error handler, monitoring.
- Utils: JWT helpers, validators, sanitizers, billing utilities.
- Models: schema validation and virtuals.

Frontend targets:
- Redux slices and RTK Query endpoints.
- Utility functions and hooks.
- Component rendering and form validation.

Tools:
- Jest
- React Testing Library
- MSW for API mocking where useful

### 2. Integration Tests
Scope: real route + middleware + database flows.

Backend targets:
- Auth register/login/refresh/logout.
- Course CRUD and search/filtering.
- Enrollment and progress tracking.
- Payment initiation, direct transfer, approval/rejection.
- Grading and certificate generation.
- Live session creation and Zoom integration mocks.
- Admin financial and user management endpoints.

Tools:
- Jest + Supertest
- mongodb-memory-server
- Test factories/fixtures

### 3. E2E Tests
Scope: full browser user journeys against a running client and server.

Critical journeys:
- Student registration/login
- Course discovery and enrollment
- Payment submission and status tracking
- Lesson viewing and test taking
- Instructor course creation and grading
- Admin dashboard and payment approval

Tools:
- Playwright
- Seeded test database
- Isolated test environment

## Proposed Structure

```text
server/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e-api/
│   ├── factories/
│   └── setup/
client/
├── src/
│   └── __tests__/
e2e/
├── playwright.config.js
└── tests/
```

## Implementation Phases

### Phase 1 - Test Infrastructure
- Add shared test setup and teardown.
- Add factories for users, courses, categories, payments.
- Add environment handling for `NODE_ENV=test`.
- Add coverage scripts and thresholds.

### Phase 2 - Backend Unit Tests
- Test middleware and utilities first.
- Add controller unit tests with mocked models/services.
- Add frontend unit tests for slices, hooks, and components.

### Phase 3 - Backend Integration Tests
- Expand payment security tests into full payment flow tests.
- Add auth, course, enrollment, grading, and admin integration tests.
- Validate error responses and authorization boundaries.

### Phase 4 - E2E Tests
- Add Playwright configuration.
- Seed deterministic test data.
- Implement critical student, instructor, and admin journeys.
- Add CI-friendly headless execution.

### Phase 5 - Quality Gates
- Enforce coverage thresholds.
- Add test commands to CI.
- Document test execution and troubleshooting.

## Scripts to Add
Server:
- `test:unit`
- `test:integration`
- `test:coverage`

Client:
- `test`
- `test:watch`
- `test:coverage`

Root:
- `test`
- `test:e2e`

## Acceptance Criteria
- All critical API flows have integration coverage.
- Core business logic has unit coverage.
- At least one E2E journey exists for each major role.
- Tests run deterministically in CI.
- Coverage reports are generated.

## Implementation Status
Implementation started. Infrastructure (factories, scripts, coverage thresholds), backend unit/integration tests, client unit tests, and E2E scaffolding are in place. Run `npm test` from the repo root.
