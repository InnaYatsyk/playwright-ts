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
