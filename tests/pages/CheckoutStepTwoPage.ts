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
