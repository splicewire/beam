import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../src/', import.meta.url));
const violations = [];
function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) scan(path);
        else if (/\.tsx?$/.test(entry.name)) {
            const body = readFileSync(path, 'utf8');
            if (/from\s*['"]@\//.test(body) || /import\s*\(['"]@\//.test(body)) violations.push(`${path}: host alias import`);
            if (/from\s*['"][^'"]*generated\/App\//.test(body)) violations.push(`${path}: host-owned generated wire type`);
            if (/import\.meta\.(glob|env)/.test(body)) violations.push(`${path}: host bundler environment`);
        }
    }
}
scan(source);
if (violations.length) { console.error(violations.join('\n')); process.exitCode = 1; }
else console.log('Beam Inertia imports are independent of host source and bundler configuration.');
