# Playwright TypeScript — Saucedemo E2E Suite

End-to-end test suite for [saucedemo.com](https://www.saucedemo.com) built with Playwright and TypeScript.  
Covers login, cart management, checkout flow, and a full smoke regression — running across **Chromium, Firefox, and WebKit** (72 tests × 3 browsers).

---

## Table of Contents

- [Project Description](#project-description)
- [Requirements](#requirements)
- [Setup](#setup)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [How to Run](#how-to-run)
- [Reporting](#reporting)
- [How to Extend](#how-to-extend)

---

## Project Description

This suite automates the core user journeys on [saucedemo.com](https://www.saucedemo.com) — a public demo e-commerce site used for QA practice. Tests are organized by feature and follow the **Page Object Model** pattern with a layered fixture/service architecture to keep specs clean and reusable.

**Coverage at a glance:**

| Suite | Cases | Tags |
|-------|-------|------|
| Login | Valid users, invalid users, empty fields | `@login @smoke` |
| Cart | Add, remove (inventory & cart page), badge state | `@cart @smoke` |
| Checkout | Full flow, multi-item, cancel paths, form validation | `@checkout @smoke` |
| E2E Smoke | Full buy flow — login → add → checkout → logout | `@e2e @smoke` |

---

## Requirements

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS or later |
| npm | 9 or later |

No global Playwright installation is required — everything is installed locally via `npm ci`.

---

## Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd Playwright_ts
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Install Playwright browsers**

   ```bash
   npx playwright install --with-deps
   ```

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and set the password for the Saucedemo test accounts:

   ```env
   SAUCE_PASSWORD=secret_sauce
   ```

   > `.env` is git-ignored. In CI the value is stored as a GitHub Actions repository secret named `SAUCE_PASSWORD`.

---

## Technologies

| Technology | Purpose |
|------------|---------|
| [Playwright](https://playwright.dev) `^1.59` | Browser automation and test runner |
| [TypeScript](https://www.typescriptlang.org) `^6` | Type-safe test authoring |
| [dotenv](https://github.com/motdotla/dotenv) | Loading `.env` credentials at runtime |
| Node.js | Runtime |
| GitHub Actions | CI pipeline — runs on every push/PR to `main` |

---

## Project Structure

```
Playwright_ts/
├── tests/
│   ├── specs/                  # Test files (one file per feature)
│   │   ├── login.spec.ts
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   └── smoke.spec.ts
│   ├── pages/                  # Page Object classes
│   │   ├── LoginPage.ts
│   │   ├── InventoryPage.ts
│   │   ├── CartPage.ts
│   │   ├── CheckoutStepOnePage.ts
│   │   ├── CheckoutStepTwoPage.ts
│   │   └── CheckoutCompletePage.ts
│   ├── fixtures/               # Playwright fixture layers
│   │   ├── base.fixture.ts     # Re-exports composed test object
│   │   ├── auth.fixture.ts     # authenticatedPage fixture
│   │   └── services.fixture.ts # authService / cartService fixtures
│   ├── services/               # Reusable action services
│   │   ├── AuthService.ts      # login / logout helpers
│   │   └── CartService.ts      # add, remove, clear, proceedToCheckout
│   ├── data/                   # Static test data
│   │   ├── users.ts            # Valid / invalid user credentials
│   │   ├── products.ts         # Product name constants
│   │   └── checkout.ts         # Checkout form data and negative cases
│   ├── helpers/
│   │   ├── storageState.ts     # Path helpers for saved auth state
│   │   └── dataProvider.ts     # Generic DataSet type utility
│   ├── global-setup.ts         # Runs once before all tests (saves auth state)
│   └── global-teardown.ts      # Runs once after all tests
├── .github/
│   └── workflows/
│       └── playwright.yml      # GitHub Actions CI config
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json
├── .env.example
└── package.json
```

---

## Architecture Overview

The suite uses a three-layer architecture to separate concerns:

```
Spec  →  Fixture  →  Service  →  Page Object
```

**Specs** (`tests/specs/`) express what to test — they read like documentation.  
**Fixtures** (`tests/fixtures/`) compose reusable Playwright contexts and inject dependencies (services, authenticated pages).  
**Services** (`tests/services/`) hold multi-step action sequences (e.g. `cartService.proceedToCheckout()`).  
**Page Objects** (`tests/pages/`) wrap individual page interactions and locators.

**Authentication strategy:** `global-setup.ts` logs in once per user and saves the browser storage state to `.auth/`. Tests that need a logged-in page receive an `authenticatedPage` fixture backed by that saved state — login cost is paid once, not per test.

---

## How to Run

```bash
# Run all tests (all browsers)
npm test

# Run with Playwright's interactive UI mode
npm run test:ui

# Run a single spec file
npx playwright test tests/specs/cart.spec.ts

# Run only smoke-tagged tests
npx playwright test --grep "@smoke"

# Run on a single browser
npx playwright test --project=chromium

# Run in headed mode (visible browser)
npx playwright test --headed

# Run failed tests from last run only
npx playwright test --last-failed
```

---

## Reporting

After any test run Playwright generates an **HTML report** in `playwright-report/`.

```bash
# Open the report in a browser
npm run test:report
```

The report includes per-test status, timings, error messages, and traces for failed tests.

**In CI (GitHub Actions):**  
The HTML report is uploaded as an artifact named `playwright-report` and retained for 30 days. Download it from the *Actions* tab of the repository after a workflow run.

**Traces:**  
`playwright.config.ts` is set to `trace: 'on-first-retry'`. When a test fails and is retried (in CI), a trace file is attached to the report. Open it with:

```bash
npx playwright show-trace path/to/trace.zip
```

---

## How to Extend

### Add a new spec

1. Create `tests/specs/<feature>.spec.ts`.
2. Import `test` and `expect` from `../fixtures/base.fixture`.
3. Use `authenticatedPage` if the test needs a logged-in session, or plain `page` + `authService` if it tests the login flow itself.

### Add a new page object

1. Create `tests/pages/<Name>Page.ts` with a class that accepts a `Page` instance.
2. Define locators as `readonly` properties.
3. Add action methods that wrap `page.*` calls.

### Add a new service

1. Create `tests/services/<Name>Service.ts`.
2. Register it as a fixture in `tests/fixtures/services.fixture.ts` by extending the base test object.
3. The service is then available in all specs via the fixture.

### Add test data

- Add constants to the appropriate file under `tests/data/`.
- For parametrized negative cases, append to the relevant array (e.g. `negativeCheckoutCases` in `checkout.ts`) — the spec will pick them up automatically.

### Run against a different environment

Update `baseURL` in `playwright.config.ts` or override it at run time:

```bash
BASE_URL=https://staging.example.com npx playwright test
```
