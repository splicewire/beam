import { CanvasClearance } from "./CanvasClearance";
import { SourceMode } from "../editor/SourceMode";
import { useCanvas } from "./context";
import { PageSettings, type PageFieldsOffer, type RedirectToPage } from "../editor/PageSettings";
import type { SessionPageSettings } from "../editor/local-session";
// In-place page editor: renders the entry's body INSIDE the real page (host layout chrome + full class
// hierarchy intact, so styles are correct), read-only until an operator enters window mode (via the host's
// dock "Edit content"), then the same content region becomes editable with FLOATING panels (Insert ·
// Inspector) + Save + Exit. The mode seam (`beam-ux:mode` / `beam-ux:exit` window events) is preserved.
//
// Unlike VisualEditor (window mode), this does NOT adopt FiveRegionEditShell — that shell is a fixed
// five-region layout taking over the whole surface, and PageEditor's entire point is the opposite: edit
// the real page, in its own real layout, with floating panels on top. It keeps its own hand-rolled
// chrome. What it DOES share with VisualEditor: the same CanvasWidget (mounted directly here, not via
// a registered heavyweight widget — no WidgetSurface/registry needed for a direct mount) and the same
// EditShellMount-driven, schema-generated Inspector (@schemastud/frame's own) — one canvas-editing
// implementation and one attrs-editing implementation, shared by both mount modes.
//
// frame's Inspector calls <SchemaForm> with no `registry` prop, so it resolves widgets off
// WidgetRegistryContext (or seam's bare default if nothing provides one) — FiveRegionEditShell wraps
// that provider itself (window mode gets it for free); PageEditor has no such shell, so it provides
// the SAME canvas widget registry (class-chips/style-rows) itself, or className/style would silently
// fall back to plain text inputs instead of the chip/row UX.
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  EditShellMountProvider,
  useEditShellMountController,
} from "@schemastud/frame";
import { BlockInspector } from "./BlockInspector";
import { WidgetRegistryContext } from "@schemastud/seam";
import { getAt, isJsonBlock } from "../blockdoc/json.js";
import type { JsonDoc } from "../blockdoc/json.js";
import type { EntryPublicationState, EntryVersion } from "../types.js";
import {
  BuiltReleaseAssembly,
  ReleasePanel,
  type ReleaseCommand,
  type ReleaseRecord,
} from "../releases";
import {
  canMountPublication,
  isUnauthored,
} from "../editor/publication-state.js";
import { VersionRecordingReferences } from "../recording.js";
import { useLocalSession } from "../editor/use-local-session.js";
import { Breadcrumb } from "./Breadcrumb.js";
import { CanvasPalette } from "./CanvasPalette.js";
import { CanvasWidget } from "./CanvasWidget.js";
import { peCss, veCss } from "./css.js";
import type { CanvasTheme } from "./css.js";
import { TreeRender } from "./TreeRender.js";
import { createCanvasWidgetRegistry } from "./widgetRegistry.js";

/**
 * The persistence seam — the host injects load/save (audiostud routes them through puckClient).
 *
 * The four PUBLICATION methods are OPTIONAL and travel together: supply them and the dock grows the
 * draft/publish affordance, omit them and it is exactly the Save/Exit dock it has always been. That is
 * deliberate — a host mounts `save-draft` / `publish` / `versions` / `restore` on purpose, and one that
 * has not is not broken, it has the immediate-publish write it always had. Rendering the buttons
 * unconditionally and letting them 404 would make "this host does not do drafts" and "this host's
 * draft button is broken" the same picture.
 */
export interface PageEditorTransport {
  printSource?: (slug: string, body: JsonDoc) => Promise<{ source: string }>;
  readSource?: (
    slug: string,
    source: string,
    body: JsonDoc,
  ) => Promise<{ body: JsonDoc }>;
  /**
   * Persist the document. The RESPONSE is read, not discarded: a host whose save op answers with a
   * `compileError` (the beam-ux entry envelope does) has stored the body but produced no artifact for
   * a reader, and {@link compileErrorOf} turns that into the same error the publish path reports.
   * Still typed `unknown` — a host is free to answer with anything, including nothing.
   */
  saveBody: (slug: string, body: JsonDoc) => Promise<unknown>;
  loadBody?: (slug: string) => Promise<{ body?: unknown } | unknown>;
  /** Record the document as a draft: versioned, not published — readers keep the published body. */
  saveDraft?: (
    slug: string,
    body: JsonDoc,
    baseVersion: string | null,
    pageSettings?: SessionPageSettings | null,
  ) => Promise<EntryPublicationState>;
  /** Publish the working copy through the real compile path. */
  publish?: (slug: string, ref: string) => Promise<EntryPublicationState>;
  releaseCommand?: (
    id: string,
    command: ReleaseCommand,
  ) => Promise<ReleaseRecord>;
  /** Remove a Redirect a Release left (ux-0236 d2), through the Redirect resource. */
  removeRedirect?: (id: string) => Promise<void>;
  /** Browse and create mutable built Releases from the page editor. */
  listReleases?: () => Promise<ReleaseRecord[]>;
  createRelease?: (entryId: string, title: string) => Promise<ReleaseRecord>;
  /** The recorded history plus both pins — refetched whenever the panel opens. */
  listVersions?: (slug: string) => Promise<EntryPublicationState>;
  /** Mint and open an author-only preview for one saved version. */
  previewVersion?: (
    slug: string,
    versionId: string,
  ) => Promise<{ url: string }>;
  /** Roll forward to a recorded version and publish it. */
  restoreVersion?: (
    slug: string,
    ref: string,
  ) => Promise<EntryPublicationState>;
  /**
   * REMOVE the page's content — `beam-ux-entry.clear-body` on a beam-ux host: the stored body, its
   * mirror file and its compiled artifact go, and the page reads as never authored. Optional and
   * independent of the four above: a host supplies it only for an author who holds the publish
   * ability, and the dock renders "Remove content" only when it is supplied. Not the same act as
   * saving an empty document, which stays an authored (and published) empty body.
   */
  clearBody?: (slug: string) => Promise<EntryPublicationState | unknown>;
}

/** Optional toast seam (host injects; the package never imports a toast lib). */
export interface Notify {
  success: (msg: string) => void;
  error: (msg: string) => void;
}

export interface PageEditorProps {
  slug: string;
  /** The entry format; an absent format preserves the legacy TSX behavior. */
  format?: string | null;
  entryId?: string;
  userId?: string;
  /** The initial body (a JsonDoc, or a legacy/absent body → falls back to `fallbackDoc` or empty). */
  body?: JsonDoc | null;
  pageSettings?: SessionPageSettings | null;
  /** The Page Fields the server offers this page (ux-0233 d4), from its body envelope. */
  pageFields?: PageFieldsOffer | null;
  /** The File Languages the server lets this page take (ux-0233 d5). */
  fileLanguages?: string[] | null;
  /** The Redirects that lead to this page (ux-0236 d14), from its body envelope. */
  redirects?: RedirectToPage[] | null;
  transport: PageEditorTransport;
  notify?: Notify;
  theme?: Partial<CanvasTheme>;
  /** A per-slug default body when `body` is absent (host-supplied, e.g. `defaultTreeFor`). */
  fallbackDoc?: (slug: string) => JsonDoc | null;
  /** Brand label shown in the floating bar. */
  brand?: string;
  /**
   * Undo/redo — entirely host-injected (the package stays version-blind, ADR-0116 four-kind seam).
   * Buttons render only when supplied. See {@link VisualEditorProps} for the same seam in window mode.
   */
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /**
   * Bump (any changed value) to force the editor to re-seed its internal `doc` from the current
   * `body` prop — e.g. after a host-side undo/redo restore changed the entry's saved body out from
   * under an already-mounted editor. `doc` is otherwise uncontrolled (seeded once via `useState`),
   * so a `body` prop change alone does nothing after the first render. Deliberately NOT a `key`-based
   * remount at the call site: that would also reset {@link useEditMode}'s own local `editing` state
   * back to read mode (it forgets it was ever in window mode until the next `beam-ux:mode` broadcast),
   * silently kicking an operator out of the editor on every undo/redo.
   */
  reloadToken?: number | string;
}

const EMPTY_DOC: JsonDoc = [
  {
    kind: "block",
    name: "div",
    isComponent: false,
    props: [],
    children: [],
    dynamic: false,
  },
];

/**
 * Is `b` a usable persisted JsonDoc?
 *
 * `[]` is deliberately NOT one, and that is the whole point: the server returns `body: []` for an entry
 * that has never been authored, and `[].every(…)` is vacuously true, so an empty array used to pass as a
 * document and suppress the seed. The editor then opened on a doc with no root — nothing to render,
 * nothing to select, and (before `insertRelativeTo` learned to append at the root) nothing insertable.
 * Measured on beam.test 2026-09-11, G2-BEAM-AUTHOR-EMPTY-ENTRY. "Never authored" must reach the
 * fallback, which is what `null` here means.
 */
const isDoc = (b: unknown): b is JsonDoc =>
  Array.isArray(b) &&
  b.length > 0 &&
  b.every((n) => !!n && typeof n === "object" && "kind" in (n as object));

/**
 * The compile diagnostic carried on a save response, or `null` when there is none.
 *
 * Read defensively rather than typed, because {@link PageEditorTransport.saveBody} promises `unknown`:
 * a host may answer with the beam-ux entry envelope (`BeamUxEntryBodyData`, which carries
 * `compileError: string | null`), with some shape of its own, or with nothing at all, and only the
 * first of those has anything to say. An empty string is not a diagnostic — it would toast a blank
 * error, which is worse than the silence it replaced.
 */
const compileErrorOf = (response: unknown): string | null => {
  if (!response || typeof response !== "object") return null;

  const value = (response as { compileError?: unknown }).compileError;

  return typeof value === "string" && value !== "" ? value : null;
};

/** Whether `path` resolves to a `block` node the lens parsed from a PascalCase (component) tag —
 * see `CanvasNode`'s `data-bd-component` for the canvas-side half of this same distinction. */
const isSelectedNodeComponent = (doc: JsonDoc, path: string): boolean => {
  const node = getAt(doc, path);

  return !!node && isJsonBlock(node) && node.isComponent;
};

/**
 * The CURRENT authoring mode, remembered across mounts.
 *
 * `beam-ux:mode` is a one-shot broadcast: a listener that subscribes after it fired never learns the
 * mode. That was harmless while every consumer was mounted for the life of the page, and stopped being
 * harmless the moment a page FORKED on the mode — `site/home` renders the compiled artifact for a
 * reader and the editor for an author, so entering window mode is precisely what mounts the editor,
 * and the editor then subscribed one tick too late and reported read mode forever. Measured on
 * beam.test 2026-09-11: the dock's "Edit content" dispatched `{mode:'window'}`, the page swapped to the
 * editor, and the editor rendered the read tree.
 *
 * So the mode is state, not an event, and the event is how it CHANGES. A module-level store is the
 * right shape for it: there is exactly one authoring mode per document, the host owns it, and every
 * consumer must agree with every other one.
 */
const editModeStore = {
  current: false,
  listeners: new Set<() => void>(),
  listening: false,
};

function subscribeEditMode(onChange: () => void): () => void {
  editModeStore.listeners.add(onChange);

  if (!editModeStore.listening && typeof window !== "undefined") {
    editModeStore.listening = true;
    window.addEventListener("beam-ux:mode", (e: Event) => {
      const next =
        (e as CustomEvent<{ mode?: string }>).detail?.mode === "window";

      if (next === editModeStore.current) return;

      editModeStore.current = next;
      for (const listener of editModeStore.listeners) listener();
    });
  }

  return () => {
    editModeStore.listeners.delete(onChange);
  };
}

/**
 * Track window (edit) mode off the host MainframeHost's `beam-ux:mode` broadcast.
 *
 * Reads the CURRENT mode, not just subsequent changes — see {@link editModeStore}. `false` on the
 * server, where there is no host and no broadcast.
 */
export function useEditMode(): boolean {
  return useSyncExternalStore(
    subscribeEditMode,
    () => editModeStore.current,
    () => false,
  );
}

/** Test seam: forget the remembered mode. Nothing in a running app resets it; a suite must. */
export function __resetEditMode(): void {
  editModeStore.current = false;
  for (const listener of editModeStore.listeners) listener();
}

/**
 * An alert the author must answer before going on: the save conflict, the remove-content confirm. It is a modal layer
 * above the editor's bar and every floating panel (afa5fb8b), so no open panel can cover its buttons; focus moves into
 * it, Tab stays inside it, and focus goes back where it was when it closes.
 */
function ModalAlert({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.querySelector('button')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  return (
    <div ref={ref} className="pe-modal" role="alertdialog" aria-label={label} aria-modal="true"
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const buttons = Array.from(event.currentTarget.querySelectorAll('button'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <div className="pe-modal-content">{children}</div>
    </div>
  );
}

export function PageEditor({
  slug,
  format,
  body = null,
  pageSettings = null,
  pageFields = null,
  fileLanguages = null,
  redirects = null,
  transport,
  notify,
  theme,
  fallbackDoc,
  brand,
  entryId,
  userId,
  reloadToken,
}: PageEditorProps) {
  const editing = useEditMode();
  const initial: JsonDoc = isDoc(body)
    ? body
    : (fallbackDoc?.(slug) ?? EMPTY_DOC);
  const [doc, setDoc] = useState<JsonDoc>(initial);
  // The latest document and whether the canvas has edits not yet written, held in refs because a widget's pending
  // edit arrives through mount.flush() INSIDE a handler whose `doc` / `mount.dirty` closure predates it (build.qa on
  // 05d10b9). Only canvas edits set `edited`; loads, restores and clears go through setDoc directly.
  const docRef = useRef<JsonDoc>(doc);
  docRef.current = doc;
  const editedRef = useRef(false);
  const onCanvasChange = (next: JsonDoc) => {
    docRef.current = next;
    editedRef.current = true;
    local.change(next);
    setDoc(next);
  };
  // Re-seed on an explicit host-driven reload only (see PageEditorProps.reloadToken) — reading the
  // latest body/fallbackDoc/slug from this render's closure, not from a dependency-tracked value, so
  // an incidental `body` prop identity change (e.g. a host re-render) never overwrites in-progress
  // local edits; only a genuine `reloadToken` bump does.
  useEffect(() => {
    if (reloadToken === undefined) return;
    setDoc(isDoc(body) ? body : (fallbackDoc?.(slug) ?? EMPTY_DOC));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);
  const mount = useEditShellMountController();
  // The canvas widget itself is never resolved off this registry (CanvasWidget is mounted directly
  // below, not via WidgetSurface) — this exists purely so frame's Inspector's SchemaForm resolves
  // class-chips/style-rows for className/style instead of falling back to plain text inputs.
  const registry = useMemo(() => createCanvasWidgetRegistry(), []);
  const [leftOpen, setLeftOpen] = useState(true);
  // Closed by default (nothing to show); auto-opens on selection, and the Inspector button forces it open.
  const [rightOpen, setRightOpen] = useState(false);

  // Auto-open the Inspector on selection (mirrors the old onCanvasClick side effect) — selection now
  // happens INSIDE CanvasWidget (it drives mount.selectNode directly), so this watches the mount.
  useEffect(() => {
    if (mount.selectedNodeId) setRightOpen(true);
  }, [mount.selectedNodeId]);

  // ── Publication: draft / publish / versions / restore ─────────────────────────────────────────
  // The whole affordance is gated on the transport actually carrying the seam. All four or none:
  // a dock offering Save draft with no Publish would strand an author's work where no reader can
  // reach it, which is worse than not offering drafts at all.
  const publishable = !!(
    transport.saveDraft &&
    transport.publish &&
    transport.listVersions &&
    transport.restoreVersion
  );
  const [publication, setPublication] = useState<EntryPublicationState | null>(
    null,
  );
  const [publicationError, setPublicationError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const canvasConfig = useCanvas();
  const local = useLocalSession(
    entryId ?? slug,
    userId,
    publication?.headVersion,
    initial,
    editing && !!publication,
    pageSettings ?? null,
  );
  useEffect(() => {
    if (!local.session) return;
    const current = local.session.body as JsonDoc;
    docRef.current = current;
    setDoc(current);
    editedRef.current = local.session.dirty;
    mount.markDirty(local.session.dirty);
  }, [
    local.session,
    local.session?.snapshot().cursor,
    JSON.stringify(local.session?.body),
    local.session?.dirty,
  ]);
  const onUndo = async () => {
    await mount.flush();
    local.undo();
  };
  const onRedo = async () => {
    await mount.flush();
    local.redo();
  };
  const canUndo = local.session?.canUndo ?? false;
  const canRedo = local.session?.canRedo ?? false;
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<EntryVersion | null>(
    null,
  );
  const [confirmClear, setConfirmClear] = useState(false);
  // The Publish dialog's choice (EP-18 ruling 2); see openPublish.
  const [publishChoice, setPublishChoice] = useState<{ releases: ReleaseRecord[]; releaseId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // One attempt, not one per render: `transport` is an object literal at most call sites, so a
  // dependency on it re-runs every render, and a FAILED load would then retry forever. The ref is
  // what makes "we asked and it did not answer" a terminal state rather than a loop.
  const askedForPublication = useRef(false);

  useEffect(() => {
    if (!editing || !publishable || askedForPublication.current) return;
    askedForPublication.current = true;

    let live = true;
    transport
      .listVersions?.(slug)
      .then((state) => {
        if (!live) return;
        if (!canMountPublication(state)) {
          setPublicationError(
            "This entry has no Publication Pin. Publish its baseline before mounting the editor.",
          );
        } else setPublication(state);
      })
      // Silent: the draft badge is an enrichment of a dock that works without it, and a toast on
      // every editor open would be noise on a host mid-migration.
      .catch(
        () =>
          live &&
          setPublicationError(
            "Could not load publication history. Verify the versions and publication-pin migrations.",
          ),
      );

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, publishable, slug]);

  // Read mode: the plain page (correct chrome + styles), no editing overhead.
  if (!editing) {
    return <TreeRender tree={doc} />;
  }

  const exit = () => window.dispatchEvent(new CustomEvent("beam-ux:exit"));

  /**
   * Record the canvas document as a DRAFT. Same flush-then-write as {@link save}, and deliberately
   * the same "the document is no longer dirty" outcome — a draft IS persisted; what it is not is
   * published.
   */
  const saveDraft = async () => {
    if (local.session?.source) {
      notify?.error("Apply or discard Source Mode before saving.");
      return;
    }
    if (!transport.saveDraft || !local.session) return;
    setBusy(true);
    try {
      await mount.flush();
      const sent = docRef.current;
      const sentSettings = local.session.pageSettings;
      const next = sentSettings
        ? await transport.saveDraft(
            slug,
            sent,
            local.session.identity.base,
            sentSettings,
          )
        : await transport.saveDraft(slug, sent, local.session.identity.base);
      setPublication(next);
      if (!next.headVersion) throw new Error("Save returned no version.");
      local.saved(next.headVersion, sent, sentSettings);
      mount.markDirty(false);
      editedRef.current = false;
      notify?.success("Draft saved");
      return next;
    } catch (error) {
      if ((error as { status?: number })?.status === 409) setConflict(true);
      else notify?.error("Draft save failed");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Publish the working copy. It sends no document: what it publishes is what the server already
   * holds, which is the distinction between this and Save.
   *
   * A compile diagnostic comes back on the state rather than as a thrown failure — the publish has
   * landed by then — so it is reported as an error toast over a publication that really did happen.
   */
  const publish = async () => {
    if (!transport.publish || !publication || !local.session) return;
    let ref = local.session.identity.base;
    if (isUnauthored(publication)) {
      const draft = await saveDraft();
      if (!draft?.headVersion) return;
      ref = draft.headVersion;
    }
    if (!ref) return;
    setBusy(true);
    try {
      const next = await transport.publish(slug, ref);
      setPublication(next);
      if (next.compileError) notify?.error(next.compileError);
      else
        notify?.success(
          next.release && next.release.status !== "published"
            ? "Release submitted for review"
            : "Published",
        );
    } catch {
      notify?.error("Publish failed");
    } finally {
      setBusy(false);
    }
  };

  /**
   * The dock's ONE publishing action (launch ticket 05 ruling 3: Save draft and Publish, not three save-like buttons).
   * With unsaved edits, or on a host without the publication seam, it is the old plain Save: save-body, which is
   * draft + publish in one act, so readers get exactly what is on the canvas. On a clean canvas it publishes the
   * pending draft. The old Publish sent no document, so edits made since the last Save draft were silently left out.
   */
  const publishNow = async () => {
    // Flush FIRST, so an edit still pending in a widget counts (a press that did not blur the inline editor).
    await mount.flush();
    if (
      (local.session?.dirty || editedRef.current) &&
      !(publication && isUnauthored(publication))
    ) {
      notify?.error("Save your draft before publishing it.");
      return;
    }
    return publish();
  };

  /**
   * The Publish dialog (ADR-0232 d15, EP-18 ruling 2): publish the saved version now as a Release of one, or add it to
   * an open Release to publish with others, each with Preview. It opens only where there is a choice to make (the host
   * offers a version Preview or Releases) and a saved version to make it with; otherwise Publish is publishNow.
   */
  const savedRef = local.session?.identity.base ?? null;
  const offersChoice = !!(transport.previewVersion || (transport.listReleases && transport.releaseCommand));
  const openPublish = async () => {
    await mount.flush();
    if (
      !offersChoice ||
      !savedRef ||
      !publication ||
      isUnauthored(publication) ||
      local.session?.dirty ||
      editedRef.current
    ) {
      return publishNow();
    }
    let releases: ReleaseRecord[] = [];
    if (transport.listReleases && transport.releaseCommand) {
      try {
        // Every open Release takes a member, a scheduled or reviewed one included (its review or schedule is revised).
        releases = (await transport.listReleases()).filter((release) =>
          ["draft", "in_review", "approved", "scheduled"].includes(release.status),
        );
      } catch {
        notify?.error("Could not load the open Releases");
      }
    }
    setPublishChoice({ releases, releaseId: releases[0]?.id ?? "" });
  };
  const addToRelease = async () => {
    if (!publishChoice?.releaseId || !transport.releaseCommand || !savedRef) return;
    setBusy(true);
    try {
      const updated = await transport.releaseCommand(publishChoice.releaseId, {
        action: "member",
        entryId: entryId ?? publication?.id ?? "",
        ref: savedRef,
      });
      setPublishChoice((current) =>
        current && {
          ...current,
          releases: current.releases.map((release) => (release.id === updated.id ? updated : release)),
        },
      );
      notify?.success(`Added to ${updated.title}`);
    } catch (failure) {
      notify?.error(failure instanceof Error ? failure.message : "Could not add it to the Release");
    } finally {
      setBusy(false);
    }
  };
  const chosenRelease = publishChoice?.releases.find((release) => release.id === publishChoice.releaseId);

  /** Open/close the history panel, refetching on every open so it can never show a stale HEAD. */
  const toggleVersions = async () => {
    const opening = !versionsOpen;
    setVersionsOpen(opening);
    setPendingRestore(null);
    if (!opening) return;
    // One panel at a time on the right edge; they occupy the same strip.
    setRightOpen(false);
    setBusy(true);
    try {
      if (transport.listVersions)
        setPublication(await transport.listVersions(slug));
    } catch {
      notify?.error("Could not load the version history");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Roll forward to a recorded version — and RE-SEED THE CANVAS from what the server now holds.
   *
   * Without the re-seed the author would be looking at the document they had before the restore,
   * and the next Save would write it straight back over the version they just restored. The editor
   * cannot re-seed from the publication state (a version list deliberately carries no bodies), so it
   * re-reads through the same `loadBody` seam the host already supplies; a transport without one
   * says so rather than leaving a stale canvas looking authoritative.
   */
  const restore = async (version: EntryVersion) => {
    await mount.flush();
    if (local.session?.dirty || editedRef.current) {
      notify?.error(
        "Save or discard unsaved changes before restoring History.",
      );
      return;
    }
    if (!transport.restoreVersion) return;
    setBusy(true);
    try {
      const next = await transport.restoreVersion(slug, version.id);
      setPublication(next);
      setPendingRestore(null);

      if (transport.loadBody) {
        const restored = (await transport.loadBody(slug)) as
          { body?: unknown; pageSettings?: SessionPageSettings } | undefined;
        if (Array.isArray(restored?.body) && next.headVersion) {
          local.reset(next.headVersion, restored.body, restored.pageSettings);
          setDoc(restored.body as JsonDoc);
        }
        mount.markDirty(false);
        notify?.success(`Restored ${version.readable}`);
      } else {
        notify?.success(`Restored ${version.readable} — reload to edit it`);
      }
    } catch {
      notify?.error(`Could not restore ${version.readable}`);
    } finally {
      setBusy(false);
    }
  };

  const openPreview = async (version: Pick<EntryVersion, "id" | "readable">) => {
    if (!transport.previewVersion) return;
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      notify?.error("Allow popups to open a version preview");
      return;
    }
    popup.opener = null;
    try {
      const preview = await transport.previewVersion(slug, version.id);
      const target = new URL(preview.url, window.location.href);
      if (target.origin !== window.location.origin) {
        throw new Error("Preview URL must stay on this host");
      }
      popup.location.href = target.href;
    } catch {
      popup.close();
      notify?.error(`Could not open ${version.readable}`);
    }
  };

  /**
   * Remove the page's content, after the confirm step — and re-seed the canvas to the UNAUTHORED
   * document, because that is what the server now holds. Without the re-seed the author would keep
   * looking at the removed body, and the next Save would put it straight back.
   *
   * The response is the publication state when the host returns one (beam-ux does); anything else
   * leaves the badge as it was rather than guessing.
   */
  const clearContent = async () => {
    if (local.session?.source) {
      notify?.error("Apply or discard Source Mode before clearing.");
      return;
    }
    if (!transport.clearBody) return;
    setBusy(true);
    try {
      const next = await transport.clearBody(slug);
      if (next && typeof next === "object" && "versions" in next) {
        const state = next as EntryPublicationState;
        setPublication(state);
        if (state.headVersion) local.reset(state.headVersion, []);
      }
      setDoc([]);
      mount.markDirty(false);
      setConfirmClear(false);
      notify?.success("Content removed");
    } catch {
      notify?.error("Could not remove the content");
    } finally {
      setBusy(false);
    }
  };

  if (!publishable || !entryId || !userId)
    return (
      <div role="alert">
        The editor requires an entry, authenticated user, and publication
        transport.
      </div>
    );
  if (publicationError || local.error)
    return <div role="alert">{publicationError ?? local.error}</div>;
  if (local.pending)
    return (
      <div role="alertdialog" aria-label="Unsaved session base moved">
        <p>
          The server version changed. Restore unsaved changes from{" "}
          {local.pending.identity.base} or discard them?
        </p>
        <button onClick={() => void local.recover(true)}>
          Restore unsaved changes
        </button>
        <button onClick={() => void local.recover(false)}>Discard</button>
      </div>
    );
  if (!local.session) return <div role="status">Loading Local Session…</div>;
  const resolveConflict = async (keepOurs: boolean) => {
    if (local.session?.source) {
      notify?.error(
        "Apply or discard Source Mode before resolving the conflict.",
      );
      return;
    }
    if (!transport.listVersions || !transport.loadBody || !transport.saveDraft)
      return;
    try {
      const current = await transport.listVersions(slug);
      if (!current.headVersion) throw new Error("No current version");
      if (keepOurs) {
        const sent = docRef.current;
        const sentSettings = local.session?.pageSettings ?? null;
        const next = sentSettings
          ? await transport.saveDraft(
              slug,
              sent,
              current.headVersion,
              sentSettings,
            )
          : await transport.saveDraft(slug, sent, current.headVersion);
        if (!next.headVersion) throw new Error("No saved version");
        local.saved(next.headVersion, sent, sentSettings);
        setPublication(next);
      } else {
        const envelope = (await transport.loadBody(slug)) as {
          body?: unknown;
          pageSettings?: SessionPageSettings;
        };
        if (!Array.isArray(envelope.body)) throw new Error("No current body");
        local.reset(current.headVersion, envelope.body, envelope.pageSettings);
        setPublication(current);
      }
      setConflict(false);
    } catch {
      notify?.error(
        "The current version changed again; reload the conflict before retrying.",
      );
    }
  };

  return (
    <WidgetRegistryContext.Provider value={registry}>
      <EditShellMountProvider value={mount}>
        <style
          dangerouslySetInnerHTML={{ __html: veCss(theme) + peCss(theme) }}
        />

        {conflict && (
          <ModalAlert label="Save conflict">
            <p>The server draft changed. Choose which work to keep.</p>
            <button onClick={() => void resolveConflict(false)}>
              Reload theirs
            </button>
            <button onClick={() => void resolveConflict(true)}>
              Save ours as a new version
            </button>
          </ModalAlert>
        )}
        {/* Reserve space for floating panels without changing the published page layout. */}
        <CanvasClearance
          panels={`${leftOpen}-${rightOpen}-${versionsOpen}-${confirmClear}`}
        >
          <SourceMode
            local={local}
            allowed={
              (format == null || format === "tsx") &&
              (!canvasConfig.profile ||
                !("x-admits-code" in canvasConfig.profile) ||
                canvasConfig.profile["x-admits-code"] !== false)
            }
            conversion={
              transport.printSource && transport.readSource
                ? {
                    print: (body) => transport.printSource!(slug, body),
                    read: (source, body) =>
                      transport.readSource!(slug, source, body),
                  }
                : undefined
            }
          >
            <CanvasWidget
              value={doc}
              onChange={onCanvasChange}
              editShellMount={mount}
              theme={theme}
              hideBreadcrumb
            />
          </SourceMode>
        </CanvasClearance>

        {/* Floating editor chrome — fixed over the page. */}
        <div className="pe-bar">
          <span className="pe-brand">
            <span className="pe-mark" />
            {brand ?? `editing · ${slug}`}
          </span>
          {!local.session.source && local.session.pageSettings && (
            <PageSettings
              value={local.session.pageSettings}
              pageFields={pageFields}
              fileLanguages={fileLanguages}
              redirects={redirects}
              onChange={(settings) =>
                local.change(local.session!.body, settings)
              }
            />
          )}
          <span style={{ flex: 1 }} />
          {
            <>
              <button
                className="pe-btn"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo"
              >
                ↶ Undo
              </button>
              <button
                className="pe-btn"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo"
              >
                ↷ Redo
              </button>
            </>
          }
          <button className="pe-btn" onClick={() => setLeftOpen((v) => !v)}>
            Insert
          </button>
          <button className="pe-btn" onClick={() => setRightOpen((v) => !v)}>
            Inspector
          </button>
          {publishable && (
            <>
              {/* The one piece of state an author cannot infer from the canvas: their
                                working copy is ahead of what readers are being served. Named, with the
                                version readers are actually on, because "unpublished changes" without
                                saying what is live is the half of the sentence that matters. */}
              {publication?.draftPending && (
                <span className="pe-draft">
                  Draft pending
                  {publication.publishedReadable
                    ? ` · readers see ${publication.publishedReadable}`
                    : ""}
                </span>
              )}
              <button
                className="pe-btn"
                onClick={saveDraft}
                disabled={busy}
                title="Save a version that readers do not see yet"
              >
                Save draft
              </button>
              <button
                className="pe-btn"
                onClick={toggleVersions}
                disabled={busy}
              >
                Versions
              </button>
            </>
          )}
          {transport.clearBody && (
            <button
              className="pe-btn"
              onClick={() => setConfirmClear(true)}
              disabled={busy}
            >
              Remove content
            </button>
          )}
          {/* Publish replaces plain Save (ruling 3): see publishNow. Primary, because it is the act readers see. */}
          <button
            className="pe-btn primary"
            onClick={() => void openPublish()}
            disabled={busy}
            title="Publish what is on the canvas: readers see it now"
          >
            Publish
          </button>
          <button className="pe-btn" onClick={exit}>
            Exit
          </button>
        </div>

        {publishChoice && (
          <ModalAlert label="Publish">
            <div className="pe-confirm">
              <span>
                Publish this page now, as a Release of its own, or add it to an open Release to publish it with the
                rest.
              </span>
              <div className="pe-confirm-actions">
                <button
                  className="pe-btn primary"
                  disabled={busy}
                  onClick={() => {
                    setPublishChoice(null);
                    void publishNow();
                  }}
                >
                  Publish now
                </button>
                {transport.previewVersion && savedRef && (
                  <button className="pe-btn" onClick={() => void openPreview({ id: savedRef, readable: "this version" })}>
                    Preview
                  </button>
                )}
              </div>
              {publishChoice.releases.length > 0 && (
                <div className="pe-confirm-actions">
                  <label>
                    Open Release{" "}
                    <select
                      value={publishChoice.releaseId}
                      onChange={(event) =>
                        setPublishChoice((current) => current && { ...current, releaseId: event.target.value })
                      }
                    >
                      {publishChoice.releases.map((release) => (
                        <option key={release.id} value={release.id}>
                          {release.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="pe-btn" disabled={busy || !publishChoice.releaseId} onClick={() => void addToRelease()}>
                    Add to the Release
                  </button>
                  {chosenRelease?.previewHref && (
                    <button
                      className="pe-btn"
                      onClick={() => window.open(chosenRelease.previewHref!, "_blank", "noopener")}
                    >
                      Preview the Release
                    </button>
                  )}
                </div>
              )}
              <div className="pe-confirm-actions">
                <button className="pe-btn" onClick={() => setPublishChoice(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </ModalAlert>
        )}

        {/* Removing content is CONFIRMED, never one click, for the same reason restore is:
                    it changes what every reader of the page is served. */}
        {confirmClear && (
          <ModalAlert label="Confirm remove content">
            <div className="pe-confirm">
              <span>
                Clear this draft? The published page stays unchanged until
                Publish. Earlier bodies remain in History.
              </span>
              <div className="pe-confirm-actions">
                <button
                  className="pe-btn primary"
                  onClick={clearContent}
                  disabled={busy}
                >
                  Confirm remove
                </button>
                <button
                  className="pe-btn"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </ModalAlert>
        )}

        {leftOpen && (
          <aside className="pe-panel pe-left">
            <CanvasPalette />
          </aside>
        )}

        {/* Closed by default; the Inspector button opens it (empty hint until you select
                    something), and selecting an element auto-opens it with that element's properties.
                    frame's own Inspector already renders its own empty state when nothing is selected. */}
        {/* The version history — the same right-hand strip as the Inspector, so they toggle
                    each other rather than stacking. Restore is CONFIRMED, never one click: it changes
                    what every reader of the page is served, which is not an undoable local edit. */}
        {publication?.release && transport.releaseCommand && (
          <ReleasePanel
            release={publication.release}
            initialEntryId={entryId ?? publication.id}
            entries={[
              {
                id: publication.id,
                title: slug,
                versions: publication.versions.map((version) => ({
                  id: version.id,
                  label: version.readable ?? version.id,
                })),
              },
            ]}
            onCommand={async (command) => {
              const release = await transport.releaseCommand!(
                publication.release!.id,
                command,
              );
              const state = await transport.listVersions!(slug);
              setPublication({ ...state, release });
            }}
            onRemoveRedirect={transport.removeRedirect}
          />
        )}
        {publication &&
          publication.versions.length > 0 &&
          transport.listReleases &&
          transport.createRelease &&
          transport.releaseCommand && (
            <BuiltReleaseAssembly
              entryId={entryId ?? publication.id}
              entryTitle={slug}
              versions={publication.versions.map((version) => ({
                id: version.id,
                label: version.readable ?? version.id,
              }))}
              canTakeDown={publication.publishedVersion !== null}
              listReleases={transport.listReleases}
              createRelease={transport.createRelease}
              releaseCommand={transport.releaseCommand}
              removeRedirect={transport.removeRedirect}
            />
          )}
        {versionsOpen && (
          <aside className="pe-panel pe-versions" aria-label="Versions">
            <h3>Versions</h3>

            {pendingRestore && (
              <div
                className="pe-confirm"
                role="alertdialog"
                aria-label="Confirm restore"
              >
                <span>
                  Restore {pendingRestore.readable} into a new draft? Publish
                  remains separate.
                </span>
                <div className="pe-confirm-actions">
                  <button
                    className="pe-btn primary"
                    onClick={() => restore(pendingRestore)}
                    disabled={busy}
                  >
                    Confirm restore
                  </button>
                  <button
                    className="pe-btn"
                    onClick={() => setPendingRestore(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {publication === null && <div className="pe-version">Loading…</div>}
            {publication !== null && publication.versions.length === 0 && (
              <div className="pe-version">
                Nothing recorded yet — a draft, a publish or a save records the
                first version.
              </div>
            )}

            {publication?.versions.map((version) => (
              <div className="pe-version" key={version.id}>
                {/* Ref and label share one shrinkable text column, stacked. As two
                                    sibling flex items, a long generated ref ("v279-restore-of-v277-
                                    published") kept its full width and squeezed the label to one
                                    character per line beside it (replay-6 G2-BEAM-DRAFT-PUBLISH). */}
                <span className="pe-version-text">
                  <span className="pe-version-ref" title={version.readable}>
                    {version.readable}
                  </span>
                  <VersionRecordingReferences recordings={version.recordings} />
                  {version.label && (
                    <span className="pe-version-label" title={version.label}>
                      {version.label}
                    </span>
                  )}
                </span>
                {version.isPublished && (
                  <span className="pe-version-tag published">published</span>
                )}
                {version.isHead && !version.isPublished && (
                  <span className="pe-version-tag head">draft</span>
                )}
                {transport.previewVersion && (
                  <button
                    className="pe-btn"
                    aria-label={`Open ${version.readable}`}
                    onClick={() => void openPreview(version)}
                    disabled={busy}
                  >
                    Open
                  </button>
                )}
                {!version.isPublished && (
                  <button
                    className="pe-btn"
                    aria-label={`Restore ${version.readable}`}
                    onClick={() => setPendingRestore(version)}
                    disabled={busy}
                  >
                    Restore
                  </button>
                )}
              </div>
            ))}
          </aside>
        )}

        {rightOpen && !versionsOpen && (
          <aside className="pe-panel pe-right">
            {mount.selectedNodeId && (
              <>
                <Breadcrumb
                  doc={doc}
                  path={mount.selectedNodeId}
                  onSelect={mount.selectNode}
                />
                {isSelectedNodeComponent(doc, mount.selectedNodeId) && (
                  <div className="pe-comp-badge">◆ component</div>
                )}
              </>
            )}
            <BlockInspector />
          </aside>
        )}
      </EditShellMountProvider>
    </WidgetRegistryContext.Provider>
  );
}

export default PageEditor;
