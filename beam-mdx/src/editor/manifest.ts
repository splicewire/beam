// The editor consumes the PHP-declared kit; no handwritten client kit is maintained here.
// Regenerate kit-manifest.json deliberately with:
// splicewire:beam:mdx:export-kit --write --output=<beam-mdx>/src/editor/kit-manifest.json
import generatedKitManifest from './kit-manifest.json';

/** A JSON Schema object (the inspector reads properties and hints). */
export type JsonSchema = Record<string, unknown>;

/** Blockdoc-shaped kit node consumed by the MDX editor adapters. */
export interface KitNodeManifest {
    name: string;
    description?: string;
    group?: 'block' | 'inline';
    category: string | null;
    admitsChildCategories: string[] | null;
    admitsText: boolean;
    'x-editable'?: { reorderable?: boolean };
    attrsSchema?: JsonSchema;
}

export interface KitManifest {
    profile: string;
    version: number;
    nodes: KitNodeManifest[];
}

export const kitManifest = generatedKitManifest as KitManifest;
