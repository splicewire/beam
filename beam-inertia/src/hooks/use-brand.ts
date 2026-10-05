import { usePage } from '@inertiajs/react';
import type { Brand } from '../types/brand';

/**
 * The shared `brand` prop. A host that predates it still shares `name`, so that is the fallback; neither ever becomes
 * a literal brand here (ux-walkthrough UX-03).
 */
export function useBrand(): Brand {
    const { brand, name } = usePage().props as { brand?: Brand; name?: string };

    return brand ?? { name: name ?? '', logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: '' };
}

/** A document title from the brand's `titleTemplate` (`:title`, `:name`), else "title - name". */
export function brandTitle(title: string, brand: Pick<Brand, 'name' | 'titleTemplate'>): string {
    if (!title) return brand.name;
    if (brand.titleTemplate) return brand.titleTemplate.replace(':title', title).replace(':name', brand.name);

    return brand.name ? `${title} - ${brand.name}` : title;
}
