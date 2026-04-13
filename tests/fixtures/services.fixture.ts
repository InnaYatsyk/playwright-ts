import { test as base } from '@playwright/test';
import { AuthService } from '../services/AuthService';
import { CartService } from '../services/CartService';

type ServicesFixtures = {
  authService: AuthService;
  cartService: CartService;
};

export const test = base.extend<ServicesFixtures>({
  authService: async ({}, use) => {
    await use(new AuthService());
  },
  cartService: async ({}, use) => {
    await use(new CartService());
  },
});
