#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { hashPasswordPbkdf2 } from '../worker/utils/crypto.js';

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    const password = (await rl.question('Enter admin password to hash (PBKDF2-SHA256, 100k iterations): ')).trim();
    if (password.length < 10) {
      console.error('Error: Please choose a strong password of at least 10 characters.');
      process.exitCode = 1;
      return;
    }
    const hash = await hashPasswordPbkdf2(password);
    console.log('\nCopy this value when running `npx wrangler secret put ADMIN_PASSWORD_HASH`:\n');
    console.log(hash);
    console.log('');
  } finally {
    rl.close();
  }
}

main();
