import {
  Badge
} from "./chunk-O7ZKQDZR.js";
import {
  jsonHeaders
} from "./chunk-QMLU62K5.js";
import {
  Label
} from "./chunk-563T736C.js";
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";

// src/platform/client.ts
function unwrap(body, url) {
  if (body && typeof body === "object" && "data" in body) {
    return body.data;
  }
  throw new Error(`${url} answered a body with no data envelope.`);
}
function createPlatformConnectionClient(endpoints) {
  async function post(url, body) {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: jsonHeaders(),
      body: body === void 0 ? "{}" : JSON.stringify(body)
    });
    if (!response.ok) {
      let message = `The request failed (${response.status}).`;
      try {
        const payload = await response.json();
        if (typeof payload?.message === "string" && payload.message !== "") {
          message = payload.message;
        }
      } catch {
      }
      throw new Error(message);
    }
    return unwrap(await response.json(), url);
  }
  return {
    connect: (label) => post(endpoints.connect, { label }),
    poll: () => post(endpoints.poll),
    check: () => post(endpoints.check),
    disconnect: () => post(endpoints.disconnect)
  };
}

// src/platform/platform-connection-panel.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var STATE_COPY = {
  unpaired: {
    label: "Not connected",
    tone: "bg-muted text-muted-foreground",
    blurb: "This site holds no platform credential. Start a pairing to connect it to your tower."
  },
  pending: {
    label: "Awaiting approval",
    tone: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    blurb: "A pairing request is open. Approve it on the tower with the code below."
  },
  paired: {
    label: "Connected",
    tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    blurb: "This site holds a live platform credential."
  },
  denied: {
    label: "Denied",
    tone: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
    blurb: "The pairing request was refused at the tower. Nothing new was issued \u2014 any credential this site already held is untouched, and is shown below. You can request a new code."
  },
  expired: {
    label: "Expired",
    tone: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
    blurb: "The pairing code ran out before anyone answered it. Nothing was refused, and any credential this site already held is untouched. Request a new code."
  },
  revoked: {
    label: "Revoked",
    tone: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
    blurb: "The platform has refused this site\u2019s credential \u2014 it was revoked at the tower. The stale credential is still stored here; pair again to restore the connection."
  }
};
function Row({ label, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5 text-sm", children: [
    /* @__PURE__ */ jsx("span", { className: "w-36 shrink-0 text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: "min-w-0 break-all", children })
  ] });
}
function PlatformConnectionPanel({
  connection: initial,
  endpoints,
  client: injected,
  pollIntervalMs = 5e3
}) {
  const client = useMemo(
    () => injected ?? createPlatformConnectionClient(endpoints),
    [injected, endpoints]
  );
  const [connection, setConnection] = useState(initial);
  const [health, setHealth] = useState(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const run = useCallback(
    async (name, work, settle) => {
      setBusy(name);
      setError(null);
      try {
        const value = await work();
        if (live.current) settle(value);
      } catch (e) {
        if (live.current) setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (live.current) setBusy(null);
      }
    },
    []
  );
  const onConnect = () => run("connect", () => client.connect(label.trim() === "" ? null : label.trim()), (next) => {
    setConnection(next);
    setHealth(null);
  });
  const onDisconnect = () => run("disconnect", () => client.disconnect(), (next) => {
    setConnection(next);
    setHealth(null);
  });
  const onCheck = () => run("check", () => client.check(), (result) => {
    setHealth(result);
    if (result.status === 401) {
      void client.poll().then((next) => {
        if (live.current) setConnection(next);
      });
    }
  });
  useEffect(() => {
    if (connection.state !== "pending") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await client.poll();
        if (!cancelled && live.current) setConnection(next);
      } catch {
      }
    };
    const handle = window.setInterval(() => void tick(), pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [connection.state, client, pollIntervalMs]);
  const copy = STATE_COPY[connection.state];
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-6 py-10", "data-testid": "platform-connection", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold", children: "Splicewire connection" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "How this site pairs with Splicewire, and whether the connection works." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsx(Badge, { className: copy.tone, "data-testid": "connection-state", children: copy.label }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", "data-testid": "connection-state-value", children: connection.state })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", "data-testid": "connection-blurb", children: copy.blurb }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-border pt-3", children: [
        /* @__PURE__ */ jsx(Row, { label: "Platform", children: /* @__PURE__ */ jsx("span", { "data-testid": "platform-url", children: connection.platformUrl ?? "Not configured" }) }),
        (connection.state === "paired" || connection.state === "revoked") && /* @__PURE__ */ jsx(Row, { label: "Paired as", children: /* @__PURE__ */ jsx("span", { "data-testid": "platform-identity", children: connection.identity ? `${connection.identity.name ?? "Unknown"} (${connection.identity.email ?? "\u2014"})` : connection.identityError ?? // A revoked pairing cannot name its other end: the probe that
        // would is the same call the platform is refusing. "Not yet
        // confirmed" would read as "still checking" for something that
        // will never resolve while the credential stands.
        (connection.state === "revoked" ? "Cannot be confirmed \u2014 the platform refuses this credential" : "Not yet confirmed") }) }),
        connection.label && /* @__PURE__ */ jsx(Row, { label: "Label", children: connection.label }),
        /* @__PURE__ */ jsx(Row, { label: "Credential stored", children: /* @__PURE__ */ jsx("span", { "data-testid": "token-present", children: connection.tokenPresent ? "Yes" : "No" }) })
      ] })
    ] }),
    connection.state === "pending" && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "mt-4 rounded-xl border border-border bg-card p-5",
        "data-testid": "pending-panel",
        children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs tracking-wide text-muted-foreground uppercase", children: "Enter this code at the tower" }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "mt-2 font-mono text-3xl font-semibold tracking-widest",
              "data-testid": "user-code",
              children: connection.userCode
            }
          ),
          connection.verificationUri && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm", children: /* @__PURE__ */ jsx(
            "a",
            {
              className: "underline",
              "data-testid": "verification-uri",
              href: connection.verificationUriComplete ?? connection.verificationUri,
              target: "_blank",
              rel: "noreferrer",
              children: connection.verificationUri
            }
          ) }),
          connection.expiresAt && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
            "This code expires at",
            " ",
            new Date(connection.expiresAt).toLocaleTimeString(),
            "."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "secondary",
                disabled: busy !== null,
                onClick: () => run("poll", () => client.poll(), setConnection),
                children: "Check now"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                disabled: busy !== null,
                onClick: onDisconnect,
                children: "Cancel"
              }
            )
          ] })
        ]
      }
    ),
    connection.state !== "pending" && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: connection.state === "paired" ? "Re-pair this site" : "Pair this site" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "The tower names the credential it issues after this label, so make it something you will recognise when you come to revoke it." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-end gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grow", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "pairing-label", children: "Label" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "pairing-label",
              "data-testid": "pairing-label",
              value: label,
              placeholder: "this site\u2019s hostname",
              onChange: (e) => setLabel(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            "data-testid": "connect",
            disabled: busy !== null || connection.platformUrl === null,
            onClick: onConnect,
            children: busy === "connect" ? "Requesting\u2026" : "Start pairing"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Connection check" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Ask Splicewire to answer with this site\u2019s credential. A refused credential shows here as revoked." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            "data-testid": "check-connection",
            variant: "secondary",
            disabled: busy !== null || !connection.tokenPresent,
            onClick: onCheck,
            children: busy === "check" ? "Checking\u2026" : "Check connection"
          }
        ),
        health && /* @__PURE__ */ jsx(
          "p",
          {
            className: health.ok ? "text-sm text-muted-foreground" : "text-sm text-red-700 dark:text-red-400",
            "data-testid": "connection-health",
            children: health.ok ? `The connection works. Checked at ${new Date(health.checkedAt).toLocaleTimeString()}.` : health.error ?? `Splicewire answered ${health.status ?? "nothing"}.`
          }
        )
      ] })
    ] }),
    connection.tokenPresent && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Disconnect" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
        "Clears the credential stored on this site. It does",
        " ",
        /* @__PURE__ */ jsx("strong", { children: "not" }),
        " revoke the credential at the tower \u2014 revoke it there too, or anyone holding a copy can still use it."
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          className: "mt-3",
          variant: "destructive",
          "data-testid": "disconnect",
          disabled: busy !== null,
          onClick: onDisconnect,
          children: busy === "disconnect" ? "Clearing\u2026" : "Disconnect this site"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx(
      "p",
      {
        className: "mt-4 text-sm text-red-700 dark:text-red-400",
        "data-testid": "panel-error",
        children: error
      }
    )
  ] });
}

export {
  createPlatformConnectionClient,
  PlatformConnectionPanel
};
//# sourceMappingURL=chunk-CPMRENLV.js.map