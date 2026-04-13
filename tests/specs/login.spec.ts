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
