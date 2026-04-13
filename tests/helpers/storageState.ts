import * as path from 'path';

export function storageStatePath(username: string): string {
  return path.resolve('.auth', `${username}.json`);
}
