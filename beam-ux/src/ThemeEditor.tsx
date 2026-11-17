import { styleRegistry } from "./blockdoc/style-runtime.js";
import { useState } from "react";
import { Button } from "@schemastud/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SchemaNode } from "@schemastud/seam";
import { useEntryBody } from "./hooks";
import { useUxBuilderServices } from "./provider";
import { RegionInspector } from "./RegionInspector";
import type { Region } from "./types";
import { ReleasePanel, type ReleaseRecord } from "./releases";
import { VersionRecordingReferences } from "./recording";
import { useBeamUxMessages } from "./messages.js";
import { NoticeError, notice as line, noticeOf, say } from "./message-descriptor.js";

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
  label: labelOverride,
  note: noteOverride,
}: {
  /** The `namespace=theme, slug=default` entry's id, resolved server-side and shared as a prop. */
  entryId: string;
  label?: string;
  note?: string;
}) {
  const m = useBeamUxMessages();
  const label = labelOverride ?? m.t('splicewire-beam-ux::messages.theme_tokens');
  const note = noteOverride ?? m.t('splicewire-beam-ux::messages.theme_note');
  const [breakpoint, setBreakpoint] = useState("");
  const [releaseId, setReleaseId] = useState("");
  const { client } = useUxBuilderServices();
  const cache = useQueryClient();
  const query = useEntryBody(entryId);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [publication, setPublication] = useState<ReleaseRecord | null>(null);
  const versionKey = ["theme-versions", entryId];
  const versions = useQuery({
    queryKey: versionKey,
    queryFn: () => client.listVersions!(entryId),
    enabled: !!client.listVersions,
  });
  const releases = useQuery({
    queryKey: ["theme-releases", entryId],
    queryFn: () => client.listReleases!(),
    enabled: !!client.listReleases,
  });
  const activeRelease =
    publication ??
    releases.data
      ?.slice()
      .sort((a, b) => b.id.localeCompare(a.id))
      .find((release) =>
        release.members.some((member) => member.entryId === entryId),
      ) ??
    null;
  const save = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const state = versions.data;
      if (!client.saveDraft || !versions.isSuccess || !state)
        throw new NoticeError(line('splicewire-beam-ux::messages.theme_requires_transport'));
      return client.saveDraft(entryId, body, state.headVersion);
    },
    onSuccess: async (state, savedBody) => {
      cache.setQueryData(versionKey, state);
      await query.refetch();
      setDraft((current) => (current === savedBody ? null : current));
    },
  });
  const join = useMutation({
    mutationFn: async () => {
      const ref = versions.data?.headVersion;
      if (!client.releaseCommand || !releaseId || !ref)
        throw new NoticeError(line('splicewire-beam-ux::messages.theme_choose_release_version'));
      return client.releaseCommand(releaseId, {
        action: "member",
        entryId,
        ref,
      });
    },
  });
  const publish = useMutation({
    mutationFn: async () => {
      if (!client.publish)
        throw new NoticeError(line('splicewire-beam-ux::messages.theme_publication_unavailable'));
      const state =
        draft === null ? versions.data : await save.mutateAsync(draft);
      if (!state?.headVersion)
        throw new NoticeError(line('splicewire-beam-ux::messages.theme_save_before_publish'));
      if (state.compileError) throw new Error(state.compileError);
      const result = await client.publish(entryId, state.headVersion);
      const release = result.release;
      if (!release) throw new NoticeError(line('splicewire-beam-ux::messages.theme_no_release_returned'));
      setPublication(release);
      await Promise.all([
        versions.refetch(),
        query.refetch(),
        ...(client.listReleases ? [releases.refetch()] : []),
      ]);
      return release;
    },
  });

  if (query.isPending) {
    return (
      <p
        role="status"
        className="rounded-lg border bg-card p-4 text-sm text-muted-foreground"
      >
        {m.t('splicewire-beam-ux::messages.theme_loading')}
      </p>
    );
  }

  if (query.isError || !query.data) {
    return (
      <p
        role="alert"
        className="rounded-lg border bg-card p-4 text-sm text-destructive"
      >
        {m.t('splicewire-beam-ux::messages.theme_load_failed')}
      </p>
    );
  }

  const loaded = query.data.body ?? {};
  const body = draft ?? loaded;
  const responsive = (body.responsive ?? {}) as {
    breakpoints?: Record<string, string>;
    tokens?: Record<string, Record<string, unknown>>;
  };
  const layers = responsive.tokens ?? {};
  const visibleBody = breakpoint ? (layers[breakpoint] ?? {}) : body;
  const changeLayer = (next: Record<string, unknown>) =>
    setDraft(
      breakpoint
        ? {
            ...body,
            responsive: {
              ...responsive,
              tokens: { ...layers, [breakpoint]: next },
            },
          }
        : { ...body, ...next },
    );
  const region: Region = {
    id: "theme",
    label,
    kind: "form",
    recordId: entryId,
    recordLabel: query.data.slug,
    note,
  };

  return (
    <>
      <label>
        {m.t('splicewire-beam-ux::messages.theme_token_breakpoint')}{" "}
        <select
          value={breakpoint}
          onChange={(e) => setBreakpoint(e.target.value)}
        >
          <option value="">{m.t('splicewire-beam-ux::messages.theme_base')}</option>
          {Object.keys(styleRegistry({ responsive }).breakpoints).map(
            (name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ),
          )}
        </select>
      </label>
      <RegionInspector
        region={region}
        schema={(query.data.schema ?? null) as SchemaNode | null}
        body={visibleBody}
        // MERGED over the loaded body — see this component's docblock. `next` is the schema-shaped
        // form output; every top-level namespace the schema does not describe survives it.
        onChange={(next) => {
          if (!Array.isArray(next)) changeLayer(next);
        }}
        onSave={() => save.mutate(body)}
        // Dropping the buffer IS Discard: the next render falls back to `query.data.body`, the
        // last thing the server actually stored.
        onDiscard={draft === null ? undefined : () => setDraft(null)}
        saving={save.isPending || publish.isPending}
        saveDisabled={!versions.isSuccess || !versions.data}
        saveLabel={m.t('splicewire-beam-ux::messages.theme_save_draft')}
      />
      {save.isError && <p role="alert">{say(m, noticeOf(save.error, save.error.message))}</p>}
      {versions.isError && (
        <p role="alert">
          {m.t('splicewire-beam-ux::messages.theme_history_load_failed')}{" "}
          <button type="button" onClick={() => void versions.refetch()}>
            {m.t('splicewire-beam-ux::messages.theme_retry_history')}
          </button>
        </p>
      )}
      {save.isSuccess && (
        <p role="status">
          {m.t('splicewire-beam-ux::messages.theme_draft_saved')}
        </p>
      )}
      {client.publish && (
        <Button
          className="mt-4"
          type="button"
          disabled={
            save.isPending || publish.isPending || !versions.data?.headVersion
          }
          onClick={() => publish.mutate()}
        >
          {m.t('splicewire-beam-ux::messages.theme_publish')}
        </Button>
      )}
      {publish.isError && <p role="alert">{say(m, noticeOf(publish.error, publish.error.message))}</p>}
      {publish.isSuccess && (
        <p role="status">
          {publication?.status === "published"
            ? m.t('splicewire-beam-ux::messages.theme_published')
            : m.t('splicewire-beam-ux::messages.theme_submitted_for_review')}
        </p>
      )}
      {versions.data && (
        <section
          aria-label={m.t('splicewire-beam-ux::messages.theme_history_label')}
          className="mt-4 space-y-2 rounded-lg border bg-card p-4 text-sm"
        >
          <h2 className="font-semibold">{m.t('splicewire-beam-ux::messages.theme_history')}</h2>
          <p>{m.t('splicewire-beam-ux::messages.theme_published_version', { version: versions.data.publishedReadable ?? m.t('splicewire-beam-ux::messages.theme_none') })}</p>
          <ul>
            {versions.data.versions.map((version) => (
              <li key={version.id}>
                {version.readable}
                {version.id === versions.data?.headVersion ? ` ${m.t('splicewire-beam-ux::messages.theme_head_marker')}` : ""}
                {version.id === versions.data?.publishedVersion
                  ? ` ${m.t('splicewire-beam-ux::messages.theme_published_marker')}`
                  : ""}
                <VersionRecordingReferences recordings={version.recordings} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {activeRelease && client.releaseCommand && (
        <ReleasePanel
          release={activeRelease}
          entries={[
            {
              id: entryId,
              title: label,
              versions:
                versions.data?.versions.map((version) => ({
                  id: version.id,
                  label: version.readable,
                })) ?? [],
            },
          ]}
          onCommand={async (command) => {
            const next = await client.releaseCommand!(
              activeRelease.id,
              command,
            );
            setPublication(next);
            await Promise.all([versions.refetch(), query.refetch()]);
          }}
        />
      )}
      {client.listReleases && client.releaseCommand && (
        <div>
          <label>
            {m.t('splicewire-beam-ux::messages.theme_release')}{" "}
            <select
              value={releaseId}
              onChange={(event) => setReleaseId(event.target.value)}
            >
              <option value="">{m.t('splicewire-beam-ux::messages.theme_choose_release')}</option>
              {releases.data
                ?.filter((release) => release.status !== "published")
                .map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
            </select>
          </label>
          <Button
            disabled={
              join.isPending || !releaseId || !versions.data?.headVersion
            }
            onClick={() => join.mutate()}
          >
            {m.t('splicewire-beam-ux::messages.theme_add_to_release')}
          </Button>
          {join.isError && <p role="alert">{say(m, noticeOf(join.error, join.error.message))}</p>}
          {join.isSuccess && (
            <p role="status">{m.t('splicewire-beam-ux::messages.theme_added_to_release')}</p>
          )}
        </div>
      )}
    </>
  );
}
