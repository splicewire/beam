import { fileURLToPath } from 'node:url';
import { runProducer } from './contracts.mjs';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--write') || args.length > 1) {
    throw new Error('Usage: npm run contracts:generate -- [--write]');
}
const output = fileURLToPath(new URL('../src/generated/', import.meta.url));
process.stdout.write(runProducer(args.length ? ['--write', `--output=${output}`] : []));
