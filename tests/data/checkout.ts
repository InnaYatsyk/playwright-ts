export interface CheckoutData {
  firstName: string;
  lastName: string;
  zip: string;
}

export interface NegativeCheckoutCase extends CheckoutData {
  expectedError: string;
}

export const VALID_CHECKOUT: CheckoutData = {
  firstName: 'Ann',
  lastName: 'Lee',
  zip: '12345',
};

export const negativeCheckoutCases: NegativeCheckoutCase[] = [
  { firstName: '',    lastName: '',    zip: '',    expectedError: 'First Name is required' },
  { firstName: 'Ann', lastName: '',    zip: '',    expectedError: 'Last Name is required' },
  { firstName: 'Ann', lastName: 'Lee', zip: '',    expectedError: 'Postal Code is required' },
  { firstName: ' ',   lastName: ' ',   zip: ' ',   expectedError: 'First Name is required' },
];
