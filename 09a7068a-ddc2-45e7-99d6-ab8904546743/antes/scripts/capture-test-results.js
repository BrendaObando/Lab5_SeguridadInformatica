const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const evidence = path.join(root, 'evidencias');
fs.mkdirSync(evidence, { recursive: true });
const commands = [
  ['resultado-unitarias.txt', ['npm.cmd', 'test']],
  ['resultado-integracion.txt', ['npm.cmd', 'run', 'test:integration']],
  ['resultado-e2e.txt', ['npx.cmd', 'playwright', 'test', '--project=chromium', '--headed', '--reporter=list']],
];

let failed = false;
for (const [file, [command, ...args]] of commands) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: true });
  const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? `\n${result.error.message}\n` : ''}`;
  fs.writeFileSync(path.join(evidence, file), output, 'utf8');
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
