export const PRODUCTS = {
  SAUCE_LABS_BACKPACK:          'Sauce Labs Backpack',
  SAUCE_LABS_BIKE_LIGHT:        'Sauce Labs Bike Light',
  SAUCE_LABS_BOLT_T_SHIRT:      'Sauce Labs Bolt T-Shirt',
  SAUCE_LABS_FLEECE_JACKET:     'Sauce Labs Fleece Jacket',
  SAUCE_LABS_ONESIE:            'Sauce Labs Onesie',
  TEST_ALL_THE_THINGS_T_SHIRT:  'Test.allTheThings() T-Shirt (Red)',
} as const;

export type ProductName = typeof PRODUCTS[keyof typeof PRODUCTS];
