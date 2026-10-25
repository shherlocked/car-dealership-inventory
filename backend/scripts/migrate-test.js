// Applies Prisma migrations to the test database (.env.test).
// Cross-platform replacement for `dotenv -e .env.test -- prisma migrate deploy`.
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
  quiet: true,
});

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(result.status === null ? 1 : result.status);