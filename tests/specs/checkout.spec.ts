import { test, expect } from '../fixtures/base.fixture';
import { PRODUCTS } from '../data/products';
import { VALID_CHECKOUT, negativeCheckoutCases } from '../data/checkout';

test.describe('Checkout @smoke @checkout', () => {
  test.afterEach(async ({ authenticatedPage, cartService }) => {
    await cartService.clearCart(authenticatedPage);
  });

  test('CH-01 Complete checkout — single item — confirmation shown', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await cartService.proceedToCheckout(VALID_CHECKOUT, authenticatedPage);

    await expect(authenticatedPage.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  });

  test('CH-02 Complete checkout — multiple items — all items in summary', async ({ authenticatedPage, cartService }) => {
    const products = [PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT, PRODUCTS.SAUCE_LABS_ONESIE];
    await cartService.addProducts(products, authenticatedPage);

    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('checkout').click();
    await authenticatedPage.getByTestId('firstName').fill(VALID_CHECKOUT.firstName);
    await authenticatedPage.getByTestId('lastName').fill(VALID_CHECKOUT.lastName);
    await authenticatedPage.getByTestId('postalCode').fill(VALID_CHECKOUT.zip);
    await authenticatedPage.getByTestId('continue').click();

    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveCount(3);
    await authenticatedPage.getByTestId('finish').click();
    await expect(authenticatedPage.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  });

  test('CH-03 Cancel on checkout step one — returns to cart, item still present', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('checkout').click();
    await authenticatedPage.getByTestId('cancel').click();

    await expect(authenticatedPage).toHaveURL(/cart/);
    await expect(authenticatedPage.getByTestId('inventory-item-name')).toHaveText(PRODUCTS.SAUCE_LABS_BACKPACK);
  });

  test('CH-04 Cancel on checkout step two — returns to inventory', async ({ authenticatedPage, cartService }) => {
    await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
    await authenticatedPage.getByTestId('shopping-cart-link').click();
    await authenticatedPage.getByTestId('checkout').click();
    await authenticatedPage.getByTestId('firstName').fill(VALID_CHECKOUT.firstName);
    await authenticatedPage.getByTestId('lastName').fill(VALID_CHECKOUT.lastName);
    await authenticatedPage.getByTestId('postalCode').fill(VALID_CHECKOUT.zip);
    await authenticatedPage.getByTestId('continue').click();
    await authenticatedPage.getByTestId('cancel').click();

    await expect(authenticatedPage).toHaveURL(/inventory/);
  });

  test.describe('Checkout form validation — negative cases', () => {
    for (const [i, data] of negativeCheckoutCases.entries()) {
      const idx = i + 5;
      test(`CH-0${idx} firstName="${data.firstName}" lastName="${data.lastName}" zip="${data.zip}"`, async ({ authenticatedPage, cartService }) => {
        await cartService.addProducts([PRODUCTS.SAUCE_LABS_BACKPACK], authenticatedPage);
        await authenticatedPage.getByTestId('shopping-cart-link').click();
        await authenticatedPage.getByTestId('checkout').click();
        await authenticatedPage.getByTestId('firstName').fill(data.firstName);
        await authenticatedPage.getByTestId('lastName').fill(data.lastName);
        await authenticatedPage.getByTestId('postalCode').fill(data.zip);
        await authenticatedPage.getByTestId('continue').click();

        await expect(authenticatedPage.getByTestId('error')).toContainText(data.expectedError);
      });
    }
  });
});
