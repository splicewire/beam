import {
  getBeamInertiaConfig
} from "./chunk-XP5YRUDH.js";

// src/editor/transport.ts
function csrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
async function readData(res, what) {
  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    throw Object.assign(new Error(problem.message || `${what} ${res.status}`), {
      status: res.status
    });
  }
  return (await res.json()).data;
}
var defaultBodyClient = {
  componentCapabilities: async (id) => readData(await fetch(`/beam-ux-entries/${id}/component-capabilities`, { credentials: "same-origin", headers: { Accept: "application/json" } }), "component capabilities"),
  createComponent: async (id, input) => readData(await fetch(`/beam-ux-entries/${id}/create-component`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": csrfToken() }, body: JSON.stringify(input) }), "create component"),
  duplicateComponent: async (id) => readData(await fetch(`/beam-ux-entries/${id}/duplicate-component`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": csrfToken() }, body: JSON.stringify({}) }), "duplicate component"),
  canvasBindings: async (id, body, recordValue, options) => {
    const response = await fetch(`/beam-ux-entries/${id}/canvas-bindings`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": csrfToken() },
      body: JSON.stringify({ body, recordValue: recordValue ?? null }),
      ...options?.signal ? { signal: options.signal } : {}
    });
    return await readData(response, "canvas bindings");
  },
  makeEditable: async (slug, body) => {
    const res = await fetch("/beam-ux-entries/make-editable", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-XSRF-TOKEN": csrfToken()
      },
      body: JSON.stringify({ slug, body })
    });
    return await readData(res, "make-editable");
  },
  /**
   * The read is a GET with NO query string, deliberately: `EntryBodyShowOp` declares `input: false`,
   * and beam's operation controller rejects a GET carrying any query key with a 422. The retired
   * `?namespace=` disambiguator is therefore not merely ignored — appending one fails loudly.
   */
  loadBody: async (id) => {
    const res = await fetch(`/beam-ux-entries/${id}/body`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });
    return await readData(res, "load");
  },
  saveBlocks: async (id, body) => {
    const request = {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-XSRF-TOKEN": csrfToken()
      },
      body: JSON.stringify({ body })
    };
    let response = await fetch(`/beam-ux-entries/${id}/save-blocks`, request);
    if (response.status === 404 || response.status === 405) {
      response = await fetch(`/beam-ux-entries/${id}/save-body`, request);
    }
    return await readData(response, "save-blocks");
  },
  saveBody: async (id, body) => {
    const res = await fetch(`/beam-ux-entries/${id}/save-body`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken(),
        Accept: "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ body })
    });
    return await readData(res, "save");
  }
};
async function reconcilePost(memberId, op, input) {
  const response = await fetch(
    `/beam-ux-release-files/${encodeURIComponent(memberId)}/${op}`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-XSRF-TOKEN": csrfToken()
      },
      body: JSON.stringify(input)
    }
  );
  return await readData(
    response,
    op
  );
}
var publicationClient = {
  createRelease: async (id, title) => await publicationPost(id, "create-release", {
    title
  }),
  printSource: async (id, body) => await publicationPost(id, "print-source", { body }),
  readSource: async (id, source, body) => await publicationPost(id, "read-source", { source, body }),
  inspectReleaseFile: async (memberId) => {
    const response = await fetch(
      `/beam-ux-release-files/${encodeURIComponent(memberId)}/inspect-file`,
      {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      }
    );
    return await readData(
      response,
      "file inspection"
    );
  },
  takeReleaseFile: (id, input) => reconcilePost(id, "take-file-draft", input),
  restoreMissingReleaseFile: (id, input) => reconcilePost(id, "restore-missing-file", input),
  remirrorReleaseFile: (id, input) => reconcilePost(id, "remirror-file", input),
  takeAllReleaseFiles: async (id, input) => {
    const response = await fetch(
      `/beam-ux-release-files/${encodeURIComponent(id)}/take-all-drafts`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": csrfToken()
        },
        body: JSON.stringify(input)
      }
    );
    return await readData(
      response,
      "take-all-drafts"
    );
  },
  recordReleaseFile: async (memberId, releaseId) => {
    const response = await fetch(
      `/beam-ux-release-files/${encodeURIComponent(memberId)}/commit-now`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": csrfToken()
        },
        body: JSON.stringify({ releaseId })
      }
    );
    return await readData(
      response,
      "recording"
    );
  },
  listReleases: async () => {
    const response = await fetch("/beam-ux-releases", {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    return await readData(
      response,
      "releases"
    );
  },
  releaseCommand: async (id, command) => {
    const response = await fetch(`/beam-ux-releases/${id}/command`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-XSRF-TOKEN": csrfToken()
      },
      body: JSON.stringify(command)
    });
    return await readData(
      response,
      "release"
    );
  },
  // ux-0236 d2: an unwanted Redirect a Release left is removed through the Redirect resource.
  removeRedirect: async (id) => {
    const response = await fetch(`/beam-ux-redirects/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { Accept: "application/json", "X-XSRF-TOKEN": csrfToken() }
    });
    if (!response.ok) {
      await readData(response, "redirect");
    }
  },
  listVersions: async (id) => {
    const res = await fetch(`/beam-ux-entries/${id}/versions`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });
    return await readData(res, "versions");
  },
  previewVersion: async (id, versionId) => await publicationPost(id, "preview", { versionId }),
  saveDraft: async (id, body, baseVersion, label, pageSettings) => await publicationPost(id, "save-draft", {
    body,
    baseVersion,
    label,
    ...pageSettings ? { pageSettings } : {}
  }),
  publish: async (id, ref, label) => await publicationPost(id, "publish", {
    ref,
    label
  }),
  restoreVersion: async (id, ref, label) => await publicationPost(id, "restore", {
    ref,
    label
  }),
  // `clear-body` — remove the page's content and return the entry to unauthored. Not the same act as
  // `save-body` with `[]`, which stores an authored empty document. Same ability (`ux.author`).
  clearBody: async (id, label) => await publicationPost(id, "clear-body", {
    label
  })
};
async function publicationPost(id, op, payload) {
  const res = await fetch(`/beam-ux-entries/${id}/${op}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": csrfToken(),
      Accept: "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify(payload)
  });
  return readData(res, op);
}
var imageClient = {
  async listImages(id) {
    const res = await fetch(`/beam-ux-entries/${encodeURIComponent(id)}/media`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    return await readData(res, "entry images");
  },
  async uploadImage(id, file) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/beam-ux-entries/${encodeURIComponent(id)}/upload-image`, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "X-XSRF-TOKEN": csrfToken() },
      body
    });
    return await readData(res, "uploaded image");
  }
};
var bodyClient = {
  get componentCapabilities() {
    const client = getBeamInertiaConfig().entryClient ?? defaultBodyClient;
    return client.componentCapabilities?.bind(client);
  },
  get createComponent() {
    const client = getBeamInertiaConfig().entryClient ?? defaultBodyClient;
    return client.createComponent?.bind(client);
  },
  get duplicateComponent() {
    const client = getBeamInertiaConfig().entryClient ?? defaultBodyClient;
    return client.duplicateComponent?.bind(client);
  },
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
  loadBody: (id) => (getBeamInertiaConfig().entryClient ?? defaultBodyClient).loadBody(id),
  saveBody: (id, body) => (getBeamInertiaConfig().entryClient ?? defaultBodyClient).saveBody(
    id,
    body
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
  }
};

export {
  bodyClient
};
//# sourceMappingURL=chunk-Q3NAZEM2.js.map