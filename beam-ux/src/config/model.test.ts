// config-sections 10a: the Config area's pure view model over the generated `beam-config` slice.
import { describe, expect, it } from 'vitest';
import { asConfigSection, cascade, closedToRealm, deploySource, family, humanize, isListKey, keyLabel, matchesFilter, nodeAt, pointerTokens, provenance } from './model';
import { APP_CHAT, BEAM_UX } from './ConfigArea.fixtures';

const key = (pointer: string, section = BEAM_UX) => section.keys.find((k) => k.pointer === pointer)!;

describe('pointers', () => {
    it('split into RFC 6901 tokens, keeping dots and decoding ~1 and ~0', () => {
        expect(pointerTokens('/google.cse.query/limit')).toEqual(['google.cse.query', 'limit']);
        expect(pointerTokens('/a~1b/c~0d')).toEqual(['a/b', 'c~d']);
        expect(pointerTokens('')).toEqual([]);
    });

    it('address the section schema through properties, a map and an array', () => {
        expect(nodeAt(BEAM_UX.schema, '/site/artifact_root')?.title).toBe('Artifact root');
        expect(nodeAt(APP_CHAT.schema, '/google.cse.query/limit')?.type).toBe('integer');
        expect(nodeAt({ type: 'object', additionalProperties: { type: 'number', title: 'Rate' } }, '/gpt-x')?.title).toBe('Rate');
        expect(nodeAt({ type: 'array', items: { type: 'string', title: 'Prefix' } }, '/0')?.title).toBe('Prefix');
        expect(nodeAt(BEAM_UX.schema, '/nope')).toBeUndefined();
    });
});

describe('labels', () => {
    it('prefer the schema title, else humanize the last token', () => {
        expect(keyLabel(BEAM_UX.schema, '/cache_ttl')).toBe('Page cache lifetime');
        expect(keyLabel(APP_CHAT.schema, '/google.cse.query/limit')).toBe('Limit');
        expect(humanize('max_retries')).toBe('Max retries');
        expect(humanize('googleCse')).toBe('Google cse');
    });
});

describe('the cascade', () => {
    it('stacks top-down with one winner of the key tier', () => {
        expect(cascade(key('/site/reserved_prefixes')).map((l) => [l.layer.tier, l.standing])).toEqual([
            ['provider', 'wins'],
            ['host', 'loses'],
            ['package', 'loses'],
        ]);
    });

    it('marks shadowed and removed layers instead of calling them losers', () => {
        expect(cascade(key('/site/artifact_root')).map((l) => l.standing)).toEqual(['wins', 'shadowed']);
        expect(cascade(key('/legacy_blocks')).map((l) => l.standing)).toEqual(['wins', 'removed']);
    });
});

describe('filters and sources', () => {
    it('filter on what the row carries', () => {
        expect(BEAM_UX.keys.filter((k) => matchesFilter(k, 'changeable')).map((k) => k.pointer)).toEqual(['/cache_ttl', '/mode']);
        expect(APP_CHAT.keys.filter((k) => matchesFilter(k, 'secrets')).map((k) => k.pointer)).toEqual(['/openai/api_key']);
        expect(APP_CHAT.keys.filter((k) => matchesFilter(k, 'env')).length).toBe(2);
    });

    it('name a deploy-only source: the env var, else the provider, else the tier file', () => {
        expect(deploySource(APP_CHAT, key('/openai/api_key', APP_CHAT))).toEqual({ kind: 'env', name: 'OPENAI_API_KEY' });
        expect(deploySource(BEAM_UX, key('/legacy_blocks')).kind).toBe('provider');
        expect(deploySource(BEAM_UX, key('/site/artifact_root'))).toEqual({ kind: 'file', name: 'config/beam/ux.php' });
        expect(deploySource(BEAM_UX, key('/theme'))).toEqual({ kind: 'file', name: 'vendor/splicewire/laravel-beam-ux/config/beam/ux.php' });
    });

    it('group sections by family and narrow only a real section row', () => {
        expect(family('beam.ux')).toBe('beam');
        expect(asConfigSection(BEAM_UX)).toBe(BEAM_UX);
        expect(asConfigSection({ id: 'x' })).toBeNull();
        expect(asConfigSection(null)).toBeNull();
    });
});

// config-sections 17: a tier the package closed the key to is shown as closed, in its place on the ladder, not as "not set".
describe('a closed tier', () => {
    const mode = key('/mode');
    const closed = { ...mode, closed: ['operator' as const], overridable: false };

    it('takes its place in the stack, between the workspace and the tiers below the operator', () => {
        const withTenant = { ...closed, tier: 'tenant' as const, layers: [...mode.layers, { tier: 'tenant' as const, value: 'lenient', source: null, shadowed: false, removed: false }] };
        expect(provenance(withTenant).map((r) => (r.kind === 'closed' ? [r.tier, 'closed'] : [r.layer.tier, r.standing]))).toEqual([
            ['tenant', 'wins'],
            ['operator', 'closed'],
            ['package', 'loses'],
        ]);
    });

    it('sits on top when no higher layer holds a value, and an open key has no closed row', () => {
        expect(provenance(closed).map((r) => r.kind)).toEqual(['closed', 'layer']);
        expect(provenance(mode).some((r) => r.kind === 'closed')).toBe(false);
    });

    it('is not drawn above the ceiling, where the header already says the key is out of reach', () => {
        expect(provenance({ ...closed, closed: ['tenant'], ceiling: 'operator' }).some((r) => r.kind === 'closed')).toBe(false);
    });

    it('names the realm whose tier it closes', () => {
        expect(closedToRealm(closed, 'operator')).toBe(true);
        expect(closedToRealm(closed, 'tenant')).toBe(false);
        expect(closedToRealm(mode, 'operator')).toBe(false);
    });
});

// config-sections 21: a list is one key, saved whole.
describe('a list key', () => {
    it('is a key whose schema node is an array, nullable or not', () => {
        expect(isListKey(BEAM_UX.schema, '/site/reserved_prefixes')).toBe(true);
        expect(isListKey({ type: 'object', properties: { relays: { type: ['array', 'null'] } } }, '/relays')).toBe(true);
        expect(isListKey(BEAM_UX.schema, '/cache_ttl')).toBe(false);
        expect(isListKey(BEAM_UX.schema, '/site')).toBe(false);
    });
});
