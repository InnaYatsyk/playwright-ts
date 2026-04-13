import { Page } from '@playwright/test';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutStepOnePage } from '../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../pages/CheckoutStepTwoPage';
import { CheckoutData } from '../data/checkout';

export class CartService {
  async addProducts(names: string[], page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    for (const name of names) {
      await inventoryPage.addToCartByName(name);
    }
  }

  async removeFromInventory(name: string, page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.removeFromInventoryByName(name);
  }

  async removeFromCart(name: string, page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.removeItemByName(name);
  }

  async proceedToCheckout(data: CheckoutData, page: Page): Promise<void> {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.proceedToCheckout();
    const checkoutOne = new CheckoutStepOnePage(page);
    await checkoutOne.fillForm(data.firstName, data.lastName, data.zip);
    await checkoutOne.submit();
    const checkoutTwo = new CheckoutStepTwoPage(page);
    await checkoutTwo.finish();
  }

  async clearCart(page: Page): Promise<void> {
    await page.goto('/cart.html');
    const cartPage = new CartPage(page);
    const items = await cartPage.getCartItems();
    for (const item of items) {
      await cartPage.removeItemByName(item);
    }
  }

  async getCartCount(page: Page): Promise<number> {
    const inventoryPage = new InventoryPage(page);
    return inventoryPage.getCartCount();
  }
}
