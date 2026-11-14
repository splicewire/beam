import {runRatchet} from '@schemastud/messages/ratchet';
import {fileURLToPath} from 'node:url';
process.exitCode=runRatchet(['--config',fileURLToPath(new URL('../../message-ratchet.config.json',import.meta.url)),...process.argv.slice(2)]);
