function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Required environment variable "${name}" is not set.\n` +
      `Copy .env.example to .env and set the value, or set the GitHub Actions secret.`
    );
  }
  return value;
}

const SAUCE_PASSWORD = requireEnv('SAUCE_PASSWORD');

export interface ValidUser {
  username: string;
  password: string;
  expectInventory: boolean;
}

export interface InvalidUser {
  username: string;
  password: string;
  expectedError: string;
}

export const STANDARD_USER = { username: 'standard_user', password: SAUCE_PASSWORD };

export const validUsers: ValidUser[] = [
  { username: 'standard_user',           password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'problem_user',            password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'performance_glitch_user', password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'error_user',              password: SAUCE_PASSWORD, expectInventory: true },
  { username: 'visual_user',             password: SAUCE_PASSWORD, expectInventory: true },
];

export const invalidUsers: InvalidUser[] = [
  { username: 'locked_out_user', password: SAUCE_PASSWORD,   expectedError: 'Sorry, this user has been locked out' },
  { username: 'standard_user',   password: 'wrong_password', expectedError: 'Username and password do not match' },
  { username: '',                password: SAUCE_PASSWORD,   expectedError: 'Username is required' },
  { username: 'standard_user',   password: '',               expectedError: 'Password is required' },
  { username: '',                password: '',               expectedError: 'Username is required' },
];
