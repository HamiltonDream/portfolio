const { execSync } = require('child_process');
const path = require('path');
const dir = path.resolve(__dirname);
process.chdir(dir);

// Clear the .next/dev directory to remove any stale locks
const fs = require('fs');
const devDir = path.join(dir, '.next', 'dev');
try { fs.rmSync(devDir, { recursive: true, force: true }); } catch {}

// Start next dev directly
execSync('npx next dev --port 3333', { cwd: dir, stdio: 'inherit', env: { ...process.env, NEXT_PRIVATE_SKIP_SERVER_STARTED_CHECK: '1' } });
