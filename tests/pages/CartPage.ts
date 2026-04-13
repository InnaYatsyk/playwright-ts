import { Page, Locator } from '@playwright/test';

export class CartPage {
  private readonly checkoutButton: Locator;
  private readonly continueShoppingButton: Locator;

  constructor(private readonly page: Page) {
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async getCartItems(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allInnerTexts();
  }

  async removeItemByName(name: string): Promise<void> {
    const names = await this.page.getByTestId('inventory-item-name').allInnerTexts();
    const index = names.indexOf(name);
    if (index === -1) throw new Error(`Item "${name}" not found in cart`);
    await this.page.getByRole('button', { name: 'Remove' }).nth(index).click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
