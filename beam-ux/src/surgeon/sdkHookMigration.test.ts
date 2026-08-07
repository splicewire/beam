import { describe, expect, it } from 'vitest';
import {
    buildHookIndex,
    buildReverseRouteIndex,
    extractRouteDefaultsFromSource,
    findImportSite,
    findQueryWrappers,
    importSpecifierFor,
    pathSegmentsFromNode,
    resolveRouteNameFromSegments,
    scan,
    type RouteDefaults,
} from './sdkHookMigration.js';
import * as recast from 'recast';
import * as babelTsParser from 'recast/parsers/babel-ts.js';
import type { Expression, File } from '@babel/types';

// The real schema-registry migration (client-sdk-codegen #05) — the reference shape every other
// candidate is checked against.
const GENERATED_HOOK = `// AUTO-GENERATED — DO NOT EDIT BY HAND.
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { route } from '@/lib/routes';

export function useSchemaRegistryIndex(options) {
    return useQuery({
        queryKey: ['schema_registry.index'],
        queryFn: async () => {
            const res = await api.get(route('schema_registry.index'));
            return res.data.data;
        },
        ...options,
    });
}
`;

const HANDWRITTEN_API = `import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { route } from '@/lib/routes';

export function useSchemaRegistryIndex() {
    return useQuery({
        queryKey: ['schema_registry.index'],
        queryFn: async () => {
            const res = await api.get(route('schema_registry.index'));
            return res.data.data;
        },
    });
}
`;

const CONSUMER_PAGE = `import { useSchemaRegistryIndex } from './api';

export function SchemaRegistryPage({ canManage }) {
    const stemsQuery = useSchemaRegistryIndex({ enabled: canManage });
    return stemsQuery.data;
}
`;

describe('findQueryWrappers', () => {
    it('extracts a safe GET wrapper', () => {
        const [w] = findQueryWrappers(HANDWRITTEN_API);
        expect(w.functionName).toBe('useSchemaRegistryIndex');
        expect(w.routeName).toBe('schema_registry.index');
        expect(w.httpVerb).toBe('get');
        expect(w.safe).toBe(true);
    });

    it('flags a non-GET wrapper as unsafe', () => {
        const source = `export function useDeleteThing() {
            return useQuery({
                queryKey: ['thing.delete'],
                queryFn: async () => (await api.delete(route('thing.delete'))).data.data,
            });
        }`;
        const [w] = findQueryWrappers(source);
        expect(w.safe).toBe(false);
        expect(w.unsafeReason).toMatch(/not a GET/);
    });

    it('flags a wrapper with extra request config as unsafe (possible query-string filtering)', () => {
        const source = `export function useFilteredThings() {
            return useQuery({
                queryKey: ['thing.index', filters],
                queryFn: async () => (await api.get(route('thing.index'), { params: filters })).data.data,
            });
        }`;
        const [w] = findQueryWrappers(source);
        expect(w.safe).toBe(false);
        expect(w.unsafeReason).toMatch(/extra request config/);
    });

    it('ignores functions that are not plain useQuery wrappers', () => {
        const source = `export function useThing() {
            const [state, setState] = useState(null);
            return state;
        }`;
        expect(findQueryWrappers(source)).toEqual([]);
    });
});

describe('buildHookIndex', () => {
    it('indexes generated hooks by (functionName, routeName)', () => {
        const index = buildHookIndex({ '/ui/src/generated/hooks/schema_registry.ts': GENERATED_HOOK });
        expect(index).toEqual([
            { functionName: 'useSchemaRegistryIndex', routeName: 'schema_registry.index', hookModule: 'schema_registry' },
        ]);
    });
});

describe('importSpecifierFor', () => {
    it('computes a same-directory relative specifier', () => {
        expect(importSpecifierFor('/ui/src/features/schema-registry/SchemaRegistryPage.tsx', '/ui/src/features/schema-registry/api.ts')).toBe(
            './api',
        );
    });

    it('computes a cross-directory relative specifier', () => {
        expect(importSpecifierFor('/ui/src/app/shell/Nav.tsx', '/ui/src/features/schema-registry/api.ts')).toBe(
            '../../features/schema-registry/api',
        );
    });
});

describe('findImportSite', () => {
    it('locates a single-name import from a matching module', () => {
        const site = findImportSite(CONSUMER_PAGE, 'useSchemaRegistryIndex', ['./api']);
        expect(site).not.toBeNull();
        expect(site!.onlyThisName).toBe(true);
        expect(CONSUMER_PAGE.slice(site!.start, site!.end)).toBe("import { useSchemaRegistryIndex } from './api';");
    });

    it('reports a bundled import as not-only-this-name', () => {
        const source = `import { useSchemaRegistryIndex, useOtherThing } from './api';`;
        const site = findImportSite(source, 'useSchemaRegistryIndex', ['./api']);
        expect(site!.onlyThisName).toBe(false);
        expect(site!.specifiers).toEqual(['useSchemaRegistryIndex', 'useOtherThing']);
    });

    it('returns null when the module does not match', () => {
        expect(findImportSite(CONSUMER_PAGE, 'useSchemaRegistryIndex', ['./other'])).toBeNull();
    });
});

describe('scan', () => {
    const hookFiles = { '/ui/src/generated/hooks/schema_registry.ts': GENERATED_HOOK };
    const apiFiles = { '/ui/src/features/schema-registry/api.ts': HANDWRITTEN_API };

    it('produces a migration candidate with the wrapper deletion + import repoint edits', () => {
        const importerSearchFiles = {
            ...apiFiles,
            '/ui/src/features/schema-registry/SchemaRegistryPage.tsx': CONSUMER_PAGE,
        };

        const report = scan(hookFiles, apiFiles, importerSearchFiles);

        expect(report.exceptions).toEqual([]);
        expect(report.candidates).toHaveLength(1);
        const [candidate] = report.candidates;
        expect(candidate.functionName).toBe('useSchemaRegistryIndex');
        expect(candidate.hookModule).toBe('schema_registry');
        expect(candidate.edits).toHaveLength(2);

        const wrapperEdit = candidate.edits.find((e) => e.file === '/ui/src/features/schema-registry/api.ts')!;
        expect(wrapperEdit.new).toBe('');
        expect(HANDWRITTEN_API.includes(wrapperEdit.old)).toBe(true);

        const importEdit = candidate.edits.find((e) => e.file.endsWith('SchemaRegistryPage.tsx'))!;
        expect(importEdit.old).toBe("import { useSchemaRegistryIndex } from './api';");
        expect(importEdit.new).toBe("import { useSchemaRegistryIndex } from '@/generated/hooks/schema_registry';");
    });

    it('emits an exception, not a candidate, when a consumer bundles the import with other names', () => {
        const bundled = `import { useSchemaRegistryIndex, useOtherThing } from './api';\nexport function Page() { return useSchemaRegistryIndex(); }`;
        const importerSearchFiles = {
            ...apiFiles,
            '/ui/src/features/schema-registry/SchemaRegistryPage.tsx': bundled,
        };

        const report = scan(hookFiles, apiFiles, importerSearchFiles);

        expect(report.candidates).toEqual([]);
        expect(report.exceptions).toHaveLength(1);
        expect(report.exceptions[0].reason).toMatch(/bundled with other names/);
    });

    it('skips a wrapper with no matching generated hook', () => {
        const noHookApi = { '/ui/src/features/knowledge/api.ts': `export function useFragments() {
            return useQuery({
                queryKey: ['knowledge.fragment.index', filters],
                queryFn: async () => (await api.get(route('knowledge.fragment.index'), { params: filters })).data.data,
            });
        }` };

        const report = scan({}, noHookApi, noHookApi);

        expect(report.candidates).toEqual([]);
        expect(report.exceptions).toEqual([]);
    });

    it('is a no-op (empty candidates/exceptions) when there is nothing to migrate', () => {
        expect(scan({}, {}, {})).toEqual({ candidates: [], exceptions: [] });
    });
});

// v2 — call sites that hand-write a plain string/template-literal path instead of `route('name')`.
// `ROUTE_DEFAULTS` mirrors the shape of `ui/src/generated/routes.ts`'s `defaults` export.
function parseExpr(code: string): Expression {
    const ast = recast.parse(`const __x = ${code};`, { parser: babelTsParser }) as File;
    const decl = ast.program.body[0];
    if (decl.type !== 'VariableDeclaration') throw new Error('expected a variable declaration');
    const init = decl.declarations[0].init;
    if (!init) throw new Error('expected an initializer');
    return init as Expression;
}

describe('pathSegmentsFromNode', () => {
    it('splits a plain string literal on /', () => {
        expect(pathSegmentsFromNode(parseExpr(`'widgets/detail'`))).toEqual(['widgets', 'detail']);
    });

    it('marks a pure single-segment interpolation as a wildcard segment', () => {
        const segments = pathSegmentsFromNode(parseExpr('`widgets/${id}`'));
        expect(segments).toHaveLength(2);
        expect(segments![0]).toBe('widgets');
        expect(segments![1]).not.toBe('id');
    });

    it('handles multiple interpolations across segments', () => {
        const segments = pathSegmentsFromNode(parseExpr('`widgets/${widgetId}/parts/${partId}`'));
        expect(segments).toHaveLength(4);
        expect(segments![0]).toBe('widgets');
        expect(segments![2]).toBe('parts');
    });

    it('returns null for a node that is neither a string nor a template literal', () => {
        expect(pathSegmentsFromNode(parseExpr('someVariable'))).toBeNull();
    });
});

describe('buildReverseRouteIndex + resolveRouteNameFromSegments', () => {
    const ROUTE_DEFAULTS: RouteDefaults = {
        'widget.index': 'widgets',
        'widget.show': 'widgets/{widget}',
        'widget.parts.show': 'widgets/{widget}/parts/{part}',
        'widget.destroy': { path: 'widgets/{widget}', methods: ['DELETE'] },
    };

    it('resolves a plain string literal to its route name', () => {
        const index = buildReverseRouteIndex(ROUTE_DEFAULTS);
        const name = resolveRouteNameFromSegments(pathSegmentsFromNode(parseExpr(`'widgets'`))!, 'get', index);
        expect(name).toBe('widget.index');
    });

    it('resolves a single-interpolation template literal to its route name', () => {
        const index = buildReverseRouteIndex(ROUTE_DEFAULTS);
        const name = resolveRouteNameFromSegments(pathSegmentsFromNode(parseExpr('`widgets/${id}`'))!, 'get', index);
        expect(name).toBe('widget.show');
    });

    it('resolves a multi-interpolation template literal to its route name', () => {
        const index = buildReverseRouteIndex(ROUTE_DEFAULTS);
        const name = resolveRouteNameFromSegments(
            pathSegmentsFromNode(parseExpr('`widgets/${widgetId}/parts/${partId}`'))!,
            'get',
            index,
        );
        expect(name).toBe('widget.parts.show');
    });

    it('disambiguates two routes sharing a path by HTTP verb when both declare methods', () => {
        const index = buildReverseRouteIndex({
            ...ROUTE_DEFAULTS,
            'widget.show': { path: 'widgets/{widget}', methods: ['GET'] },
        });
        // Both entries share the exact path 'widgets/{widget}'; only one's declared method fits a
        // DELETE call, so it resolves cleanly rather than being rejected as ambiguous.
        const name = resolveRouteNameFromSegments(pathSegmentsFromNode(parseExpr('`widgets/${id}`'))!, 'delete', index);
        expect(name).toBe('widget.destroy');
    });

    it('stays ambiguous (does not guess) when a path-sharing route has no declared method to rule it out', () => {
        const index = buildReverseRouteIndex(ROUTE_DEFAULTS);
        // widget.show here has NO methods declared, so it can't be ruled out for a DELETE call even
        // though widget.destroy also matches — safer to report no match than to guess.
        const name = resolveRouteNameFromSegments(pathSegmentsFromNode(parseExpr('`widgets/${id}`'))!, 'delete', index);
        expect(name).toBeNull();
    });

    it('does not match and does not crash on a path with no corresponding route', () => {
        const index = buildReverseRouteIndex(ROUTE_DEFAULTS);
        expect(resolveRouteNameFromSegments(pathSegmentsFromNode(parseExpr(`'unknown/path'`))!, 'get', index)).toBeNull();
    });

    it('does not guess on a segment count mismatch', () => {
        const index = buildReverseRouteIndex(ROUTE_DEFAULTS);
        expect(resolveRouteNameFromSegments(pathSegmentsFromNode(parseExpr(`'widgets/extra/segment'`))!, 'get', index)).toBeNull();
    });
});

describe('findQueryWrappers — plain-string/template-literal path call sites', () => {
    const ROUTE_DEFAULTS: RouteDefaults = {
        'widget.index': 'widgets',
        'widget.show': 'widgets/{widget}',
    };

    it('recognizes a wrapper using a plain string-literal path (no route() call)', () => {
        const source = `export function useWidgets() {
            return useQuery({
                queryKey: ['widgets'],
                queryFn: async () => (await api.get('widgets')).data.data,
            });
        }`;
        const [w] = findQueryWrappers(source, buildReverseRouteIndex(ROUTE_DEFAULTS));
        expect(w.routeName).toBe('widget.index');
        expect(w.safe).toBe(true);
    });

    it('recognizes a wrapper using a template-literal path and flags it unsafe if it also passes params', () => {
        // Mirrors ui/src/features/knowledge/api.ts's useFragments shape: a plain string path plus an
        // extra `{ params }` object — the exact case that motivated v2.
        const source = `export function useFragments(params) {
            const query = params;
            return useQuery({
                queryKey: ['widgets', query ?? {}],
                queryFn: async () => (await api.get('widgets', { params: query })).data.data,
            });
        }`;
        const [w] = findQueryWrappers(source, buildReverseRouteIndex(ROUTE_DEFAULTS));
        expect(w.routeName).toBe('widget.index');
        expect(w.safe).toBe(false);
        expect(w.unsafeReason).toMatch(/query-string filtering/);
    });

    it('recognizes a clean template-literal detail-GET as a safe candidate', () => {
        // Mirrors ui/src/features/knowledge/api.ts's useFragment(id) shape: `` api.get(`fragments/${id}`) ``
        // with no extra params — a genuinely safe, mechanical migration once a hook covers it.
        const source = `export function useWidget(id) {
            return useQuery({
                queryKey: ['widgets', 'detail', id],
                queryFn: async () => (await api.get(\`widgets/\${id}\`)).data.data,
            });
        }`;
        const [w] = findQueryWrappers(source, buildReverseRouteIndex(ROUTE_DEFAULTS));
        expect(w.routeName).toBe('widget.show');
        expect(w.safe).toBe(true);
    });

    it('does not surface a wrapper at all when its literal path matches no known route (no crash)', () => {
        const source = `export function useMystery() {
            return useQuery({
                queryKey: ['mystery'],
                queryFn: async () => (await api.get('totally/unknown/path')).data.data,
            });
        }`;
        expect(findQueryWrappers(source, buildReverseRouteIndex(ROUTE_DEFAULTS))).toEqual([]);
    });

    it('still falls back to the v1 route() shape when no reverseIndex is supplied', () => {
        const source = `export function useSchemaRegistryIndex() {
            return useQuery({
                queryKey: ['schema_registry.index'],
                queryFn: async () => (await api.get(route('schema_registry.index'))).data.data,
            });
        }`;
        const [w] = findQueryWrappers(source);
        expect(w.routeName).toBe('schema_registry.index');
    });
});

describe('extractRouteDefaultsFromSource', () => {
    it('extracts a `defaults` export mixing bare-string and { path, methods } entries', () => {
        const source = `// AUTO-GENERATED — DO NOT EDIT BY HAND.
import type { RouteMap } from '@/lib/routes';

export const defaults: RouteMap = {
    'widget.index': 'widgets',
    'widget.show': { path: 'widgets/{widget}', methods: ['GET'] },
    'widget.destroy': { path: 'widgets/{widget}', methods: ['DELETE'] },
};

export const adminDefaults: RouteMap = {
    'admin.widgets.index': 'admin/widgets',
};
`;
        expect(extractRouteDefaultsFromSource(source)).toEqual({
            'widget.index': 'widgets',
            'widget.show': { path: 'widgets/{widget}', methods: ['GET'] },
            'widget.destroy': { path: 'widgets/{widget}', methods: ['DELETE'] },
        });
    });

    it('extracts a differently-named export via exportName', () => {
        const source = `export const adminDefaults: RouteMap = { 'admin.widgets.index': 'admin/widgets' };`;
        expect(extractRouteDefaultsFromSource(source, 'adminDefaults')).toEqual({ 'admin.widgets.index': 'admin/widgets' });
    });

    it('returns an empty object when the export is not found (does not crash)', () => {
        expect(extractRouteDefaultsFromSource('export const somethingElse = {};')).toEqual({});
    });
});

describe('scan — end-to-end with a plain-string-path call site and matching generated hook', () => {
    const ROUTE_DEFAULTS: RouteDefaults = { 'widget.index': 'widgets' };

    const HOOK = `export function useWidgets(options) {
        return useQuery({
            queryKey: ['widgets'],
            queryFn: async () => (await api.get(route('widget.index'))).data.data,
            ...options,
        });
    }`;

    const API = `export function useWidgets() {
        return useQuery({
            queryKey: ['widgets'],
            queryFn: async () => (await api.get('widgets')).data.data,
        });
    }`;

    const CONSUMER = `import { useWidgets } from './api';
    export function Page() { return useWidgets(); }`;

    it('produces a migration candidate even though the hand-written call site never used route()', () => {
        const report = scan(
            { '/ui/src/generated/hooks/widget.ts': HOOK },
            { '/ui/src/features/widgets/api.ts': API },
            { '/ui/src/features/widgets/api.ts': API, '/ui/src/features/widgets/Page.tsx': CONSUMER },
            ROUTE_DEFAULTS,
        );

        expect(report.exceptions).toEqual([]);
        expect(report.candidates).toHaveLength(1);
        expect(report.candidates[0].functionName).toBe('useWidgets');
        expect(report.candidates[0].hookModule).toBe('widget');
    });
});
