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
