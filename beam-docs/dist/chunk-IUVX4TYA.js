// src/publications.ts
import { createFormValidator } from "@schemastud/seam";

// src/generated/publication.schema.json
var publication_schema_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    id: {
      type: "string"
    },
    version: {
      type: "string"
    },
    status: {
      $ref: "#/$defs/PublicationStatus"
    },
    sha256: {
      type: "string"
    },
    namespace: {
      type: "string"
    },
    slug: {
      type: "string"
    },
    isPrivate: {
      type: "boolean"
    },
    registryUrl: {
      type: [
        "string",
        "null"
      ]
    },
    error: {
      type: [
        "string",
        "null"
      ]
    },
    createdAt: {
      type: [
        "string",
        "null"
      ]
    },
    startedAt: {
      type: [
        "string",
        "null"
      ]
    },
    finishedAt: {
      type: [
        "string",
        "null"
      ]
    },
    retryOf: {
      type: [
        "string",
        "null"
      ]
    }
  },
  required: [
    "id",
    "version",
    "status",
    "sha256",
    "namespace",
    "slug",
    "isPrivate",
    "registryUrl",
    "error",
    "createdAt",
    "startedAt",
    "finishedAt",
    "retryOf"
  ],
  $id: "PublicationData",
  $defs: {
    PublicationStatus: {
      type: "string",
      enum: [
        "queued",
        "running",
        "succeeded",
        "failed"
      ]
    }
  }
};

// src/publications.ts
var DocsRequestError = class extends Error {
};
function requestMessage(status) {
  if (status === 401 || status === 403) return "You do not have permission to manage documentation publications.";
  if (status === 419) return "Your session has expired. Reload this page and try again.";
  if (status === 422) return "Check the release version and publication settings, then try again.";
  if (status === 409) return "This publication cannot be started again. Refresh its status.";
  if (status === 404) return "Documentation publishing is unavailable on this site.";
  return "The publication request failed. Try again or check the publishing service.";
}
var fetchDocs = async (url, init = {}) => {
  const target = new URL(url, window.location.href);
  if (target.origin !== window.location.origin) {
    throw new DocsRequestError("Documentation requests must use this site\u2019s origin.");
  }
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== void 0) headers.set("Content-Type", "application/json");
  if ((init.method ?? "GET").toUpperCase() !== "GET") {
    const cookie = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("XSRF-TOKEN="));
    const meta = document.querySelector('meta[name="csrf-token"]')?.content;
    if (cookie) {
      try {
        headers.set("X-XSRF-TOKEN", decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)));
      } catch {
        throw new DocsRequestError("Your session token is invalid. Reload this page and try again.");
      }
    } else if (meta) {
      headers.set("X-CSRF-TOKEN", meta);
    }
  }
  const response = await fetch(target.href, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error"
  });
  if (!response.ok) throw new DocsRequestError(requestMessage(response.status));
  return response.json();
};
function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var validator;
var schema = publication_schema_default;
function publication(value) {
  validator ??= createFormValidator();
  if (!validator.isValid(schema, value, schema)) {
    throw new DocsRequestError("The publishing service returned an unreadable status. Refresh and try again.");
  }
  return value;
}
function data(value) {
  if (!record(value) || !("data" in value)) {
    throw new DocsRequestError("The publishing service returned an unreadable response. Refresh and try again.");
  }
  return value.data;
}
function createDocsPublicationsClient(endpoint = "/beam/docs/publications", transport = fetchDocs) {
  const base = endpoint.replace(/\/$/, "");
  return {
    async list(signal) {
      const result = data(await transport(base, { signal }));
      if (!Array.isArray(result)) throw new DocsRequestError("The publishing service returned an unreadable list.");
      return result.map(publication);
    },
    async get(id, signal) {
      return publication(data(await transport(`${base}/${encodeURIComponent(id)}`, { signal })));
    },
    async publish(version, signal) {
      return publication(data(await transport(base, {
        method: "POST",
        body: JSON.stringify({ version }),
        signal
      })));
    },
    async retry(id, signal) {
      return publication(data(await transport(`${base}/${encodeURIComponent(id)}/retry`, {
        method: "POST",
        body: JSON.stringify({}),
        signal
      })));
    }
  };
}
function scalarRegistryUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "registry.scalar.com" && url.port === "" && url.username === "" && url.password === "" ? url.href : null;
  } catch {
    return null;
  }
}
async function fetchRegistryLink(endpoint, transport, signal) {
  const result = data(await transport(endpoint, { signal }));
  return record(result) && typeof result.url === "string" ? scalarRegistryUrl(result.url) : null;
}
function publicationRequestMessage(error) {
  return error instanceof DocsRequestError ? error.message : "Could not reach the publishing service. Check your connection and try again.";
}

// src/DocsPublishingPanel.tsx
import { SchemaForm } from "@schemastud/seam";
import { useEffect, useId, useMemo, useRef, useState } from "react";

// src/config.ts
var configuration = { registryLinkEndpoint: null, searchEndpoint: null };
function docsConfiguration() {
  return configuration;
}
function setDocsConfiguration(next) {
  configuration = next;
}

// src/publishing-css.ts
var PUBLISHING_CSS = `
.beam-docs-publishing-page { width: 100%; max-width: 64rem; margin-inline: auto; padding: clamp(1.25rem, 4vw, 3rem); }
.beam-docs-publishing-page > header { margin-bottom: 2.5rem; }
.beam-docs-publishing-page h1 { margin: 0 0 0.75rem; font-size: clamp(1.75rem, 3vw, 2.25rem); line-height: 1.2; font-weight: 650; text-wrap: balance; }
.beam-docs-back { display: inline-block; margin-bottom: 1.5rem; }
.beam-docs-publishing { color: var(--foreground, CanvasText); font: inherit; line-height: 1.5; }
.beam-docs-publishing h2 { margin: 0; font-size: 1.125rem; font-weight: 650; }
.beam-docs-publishing h3 { margin: 0; font-size: 1rem; font-weight: 650; overflow-wrap: anywhere; }
.beam-docs-publishing p { margin: 0.375rem 0 0; max-width: 72ch; }
.beam-docs-help { color: var(--muted-foreground, CanvasText); font-size: 0.875rem; }
.beam-docs-publish-form { padding-bottom: 2rem; }
.beam-docs-publish-controls { display: flex; align-items: end; flex-wrap: wrap; gap: 0.75rem; margin-block: 1.25rem 0.75rem; }
.beam-docs-publish-controls > .rjsf-field { flex: 1 1 16rem; max-width: 25rem; }
.beam-docs-version-field { flex: 1 1 16rem; max-width: 25rem; }
.beam-docs-version-field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 600; }
.beam-docs-publishing input { width: 100%; min-height: 2.75rem; box-sizing: border-box; border: 1px solid var(--input, currentColor); border-radius: var(--radius, 0.375rem); padding: 0.625rem 0.75rem; color: inherit; background: var(--background, Canvas); font: inherit; }
.beam-docs-publishing input::placeholder { color: var(--muted-foreground, GrayText); opacity: 1; }
.beam-docs-publishing button { min-height: 2.75rem; border: 1px solid transparent; border-radius: var(--radius, 0.375rem); padding: 0.625rem 1rem; background: var(--primary, CanvasText); color: var(--primary-foreground, Canvas); font: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.beam-docs-publishing button:hover:not(:disabled) { filter: brightness(0.92); }
.beam-docs-publishing .beam-docs-secondary { background: var(--background, Canvas); color: inherit; border-color: var(--border, currentColor); }
.beam-docs-publishing button:disabled { opacity: 0.55; cursor: default; }
.beam-docs-publishing :is(button,input,a):focus-visible, .beam-docs-back:focus-visible { outline: 2px solid var(--ring, Highlight); outline-offset: 3px; }
.beam-docs-publishing a, .beam-docs-back { color: inherit; text-decoration: underline; text-underline-offset: 0.2em; font-size: 0.875rem; }
.beam-docs-error { color: var(--destructive, CanvasText); overflow-wrap: anywhere; }
.beam-docs-announcement:empty { display: none; }
.beam-docs-attempts-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border, currentColor); }
.beam-docs-attempts { padding: 0; margin: 1rem 0 0; list-style: none; }
.beam-docs-attempt { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 1rem; padding-block: 1.25rem; border-bottom: 1px solid var(--border, currentColor); }
.beam-docs-attempt-summary { min-width: 0; overflow-wrap: anywhere; }
.beam-docs-attempt-meta { display: flex; flex-wrap: wrap; gap: 0.375rem 1rem; color: var(--muted-foreground, CanvasText); font-size: 0.8125rem; }
.beam-docs-attempt-meta code { font-size: inherit; }
.beam-docs-attempt-actions { display: flex; flex-direction: column; align-items: end; gap: 0.625rem; }
.beam-docs-attempt-status { font-size: 0.875rem; font-weight: 600; text-transform: capitalize; }
.beam-docs-attempt-status[data-status='failed'] { color: var(--destructive, CanvasText); }
.beam-docs-attempt-error { grid-column: 1 / -1; overflow-wrap: anywhere; }
.beam-docs-empty { padding-block: 1.25rem; }
@media (max-width: 36rem) {
  .beam-docs-version-field, .beam-docs-publish-controls > .rjsf-field { max-width: none; }
  .beam-docs-publish-controls > button { width: 100%; }
  .beam-docs-attempt { grid-template-columns: minmax(0,1fr); }
  .beam-docs-attempt-actions { flex-direction: row; align-items: center; flex-wrap: wrap; justify-content: space-between; }
}
`;

// src/generated/publish-input.schema.json
var publish_input_schema_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    version: {
      type: "string",
      title: "Release version",
      maxLength: 128,
      pattern: "^[A-Za-z0-9][A-Za-z0-9._+-]*(?![\\s\\S])"
    }
  },
  required: [
    "version"
  ],
  $id: "PublishInputData"
};

// src/DocsPublishingPanel.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var active = (attempt) => attempt.status === "queued" || attempt.status === "running";
function mergeAttempts(current, incoming) {
  const rows = new Map(current.map((row) => [row.id, row]));
  for (const row of incoming) {
    const previous = rows.get(row.id);
    if (previous && (!active(previous) || previous.status === "running" && row.status === "queued")) continue;
    rows.set(row.id, row);
  }
  return [...rows.values()].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.id.localeCompare(a.id));
}
function PublishFields({ properties }) {
  return /* @__PURE__ */ jsx("div", { className: "beam-docs-version-field", children: properties.map((property) => property.content) });
}
function DocsPublishingPanel({
  endpoint = "/beam/docs/publications",
  transport,
  pollIntervalMs = 2e3,
  className
}) {
  const fetcher = transport ?? docsConfiguration().transport ?? fetchDocs;
  const client = useMemo(() => createDocsPublicationsClient(endpoint, fetcher), [endpoint, fetcher]);
  const inputId = useId();
  const [version, setVersion] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);
  const request = useRef(null);
  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setAttempts([]);
    setActionError(null);
    setAnnouncement("");
    setSubmitting(false);
  }, [client]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    client.list(controller.signal).then((rows) => {
      if (!controller.signal.aborted) setAttempts((current) => mergeAttempts(current, rows));
    }).catch((error) => {
      if (!controller.signal.aborted) setLoadError(publicationRequestMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [client, reload]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const pending = attempts.filter(active);
    if (pending.length === 0) return;
    const controller = new AbortController();
    let timer;
    const delay = Math.max(250, pollIntervalMs);
    const poll = async () => {
      const results = await Promise.allSettled(pending.map((row) => client.get(row.id, controller.signal)));
      if (controller.signal.aborted) return;
      const updates = [];
      let failure = null;
      for (const result of results) {
        if (result.status === "fulfilled") updates.push(result.value);
        else failure = publicationRequestMessage(result.reason);
      }
      setLoadError(failure);
      if (updates.length) setAttempts((current) => mergeAttempts(current, updates));
      timer = setTimeout(poll, delay);
    };
    timer = setTimeout(poll, delay);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [attempts, client, pollIntervalMs]);
  const submit = async (retry) => {
    if (request.current) return;
    const release = version.trim();
    if (!retry && release === "") {
      setActionError("Enter a release version.");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setSubmitting(true);
    setActionError(null);
    setAnnouncement("");
    try {
      const row = retry ? await client.retry(retry.id, controller.signal) : await client.publish(release, controller.signal);
      if (controller.signal.aborted) return;
      setAttempts((current) => mergeAttempts(current, [row]));
      setAnnouncement(`Publication ${row.status} for ${row.version}.`);
      if (!retry) setVersion("");
    } catch (error) {
      if (!controller.signal.aborted) setActionError(publicationRequestMessage(error));
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("section", { className: ["beam-docs-publishing", className].filter(Boolean).join(" "), "aria-label": "Documentation publishing", children: [
    /* @__PURE__ */ jsx("style", { children: PUBLISHING_CSS }),
    /* @__PURE__ */ jsxs("div", { className: "beam-docs-publish-form", children: [
      /* @__PURE__ */ jsx("h2", { children: "Publish a release" }),
      /* @__PURE__ */ jsx("p", { className: "beam-docs-help", children: "Publish the current API specification to Scalar Registry under a release version." }),
      /* @__PURE__ */ jsx(
        SchemaForm,
        {
          idPrefix: inputId,
          className: "beam-docs-publish-controls",
          schema: publish_input_schema_default,
          formData: { version },
          uiSchema: { version: { "ui:placeholder": "e.g. v1.2.0", "ui:autocomplete": "off" } },
          templates: { ObjectFieldTemplate: PublishFields },
          disabled: submitting,
          showErrorList: false,
          noHtml5Validate: true,
          transformErrors: (errors) => errors.map((error) => error.name === "pattern" ? { ...error, message: "Enter a release version such as v1.2.3 or 1.2.3+build.4." } : error),
          onChange: ({ formData }) => setVersion(String(formData.version ?? "").trim()),
          onSubmit: () => void submit(),
          children: /* @__PURE__ */ jsx("button", { type: "submit", disabled: submitting || !version.trim(), children: submitting ? "Submitting\u2026" : "Publish release" })
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "beam-docs-help", children: "Existing Registry versions are never overwritten." }),
      actionError && /* @__PURE__ */ jsx("p", { role: "alert", className: "beam-docs-error", children: actionError }),
      /* @__PURE__ */ jsx("p", { role: "status", className: "beam-docs-announcement", children: announcement })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "beam-docs-attempts-heading", children: [
      /* @__PURE__ */ jsx("h2", { children: "Recent publications" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "beam-docs-secondary", disabled: loading, onClick: () => setReload((value) => value + 1), children: loading ? "Refreshing\u2026" : "Refresh status" })
    ] }),
    loadError && /* @__PURE__ */ jsx("p", { role: "alert", className: "beam-docs-error", children: loadError }),
    loading && attempts.length === 0 && /* @__PURE__ */ jsx("p", { role: "status", children: "Loading publications\u2026" }),
    !loading && !loadError && attempts.length === 0 && /* @__PURE__ */ jsx("p", { className: "beam-docs-empty", children: "No releases have been published yet. Enter a version to publish the first one." }),
    /* @__PURE__ */ jsx("ol", { className: "beam-docs-attempts", "aria-label": "Publication attempts", "aria-live": "polite", children: attempts.map((attempt) => {
      const registryUrl = attempt.status === "succeeded" ? scalarRegistryUrl(attempt.registryUrl) : null;
      return /* @__PURE__ */ jsxs("li", { className: "beam-docs-attempt", "data-publication-id": attempt.id, children: [
        /* @__PURE__ */ jsxs("div", { className: "beam-docs-attempt-summary", children: [
          /* @__PURE__ */ jsx("h3", { children: attempt.version }),
          /* @__PURE__ */ jsxs("p", { className: "beam-docs-help", children: [
            attempt.namespace,
            " / ",
            attempt.slug
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "beam-docs-attempt-meta", children: [
            /* @__PURE__ */ jsx("span", { children: attempt.isPrivate ? "Private" : "Public" }),
            attempt.createdAt && /* @__PURE__ */ jsx("time", { dateTime: attempt.createdAt, children: formatDate(attempt.createdAt) }),
            /* @__PURE__ */ jsx("code", { title: `SHA-256: ${attempt.sha256}`, children: attempt.sha256.slice(0, 12) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "beam-docs-attempt-actions", children: [
          /* @__PURE__ */ jsx("span", { className: "beam-docs-attempt-status", "data-status": attempt.status, children: attempt.status }),
          registryUrl && /* @__PURE__ */ jsx("a", { href: registryUrl, target: "_blank", rel: "noopener noreferrer", children: "View in Scalar Registry" }),
          attempt.status === "failed" && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "beam-docs-secondary",
              disabled: submitting,
              "aria-label": `Retry ${attempt.version}`,
              onClick: () => void submit(attempt),
              children: "Retry publication"
            }
          )
        ] }),
        attempt.status === "failed" && /* @__PURE__ */ jsxs("div", { className: "beam-docs-attempt-error", children: [
          /* @__PURE__ */ jsx("p", { children: attempt.error?.slice(0, 2e3) || "The publication failed. Check the publishing service before retrying." }),
          /* @__PURE__ */ jsx("p", { className: "beam-docs-help", children: "Retry uses the same captured specification and destination." })
        ] })
      ] }, attempt.id);
    }) })
  ] });
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export {
  docsConfiguration,
  setDocsConfiguration,
  fetchDocs,
  createDocsPublicationsClient,
  scalarRegistryUrl,
  fetchRegistryLink,
  DocsPublishingPanel
};
//# sourceMappingURL=chunk-IUVX4TYA.js.map