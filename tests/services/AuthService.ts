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
    fs.mkdirSync(dir, { recursive: true });
    await context.storageState({ path: path.join(dir, `${username}.json`) });
  }

  async clearStorageState(username: string): Promise<void> {
    const filePath = path.resolve('.auth', `${username}.json`);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // file does not exist — nothing to clear
    }
  }
}
