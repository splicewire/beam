import type { ComponentType } from 'react';
import { beamAgreementsPages } from '../src/pages/index.js';

type InertiaPageLoader = () => Promise<{ default: ComponentType }>;

// Keep the package's documented page-map spread assignable to beam-inertia's public loader contract.
export const agreementsPagesAsInertiaLoaders: Record<string, InertiaPageLoader> = beamAgreementsPages;
