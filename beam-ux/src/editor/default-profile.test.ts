import { describe, expect, it } from 'vitest';
import { DEFAULT_TREES } from './defaults';
import profile from './default-profile.fixture.json';
import type { JsonDoc } from '../blockdoc/json';

// Generated from laravel-beam-ux HtmlManifestProfile + PackagedEditorNodeSource.
// Auth pages are shipped system seeds, not author-create defaults (lead 2026-10-17);
// their palette/inspector declarations are explicitly tracked in ticket 00 for 07b/EP-12.
const shippedAuth = new Set(['login', 'register', 'forgot-password', 'reset-password',
    'confirm-password', 'two-factor-challenge', 'verify-email']);

describe('packaged author-create defaults', () => {
    it('places only nodes declared in the PHP default profile, respecting sealed islands', () => {
        const nodes = new Map(profile.nodes.map(node => [node.name, node]));
        const visit = (body: JsonDoc) => {
            for (const node of body) {
                if (node.kind !== 'block') continue;
                if (!node.name) throw new Error('Packaged default contains an unnamed block');
                const declaration = nodes.get(node.name);
                expect(declaration, `undeclared default block ${node.name}`).toBeDefined();
                if (declaration?.admitsChildCategories?.length === 0) {
                    expect(node.children ?? []).toEqual([]);
                }
                if (declaration?.attrsSchema.additionalProperties === false) {
                    expect(node.props ?? []).toEqual([]);
                }
                visit(node.children ?? []);
            }
        };
        for (const [slug, tree] of Object.entries(DEFAULT_TREES)) {
            if (!shippedAuth.has(slug)) visit(tree);
        }
        expect(nodes.has('AuthLogin')).toBe(false); // No accidental auth exemption in this profile.
    });
});
