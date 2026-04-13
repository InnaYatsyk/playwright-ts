import { test, expect } from '../fixtures/base.fixture';
import { PRODUCTS } from '../data/products';

test.describe('Cart @smoke @cart', () => {
  test.afterEach(async ({ authenticatedPage, cartService }) => {
    await cartService.clearCart(authenticatedPage);
  });

  test('C-01 Add single product — cart badge = 1', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('1');
  });

  test('C-02 Add multiple products — badge = 3, all items in cart', async ({ authenticatedPage, cartService }) => {
    const products = [PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT, PRODUCTS.SAUCE_LABS_ONESIE];
    await cartService.addProducts(products, authenticatedPage);
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('3');

    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveCount(3);
  });

  test('C-03 Remove product from inventory — badge = 0, button reverts', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await cartService.removeFromInventory(PRODUCTS.SAUCE_LABS_BACKPACK, authenticatedPage);

    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).not.toBeVisible();
    const item = authenticatedPage.getByTestId('inventory-item').filter({ hasText: PRODUCTS.SAUCE_LABS_BACKPACK });
    await expect(item.getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });

  test('C-04 Remove product from cart page — 1 item remains, badge = 1', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT], authenticatedPage);
    await cartService.removeFromCart(PRODUCTS.SAUCE_LABS_BACKPACK, authenticatedPage);

    const cartItems = authenticatedPage.getByTestId('inventory-item-name');
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('1');
    await expect(cartItems).toHaveCount(1);
    await expect(cartItems).toHaveText(PRODUCTS.SAUCE_LABS_BIKE_LIGHT);
  });

  test('C-05 Cart badge not shown when cart is empty', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).not.toBeVisible();
  });

  test('C-06 Continue shopping returns to inventory, cart unchanged', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('continue-shopping').click();

    await expect(authenticatedPage).toHaveURL(/inventory/);
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('1');
  });
});
