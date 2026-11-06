// src/IngestProgress.tsx
import { Button } from "@schemastud/ui";

// src/hooks.ts
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var IngestContext = createContext(null);
function IngestProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(IngestContext.Provider, { value: services, children });
}
function useIngestServices() {
  const services = useContext(IngestContext);
  if (!services) throw new Error("IngestProgress requires an IngestProvider.");
  return services;
}

// src/hooks.ts
function isIngestFinished(run) {
  return run.finished || run.status === "completed" || run.status === "failed";
}
function useIngestProgress(run) {
  const services = useIngestServices();
  const notified = useRef(/* @__PURE__ */ new Set());
  const lastError = useRef(null);
  const progress = useQuery({
    queryKey: ["beam-ingest", run.id],
    queryFn: () => services.client.get(run.id),
    initialData: run,
    enabled: (query) => !isIngestFinished(query.state.data ?? run),
    refetchOnMount: (query) => !query.state.error && !isIngestFinished(query.state.data ?? run),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (query) => query.state.error || query.state.data && isIngestFinished(query.state.data) ? false : 1500
  });
  const current = progress.data;
  useEffect(() => {
    if (isIngestFinished(current) && !notified.current.has(current.id)) {
      notified.current.add(current.id);
      services.notify?.({ type: "finished", run: current });
    }
  }, [current, services]);
  useEffect(() => {
    if (progress.isError && (!lastError.current || lastError.current.id !== run.id || lastError.current.updatedAt !== progress.errorUpdatedAt)) {
      lastError.current = { id: run.id, updatedAt: progress.errorUpdatedAt };
      services.onError?.(progress.error);
    }
  }, [progress.isError, progress.error, progress.errorUpdatedAt, services, run.id]);
  return progress;
}

// src/IngestProgress.tsx
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
function IngestProgress({ run }) {
  const progress = useIngestProgress(run);
  const current = progress.data;
  if (progress.isError) {
    return /* @__PURE__ */ jsxs("div", { role: "alert", className: "space-y-3 text-sm", children: [
      /* @__PURE__ */ jsx2("p", { children: progress.error instanceof Error ? progress.error.message : "Could not check import progress." }),
      /* @__PURE__ */ jsx2("p", { className: "text-muted-foreground", children: "The import may still be running." }),
      /* @__PURE__ */ jsx2(
        Button,
        {
          variant: "outline",
          disabled: progress.isFetching,
          onClick: () => void progress.refetch(),
          children: progress.isFetching ? "Checking\u2026" : "Retry"
        }
      )
    ] });
  }
  if (current.status === "failed") {
    return /* @__PURE__ */ jsx2("p", { role: "alert", className: "text-sm text-destructive", children: current.error ?? "Import failed." });
  }
  return /* @__PURE__ */ jsxs("p", { role: "status", className: "text-sm", "aria-live": "polite", children: [
    current.status === "completed" ? "Import completed." : `Import ${current.status}.`,
    current.totalRows != null && /* @__PURE__ */ jsxs(Fragment, { children: [
      " ",
      current.currentRow ?? 0,
      " of ",
      current.totalRows,
      " rows."
    ] })
  ] });
}
export {
  IngestProgress,
  IngestProvider,
  isIngestFinished,
  useIngestProgress,
  useIngestServices
};
//# sourceMappingURL=index.js.map