import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting DoxCards production build for Cloudflare Pages...');

// Run vite build with root config
execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });

// Ensure both dist and client/dist exist
const rootDist = path.join(__dirname, 'dist');
const clientDist = path.join(__dirname, 'client', 'dist');

if (fs.existsSync(rootDist)) {
  console.log('📦 Copying build artifacts to client/dist for dual-path compatibility...');
  fs.cpSync(rootDist, clientDist, { recursive: true, force: true });
}

console.log('✅ Build completed successfully! Both dist/ and client/dist/ are ready.');
