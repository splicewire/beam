import {
  getBeamInertiaConfig
} from "./chunk-MTKP2AW3.js";

// src/editor/transport.ts
function csrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
async function readData(res, what) {
  if (!res.ok) {
    throw new Error(`${what} ${res.status}`);
  }
  return (await res.json()).data;
}
var defaultBodyClient = {
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
var publicationClient = {
  listVersions: async (id) => {
    const res = await fetch(`/beam-ux-entries/${id}/versions`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });
    return await readData(res, "versions");
  },
  saveDraft: async (id, body, label) => await publicationPost(id, "save-draft", { body, label }),
  publish: async (id, label) => await publicationPost(id, "publish", { label }),
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
//# sourceMappingURL=chunk-AHQQKX5V.js.map