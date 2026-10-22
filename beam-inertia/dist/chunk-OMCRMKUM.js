import {
  getBeamInertiaConfig
} from "./chunk-2XTQOEA4.js";

// src/editor/transport.ts
function csrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
async function readData(res, what) {
  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    throw Object.assign(new Error(problem.message || `${what} ${res.status}`), { status: res.status });
  }
  return (await res.json()).data;
}
var defaultBodyClient = {
  makeEditable: async (slug, body) => {
    const res = await fetch("/beam-ux-entries/make-editable", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": csrfToken() },
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
  const response = await fetch(`/beam-ux-release-files/${encodeURIComponent(memberId)}/${op}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": csrfToken() },
    body: JSON.stringify(input)
  });
  return await readData(response, op);
}
var publicationClient = {
  inspectReleaseFile: async (memberId) => {
    const response = await fetch(`/beam-ux-release-files/${encodeURIComponent(memberId)}/inspect-file`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    return await readData(response, "file inspection");
  },
  takeReleaseFile: (id, input) => reconcilePost(id, "take-file-draft", input),
  restoreMissingReleaseFile: (id, input) => reconcilePost(id, "restore-missing-file", input),
  recordReleaseFile: async (memberId, releaseId) => {
    const response = await fetch(`/beam-ux-release-files/${encodeURIComponent(memberId)}/commit-now`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": csrfToken() },
      body: JSON.stringify({ releaseId })
    });
    return await readData(response, "recording");
  },
  listReleases: async () => {
    const response = await fetch("/beam-ux-releases", { credentials: "same-origin", headers: { Accept: "application/json" } });
    return await readData(response, "releases");
  },
  releaseCommand: async (id, command) => {
    const response = await fetch(`/beam-ux-releases/${id}/command`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": csrfToken() },
      body: JSON.stringify(command)
    });
    return await readData(response, "release");
  },
  listVersions: async (id) => {
    const res = await fetch(`/beam-ux-entries/${id}/versions`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });
    return await readData(res, "versions");
  },
  saveDraft: async (id, body, baseVersion, label) => await publicationPost(id, "save-draft", { body, baseVersion, label }),
  publish: async (id, ref, label) => await publicationPost(id, "publish", { ref, label }),
  restoreVersion: async (id, ref, label) => await publicationPost(id, "restore", { ref, label }),
  // `clear-body` — remove the page's content and return the entry to unauthored. Not the same act as
  // `save-body` with `[]`, which stores an authored empty document. Same ability (`ux.author`).
  clearBody: async (id, label) => await publicationPost(id, "clear-body", { label })
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
var bodyClient = {
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
  get makeEditable() {
    const client = getBeamInertiaConfig().entryClient ?? defaultBodyClient;
    return client.makeEditable?.bind(client);
  },
  loadBody: (id) => (getBeamInertiaConfig().entryClient ?? defaultBodyClient).loadBody(id),
  saveBody: (id, body) => (getBeamInertiaConfig().entryClient ?? defaultBodyClient).saveBody(id, body),
  // Configuration is read at use time, as for load/save. An injected client's missing methods
  // stay absent; only the default starter client supplies the default publication routes.
  get listVersions() {
    const client = getBeamInertiaConfig().entryClient ?? publicationClient;
    return client.listVersions?.bind(client);
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
//# sourceMappingURL=chunk-OMCRMKUM.js.map