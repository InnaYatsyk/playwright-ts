import { test, expect } from '../fixtures/base.fixture';
import { STANDARD_USER } from '../data/users';
import { PRODUCTS } from '../data/products';
import { VALID_CHECKOUT } from '../data/checkout';

test('E2E-01 Full buy flow @smoke @e2e', async ({ page, authService }) => {
  await authService.login(STANDARD_USER.username, STANDARD_USER.password, page);
  await expect(page).toHaveURL(/inventory/);

  const selectedProducts = [PRODUCTS.SAUCE_LABS_BACKPACK, PRODUCTS.SAUCE_LABS_BIKE_LIGHT];
  for (const product of selectedProducts) {
    await page.getByTestId('inventory-item')
      .filter({ hasText: product })
      .getByRole('button', { name: 'Add to cart' })
      .click();
  }
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('2');

  await page.getByTestId('shopping-cart-link').click();
  await expect(page.getByTestId('inventory-item-name')).toHaveCount(2);
  for (const product of selectedProducts) {
    await expect(page.getByTestId('inventory-item-name').filter({ hasText: product })).toBeVisible();
  }

  await page.getByTestId('checkout').click();

  await page.getByTestId('firstName').fill(VALID_CHECKOUT.firstName);
  await page.getByTestId('lastName').fill(VALID_CHECKOUT.lastName);
  await page.getByTestId('postalCode').fill(VALID_CHECKOUT.zip);
  await page.getByTestId('continue').click();

  await expect(page.getByTestId('inventory-item-name')).toHaveCount(2);
  await expect(page.getByTestId('total-label')).toBeVisible();

  await page.getByTestId('finish').click();

  await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');

  await authService.logout(page);
  await expect(page).toHaveURL('/');
});
