# SauceDemo Test Suite — Design Spec

**Date:** 2026-04-12
**Target:** https://www.saucedemo.com/
**Scope:** Pre-release smoke suite covering login, cart, checkout, and full E2E flow

---

## 1. Goals

- Automate a pre-release smoke suite for saucedemo.com covering login with multiple users, cart operations, checkout (happy path + negative), and a full end-to-end flow
- Produce a maintainable, extendable suite that can grow to include API testing without rewriting tests
- Support parallel execution safely
- Support a data provider pattern for parameterised tests

---

## 2. Architecture

### Pattern: POM + Service Layer + Fixtures

Three distinct layers:

| Layer | Purpose |
|---|---|
| **Page Objects** | Encapsulate UI interactions for a single page. No test logic. |
| **Services** | Orchestrate page objects into business operations (e.g. login, addToCart, checkout). |
| **Fixtures** | Inject services and pre-authenticated contexts into tests. Tests never import page objects or services directly. |

**Key extensibility principle:** Services will have defined method signatures. Adding API testing means implementing an `ApiCartService` with the same interface — the fixture decides which to inject, test files change nothing.

---

## 3. Project Structure

```
tests/
├── pages/
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutStepOnePage.ts
│   ├── CheckoutStepTwoPage.ts
│   └── CheckoutCompletePage.ts
│
├── services/
│   ├── AuthService.ts
│   └── CartService.ts
│
├── fixtures/
│   ├── base.fixture.ts         # merges all fixtures, exported as `test`
│   ├── auth.fixture.ts         # injects authenticated page via storage state
│   └── services.fixture.ts     # injects AuthService and CartService
│
├── data/
│   ├── users.ts
│   ├── products.ts
│   └── checkout.ts
│
├── specs/
│   ├── login.spec.ts
│   ├── cart.spec.ts
│   ├── checkout.spec.ts
│   └── smoke.spec.ts
│
├── helpers/
│   ├── storageState.ts
│   └── dataProvider.ts
│
├── global-setup.ts
└── global-teardown.ts
```

**Rule:** `specs/` files import only from `fixtures/base.fixture.ts`. Never from pages or services directly.

---

## 4. Page Objects

Each class maps 1:1 to a page and exposes only locator-based actions and assertions. No CSS class selectors — role, test-id, and label selectors only.

| Class | Responsibilities |
|---|---|
| `LoginPage` | fill credentials, submit form, read error message |
| `InventoryPage` | list products, add/remove item by name, open item detail, open cart, open menu |
| `CartPage` | read cart items, remove item by name, proceed to checkout, continue shopping |
| `CheckoutStepOnePage` | fill personal info form, submit, read validation errors |
| `CheckoutStepTwoPage` | read order summary, finish order, cancel |
| `CheckoutCompletePage` | confirm success message |

---

## 5. Services

### AuthService
- `login(user, page)` — full UI login via LoginPage
- `logout(page)` — open hamburger menu → logout
- `saveStorageState(user, context)` — authenticate and persist session to `.auth/<user>.json`
- `clearStorageState(user)` — delete persisted session file

### CartService
- `addProducts(names: string[], page)` — add one or more products by name from inventory
- `removeFromInventory(name: string, page)` — remove a product via inventory page
- `removeFromCart(name: string, page)` — remove a product via cart page
- `proceedToCheckout(data: CheckoutData, page)` — fill form and complete purchase
- `clearCart(page)` — remove all items currently in cart (used in afterEach)
- `getCartCount(page)` — read cart badge count

---

## 6. Fixtures

### Fixture hierarchy
```
Playwright base test
  └── services.fixture.ts      (authService, cartService)
        └── auth.fixture.ts    (authenticatedPage — session injected)
              └── base.fixture.ts  (exported as `test`)
```

### Scoping rule
- Auth fixture is **test-scoped** — each test gets its own isolated browser context loaded with the storage state snapshot. This ensures cart state (stored in localStorage) never bleeds between parallel tests.

### global-setup.ts
- Logs in once as `standard_user` via UI
- Saves session to `.auth/standard_user.json`
- Runs before the entire test suite

### global-teardown.ts
- Deletes all files in `.auth/`
- Runs after the entire test suite

---

## 7. Preconditions & Postconditions

| Test type | Precondition | Postcondition |
|---|---|---|
| Login tests | Fresh page, no session | Nothing — context closes automatically |
| Cart tests | Session injected via storage state, empty cart | `cartService.clearCart()` in afterEach |
| Checkout tests | Session injected via storage state, products pre-added | `cartService.clearCart()` in afterEach |
| E2E smoke test | Full UI login via `authService.login()` | Full UI logout via `authService.logout()` |

---

## 8. Test Data

### `data/users.ts`
Two datasets:

**Valid users** (L-01 to L-05 — parameterised):
```
{ username: 'standard_user',           password: 'secret_sauce', expectInventory: true }
{ username: 'problem_user',            password: 'secret_sauce', expectInventory: true }
{ username: 'performance_glitch_user', password: 'secret_sauce', expectInventory: true }
{ username: 'error_user',              password: 'secret_sauce', expectInventory: true }
{ username: 'visual_user',             password: 'secret_sauce', expectInventory: true }
```

**Invalid/blocked users** (L-06 to L-10 — parameterised):
```
{ username: 'locked_out_user', password: 'secret_sauce',    expectedError: 'Sorry, this user has been locked out' }
{ username: 'standard_user',   password: 'wrong_password',  expectedError: 'Username and password do not match' }
{ username: '',                password: 'secret_sauce',    expectedError: 'Username is required' }
{ username: 'standard_user',   password: '',                expectedError: 'Password is required' }
{ username: '',                password: '',                expectedError: 'Username is required' }
```

### `data/checkout.ts`
Negative form validation dataset (CH-05 to CH-08 — parameterised):
```
{ firstName: '',    lastName: '',    zip: '',    expectedError: 'First Name is required' }
{ firstName: 'Ann', lastName: '',    zip: '',    expectedError: 'Last Name is required' }
{ firstName: 'Ann', lastName: 'Lee', zip: '',    expectedError: 'Postal Code is required' }
{ firstName: ' ',   lastName: ' ',   zip: ' ',   expectedError: 'First Name is required' }
```

### `data/products.ts`
Named product constants used across cart and checkout tests to avoid magic strings.

---

## 9. Test Scenarios

### Suite 1: Login `@smoke @login`

| ID | Scenario | Data | Expected Result |
|---|---|---|---|
| L-01 | Valid login — standard user | standard_user | Inventory page |
| L-02 | Valid login — problem user | problem_user | Inventory page |
| L-03 | Valid login — performance glitch user | performance_glitch_user | Inventory page reached within Playwright default timeout (30s) |
| L-04 | Valid login — error user | error_user | Inventory page |
| L-05 | Valid login — visual user | visual_user | Inventory page |
| L-06 | Locked out user | locked_out_user | Error: locked out message |
| L-07 | Invalid password | standard_user + wrong password | Error: credentials mismatch |
| L-08 | Empty username | no username | Error: username required |
| L-09 | Empty password | no password | Error: password required |
| L-10 | Both fields empty | — | Error: username required |

L-01–L-05 implemented as one parameterised test over valid users dataset.
L-06–L-10 implemented as one parameterised test over invalid users dataset.

---

### Suite 2: Cart `@smoke @cart`

| ID | Scenario | Precondition | Expected Result |
|---|---|---|---|
| C-01 | Add single product | Session injected, empty cart | Cart badge = 1 |
| C-02 | Add multiple products | Session injected, empty cart | Cart badge = 3, all items in cart |
| C-03 | Remove product from inventory page | Session injected, 1 item in cart | Cart badge = 0, button reverts to Add |
| C-04 | Remove product from cart page | Session injected, 2 items in cart | 1 item remains, badge = 1 |
| C-05 | Cart badge not shown when empty | Session injected, empty cart | No badge visible |
| C-06 | Continue shopping from cart | Session injected, 1 item in cart | Returns to inventory, cart unchanged |

Postcondition: `afterEach` → `cartService.clearCart()`

---

### Suite 3: Checkout `@smoke @checkout`

**Happy path:**

| ID | Scenario | Precondition | Expected Result |
|---|---|---|---|
| CH-01 | Complete checkout — single item | Session injected, 1 item in cart | Order confirmation shown |
| CH-02 | Complete checkout — multiple items | Session injected, 3 items in cart | Confirmation, all items in summary |
| CH-03 | Cancel on checkout step one | Session injected, 1 item in cart | Returns to cart, item still present |
| CH-04 | Cancel on checkout step two | Session injected, 1 item in cart | Returns to inventory page |

**Negative — form validation (parameterised):**

| ID | Scenario | Form Data | Expected Error |
|---|---|---|---|
| CH-05 | All fields empty | `{}` | "First Name is required" |
| CH-06 | First name only | `{ firstName }` | "Last Name is required" |
| CH-07 | First + last name, no zip | `{ firstName, lastName }` | "Postal Code is required" |
| CH-08 | Whitespace-only fields | `{ " ", " ", " " }` | "First Name is required" |

CH-05–CH-08 implemented as one parameterised test over checkout negative dataset.

Postcondition: `afterEach` → `cartService.clearCart()`

---

### Suite 4: End-to-End `@smoke @e2e`

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| E2E-01 | Full buy flow | 1. Full UI login as standard_user 2. Add 2 products from inventory 3. Open cart, verify both items present 4. Proceed to checkout 5. Fill valid form data 6. Verify order summary (items + total) 7. Complete order 8. Verify confirmation message 9. Logout | Back on login page, session cleared |

---

## 10. Parallel Execution

- Cart and checkout test suites run in parallel across workers safely because:
  - Auth fixture is test-scoped — each test gets its own browser context
  - Cart state lives in localStorage, which is isolated per context
  - Storage state file is written once in global-setup and only read during tests (no write conflicts)
- Login tests are stateless — always safe to parallelise
- E2E test is self-contained (full login/logout) — safe to run in parallel with other suites

---

## 11. Future Extensions

- **API testing:** Implement `ApiAuthService` / `ApiCartService` with the same method signatures as UI services. Update fixture to inject API variant. No test files change.
- **Additional users:** Add entries to `data/users.ts` — parameterised tests pick them up automatically.
- **Additional checkout cases:** Add entries to `data/checkout.ts`.
- **Visual regression:** Add visual assertions to existing page objects without structural changes.
- **Builder pattern:** Can be layered on top of services for complex scenario construction (e.g. `CheckoutBuilder`) when the suite grows.
