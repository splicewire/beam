import {
  surfaceMessage
} from "./chunk-VXVLZYD3.js";
import {
  Badge
} from "./chunk-O7ZKQDZR.js";
import {
  Label
} from "./chunk-563T736C.js";
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/platform/client.ts
function unwrap(body, url) {
  if (body && typeof body === "object" && "data" in body) {
    return body.data;
  }
  throw new Error(`${url} answered a body with no data envelope.`);
}
function createPlatformConnectionClient(request, endpoints) {
  async function post(url, body) {
    return unwrap((await request("POST", url, void 0, body ?? {})).data, url);
  }
  return {
    connect: (label) => post(endpoints.connect, { label }),
    poll: () => post(endpoints.poll),
    check: () => post(endpoints.check),
    disconnect: () => post(endpoints.disconnect)
  };
}

// src/platform/platform-connection-panel.tsx
import { createSessionRequest } from "@schemastud/frame/session";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
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
  const m = useBeamMessages();
  const STATE_COPY = {
    unpaired: {
      label: m.t("splicewire-beam-inertia::messages.surfaces_connection_not_connected"),
      tone: "bg-muted text-muted-foreground",
      blurb: m.t("splicewire-beam-inertia::messages.surfaces_connection_this_site_holds_no_platform_credential_start_a_pairing")
    },
    pending: {
      label: m.t("splicewire-beam-inertia::messages.surfaces_connection_awaiting_approval"),
      tone: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
      blurb: m.t("splicewire-beam-inertia::messages.surfaces_connection_a_pairing_request_is_open_approve_it_on_the_tower_with")
    },
    paired: {
      label: m.t("splicewire-beam-inertia::messages.surfaces_connection_connected"),
      tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
      blurb: m.t("splicewire-beam-inertia::messages.surfaces_connection_this_site_holds_a_live_platform_credential")
    },
    denied: {
      label: m.t("splicewire-beam-inertia::messages.surfaces_connection_denied"),
      tone: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
      blurb: m.t("splicewire-beam-inertia::messages.surfaces_connection_the_pairing_request_was_refused_at_the_tower_nothing_n")
    },
    expired: {
      label: m.t("splicewire-beam-inertia::messages.surfaces_connection_expired"),
      tone: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
      blurb: m.t("splicewire-beam-inertia::messages.surfaces_connection_the_pairing_code_ran_out_before_anyone_answered_it_not")
    },
    revoked: {
      label: m.t("splicewire-beam-inertia::messages.surfaces_connection_revoked"),
      tone: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
      blurb: m.t("splicewire-beam-inertia::messages.surfaces_connection_the_platform_has_refused_this_site_s_credential_it_was")
    }
  };
  const client = useMemo(
    () => injected ?? createPlatformConnectionClient(createSessionRequest(), endpoints),
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
        if (live.current) setError(e instanceof Error ? { raw: e.message } : { fallback: true });
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
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_splicewire_connection") }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_how_this_site_pairs_with_splicewire_and_whether_the_connection_wo") }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsx(Badge, { className: copy.tone, "data-testid": "connection-state", children: copy.label }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", "data-testid": "connection-state-value", children: connection.state })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", "data-testid": "connection-blurb", children: copy.blurb }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-border pt-3", children: [
        /* @__PURE__ */ jsx(Row, { label: m.t("splicewire-beam-inertia::messages.surfaces_connection_platform"), children: /* @__PURE__ */ jsx("span", { "data-testid": "platform-url", children: connection.platformUrl ?? m.t("splicewire-beam-inertia::messages.surfaces_connection_not_configured") }) }),
        (connection.state === "paired" || connection.state === "revoked") && /* @__PURE__ */ jsx(Row, { label: m.t("splicewire-beam-inertia::messages.surfaces_connection_paired_as"), children: /* @__PURE__ */ jsx("span", { "data-testid": "platform-identity", children: connection.identity ? m.t("splicewire-beam-inertia::messages.surfaces_connection_identity", { name: connection.identity.name ?? m.t("splicewire-beam-inertia::messages.surfaces_connection_unknown"), email: connection.identity.email ?? "\u2014" }) : connection.identityError ?? // A revoked pairing cannot name its other end: the probe that
        // would is the same call the platform is refusing. "Not yet
        // confirmed" would read as "still checking" for something that
        // will never resolve while the credential stands.
        (connection.state === "revoked" ? m.t("splicewire-beam-inertia::messages.surfaces_connection_cannot_be_confirmed_the_platform_refuses_this_credenti") : m.t("splicewire-beam-inertia::messages.surfaces_connection_not_yet_confirmed")) }) }),
        connection.label && /* @__PURE__ */ jsx(Row, { label: m.t("splicewire-beam-inertia::messages.surfaces_connection_label"), children: connection.label }),
        /* @__PURE__ */ jsx(Row, { label: m.t("splicewire-beam-inertia::messages.surfaces_connection_credential_stored"), children: /* @__PURE__ */ jsx("span", { "data-testid": "token-present", children: connection.tokenPresent ? m.t("splicewire-beam-inertia::messages.surfaces_connection_yes") : m.t("splicewire-beam-inertia::messages.surfaces_connection_no") }) })
      ] })
    ] }),
    connection.state === "pending" && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "mt-4 rounded-xl border border-border bg-card p-5",
        "data-testid": "pending-panel",
        children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs tracking-wide text-muted-foreground uppercase", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_enter_this_code_at_the_tower") }),
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
          connection.expiresAt && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_expires", { time: new Date(connection.expiresAt).toLocaleTimeString() }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "secondary",
                disabled: busy !== null,
                onClick: () => run("poll", () => client.poll(), setConnection),
                children: m.t("splicewire-beam-inertia::messages.surfaces_connection_check_now")
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                disabled: busy !== null,
                onClick: onDisconnect,
                children: m.t("splicewire-beam-inertia::messages.surfaces_connection_cancel")
              }
            )
          ] })
        ]
      }
    ),
    connection.state !== "pending" && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: connection.state === "paired" ? m.t("splicewire-beam-inertia::messages.surfaces_connection_re_pair_this_site") : m.t("splicewire-beam-inertia::messages.surfaces_connection_pair_this_site") }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_the_tower_names_the_credential_it_issues_after_this_label_so_make") }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-end gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grow", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "pairing-label", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_label") }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "pairing-label",
              "data-testid": "pairing-label",
              value: label,
              placeholder: m.t("splicewire-beam-inertia::messages.surfaces_connection_hostname"),
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
            children: busy === "connect" ? m.t("splicewire-beam-inertia::messages.surfaces_connection_requesting") : m.t("splicewire-beam-inertia::messages.surfaces_connection_start_pairing")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_connection_check") }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_ask_splicewire_to_answer_with_this_site_s_credential_a_refused_cr") }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            "data-testid": "check-connection",
            variant: "secondary",
            disabled: busy !== null || !connection.tokenPresent,
            onClick: onCheck,
            children: busy === "check" ? m.t("splicewire-beam-inertia::messages.surfaces_connection_checking") : m.t("splicewire-beam-inertia::messages.surfaces_connection_check_connection")
          }
        ),
        health && /* @__PURE__ */ jsx(
          "p",
          {
            className: health.ok ? "text-sm text-muted-foreground" : "text-sm text-red-700 dark:text-red-400",
            "data-testid": "connection-health",
            children: health.ok ? m.t("splicewire-beam-inertia::messages.surfaces_connection_works", { time: new Date(health.checkedAt).toLocaleTimeString() }) : health.error ?? (health.status == null ? m.t("splicewire-beam-inertia::messages.surfaces_connection_answered_nothing") : m.t("splicewire-beam-inertia::messages.surfaces_connection_answered", { status: health.status }))
          }
        )
      ] })
    ] }),
    connection.tokenPresent && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: m.t("splicewire-beam-inertia::messages.surfaces_connection_disconnect") }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: surfaceMessage(m, "splicewire-beam-inertia::messages.surfaces_connection_disconnect_explanation", {}, (text) => /* @__PURE__ */ jsx("strong", { children: text })) }),
      /* @__PURE__ */ jsx(
        Button,
        {
          className: "mt-3",
          variant: "destructive",
          "data-testid": "disconnect",
          disabled: busy !== null,
          onClick: onDisconnect,
          children: busy === "disconnect" ? m.t("splicewire-beam-inertia::messages.surfaces_connection_clearing") : m.t("splicewire-beam-inertia::messages.surfaces_connection_disconnect_this_site")
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx(
      "p",
      {
        className: "mt-4 text-sm text-red-700 dark:text-red-400",
        "data-testid": "panel-error",
        children: "raw" in error ? error.raw : m.t("splicewire-beam-inertia::messages.surfaces_connection_something_went_wrong")
      }
    )
  ] });
}

export {
  createPlatformConnectionClient,
  PlatformConnectionPanel
};
//# sourceMappingURL=chunk-2ORJXUEJ.js.map