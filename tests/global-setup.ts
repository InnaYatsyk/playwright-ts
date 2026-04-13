import { chromium, selectors } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import { AuthService } from './services/AuthService';
import { STANDARD_USER } from './data/users';

async function globalSetup(config: FullConfig): Promise<void> {
  await selectors.setTestIdAttribute('data-test');
  const { baseURL } = config.projects[0].use;
  if (!baseURL) throw new Error('baseURL is not configured in playwright.config.ts');

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    const authService = new AuthService();
    await authService.login(STANDARD_USER.username, STANDARD_USER.password, page);
    await authService.saveStorageState(STANDARD_USER.username, context);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
