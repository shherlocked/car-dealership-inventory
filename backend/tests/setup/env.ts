import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables before any module reads process.env.
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), quiet: true });
