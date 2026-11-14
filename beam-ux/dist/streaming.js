// src/streaming/useSseStream.ts
import { xsrfHeader } from "@schemastud/frame/session";
import { useCallback, useEffect, useRef, useState } from "react";
import { readSse } from "@schemastud/chat/core";
function joinUrl(baseURL, path) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(path)) {
    return path;
  }
  if (!baseURL) {
    return path;
  }
  return `${baseURL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
function useSseStream(client, path, options = {}) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  useEffect(() => () => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);
  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setEvents([]);
    setStatus("idle");
    setError(null);
  }, []);
  const start = useCallback(
    (body) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setEvents([]);
      setStatus("streaming");
      setError(null);
      const url = joinUrl(client.defaults.baseURL, path);
      const authHeader = client.defaults.headers?.common?.["Authorization"];
      const auth = typeof authHeader === "string" ? authHeader : "";
      void (async () => {
        try {
          const response = await fetch(url, {
            method: (options.method ?? "post").toUpperCase(),
            headers: {
              Accept: "text/event-stream",
              "Content-Type": "application/json",
              Authorization: auth,
              ...xsrfHeader()
            },
            credentials: "same-origin",
            body: body !== void 0 ? JSON.stringify(body) : void 0,
            signal: controller.signal
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          for await (const frame of readSse(response)) {
            if (abortRef.current !== controller || controller.signal.aborted) {
              return;
            }
            setEvents((prev) => [...prev, frame]);
          }
          if (!controller.signal.aborted) {
            setStatus("done");
          }
        } catch (err) {
          if (abortRef.current !== controller || controller.signal.aborted || err?.name === "AbortError") {
            return;
          }
          setError(err);
          setStatus("error");
        }
      })();
    },
    [client, path, options.method]
  );
  return { events, status, error, start, reset };
}
export {
  useSseStream
};
//# sourceMappingURL=streaming.js.map