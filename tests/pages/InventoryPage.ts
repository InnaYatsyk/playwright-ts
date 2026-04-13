import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  private readonly cartBadge: Locator;
  private readonly cartLink: Locator;
  private readonly menuButton: Locator;

  constructor(private readonly page: Page) {
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
  }

  async addToCartByName(name: string): Promise<void> {
    const item = this.page.getByTestId('inventory-item').filter({ hasText: name });
    await item.getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromInventoryByName(name: string): Promise<void> {
    const item = this.page.getByTestId('inventory-item').filter({ hasText: name });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
  }

  async getCartCount(): Promise<number> {
    if (!await this.cartBadge.isVisible()) return 0;
    return parseInt(await this.cartBadge.innerText(), 10);
  }
}
