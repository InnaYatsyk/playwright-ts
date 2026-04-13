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
