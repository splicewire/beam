import { defineConfig } from 'tsup';
export default defineConfig({ entry: ['src/index.ts'], format: ['esm'], dts: true, sourcemap: true, clean: true, external: ['react','react-dom','@schemastud/ui','@tanstack/react-query','lucide-react','@splicewire/beam-resources'] });
