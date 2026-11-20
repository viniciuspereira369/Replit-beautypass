import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Reuse Vite's existing compiler; no extra dependency or API server is needed.
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('vite'))('esbuild');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = resolve(root, 'generated-artifacts/beautypass-tests/beautypass.test.mjs');
await build({
  entryPoints: [resolve(root, 'artifacts/beautypass/src/lib/beautypass.test.ts')],
  outfile: output, bundle: true, platform: 'node', format: 'esm', target: 'node24', jsx: 'automatic',
  banner: { js: "import { createRequire as createTestRequire } from 'node:module'; const require = createTestRequire(import.meta.url);" },
});
const result = spawnSync(process.execPath, ['--test', output], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
