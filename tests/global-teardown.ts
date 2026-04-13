import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(): Promise<void> {
  const authDir = path.resolve('.auth');
  if (fs.existsSync(authDir)) {
    for (const file of fs.readdirSync(authDir)) {
      fs.unlinkSync(path.join(authDir, file));
    }
  }
}

export default globalTeardown;
