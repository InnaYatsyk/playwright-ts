import { chromium, FullConfig } from '@playwright/test';
import { AuthService } from './services/AuthService';
import { STANDARD_USER } from './data/users';

async function globalSetup(config: FullConfig): Promise<void> {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  const authService = new AuthService();
  await authService.login(STANDARD_USER.username, STANDARD_USER.password, page);
  await authService.saveStorageState(STANDARD_USER.username, context);

  await browser.close();
}

export default globalSetup;
