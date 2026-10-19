import { styleRegistry } from './blockdoc/style-runtime.js';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SchemaNode } from '@schemastud/seam';
import { useEntryBody } from './hooks';
import { useUxBuilderServices } from './provider';
import { RegionInspector } from './RegionInspector';
import type { Region } from './types';
import { ReleasePanel, type ReleaseRecord } from './releases';

/**
 * The THEME ENTRY's editor seat — the one surface that lets an author change a theme token through a
 * UI instead of hand-editing a seeder and reseeding (G2-BEAM-THEME-NAV).
 *
 * ## It is Frame's form on the entry, not a bespoke theme UI — deliberately
 *
 * `theme-entries-and-authoring`'s PRD closed Part A §5 with exactly this ruling: the theme editor is
 * "Frame's edit form on the `ParticleResource`, not a bespoke UI". So this component invents no
 * widget, no color picker, no token taxonomy. It is the same three moving parts every other region
 * editor in this package already is, wired to one entry id:
 *
 *   {@link useEntryBody} → {@link RegionInspector} (`kind: 'form'` ⇒ the REAL `@schemastud/seam`
 *   SchemaForm over `{schema, body}`) → the entry's versioned draft operation.
 *
 * The schema is the SERVER's: `Splicewire\Beam\Ux\Particle\EntryBodyEnvelope::schemaFor()` answers a
 * `UxType::Theme` entry with `ThemeSchemas`' `{canvas, site}` JSON Schema, so the fields an author
 * sees are generated from the same declaration `ThemeResolver::defaults()` reads its defaults from.
 * Adding a token in PHP adds a field here with no change to this file — which is the whole point of
 * routing a theme through the entry-body transport rather than a bespoke endpoint.
 *
 * ## The un-schema'd namespaces must round-trip — and today something else already ensures that
 *
 * A theme BODY carries three namespaces (`{canvas, shell, site}`); the schema the server hands the
 * form carries TWO — `shell` is omitted on purpose (`schemaFor()`'s docblock: no consuming host has an
 * `/os` chrome to theme, so it would be dead form fields). Writing back a body with no `shell` key
 * would reset every OS-shell token to its package default on the first theme save, silently, since
 * nothing on the screen ever showed that namespace.
 *
 * The edit buffer is therefore the form's output MERGED OVER the loaded body rather than a
 * replacement for it — the same "edit one key, spread the rest through untouched" discipline
 * {@link RegionEditorBody}'s `RichtextEditor` applies to MDX frontmatter.
 *
 * ⚠️ **Measured 2026-09-12: that merge is a belt, not the braces.** `@rjsf`'s `omitExtraData` defaults
 * to `false`, so the SchemaForm's `formData` ALREADY carries `shell` straight through untouched, and
 * `ThemeEditor.test.tsx`'s round-trip case passes against a version of this file that writes
 * `setDraft(next)` with no merge at all (verified by running it that way). Its value is what it pins —
 * the OUTCOME, that a theme save preserves what the form never rendered — which would start failing
 * the day `FormEditor` gained `omitExtraData: true` or the buffer stopped being seeded from the loaded
 * body. What the merge buys is that this component owes that outcome to its own code rather than to a
 * third-party default; it does not buy a case that distinguishes the two today, and no comment here
 * should claim otherwise.
 *
 * ## Host responsibilities
 *
 * The host supplies the entry id (only the server knows the per-database uuid of the
 * `namespace=theme, slug=default` row), mounts this inside its `<UxBuilderProvider>` + a
 * `QueryClientProvider`, and gates the route — the `save-body` operation declares
 * `ability: 'ux.author'` and refuses a guest or a member on its own, but a screen nobody may write
 * through should not be a door either.
 */
export function ThemeEditor({
    entryId,
    label = 'Theme tokens',
    note = 'Save creates a theme draft. Publish releases the saved version, or submits it for review when required.',
}: {
    /** The `namespace=theme, slug=default` entry's id, resolved server-side and shared as a prop. */
    entryId: string;
    label?: string;
    note?: string;
}) {
    const [breakpoint, setBreakpoint] = useState('');
    const { client } = useUxBuilderServices();
    const cache = useQueryClient();
    const query = useEntryBody(entryId);
    const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
    const [releaseId, setReleaseId] = useState('');
    const [publication, setPublication] = useState<ReleaseRecord | null>(null);
    const versionKey = ['theme-versions', entryId];
    const versions = useQuery({queryKey: versionKey, queryFn: () => client.listVersions!(entryId), enabled: !!client.listVersions});
    const releases = useQuery({queryKey:['theme-releases',entryId],queryFn: () => client.listReleases!(),enabled:!!client.listReleases});
    const save = useMutation({
        mutationFn: async (body: Record<string, unknown>) => {
            const base = versions.data?.headVersion;
            if (!client.saveDraft || !base) throw new Error('A saved base version and draft transport are required to edit this theme.');
            return client.saveDraft(entryId, body, base);
        },
        onSuccess: async (state, savedBody) => {
            cache.setQueryData(versionKey, state);
            await query.refetch();
            setDraft(current => current === savedBody ? null : current);
        },
    });
    const join = useMutation({mutationFn: async () => {
        const ref = versions.data?.headVersion;
        if (!client.releaseCommand || !releaseId || !ref) throw new Error('Choose a Release and a saved theme version.');
        return client.releaseCommand(releaseId, {action:'member',entryId,ref});
    }});

    const publish = useMutation({mutationFn: async () => {
        if (!client.createRelease || !client.releaseCommand) throw new Error('Release publication is unavailable.');
        const state = draft === null ? versions.data : await save.mutateAsync(draft);
        if (!state?.headVersion) throw new Error('Save a theme version before publishing.');
        if (state.compileError) throw new Error(state.compileError);
        let release = await client.createRelease(entryId, `Publish: ${label}`);
        setPublication(release);
        try {
            release = await client.releaseCommand(release.id, {action:'member',entryId,ref:state.headVersion});
            setPublication(release);
            release = await client.releaseCommand(release.id, {action:release.reviewRequired ? 'submit' : 'publish'});
            setPublication(release);
        } catch (error) {
            throw new Error(`Release "${release.title}" (${release.id}): ${error instanceof Error ? error.message : 'Publication failed.'}`);
        }
        await Promise.all([versions.refetch(), query.refetch(), ...(client.listReleases ? [releases.refetch()] : [])]);
        return release;
    }});

    if (query.isPending) {
        return (
            <p role="status" className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                Loading the theme…
            </p>
        );
    }

    if (query.isError || !query.data) {
        return (
            <p role="alert" className="rounded-lg border bg-card p-4 text-sm text-destructive">
                The theme entry could not be loaded.
            </p>
        );
    }

    const loaded = query.data.body ?? {};
    const body = draft ?? loaded;
    const responsive = (body.responsive ?? {}) as {breakpoints?: Record<string,string>; tokens?: Record<string,Record<string,unknown>>};
    const layers = responsive.tokens ?? {};
    const visibleBody = breakpoint ? (layers[breakpoint] ?? {}) : body;
    const changeLayer = (next: Record<string, unknown>) => setDraft(breakpoint
        ? { ...body, responsive: { ...responsive, tokens: { ...layers, [breakpoint]: next } } }
        : { ...body, ...next });
    const region: Region = {
        id: 'theme',
        label,
        kind: 'form',
        recordId: entryId,
        recordLabel: query.data.slug,
        note,
    };

    return (
        <>
        <label>Token breakpoint <select value={breakpoint} onChange={e => setBreakpoint(e.target.value)}><option value="">Base</option>{Object.keys(styleRegistry({responsive}).breakpoints).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <RegionInspector
            region={region}
            schema={(query.data.schema ?? null) as SchemaNode | null}
            body={visibleBody}
            // MERGED over the loaded body — see this component's docblock. `next` is the schema-shaped
            // form output; every top-level namespace the schema does not describe survives it.
            onChange={changeLayer}
            onSave={() => save.mutate(body)}
            // Dropping the buffer IS Discard: the next render falls back to `query.data.body`, the
            // last thing the server actually stored.
            onDiscard={draft === null ? undefined : () => setDraft(null)}
            saving={save.isPending || publish.isPending}
        />
        {save.isError && <p role="alert">{save.error.message}</p>}
        {save.isSuccess && !publication && <p role="status">Theme draft saved. Readers still receive the published theme.</p>}
        {client.createRelease && client.releaseCommand && <button type="button"
            disabled={save.isPending || publish.isPending || !versions.data?.headVersion}
            onClick={() => publish.mutate()}>Publish</button>}
        {publish.isError && <p role="alert">{publish.error.message}</p>}
        {publish.isSuccess && <p role="status">{publication?.status === 'published' ? 'Theme published.' : 'Theme Release submitted for review.'}</p>}
        {publication && client.releaseCommand && <ReleasePanel release={publication}
            entries={[{id:entryId,title:label,versions:versions.data?.versions.map(version=>({id:version.id,label:version.readable})) ?? []}]}
            onCommand={async command => {
                const next = await client.releaseCommand!(publication.id, command);
                setPublication(next);
                await Promise.all([versions.refetch(), query.refetch()]);
            }} />}
        {client.listReleases && client.releaseCommand && <div>
            <label>Release <select value={releaseId} onChange={event => setReleaseId(event.target.value)}>
                <option value="">Choose a Release</option>
                {releases.data?.map(release => <option key={release.id} value={release.id}>{release.title}</option>)}
            </select></label>
            <button disabled={join.isPending || !releaseId || !versions.data?.headVersion}
                onClick={() => join.mutate()}>Add saved theme to Release</button>
            {join.isError && <p role="alert">{join.error.message}</p>}
            {join.isSuccess && <p role="status">Saved theme version added to the Release.</p>}
        </div>}
        </>
    );
}
