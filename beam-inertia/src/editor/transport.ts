import type { JsonDoc } from "@splicewire/beam-ux/jsondoc";
import { createSessionRequest, xsrfHeader } from "@schemastud/frame/session";
import { getBeamInertiaConfig } from "../config";
// The host-supplied entry-body transport — the ONE injection seam the promoted editor + Mainframe host
// load/save an entry body through. Mirrors `splicewire/www`'s and `rushing/audiostud`'s: a same-origin,
// cookie-authed load/save over beam-ux's versioned ParticleWriter. Retry off — a failed authoring
// load/save should surface.
//
// ## Addressed by ID, as of beam-docs-satellite ticket 40
//
// It loads/saves over the id-addressed particle operations `beam-ux-entry.body` /
// `beam-ux-entry.save-body` (ADR-0214 §1). It used to fetch the LITERAL
// `/beam/ux/entries/${slug}/body` — the `Route::beamUxEntries()` macro — and that was wrong twice over:
//
//  - **Slug-addressed.** `UxBuilderClient.loadBody` has taken an ID since ADR-0214 §2, and this file
//    declared `bodyClient: UxBuilderClient` while feeding it a slug. A slug and an id are both `string`,
//    so `tsc` never once complained — the annotation asserted something untrue for months (ticket 37
//    dropped the annotation rather than fake it; this is the real fix).
//  - **A literal URL.** A literal silently stops matching the moment the mount moves. `splicewire/www`
//    was bitten by exactly that (ticket 07: the route moved under `api/` and the editor 404'd on every
//    page).
//
// ⚠️ **That protection is GONE as of ADR-0004 (2026-08-27), and this is the literal again.** Wayfinder
// is retired fleet-wide, so the URL below is a template literal keyed by URI, not a helper keyed by
// route name. The hazard the bullet above describes is therefore live once more, and it is not
// theoretical: retiring Wayfinder across the fleet found `splicewire/www` mounting these ops under
// `api/` and `rushing/audiostud` under `/resources/`, so three roots legitimately need three different
// literals here. ADR-0004 accepts that cost explicitly — a mistyped or moved route is now a 404 found
// by a click or a test, not a build error.
//
// So: **if the editor 404s on load or save, check this URL against `php artisan route:list` for
// `beam-ux-entry.body` / `.save-body` before looking anywhere else.** That is the whole failure
// mode, and it is the first thing to rule out.
import type {
  EntryPublicationState,
  UxBuilderClient,
} from "@splicewire/beam-ux";
// The JSON calls go through frame's session request (ticket 49): same-origin, JSON headers and the XSRF token. A refusal
// rejects with frame's FrameActionError: its `status`, `errors` and the server's `message`.
const request = createSessionRequest();

/** One JSON call, the beam envelope's payload one unwrap down. */
async function send(method: string, url: string, body?: unknown, init?: { signal?: AbortSignal }): Promise<unknown> {
  return (await request<{ data: unknown }>(method, url, undefined, body, init)).data.data;
}

/** The two non-JSON-request calls (a FormData upload, a body-less DELETE) keep their own fetch and read the answer here. */
async function readData(res: Response, what: string): Promise<unknown> {
  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    throw Object.assign(new Error(problem.message || `${what} ${res.status}`), {
      status: res.status,
    });
  }

  return (await res.json()).data;
}

const defaultBodyClient: UxBuilderClient = {
  componentCapabilities: async id => send('GET',`/beam-ux-entries/${id}/component-capabilities`) as ReturnType<NonNullable<UxBuilderClient['componentCapabilities']>>,
  createComponent: async (id,input) => send('POST',`/beam-ux-entries/${id}/create-component`,input) as ReturnType<NonNullable<UxBuilderClient['createComponent']>>,
  duplicateComponent: async id => send('POST',`/beam-ux-entries/${id}/duplicate-component`,{}) as ReturnType<NonNullable<UxBuilderClient['duplicateComponent']>>,
  canvasBindings: async (id, body, recordValue, options) => {
    // The signal rides through, so a superseded bindings read is aborted (beam-ux's use-canvas-bindings).
    return await send('POST', `/beam-ux-entries/${id}/canvas-bindings`, {body,recordValue:recordValue ?? null}, {signal:options?.signal}) as Awaited<ReturnType<NonNullable<UxBuilderClient['canvasBindings']>>>;
  },
  makeEditable: async (slug, body) => {
    return (await send("POST", "/beam-ux-entries/make-editable", { slug, body })) as Awaited<
      ReturnType<NonNullable<UxBuilderClient["makeEditable"]>>
    >;
  },
  /**
   * The read is a GET with NO query string, deliberately: `EntryBodyShowOp` declares `input: false`,
   * and beam's operation controller rejects a GET carrying any query key with a 422. The retired
   * `?namespace=` disambiguator is therefore not merely ignored — appending one fails loudly.
   */
  loadBody: async (id) => {
    return (await send("GET", `/beam-ux-entries/${id}/body`)) as Awaited<
      ReturnType<UxBuilderClient["loadBody"]>
    >;
  },
  saveBlocks: async (id, body) => {
    let saved: unknown;
    try {
      saved = await send("POST", `/beam-ux-entries/${id}/save-blocks`, { body });
    } catch (error) {
      // Older hosts may not mount the typed operation yet. Never bypass a validation/auth refusal.
      const status = (error as { status?: unknown }).status;
      if (status !== 404 && status !== 405) throw error;
      saved = await send("POST", `/beam-ux-entries/${id}/save-body`, { body });
    }
    return saved as Awaited<ReturnType<UxBuilderClient["saveBody"]>>;
  },
  saveBody: async (id, body) => {
    return (await send("POST", `/beam-ux-entries/${id}/save-body`, { body })) as Awaited<
      ReturnType<UxBuilderClient["saveBody"]>
    >;
  },
};

// ── the PUBLICATION seam (G2-BEAM-DRAFT-PUBLISH) ─────────────────────────────────────────────────
//
// Four more id-addressed operations on the same resource, mounted by the host beside `save-body`
// (`save-draft` / `publish` / `versions` / `restore`, all `ability: 'ux.author'`). They are OPTIONAL on
// `UxBuilderClient` because a host mounts them deliberately; this default implements them because the
// starters do. An injected client supplies only the operations its host mounts; the dock renders the
// affordance only when the whole seam is present.
//
// The same literal-URL hazard the block above describes applies verbatim: if a draft or publish 404s,
// check these four against `php artisan route:list` before looking anywhere else.
async function reconcilePost(
  memberId: string,
  op: string,
  input: import("@splicewire/beam-ux").FileReconcileInput,
) {
  return (await send(
    "POST",
    `/beam-ux-release-files/${encodeURIComponent(memberId)}/${op}`,
    input,
  )) as import("@splicewire/beam-ux").FileReconcileResult;
}
const publicationClient = {
  createRelease: async (id: string, title: string) =>
    (await publicationPost(id, "create-release", {
      title,
    })) as import("@splicewire/beam-ux").ReleaseRecord,
  printSource: async (id: string, body: JsonDoc) =>
    (await publicationPost(id, "print-source", { body })) as { source: string },
  readSource: async (id: string, source: string, body: JsonDoc) =>
    (await publicationPost(id, "read-source", { source, body })) as {
      body: JsonDoc;
    },
  inspectReleaseFile: async (memberId: string) => {
    return (await send(
      "GET",
      `/beam-ux-release-files/${encodeURIComponent(memberId)}/inspect-file`,
    )) as import("@splicewire/beam-ux").FileInspection;
  },
  takeReleaseFile: (
    id: string,
    input: import("@splicewire/beam-ux").FileReconcileInput,
  ) => reconcilePost(id, "take-file-draft", input),
  restoreMissingReleaseFile: (
    id: string,
    input: import("@splicewire/beam-ux").FileReconcileInput,
  ) => reconcilePost(id, "restore-missing-file", input),
  remirrorReleaseFile: (
    id: string,
    input: import("@splicewire/beam-ux").FileReconcileInput,
  ) => reconcilePost(id, "remirror-file", input),
  takeAllReleaseFiles: async (
    id: string,
    input: Parameters<
      NonNullable<UxBuilderClient["takeAllReleaseFiles"]>
    >[1],
  ) => {
    return (await send(
      "POST",
      `/beam-ux-release-files/${encodeURIComponent(id)}/take-all-drafts`,
      input,
    )) as Awaited<
      ReturnType<NonNullable<UxBuilderClient["takeAllReleaseFiles"]>>
    >;
  },
  recordReleaseFile: async (memberId: string, releaseId: string) => {
    return (await send(
      "POST",
      `/beam-ux-release-files/${encodeURIComponent(memberId)}/commit-now`,
      { releaseId },
    )) as import("@splicewire/beam-ux").ReleaseRecording;
  },
  listReleases: async () => {
    return (await send("GET", "/beam-ux-releases")) as import("@splicewire/beam-ux").ReleaseRecord[];
  },
  releaseCommand: async (
    id: string,
    command: import("@splicewire/beam-ux").ReleaseCommand,
  ) => {
    return (await send("POST", `/beam-ux-releases/${id}/command`, command)) as import("@splicewire/beam-ux").ReleaseRecord;
  },
  // ux-0236 d2: an unwanted Redirect a Release left is removed through the Redirect resource.
  removeRedirect: async (id: string) => {
    const response = await fetch(`/beam-ux-redirects/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { Accept: "application/json", ...xsrfHeader() },
    });
    if (!response.ok) {
      await readData(response, "redirect");
    }
  },

  listVersions: async (id: string) => {
    return (await send("GET", `/beam-ux-entries/${id}/versions`)) as EntryPublicationState;
  },
  previewVersion: async (id: string, versionId: string) =>
    (await publicationPost(id, "preview", { versionId })) as { url: string },
  saveDraft: async (
    id: string,
    body: Record<string, unknown>,
    baseVersion: string | null,
    label?: string,
    pageSettings?: Record<string, unknown> | null,
  ) =>
    (await publicationPost(id, "save-draft", {
      body,
      baseVersion,
      label,
      ...(pageSettings ? { pageSettings } : {}),
    })) as EntryPublicationState,
  publish: async (id: string, ref: string, label?: string) =>
    (await publicationPost(id, "publish", {
      ref,
      label,
    })) as EntryPublicationState,
  restoreVersion: async (id: string, ref: string, label?: string) =>
    (await publicationPost(id, "restore", {
      ref,
      label,
    })) as EntryPublicationState,
  // `clear-body` — remove the page's content and return the entry to unauthored. Not the same act as
  // `save-body` with `[]`, which stores an authored empty document. Same ability (`ux.author`).
  clearBody: async (id: string, label?: string) =>
    (await publicationPost(id, "clear-body", {
      label,
    })) as EntryPublicationState,
};

/** The shared write leg: a stateful, cookie-authed POST through the session request. */
async function publicationPost(
  id: string,
  op: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return send("POST", `/beam-ux-entries/${id}/${op}`, payload);
}

const imageClient = {
  async listImages(id: string) {
    return await send('GET', `/beam-ux-entries/${encodeURIComponent(id)}/media`) as import('@splicewire/beam-ux').EntryImageLibraryData;
  },
  async uploadImage(id: string, file: File) {
    const body = new FormData();body.append('file',file);
    const res = await fetch(`/beam-ux-entries/${encodeURIComponent(id)}/upload-image`, {
      method:'POST',credentials:'same-origin',headers:{Accept:'application/json',...xsrfHeader()},body,
    });
    return await readData(res, 'uploaded image') as import('@splicewire/beam-ux').EntryImageData;
  },
};

export const bodyClient: UxBuilderClient = {
  get componentCapabilities() { const client=getBeamInertiaConfig().entryClient ?? defaultBodyClient;return client.componentCapabilities?.bind(client); },
  get createComponent() { const client=getBeamInertiaConfig().entryClient ?? defaultBodyClient;return client.createComponent?.bind(client); },
  get duplicateComponent() { const client=getBeamInertiaConfig().entryClient ?? defaultBodyClient;return client.duplicateComponent?.bind(client); },
  get canvasBindings() {
    const client = getBeamInertiaConfig().entryClient ?? defaultBodyClient;
    return client.canvasBindings?.bind(client);
  },
  get listImages() {
    const client = getBeamInertiaConfig().entryClient ?? imageClient;
    return client.listImages?.bind(client);
  },
  get uploadImage() {
    const client = getBeamInertiaConfig().entryClient ?? imageClient;
    return client.uploadImage?.bind(client);
  },
  get createRelease() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.createRelease?.bind(client);
  },
  get printSource() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.printSource?.bind(client);
  },
  get readSource() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.readSource?.bind(client);
  },

  get inspectReleaseFile() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.inspectReleaseFile?.bind(client);
  },
  get takeReleaseFile() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.takeReleaseFile?.bind(client);
  },
  get restoreMissingReleaseFile() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.restoreMissingReleaseFile?.bind(client);
  },
  get remirrorReleaseFile() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.remirrorReleaseFile?.bind(client);
  },
  get takeAllReleaseFiles() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.takeAllReleaseFiles?.bind(client);
  },
  get recordReleaseFile() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.recordReleaseFile?.bind(client);
  },
  get listReleases() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.listReleases?.bind(client);
  },
  get releaseCommand() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.releaseCommand?.bind(client);
  },
  get removeRedirect() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.removeRedirect?.bind(client);
  },

  get makeEditable() {
    const client = getBeamInertiaConfig().entryClient ?? defaultBodyClient;
    return client.makeEditable?.bind(client);
  },
  get saveBlocks() {
    const client = getBeamInertiaConfig().entryClient ?? defaultBodyClient;
    return client.saveBlocks?.bind(client);
  },
  loadBody: (id) =>
    (getBeamInertiaConfig().entryClient ?? defaultBodyClient).loadBody(id),
  saveBody: (id, body) =>
    (getBeamInertiaConfig().entryClient ?? defaultBodyClient).saveBody(
      id,
      body,
    ),
  // Configuration is read at use time, as for load/save. An injected client's missing methods
  // stay absent; only the default starter client supplies the default publication routes.
  get listVersions() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.listVersions?.bind(client);
  },
  get previewVersion() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.previewVersion?.bind(client);
  },
  get saveDraft() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.saveDraft?.bind(client);
  },
  get publish() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.publish?.bind(client);
  },
  get restoreVersion() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.restoreVersion?.bind(client);
  },
  get clearBody() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.clearBody?.bind(client);
  },
};
