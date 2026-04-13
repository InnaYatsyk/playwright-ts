# SauceDemo Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a maintainable POM + Service Layer + Fixtures smoke suite for saucedemo.com covering login, cart, checkout, and a full E2E flow.

**Architecture:** Page Objects encapsulate UI interactions; Services orchestrate page objects into business operations; Fixtures inject services and pre-authenticated contexts into tests. Spec files import only from `fixtures/base.fixture.ts`.

**Tech Stack:** Playwright 1.59, TypeScript, @playwright/test, dotenv

---

## Plugin Protocol

Apply in every task, in this order:

| When | Plugin | How |
|---|---|---|
| Before writing any Playwright file | **Context7** | Query `playwright <topic>` (e.g. `playwright locator api`, `playwright fixtures`, `playwright storage state`) to get current API docs before coding |
| After completing implementation steps | **code-simplifier** | Run on the newly written file; apply any suggested improvements before committing |
| After completing each task group | **code-reviewer** | Task group boundaries: after Task 6 (all pages), after Task 8 (all services), after Task 12 (fixtures), after Task 16 (all specs) |

---

## Security: Password Handling

`SAUCE_PASSWORD` is the only credential used across the entire suite. It is **never hardcoded** in any source file:

- **Locally**: copy `.env.example` → `.env`, set the real value. `.env` is gitignored.
- **CI**: set `SAUCE_PASSWORD` as a GitHub Actions repository secret (`Settings → Secrets → Actions`).
- **Wrong value in code** will cause the suite to throw at import time — fail fast, never silently.

---

## File Map

**Create:**
- `.env.example` — env var template (committed, no real values)
- `.github/workflows/playwright.yml` — CI workflow using `SAUCE_PASSWORD` secret
- `tests/data/users.ts` — user datasets (valid + invalid), passwords from `process.env.SAUCE_PASSWORD`
- `tests/data/products.ts` — named product constants
- `tests/data/checkout.ts` — checkout form datasets
- `tests/pages/LoginPage.ts` — login page interactions
- `tests/pages/InventoryPage.ts` — inventory page interactions
- `tests/pages/CartPage.ts` — cart page interactions
- `tests/pages/CheckoutStepOnePage.ts` — checkout form fill + validation errors
- `tests/pages/CheckoutStepTwoPage.ts` — order summary + finish/cancel
- `tests/pages/CheckoutCompletePage.ts` — confirmation message
- `tests/services/AuthService.ts` — login, logout, storage state management
- `tests/services/CartService.ts` — add/remove products, checkout orchestration, clearCart
- `tests/helpers/storageState.ts` — `.auth/` path resolver
- `tests/helpers/dataProvider.ts` — typed dataset utility
- `tests/fixtures/services.fixture.ts` — injects authService + cartService
- `tests/fixtures/auth.fixture.ts` — injects authenticatedPage (session-loaded context)
- `tests/fixtures/base.fixture.ts` — re-exports `test` and `expect` for spec files
- `tests/global-setup.ts` — one-time login + storage state save
- `tests/global-teardown.ts` — delete `.auth/` contents
- `tests/specs/login.spec.ts` — L-01 to L-10 (2 parameterised tests)
- `tests/specs/cart.spec.ts` — C-01 to C-06
- `tests/specs/checkout.spec.ts` — CH-01 to CH-08
- `tests/specs/smoke.spec.ts` — E2E-01 full buy flow
- `tsconfig.json` — TypeScript config for the project

**Modify:**
- `playwright.config.ts` — add baseURL, globalSetup, globalTeardown, dotenv loading
- `.gitignore` — add `.env`, `.auth/`, `playwright-report/`, `test-results/`

---

## Task 1: TypeScript config + playwright.config.ts + secrets infrastructure

**Files:**
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.github/workflows/playwright.yml`
- Create/Update: `.gitignore`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Install dotenv**

```bash
npm install --save-dev dotenv
```

Expected: `dotenv` appears in `package.json` devDependencies.

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["tests/**/*.ts", "playwright.config.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create .env.example**

```
# Copy this file to .env and fill in the real value.
# .env is gitignored — never commit real passwords.
# In CI, set SAUCE_PASSWORD as a GitHub Actions repository secret.
SAUCE_PASSWORD=
```

- [ ] **Step 4: Create or update .gitignore**

```
.env
.auth/
node_modules/
playwright-report/
test-results/
dist/
```

- [ ] **Step 5: Update playwright.config.ts**

Replace the current `playwright.config.ts` entirely:

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/global-setup',
  globalTeardown: './tests/global-teardown',
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

- [ ] **Step 6: Create .github/workflows/playwright.yml**

```yaml
name: Playwright Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: npx playwright test --project=chromium
        env:
          SAUCE_PASSWORD: ${{ secrets.SAUCE_PASSWORD }}

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

- [ ] **Step 7: Query Context7 for Playwright config API**

Use Context7: query `playwright test configuration dotenv environment variables` to confirm the dotenv loading approach is current.

- [ ] **Step 8: Run code-simplifier on playwright.config.ts**

Run the code-simplifier on `playwright.config.ts`. Apply any suggestions.

- [ ] **Step 9: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors (some missing files are fine at this stage).

- [ ] **Step 10: Commit**

```bash
git add tsconfig.json .env.example .gitignore playwright.config.ts .github/workflows/playwright.yml package.json package-lock.json
git commit -m "chore: add tsconfig, dotenv, CI workflow, and playwright config for saucedemo suite"
```

---

## Task 2: Test data

**Files:**
- Create: `tests/data/users.ts`
- Create: `tests/data/products.ts`
- Create: `tests/data/checkout.ts`

- [ ] **Step 1: Query Context7**

Use Context7: query `playwright test parameterized tests` to confirm the current pattern for data-driven tests.

- [ ] **Step 2: Create tests/data/users.ts**

Note: passwords come from `process.env.SAUCE_PASSWORD`. The module throws at import time if the variable is not set — this is intentional to prevent silent credential failures.

```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Required environment variable "${name}" is not set.\n` +
      `Copy .env.example to .env and set the value, or set the GitHub Actions secret.`
    );
  }
  return value;
}

const SAUCE_PASSWORD = requireEnv('SAUCE_PASSWORD');

export interface ValidUser {
  username: string;
  password: string;
  expectInventory: boolean;
}

export interface InvalidUser {
  username: string;
  password: string;
  expectedError: string;
}

export const STANDARD_USER = { username: 'standard_user', password: SAUCE_PASSWORD };

export const validUsers: ValidUser[] = [
  { username: 'standard_user',           password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'problem_user',            password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'performance_glitch_user', password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'error_user',              password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'visual_user',             password: SAUCE_PASSWORD, expectInventory: true },
];

export const invalidUsers: InvalidUser[] = [
  { username: 'locked_out_user', password: SAUCE_PASSWORD,   expectedError: 'Sorry, this user has been locked out' },
  { username: 'standard_user',   password: 'wrong_password', expectedError: 'Username and password do not match' },
  { username: '',                password: SAUCE_PASSWORD,   expectedError: 'Username is required' },
  { username: 'standard_user',   password: '',               expectedError: 'Password is required' },
  { username: '',                password: '',               expectedError: 'Username is required' },
];
```

- [ ] **Step 3: Create tests/data/products.ts**

```typescript
export const PRODUCTS = {
  SAUCE_LABS_BACKPACK:          'Sauce Labs Backpack',
  SAUCE_LABS_BIKE_LIGHT:        'Sauce Labs Bike Light',
  SAUCE_LABS_BOLT_T_SHIRT:      'Sauce Labs Bolt T-Shirt',
  SAUCE_LABS_FLEECE_JACKET:     'Sauce Labs Fleece Jacket',
  SAUCE_LABS_ONESIE:            'Sauce Labs Onesie',
  TEST_ALL_THE_THINGS_T_SHIRT:  'Test.allTheThings() T-Shirt (Red)',
} as const;

export type ProductName = typeof PRODUCTS[keyof typeof PRODUCTS];
```

- [ ] **Step 4: Create tests/data/checkout.ts**

```typescript
export interface CheckoutData {
  firstName: string;
  lastName: string;
  zip: string;
}

export interface NegativeCheckoutCase extends CheckoutData {
  expectedError: string;
}

export const VALID_CHECKOUT: CheckoutData = {
  firstName: 'Ann',
  lastName: 'Lee',
  zip: '12345',
};

export const negativeCheckoutCases: NegativeCheckoutCase[] = [
  { firstName: '',    lastName: '',    zip: '',    expectedError: 'First Name is required' },
  { firstName: 'Ann', lastName: '',    zip: '',    expectedError: 'Last Name is required' },
  { firstName: 'Ann', lastName: 'Lee', zip: '',    expectedError: 'Postal Code is required' },
  { firstName: ' ',   lastName: ' ',   zip: ' ',   expectedError: 'First Name is required' },
];
```

- [ ] **Step 5: Run code-simplifier on all three data files**

Run code-simplifier on `tests/data/users.ts`, `tests/data/products.ts`, `tests/data/checkout.ts`. Apply any suggestions.

- [ ] **Step 6: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors on the new data files.

- [ ] **Step 7: Commit**

```bash
git add tests/data/
git commit -m "feat: add test data (users from env var, products, checkout)"
```

---

## Task 3: LoginPage

**Files:**
- Create: `tests/pages/LoginPage.ts`

- [ ] **Step 1: Query Context7**

Use Context7: query `playwright locator getByTestId getByRole` to confirm the current locator API.

- [ ] **Step 2: Create tests/pages/LoginPage.ts**

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton:   Locator;
  private readonly errorMessage:  Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton   = page.getByTestId('login-button');
    this.errorMessage  = page.getByTestId('error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.errorMessage.innerText();
  }
}
```

- [ ] **Step 3: Run code-simplifier on LoginPage.ts**

Run code-simplifier on `tests/pages/LoginPage.ts`. Apply any suggestions.

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add tests/pages/LoginPage.ts
git commit -m "feat: add LoginPage page object"
```

---

## Task 4: InventoryPage

**Files:**
- Create: `tests/pages/InventoryPage.ts`

- [ ] **Step 1: Query Context7**

Use Context7: query `playwright locator filter hasText` to confirm the `.filter({ hasText })` API.

- [ ] **Step 2: Create tests/pages/InventoryPage.ts**

```typescript
import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  private readonly cartBadge:  Locator;
  private readonly cartLink:   Locator;
  private readonly menuButton: Locator;

  constructor(private readonly page: Page) {
    this.cartBadge  = page.getByTestId('shopping-cart-badge');
    this.cartLink   = page.getByTestId('shopping-cart-link');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
  }

  async addToCartByName(name: string): Promise<void> {
    const item = this.page.getByTestId('inventory-item').filter({ hasText: name });
    await item.getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromInventoryByName(name: string): Promise<void> {
    const item = this.page.getByTestId('inventory-item').filter({ hasText: name });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
  }

  async getCartCount(): Promise<number> {
    if (!await this.cartBadge.isVisible()) return 0;
    return parseInt(await this.cartBadge.innerText(), 10);
  }
}
```

- [ ] **Step 3: Run code-simplifier on InventoryPage.ts**

Run code-simplifier on `tests/pages/InventoryPage.ts`. Apply any suggestions.

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add tests/pages/InventoryPage.ts
git commit -m "feat: add InventoryPage page object"
```

---

## Task 5: CartPage

**Files:**
- Create: `tests/pages/CartPage.ts`

- [ ] **Step 1: Create tests/pages/CartPage.ts**

```typescript
import { Page, Locator } from '@playwright/test';

export class CartPage {
  private readonly checkoutButton:         Locator;
  private readonly continueShoppingButton: Locator;

  constructor(private readonly page: Page) {
    this.checkoutButton         = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async getCartItems(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allInnerTexts();
  }

  async removeItemByName(name: string): Promise<void> {
    const item = this.page.getByTestId('cart-item').filter({ hasText: name });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
```

- [ ] **Step 2: Run code-simplifier on CartPage.ts**

Run code-simplifier on `tests/pages/CartPage.ts`. Apply any suggestions.

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add tests/pages/CartPage.ts
git commit -m "feat: add CartPage page object"
```

---

## Task 6: Checkout page objects

**Files:**
- Create: `tests/pages/CheckoutStepOnePage.ts`
- Create: `tests/pages/CheckoutStepTwoPage.ts`
- Create: `tests/pages/CheckoutCompletePage.ts`

- [ ] **Step 1: Create tests/pages/CheckoutStepOnePage.ts**

```typescript
import { Page, Locator } from '@playwright/test';

export class CheckoutStepOnePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput:  Locator;
  private readonly zipInput:       Locator;
  private readonly continueButton: Locator;
  private readonly cancelButton:   Locator;
  private readonly errorMessage:   Locator;

  constructor(private readonly page: Page) {
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput  = page.getByTestId('lastName');
    this.zipInput       = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton   = page.getByTestId('cancel');
    this.errorMessage   = page.getByTestId('error');
  }

  async fillForm(firstName: string, lastName: string, zip: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.zipInput.fill(zip);
  }

  async submit(): Promise<void> {
    await this.continueButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.errorMessage.innerText();
  }
}
```

- [ ] **Step 2: Create tests/pages/CheckoutStepTwoPage.ts**

```typescript
import { Page, Locator } from '@playwright/test';

export class CheckoutStepTwoPage {
  private readonly finishButton: Locator;
  private readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
  }

  async getItemNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allInnerTexts();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
```

- [ ] **Step 3: Create tests/pages/CheckoutCompletePage.ts**

```typescript
import { Page, Locator } from '@playwright/test';

export class CheckoutCompletePage {
  private readonly header: Locator;

  constructor(private readonly page: Page) {
    this.header = page.getByTestId('complete-header');
  }

  async getConfirmationHeader(): Promise<string> {
    return this.header.innerText();
  }
}
```

- [ ] **Step 4: Run code-simplifier on all three checkout page objects**

Run code-simplifier on `CheckoutStepOnePage.ts`, `CheckoutStepTwoPage.ts`, `CheckoutCompletePage.ts`. Apply any suggestions.

- [ ] **Step 5: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add tests/pages/CheckoutStepOnePage.ts tests/pages/CheckoutStepTwoPage.ts tests/pages/CheckoutCompletePage.ts
git commit -m "feat: add Checkout page objects (StepOne, StepTwo, Complete)"
```

---

## Code Review Checkpoint — All Page Objects (after Task 6)

> **Run code-reviewer** on `tests/pages/` against these criteria:
> - No CSS class selectors anywhere — only `getByTestId`, `getByRole`, `filter({ hasText })`
> - Each class maps to exactly one page; no test logic or assertions
> - All public methods are `async` and return `Promise<void>` or a typed value
> - No imports from `@playwright/test` beyond `Page` and `Locator`

---

## Task 7: AuthService

**Files:**
- Create: `tests/services/AuthService.ts`

- [ ] **Step 1: Query Context7**

Use Context7: query `playwright storage state browser context` to confirm the current `context.storageState()` API.

- [ ] **Step 2: Create tests/services/AuthService.ts**

```typescript
import { Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';

export class AuthService {
  async login(username: string, password: string, page: Page): Promise<void> {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials(username, password);
    await loginPage.submit();
  }

  async logout(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
  }

  async saveStorageState(username: string, context: BrowserContext): Promise<void> {
    const dir = path.resolve('.auth');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await context.storageState({ path: path.join(dir, `${username}.json`) });
  }

  async clearStorageState(username: string): Promise<void> {
    const filePath = path.resolve('.auth', `${username}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
```

- [ ] **Step 3: Run code-simplifier on AuthService.ts**

Run code-simplifier on `tests/services/AuthService.ts`. Apply any suggestions.

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add tests/services/AuthService.ts
git commit -m "feat: add AuthService"
```

---

## Task 8: CartService

**Files:**
- Create: `tests/services/CartService.ts`

- [ ] **Step 1: Create tests/services/CartService.ts**

```typescript
import { Page } from '@playwright/test';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutStepOnePage } from '../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../pages/CheckoutStepTwoPage';
import { CheckoutData } from '../data/checkout';

export class CartService {
  async addProducts(names: string[], page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    for (const name of names) {
      await inventoryPage.addToCartByName(name);
    }
  }

  async removeFromInventory(name: string, page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.removeFromInventoryByName(name);
  }

  async removeFromCart(name: string, page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.removeItemByName(name);
  }

  async proceedToCheckout(data: CheckoutData, page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.proceedToCheckout();
    const checkoutOne = new CheckoutStepOnePage(page);
    await checkoutOne.fillForm(data.firstName, data.lastName, data.zip);
    await checkoutOne.submit();
    const checkoutTwo = new CheckoutStepTwoPage(page);
    await checkoutTwo.finish();
  }

  async clearCart(page: Page): Promise<void> {
    await page.goto('/cart.html');
    const cartPage = new CartPage(page);
    const items = await cartPage.getCartItems();
    for (const item of items) {
      await cartPage.removeItemByName(item);
    }
  }

  async getCartCount(page: Page): Promise<number> {
    const inventoryPage = new InventoryPage(page);
    return inventoryPage.getCartCount();
  }
}
```

- [ ] **Step 2: Run code-simplifier on CartService.ts**

Run code-simplifier on `tests/services/CartService.ts`. Apply any suggestions.

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add tests/services/CartService.ts
git commit -m "feat: add CartService"
```

---

## Code Review Checkpoint — All Services (after Task 8)

> **Run code-reviewer** on `tests/services/` against these criteria:
> - Services only orchestrate page objects — no direct `page.locator()` calls
> - All methods accept `page: Page` as last parameter (consistent with spec)
> - `clearCart` navigates to `/cart.html` directly — no dependency on current page state
> - No test assertions; services are action-only

---

## Task 9: Helpers

**Files:**
- Create: `tests/helpers/storageState.ts`
- Create: `tests/helpers/dataProvider.ts`

- [ ] **Step 1: Create tests/helpers/storageState.ts**

```typescript
import * as path from 'path';

export function storageStatePath(username: string): string {
  return path.resolve('.auth', `${username}.json`);
}
```

- [ ] **Step 2: Create tests/helpers/dataProvider.ts**

```typescript
export type DataSet<T> = readonly T[];

export function withData<T>(dataset: DataSet<T>): T[] {
  return [...dataset];
}
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add tests/helpers/
git commit -m "feat: add storageState and dataProvider helpers"
```

---

## Task 10: global-setup.ts

**Files:**
- Create: `tests/global-setup.ts`

- [ ] **Step 1: Query Context7**

Use Context7: query `playwright global setup storage state` to confirm the current global setup API and how to read `baseURL` from `FullConfig`.

- [ ] **Step 2: Create tests/global-setup.ts**

```typescript
import { chromium, FullConfig } from '@playwright/test';
import { AuthService } from './services/AuthService';
import { STANDARD_USER } from './data/users';

async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL ?? 'https://www.saucedemo.com';
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page    = await context.newPage();

  const authService = new AuthService();
  await authService.login(STANDARD_USER.username, STANDARD_USER.password, page);
  await authService.saveStorageState(STANDARD_USER.username, context);

  await browser.close();
}

export default globalSetup;
```

- [ ] **Step 3: Run code-simplifier on global-setup.ts**

Run code-simplifier on `tests/global-setup.ts`. Apply any suggestions.

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add tests/global-setup.ts
git commit -m "feat: add global-setup (saves standard_user session)"
```

---

## Task 11: global-teardown.ts

**Files:**
- Create: `tests/global-teardown.ts`

- [ ] **Step 1: Create tests/global-teardown.ts**

```typescript
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(): Promise<void> {
  const authDir = path.resolve('.auth');
  if (fs.existsSync(authDir)) {
    for (const file of fs.readdirSync(authDir)) {
      fs.unlinkSync(path.join(authDir, file));
    }
  }
}

export default globalTeardown;
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add tests/global-teardown.ts
git commit -m "feat: add global-teardown (cleans .auth/ directory)"
```

---

## Task 12: Fixtures

**Files:**
- Create: `tests/fixtures/services.fixture.ts`
- Create: `tests/fixtures/auth.fixture.ts`
- Create: `tests/fixtures/base.fixture.ts`

- [ ] **Step 1: Query Context7**

Use Context7: query `playwright test fixtures extend scope` to confirm how `test.extend` and fixture scoping work in Playwright 1.59.

- [ ] **Step 2: Create tests/fixtures/services.fixture.ts**

```typescript
import { test as base } from '@playwright/test';
import { AuthService } from '../services/AuthService';
import { CartService } from '../services/CartService';

type ServicesFixtures = {
  authService: AuthService;
  cartService: CartService;
};

export const test = base.extend<ServicesFixtures>({
  authService: async ({}, use) => {
    await use(new AuthService());
  },
  cartService: async ({}, use) => {
    await use(new CartService());
  },
});
```

- [ ] **Step 3: Create tests/fixtures/auth.fixture.ts**

```typescript
import { Page } from '@playwright/test';
import { test as base } from './services.fixture';
import { storageStatePath } from '../helpers/storageState';
import { STANDARD_USER } from '../data/users';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      storageState: storageStatePath(STANDARD_USER.username),
      baseURL,
    });
    const page = await context.newPage();
    await page.goto('/inventory.html');
    await use(page);
    await context.close();
  },
});
```

- [ ] **Step 4: Create tests/fixtures/base.fixture.ts**

```typescript
export { test } from './auth.fixture';
export { expect } from '@playwright/test';
```

- [ ] **Step 5: Run code-simplifier on all fixture files**

Run code-simplifier on `services.fixture.ts`, `auth.fixture.ts`, `base.fixture.ts`. Apply any suggestions.

- [ ] **Step 6: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add tests/fixtures/
git commit -m "feat: add fixtures (services, auth, base)"
```

---

## Code Review Checkpoint — Fixtures (after Task 12)

> **Run code-reviewer** on `tests/fixtures/` against these criteria:
> - Fixture hierarchy: services → auth → base (each extends the previous)
> - `authenticatedPage` creates a new `browser.newContext` per test — not reused across tests
> - `baseURL` is forwarded from the Playwright config fixture into the new context
> - `base.fixture.ts` exports only `test` and `expect` — nothing else
> - Login tests that don't use `authenticatedPage` won't trigger the storage state load (Playwright fixtures are lazy by default)

---

## Task 13: login.spec.ts

**Files:**
- Create: `tests/specs/login.spec.ts`

- [ ] **Step 1: Query Context7**

Use Context7: query `playwright test describe for of parameterized` to confirm the current pattern for looping over data to create parameterised tests.

- [ ] **Step 2: Write tests/specs/login.spec.ts**

```typescript
import { test, expect } from '../fixtures/base.fixture';
import { validUsers, invalidUsers } from '../data/users';

test.describe('Login @smoke @login', () => {
  test.describe('Valid users', () => {
    for (const user of validUsers) {
      test(`Valid login — ${user.username}`, async ({ page, authService }) => {
        await authService.login(user.username, user.password, page);
        await expect(page).toHaveURL(/inventory/);
      });
    }
  });

  test.describe('Invalid users', () => {
    for (const user of invalidUsers) {
      const label = user.username || '(empty)';
      const passLabel = user.password ? '(set)' : '(empty)';
      test(`Invalid login — username: "${label}", password: ${passLabel}`, async ({ page, authService }) => {
        await authService.login(user.username, user.password, page);
        await expect(page.getByTestId('error')).toContainText(user.expectedError);
      });
    }
  });
});
```

Note: test names use `(set)` / `(empty)` for the password label — never the actual password value — so real credentials never appear in test output, CI logs, or reports.

- [ ] **Step 3: Run code-simplifier on login.spec.ts**

Run code-simplifier on `tests/specs/login.spec.ts`. Apply any suggestions.

- [ ] **Step 4: Verify test list (no credentials exposed)**

```bash
npx playwright test tests/specs/login.spec.ts --list
```

Expected: Lists 10 test names. Verify that no password values appear in the output.

- [ ] **Step 5: Run login spec**

```bash
npx playwright test tests/specs/login.spec.ts --project=chromium
```

Expected: All 10 tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/specs/login.spec.ts
git commit -m "feat: add login spec (L-01 to L-10)"
```

---

## Task 14: cart.spec.ts

**Files:**
- Create: `tests/specs/cart.spec.ts`

- [ ] **Step 1: Write tests/specs/cart.spec.ts**

```typescript
import { test, expect } from '../fixtures/base.fixture';
import { PRODUCTS } from '../data/products';

test.describe('Cart @smoke @cart', () => {
  test.afterEach(async ({ authenticatedPage, cartService }) => {
    await cartService.clearCart(authenticatedPage);
  });

  test('C-01 Add single product — cart badge = 1', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('1');
  });

  test('C-02 Add multiple products — badge = 3, all items in cart', async ({ authenticatedPage, cartService }) => {
    const products = [PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT, PRODUCTS.SAUCE_LABS_ONESIE];
    await cartService.addProducts(products, authenticatedPage);
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('3');

    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveCount(3);
  });

  test('C-03 Remove product from inventory — badge = 0, button reverts', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await cartService.removeFromInventory(PRODUCTS.SAUCE_LABS_BACKPACK, authenticatedPage);

    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).not.toBeVisible();
    const item = authenticatedPage.getByTestId('inventory-item').filter({ hasText: PRODUCTS.SAUCE_LABS_BACKPACK });
    await expect(item.getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });

  test('C-04 Remove product from cart page — 1 item remains, badge = 1', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT], authenticatedPage);
    await cartService.removeFromCart(PRODUCTS.SAUCE_LABS_BACKPACK, authenticatedPage);

    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('1');
    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveCount(1);
    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveText(PRODUCTS.SAUCE_LABS_BIKE_LIGHT);
  });

  test('C-05 Cart badge not shown when cart is empty', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).not.toBeVisible();
  });

  test('C-06 Continue shopping returns to inventory, cart unchanged', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('continue-shopping').click();

    await expect(authenticatedPage).toHaveURL(/inventory/);
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('1');
  });
});
```

- [ ] **Step 2: Run code-simplifier on cart.spec.ts**

Run code-simplifier on `tests/specs/cart.spec.ts`. Apply any suggestions.

- [ ] **Step 3: Verify test list**

```bash
npx playwright test tests/specs/cart.spec.ts --list
```

Expected: Lists 6 tests.

- [ ] **Step 4: Run cart spec**

```bash
npx playwright test tests/specs/cart.spec.ts --project=chromium
```

Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/specs/cart.spec.ts
git commit -m "feat: add cart spec (C-01 to C-06)"
```

---

## Task 15: checkout.spec.ts

**Files:**
- Create: `tests/specs/checkout.spec.ts`

- [ ] **Step 1: Write tests/specs/checkout.spec.ts**

```typescript
import { test, expect } from '../fixtures/base.fixture';
import { PRODUCTS } from '../data/products';
import { VALID_CHECKOUT, negativeCheckoutCases } from '../data/checkout';

test.describe('Checkout @smoke @checkout', () => {
  test.afterEach(async ({ authenticatedPage, cartService }) => {
    await cartService.clearCart(authenticatedPage);
  });

  test('CH-01 Complete checkout — single item — confirmation shown', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await cartService.proceedToCheckout(VALID_CHECKOUT, authenticatedPage);

    await expect(authenticatedPage.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  });

  test('CH-02 Complete checkout — multiple items — all items in summary', async ({ authenticatedPage, cartService }) => {
    const products = [PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT, PRODUCTS.SAUCE_LABS_ONESIE];
    await cartService.addProducts(products, authenticatedPage);

    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('checkout').click();
    await authenticatedPage.getByTestId('firstName').fill(VALID_CHECKOUT.firstName);
    await authenticatedPage.getByTestId('lastName').fill(VALID_CHECKOUT.lastName);
    await authenticatedPage.getByTestId('postalCode').fill(VALID_CHECKOUT.zip);
    await authenticatedPage.getByTestId('continue').click();

    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveCount(3);
    await authenticatedPage.getByTestId('finish').click();
    await expect(authenticatedPage.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  });

  test('CH-03 Cancel on checkout step one — returns to cart, item still present', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('checkout').click();
    await authenticatedPage.getByTestId('cancel').click();

    await expect(authenticatedPage).toHaveURL(/cart/);
    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveText(PRODUCTS.SAUCE_LABS_BACKPACK);
  });

  test('CH-04 Cancel on checkout step two — returns to inventory', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('checkout').click();
    await authenticatedPage.getByTestId('firstName').fill(VALID_CHECKOUT.firstName);
    await authenticatedPage.getByTestId('lastName').fill(VALID_CHECKOUT.lastName);
    await authenticatedPage.getByTestId('postalCode').fill(VALID_CHECKOUT.zip);
    await authenticatedPage.getByTestId('continue').click();
    await authenticatedPage.getByTestId('cancel').click();

    await expect(authenticatedPage).toHaveURL(/inventory/);
  });

  test.describe('Checkout form validation — negative cases', () => {
    for (const data of negativeCheckoutCases) {
      const idx = negativeCheckoutCases.indexOf(data) + 5;
      test(`CH-0${idx} firstName="${data.firstName}" lastName="${data.lastName}" zip="${data.zip}"`, async ({ authenticatedPage, cartService }) => {
        await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
        await authenticatedPage.getByTestId('shopping-cart-link').click();
        await authenticatedPage.getByTestId('checkout').click();
        await authenticatedPage.getByTestId('firstName').fill(data.firstName);
        await authenticatedPage.getByTestId('lastName').fill(data.lastName);
        await authenticatedPage.getByTestId('postalCode').fill(data.zip);
        await authenticatedPage.getByTestId('continue').click();

        await expect(authenticatedPage.getByTestId('error')).toContainText(data.expectedError);
      });
    }
  });
});
```

- [ ] **Step 2: Run code-simplifier on checkout.spec.ts**

Run code-simplifier on `tests/specs/checkout.spec.ts`. Apply any suggestions.

- [ ] **Step 3: Verify test list**

```bash
npx playwright test tests/specs/checkout.spec.ts --list
```

Expected: Lists 8 tests (CH-01 to CH-08).

- [ ] **Step 4: Run checkout spec**

```bash
npx playwright test tests/specs/checkout.spec.ts --project=chromium
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/specs/checkout.spec.ts
git commit -m "feat: add checkout spec (CH-01 to CH-08)"
```

---

## Task 16: smoke.spec.ts (E2E)

**Files:**
- Create: `tests/specs/smoke.spec.ts`

- [ ] **Step 1: Write tests/specs/smoke.spec.ts**

```typescript
import { test, expect } from '../fixtures/base.fixture';
import { STANDARD_USER } from '../data/users';
import { PRODUCTS } from '../data/products';
import { VALID_CHECKOUT } from '../data/checkout';

test('E2E-01 Full buy flow @smoke @e2e', async ({ page, authService }) => {
  // 1. Full UI login as standard_user
  await authService.login(STANDARD_USER.username, STANDARD_USER.password, page);
  await expect(page).toHaveURL(/inventory/);

  // 2. Add 2 products from inventory
  const selectedProducts = [PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT];
  for (const product of selectedProducts) {
    await page.getByTestId('inventory-item')
      .filter({ hasText: product })
      .getByRole('button', { name: 'Add to cart' })
      .click();
  }
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('2');

  // 3. Open cart — verify both items present
  await page.getByTestId('shopping-cart-link').click();
  await expect(page.getByTestId('inventory-item-name')).toHaveCount(2);
  for (const product of selectedProducts) {
    await expect(page.getByTestId('inventory-item-name').filter({ hasText: product })).toBeVisible();
  }

  // 4. Proceed to checkout
  await page.getByTestId('checkout').click();

  // 5. Fill valid form data
  await page.getByTestId('firstName').fill(VALID_CHECKOUT.firstName);
  await page.getByTestId('lastName').fill(VALID_CHECKOUT.lastName);
  await page.getByTestId('postalCode').fill(VALID_CHECKOUT.zip);
  await page.getByTestId('continue').click();

  // 6. Verify order summary — items and total visible
  await expect(page.getByTestId('inventory-item-name')).toHaveCount(2);
  await expect(page.getByTestId('total-label')).toBeVisible();

  // 7. Complete order
  await page.getByTestId('finish').click();

  // 8. Verify confirmation message
  await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');

  // 9. Logout
  await authService.logout(page);
  await expect(page).toHaveURL('/');
});
```

- [ ] **Step 2: Run code-simplifier on smoke.spec.ts**

Run code-simplifier on `tests/specs/smoke.spec.ts`. Apply any suggestions.

- [ ] **Step 3: Verify test list**

```bash
npx playwright test tests/specs/smoke.spec.ts --list
```

Expected: Lists 1 test.

- [ ] **Step 4: Run E2E spec**

```bash
npx playwright test tests/specs/smoke.spec.ts --project=chromium
```

Expected: Test passes end-to-end.

- [ ] **Step 5: Commit**

```bash
git add tests/specs/smoke.spec.ts
git commit -m "feat: add E2E smoke spec (E2E-01 full buy flow)"
```

---

## Code Review Checkpoint — All Specs (after Task 16)

> **Run code-reviewer** on `tests/specs/` against these criteria:
> - All specs import only from `../fixtures/base.fixture`
> - No password values appear anywhere in test names, assertions, or comments
> - `afterEach` with `clearCart` is present in both cart and checkout suites
> - E2E test performs full UI login/logout (does not use `authenticatedPage`)
> - Test names in output match the ID scheme from the spec (L-01..L-10, C-01..C-06, CH-01..CH-08, E2E-01)

---

## Task 17: Full suite run + cleanup

**Files:**
- Delete: `tests/example.spec.ts`

- [ ] **Step 1: Delete the scaffolding example file**

```bash
rm tests/example.spec.ts
```

- [ ] **Step 2: Run full suite on Chromium**

```bash
npx playwright test --project=chromium
```

Expected: All 25 tests pass. Count: 5 valid login + 5 invalid login + 6 cart + 8 checkout + 1 E2E.

- [ ] **Step 3: Run full suite across all browsers**

```bash
npx playwright test
```

Expected: All 75 tests pass (25 × 3 browsers). Investigate any browser-specific failures before marking complete.

- [ ] **Step 4: Final commit**

```bash
git rm tests/example.spec.ts
git commit -m "chore: remove example spec, suite complete"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Covered |
|---|---|
| Login L-01 to L-05 (parameterised) | ✅ Task 13 |
| Login L-06 to L-10 (parameterised) | ✅ Task 13 |
| Cart C-01 to C-06 | ✅ Task 14 |
| Checkout CH-01 to CH-04 (happy path + cancel) | ✅ Task 15 |
| Checkout CH-05 to CH-08 (form validation, parameterised) | ✅ Task 15 |
| E2E-01 full buy flow | ✅ Task 16 |
| POM layer | ✅ Tasks 3–6 |
| Service layer | ✅ Tasks 7–8 |
| Fixtures (services, auth, base) | ✅ Task 12 |
| global-setup saves storage state | ✅ Task 10 |
| global-teardown cleans .auth/ | ✅ Task 11 |
| Passwords in env var, not source | ✅ Task 2 — `requireEnv('SAUCE_PASSWORD')` |
| CI uses GitHub secret | ✅ Task 1 — `.github/workflows/playwright.yml` |
| No password visible in test output | ✅ Task 13 — label uses `(set)`/`(empty)` |
| No CSS class selectors | ✅ All pages use `getByTestId` / `getByRole` |
| Specs import only from base.fixture | ✅ All specs import from `../fixtures/base.fixture` |
| afterEach clearCart for cart/checkout | ✅ Tasks 14–15 |
| Context7 used per Playwright task | ✅ Tasks 1, 2, 3, 4, 7, 10, 12, 13 |
| code-simplifier applied per task | ✅ Every task has a simplifier step |
| code-reviewer at task group boundaries | ✅ After Tasks 6, 8, 12, 16 |
