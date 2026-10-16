import { beamInertiaOptions, type PageModule } from '../fixtures/inertia-contract-0.1.2/index';
import { beamDocsPages } from '@splicewire/beam-docs/pages';

const hostPages: Record<string, () => Promise<PageModule>> = {
    './pages/host.tsx': async () => ({ default: () => null }),
};

// Compile the starter's map composition against published Inertia and emitted Docs declarations.
export const options = beamInertiaOptions({ pages: { ...beamDocsPages, ...hostPages } });
