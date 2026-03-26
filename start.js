const path = require('path');
const dir = __dirname;
process.chdir(dir);
const next = path.join(dir, 'node_modules', 'next', 'dist', 'bin', 'next');
require('child_process').fork(next, ['dev', '--port', '7073'], {
  cwd: dir,
  stdio: 'inherit'
});
