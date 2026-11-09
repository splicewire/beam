// src/state/page-state.ts
function pageStateOf(transport) {
  if (transport.phase === "in-flight") return { state: "loading", retry: null };
  if (transport.phase === "network-error") return { state: "error", retry: "bounded" };
  const { status } = transport;
  if (status >= 200 && status < 300) {
    if (transport.rows === void 0) return { state: "ready", retry: null };
    return transport.rows > 0 ? { state: "ready", retry: null } : { state: "empty", retry: null, filtered: transport.filtered === true };
  }
  if (status === 401 || status === 403) return { state: "forbidden", retry: "never" };
  if (status === 402) return { state: "upsell", retry: "never" };
  if (status === 404) return { state: "not-found", retry: "never" };
  if (status >= 400 && status < 500) return { state: "error", retry: "never" };
  return { state: "error", retry: "bounded" };
}
function statusOf(error) {
  if (error === null || typeof error !== "object") return null;
  const e = error;
  const status = typeof e.response?.status === "number" ? e.response.status : e.status;
  return typeof status === "number" ? status : null;
}
function messageOf(error) {
  if (error === null || typeof error !== "object") return null;
  const message = error.response?.data?.message;
  return typeof message === "string" && message !== "" ? message : null;
}
function transportOf(query, options = {}) {
  if (query.status === "pending") return { phase: "in-flight" };
  if (query.status === "error") {
    const status = statusOf(query.error);
    return status === null ? { phase: "network-error" } : { phase: "answered", status };
  }
  const list = Array.isArray(query.data) ? query.data : Array.isArray(query.data?.data) ? query.data.data : null;
  if (list === null) return { phase: "answered", status: 200 };
  return options.filtered === void 0 ? { phase: "answered", status: 200, rows: list.length } : { phase: "answered", status: 200, rows: list.length, filtered: options.filtered };
}
function retryUnlessClientError(failureCount, error) {
  const status = statusOf(error);
  if (status !== null && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

export {
  pageStateOf,
  statusOf,
  messageOf,
  transportOf,
  retryUnlessClientError
};
//# sourceMappingURL=chunk-2FFLR2EZ.js.map