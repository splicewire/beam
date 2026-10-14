// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var AutoReloadServicesContext = createContext(null);
function consoleNotify(event) {
  if (event.type === "error") console.error(`[auto-reload] ${event.message}`);
  else console.info(`[auto-reload] ${event.message}`);
}
function AutoReloadProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(AutoReloadServicesContext.Provider, { value: services, children });
}
function useAutoReloadServices() {
  const services = useContext(AutoReloadServicesContext);
  if (!services) {
    throw new Error("Auto-reload components must be rendered inside an <AutoReloadProvider>.");
  }
  return services;
}
function useNotify() {
  return useAutoReloadServices().notify ?? consoleNotify;
}
function useSavePaymentMethod() {
  return useAutoReloadServices().onSavePaymentMethod ?? (() => {
  });
}

// src/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
var CONFIG_KEY = ["beam-commerce", "auto-reload"];
var ACTIVITY_KEY = ["beam-commerce", "auto-reload", "activity"];
function useAutoReloadConfig() {
  const { client } = useAutoReloadServices();
  return useQuery({ queryKey: CONFIG_KEY, queryFn: () => client.getConfig() });
}
function useAutoReloadActivity() {
  const { client } = useAutoReloadServices();
  return useQuery({ queryKey: ACTIVITY_KEY, queryFn: () => client.getActivity() });
}
function useUpdateAutoReloadConfig() {
  const { client, onError } = useAutoReloadServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => client.updateConfig(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONFIG_KEY });
      await queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY });
    },
    onError: (err) => onError?.(err)
  });
}

// src/AutoReloadConfigCard.tsx
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Label,
  Switch
} from "@schemastud/ui";
import {
  AlertTriangle,
  ArrowUpCircle,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Target
} from "lucide-react";
import { useEffect, useState } from "react";

// src/format.ts
function formatUsd(value) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "\u2014";
}
function errorMessage(error, fallback = "Something went wrong.") {
  if (!error || typeof error !== "object") return fallback;
  const candidate = error;
  const status = typeof candidate.response?.status === "number" ? candidate.response.status : typeof candidate.status === "number" ? candidate.status : null;
  if (status !== null && status >= 400 && status < 500) {
    const message = candidate.response ? candidate.response.data?.message : candidate.message;
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  return fallback;
}
var COMPONENT_LABELS = {
  SubscriptionFee: "Subscription",
  PerSeatFees: "Seats",
  PerTokenFees: "Token usage"
};
function componentLabel(key) {
  if (!key) return "";
  if (COMPONENT_LABELS[key]) return COMPONENT_LABELS[key];
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// src/AutoReloadConfigCard.tsx
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
function StatusPill({ status, disabledReason }) {
  const map = {
    active: {
      label: "Active",
      cls: "border-primary/25 bg-primary/5 text-foreground",
      dot: "bg-primary"
    },
    suspended: {
      label: "Suspended",
      cls: "border-destructive/30 bg-destructive/5 text-foreground",
      dot: "bg-destructive"
    },
    needs_payment_method: {
      label: "Needs a card",
      cls: "border-warning/40 bg-warning/10 text-warning-foreground",
      dot: "bg-warning"
    },
    off: {
      label: "Off",
      cls: "border-border bg-muted/50 text-muted-foreground",
      dot: "bg-muted-foreground/50"
    }
  };
  const s = status === "needs_payment_method" && disabledReason === "no_payment_method" ? { ...map.needs_payment_method, label: "Add a card" } : map[status] ?? map.off;
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium",
        s.cls
      ),
      children: [
        /* @__PURE__ */ jsx2("span", { className: cn("size-1.5 rounded-full", s.dot) }),
        s.label
      ]
    }
  );
}
function MoneyField({
  id,
  label,
  value,
  onChange,
  help,
  disabled
}) {
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
    /* @__PURE__ */ jsx2(Label, { htmlFor: id, children: label }),
    /* @__PURE__ */ jsxs("div", { className: "relative max-w-[12rem]", children: [
      /* @__PURE__ */ jsx2("span", { className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground", children: "$" }),
      /* @__PURE__ */ jsx2(
        Input,
        {
          id,
          type: "number",
          inputMode: "decimal",
          className: "pl-6 font-mono tabular-nums",
          value: value ?? "",
          disabled,
          onChange: (e) => onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      )
    ] }),
    help && /* @__PURE__ */ jsx2("p", { className: "text-[11px] text-muted-foreground", children: help })
  ] });
}
function ClampHelp({
  raw,
  ceiling,
  effective,
  format = formatUsd
}) {
  const clamped = raw != null && raw > ceiling;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    "Platform max ",
    format(ceiling),
    ".",
    clamped && /* @__PURE__ */ jsxs("span", { className: "font-medium text-warning-foreground", children: [
      " ",
      "Clamped to ",
      format(effective),
      "."
    ] })
  ] });
}
function SegBtn({
  active,
  icon,
  onClick,
  children,
  disabled,
  describedBy
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      "aria-describedby": describedBy,
      className: cn(
        "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      ),
      children: [
        icon,
        children
      ]
    }
  );
}
function CardOnFileRow({
  config,
  onSaveCard,
  disabled,
  describedBy
}) {
  if (config.hasPaymentMethod) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 p-3", children: [
      /* @__PURE__ */ jsx2("span", { className: "grid size-8 flex-none place-items-center rounded-md bg-primary/10 text-primary", children: /* @__PURE__ */ jsx2(CreditCard, { className: "size-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx2("div", { className: "text-sm font-medium", children: "Your card is saved for automatic top-ups" }),
        /* @__PURE__ */ jsx2("div", { className: "text-xs text-muted-foreground", children: "It's only charged when a top-up runs." })
      ] }),
      /* @__PURE__ */ jsx2(Badge, { variant: "outline", className: "text-[11px] font-normal", children: config.paymentMethodSource === "subscription" ? "From subscription" : "Saved card" }),
      /* @__PURE__ */ jsx2(Button, { variant: "outline", size: "sm", onClick: onSaveCard, disabled, "aria-describedby": describedBy, children: "Update card" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-md border border-warning/40 bg-warning/10 p-3", children: [
    /* @__PURE__ */ jsx2("span", { className: "grid size-8 flex-none place-items-center rounded-md bg-warning/20 text-warning-foreground", children: /* @__PURE__ */ jsx2(KeyRound, { className: "size-4" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx2("div", { className: "text-sm font-medium text-warning-foreground", children: "Save a card to turn on automatic top-ups" }),
      /* @__PURE__ */ jsx2("div", { id: "auto-reload-card-requirement", className: "text-xs text-warning-foreground/80", children: "Saving a card requires a billing account. We save it securely with Stripe; you're not charged until a top-up runs." })
    ] }),
    /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: onSaveCard, disabled, "aria-describedby": describedBy ?? "auto-reload-card-requirement", children: [
      /* @__PURE__ */ jsx2(CreditCard, { className: "size-4" }),
      " Save a card"
    ] })
  ] });
}
function FailureBanner({
  config,
  onSaveCard
}) {
  if (config.status !== "suspended" && config.status !== "needs_payment_method") return null;
  const reason = config.disabledReason;
  if (reason === "no_payment_method" || config.status === "needs_payment_method" && reason === null) return null;
  const isSca = reason === "sca_required";
  const isNoPm = reason === "payment_method_unavailable";
  const title = isSca ? "Your bank needs you to confirm this card" : isNoPm ? "The saved card is no longer available" : `Auto-reload paused after ${config.consecutiveFailures} failed charges`;
  const body = isSca ? "Automatic top-ups can\u2019t answer your bank\u2019s security check on their own \u2014 confirm the card once and they resume." : isNoPm ? "Save a card to keep auto-reload on." : "We stopped retrying to avoid repeated declines. Update the card, then re-enable.";
  const cta = isSca ? "Confirm card" : isNoPm ? "Save a card" : "Update card";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4", children: [
    /* @__PURE__ */ jsx2(AlertTriangle, { className: "mt-0.5 size-5 flex-none text-destructive" }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
      /* @__PURE__ */ jsx2("div", { className: "text-sm font-medium", children: title }),
      /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: body })
    ] }),
    /* @__PURE__ */ jsx2(Button, { size: "sm", className: "flex-none", onClick: onSaveCard, children: cta })
  ] });
}
function seedForm(config) {
  return {
    enabled: config.enabled,
    thresholdUsd: config.thresholdUsd,
    amountMode: config.amountMode === "to_target" ? "to_target" : "fixed",
    reloadAmountUsd: config.reloadAmountUsd,
    targetUsd: config.targetUsd,
    cooldownSeconds: config.cooldownSeconds,
    maxReloadsPerPeriod: config.maxReloadsPerPeriod,
    maxSpendPerPeriodUsd: config.maxSpendPerPeriodUsd,
    maxPerReloadUsd: config.maxPerReloadUsd,
    periodDays: config.periodDays,
    paymentMethodSource: config.paymentMethodSource === "subscription" ? "subscription" : config.paymentMethodSource === "setup_intent" ? "setup_intent" : null
  };
}
var AMOUNT_PRESETS = [25, 50, 100];
function AutoReloadConfigCard({ config, canManage = true }) {
  const update = useUpdateAutoReloadConfig();
  const onSaveCard = useSavePaymentMethod();
  const clamps = config.clamps;
  const [form, setForm] = useState(() => seedForm(config));
  useEffect(() => {
    setForm(seedForm(config));
  }, [config]);
  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function onSave() {
    const body = {
      enabled: form.enabled,
      thresholdUsd: form.thresholdUsd ?? 0,
      amountMode: form.amountMode,
      reloadAmountUsd: form.reloadAmountUsd,
      targetUsd: form.targetUsd,
      cooldownSeconds: form.cooldownSeconds,
      maxReloadsPerPeriod: form.maxReloadsPerPeriod,
      maxSpendPerPeriodUsd: form.maxSpendPerPeriodUsd,
      maxPerReloadUsd: form.maxPerReloadUsd,
      periodDays: form.periodDays,
      paymentMethodSource: form.paymentMethodSource
    };
    update.mutate(body);
  }
  const fixed = form.amountMode === "fixed";
  const refusalId = !canManage ? "auto-reload-manage-refusal" : void 0;
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx2("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx2(CardTitle, { children: "Automatic reload" }),
        /* @__PURE__ */ jsx2(StatusPill, { status: config.status, disabledReason: config.disabledReason })
      ] }) }),
      /* @__PURE__ */ jsx2(CardDescription, { children: "Keep generation running: when your prepaid balance runs low, top it up automatically \u2014 no checkout, no waiting." }),
      !canManage && /* @__PURE__ */ jsx2("p", { id: "auto-reload-manage-refusal", className: "text-sm text-muted-foreground", children: "Your role can\u2019t manage billing. Ask a workspace owner or admin to change auto-reload or its payment method." })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsx2(FailureBanner, { config, onSaveCard }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 rounded-md border p-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx2("div", { className: "text-sm font-medium", children: "Reload my credits automatically" }),
          /* @__PURE__ */ jsx2("div", { className: "text-xs text-muted-foreground", children: "We charge your saved card automatically when your balance drops below the amount you set below." })
        ] }),
        /* @__PURE__ */ jsx2(
          Switch,
          {
            checked: form.enabled,
            onCheckedChange: (checked) => set("enabled", checked),
            disabled: !canManage,
            "aria-describedby": refusalId
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: cn("space-y-6", !form.enabled && "pointer-events-none opacity-50"), children: [
        /* @__PURE__ */ jsx2(
          MoneyField,
          {
            id: "ar-threshold",
            label: "Reload when my balance drops below",
            value: form.thresholdUsd,
            onChange: (v) => set("thresholdUsd", v),
            disabled: !canManage
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx2(Label, { children: "Each time, reload" }),
          /* @__PURE__ */ jsxs("div", { className: "flex w-fit rounded-md border p-0.5", "data-testid": "reload-amount-mode", children: [
            /* @__PURE__ */ jsx2(
              SegBtn,
              {
                active: fixed,
                icon: /* @__PURE__ */ jsx2(ArrowUpCircle, { className: "size-3.5" }),
                onClick: () => set("amountMode", "fixed"),
                disabled: !canManage,
                describedBy: refusalId,
                children: "A fixed amount"
              }
            ),
            /* @__PURE__ */ jsx2(
              SegBtn,
              {
                active: !fixed,
                icon: /* @__PURE__ */ jsx2(Target, { className: "size-3.5" }),
                onClick: () => set("amountMode", "to_target"),
                disabled: !canManage,
                describedBy: refusalId,
                children: "Up to a target"
              }
            )
          ] }),
          fixed ? /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1", children: [
            /* @__PURE__ */ jsx2(
              MoneyField,
              {
                id: "ar-amount",
                label: "Reload amount",
                value: form.reloadAmountUsd,
                onChange: (v) => set("reloadAmountUsd", v),
                disabled: !canManage
              }
            ),
            /* @__PURE__ */ jsx2("div", { className: "flex flex-wrap gap-1.5", children: AMOUNT_PRESETS.map((p) => /* @__PURE__ */ jsx2(
              "button",
              {
                type: "button",
                onClick: () => set("reloadAmountUsd", p),
                disabled: !canManage,
                "aria-describedby": refusalId,
                className: cn(
                  "rounded-md border px-2 py-1 text-xs transition-colors",
                  form.reloadAmountUsd === p ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                ),
                children: formatUsd(p)
              },
              p
            )) })
          ] }) : /* @__PURE__ */ jsx2("div", { className: "pt-1", children: /* @__PURE__ */ jsx2(
            MoneyField,
            {
              id: "ar-target",
              label: "Top up to",
              value: form.targetUsd,
              onChange: (v) => set("targetUsd", v),
              disabled: !canManage,
              help: "We charge the difference between your balance and this target \u2014 capped by the per-reload limit below."
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx2(Label, { className: "text-muted-foreground", children: "Spending limits" }),
            /* @__PURE__ */ jsx2("span", { className: "rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground", children: "Your plan's limits always apply" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsx2(
              MoneyField,
              {
                id: "ar-max-reload",
                label: "Max per reload",
                value: form.maxPerReloadUsd,
                onChange: (v) => set("maxPerReloadUsd", v),
                disabled: !canManage,
                help: /* @__PURE__ */ jsx2(
                  ClampHelp,
                  {
                    raw: form.maxPerReloadUsd,
                    ceiling: clamps.maxPerReloadCeilingUsd,
                    effective: clamps.effectiveMaxPerReloadUsd
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx2(
              MoneyField,
              {
                id: "ar-max-spend",
                label: `Max spend per ${form.periodDays ?? config.periodDays} days`,
                value: form.maxSpendPerPeriodUsd,
                onChange: (v) => set("maxSpendPerPeriodUsd", v),
                disabled: !canManage,
                help: /* @__PURE__ */ jsx2(
                  ClampHelp,
                  {
                    raw: form.maxSpendPerPeriodUsd,
                    ceiling: clamps.maxSpendCeilingUsd,
                    effective: clamps.effectiveMaxSpendPerPeriodUsd
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
              /* @__PURE__ */ jsx2(Label, { htmlFor: "ar-max-count", children: "Max reloads per period" }),
              /* @__PURE__ */ jsx2(
                Input,
                {
                  id: "ar-max-count",
                  type: "number",
                  inputMode: "numeric",
                  className: "max-w-[12rem] font-mono tabular-nums",
                  value: form.maxReloadsPerPeriod ?? "",
                  disabled: !canManage,
                  onChange: (e) => set(
                    "maxReloadsPerPeriod",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              ),
              /* @__PURE__ */ jsx2("p", { className: "text-[11px] text-muted-foreground", children: /* @__PURE__ */ jsx2(
                ClampHelp,
                {
                  raw: form.maxReloadsPerPeriod,
                  ceiling: clamps.maxReloadsCeiling,
                  effective: clamps.effectiveMaxReloadsPerPeriod,
                  format: (n) => String(n)
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
              /* @__PURE__ */ jsx2(Label, { htmlFor: "ar-cooldown", children: "Wait between reloads" }),
              /* @__PURE__ */ jsxs("div", { className: "relative max-w-[12rem]", children: [
                /* @__PURE__ */ jsx2(
                  Input,
                  {
                    id: "ar-cooldown",
                    type: "number",
                    inputMode: "numeric",
                    className: "pr-14 font-mono tabular-nums",
                    value: form.cooldownSeconds != null ? form.cooldownSeconds / 60 : "",
                    disabled: !canManage,
                    onChange: (e) => set(
                      "cooldownSeconds",
                      e.target.value === "" ? null : Math.round(Number(e.target.value) * 60)
                    )
                  }
                ),
                /* @__PURE__ */ jsx2("span", { className: "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground", children: "min" })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
                "At least ",
                Math.round(clamps.minCooldownSeconds / 60),
                " min between top-ups, so one low balance can't trigger two charges.",
                form.cooldownSeconds != null && form.cooldownSeconds < clamps.minCooldownSeconds && /* @__PURE__ */ jsxs("span", { className: "font-medium text-warning-foreground", children: [
                  " ",
                  "Clamped to",
                  " ",
                  Math.round(
                    clamps.effectiveCooldownSeconds / 60
                  ),
                  " ",
                  "min."
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx2(Label, { children: "Payment method" }),
          /* @__PURE__ */ jsx2(CardOnFileRow, { config, onSaveCard, disabled: !canManage, describedBy: refusalId })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
        update.isError && /* @__PURE__ */ jsx2("span", { className: "text-sm text-destructive", children: errorMessage(update.error, "Could not save auto-reload.") }),
        update.isSuccess && !update.isPending && /* @__PURE__ */ jsx2("span", { className: "text-sm text-muted-foreground", children: "Saved." }),
        /* @__PURE__ */ jsxs(Button, { onClick: onSave, disabled: !canManage || update.isPending, "aria-describedby": refusalId, children: [
          /* @__PURE__ */ jsx2(ShieldCheck, { className: "size-4" }),
          update.isPending ? "Saving\u2026" : "Save changes"
        ] })
      ] })
    ] })
  ] });
}

// src/ReloadActivityCard.tsx
import {
  Card as Card2,
  CardContent as CardContent2,
  CardDescription as CardDescription2,
  CardHeader as CardHeader2,
  CardTitle as CardTitle2,
  cn as cn2,
  DataTable
} from "@schemastud/ui";
import { ArrowUpCircle as ArrowUpCircle2, CheckCircle2, XCircle } from "lucide-react";

// src/vocabulary.ts
var BILL_STATUS_LABELS = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  finalized: "Finalized",
  invoiced: "Invoiced",
  void: "Void"
};
var RELOAD_OUTCOME_LABELS = {
  succeeded: "Reloaded",
  declined: "Declined",
  sca_required: "Authentication required",
  transient_error: "Retrying",
  blocked: "Blocked"
};
var RELOAD_FAILURE_COPY = {
  card_declined: "Your card was declined \u2014 update your payment method to resume automatic top-ups.",
  insufficient_funds: "The payment was declined for insufficient funds \u2014 update your payment method to resume automatic top-ups.",
  expired_card: "Your card has expired \u2014 update your payment method to resume automatic top-ups.",
  authentication_required: "Your bank needs to confirm this payment \u2014 update your payment method or complete authentication to resume automatic top-ups."
};
var ENTITLEMENT_SOURCE_FACETS = [
  { key: "all", label: "All" },
  { key: "default", label: "Default" },
  { key: "plan", label: "Plan" },
  { key: "tenant", label: "Tenant override" }
];
var ENTITLEMENT_SOURCE_LABELS = Object.fromEntries(
  ENTITLEMENT_SOURCE_FACETS.filter((facet) => facet.key !== "all").map((facet) => [facet.key, facet.label])
);
function billStatusLabel(status) {
  return BILL_STATUS_LABELS[status] ?? "Unknown bill status";
}
function reloadOutcomeLabel(outcome) {
  return RELOAD_OUTCOME_LABELS[outcome] ?? "Unknown reload outcome";
}
function reloadFailureCopy(code) {
  return (code && RELOAD_FAILURE_COPY[code]) ?? "The automatic top-up didn\u2019t go through \u2014 update your payment method to resume.";
}
function entitlementSourceLabel(source) {
  return ENTITLEMENT_SOURCE_LABELS[source] ?? "Unknown entitlement source";
}

// src/ReloadActivityCard.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function OutcomeBadge({ outcome }) {
  const ok = outcome === "succeeded";
  const label = reloadOutcomeLabel(outcome);
  return /* @__PURE__ */ jsxs2(
    "span",
    {
      className: cn2(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]",
        ok ? "border-primary/25 bg-primary/5 text-foreground" : "border-destructive/30 bg-destructive/5 text-foreground"
      ),
      children: [
        ok ? /* @__PURE__ */ jsx3(CheckCircle2, { className: "size-3.5 text-primary" }) : /* @__PURE__ */ jsx3(XCircle, { className: "size-3.5 text-destructive" }),
        /* @__PURE__ */ jsx3("span", { children: label }),
        /* @__PURE__ */ jsx3("span", { className: "font-mono text-[10px] opacity-70", children: outcome })
      ]
    }
  );
}
var attemptColumns = [
  {
    header: "Date",
    cell: ({ row }) => /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: formatDate(row.original.createdAt) })
  },
  {
    header: "Outcome",
    cell: ({ row }) => /* @__PURE__ */ jsx3(OutcomeBadge, { outcome: row.original.outcome })
  },
  {
    header: "Amount",
    cell: ({ row }) => /* @__PURE__ */ jsx3("span", { className: "font-mono tabular-nums", children: row.original.amountUsd != null ? formatUsd(row.original.amountUsd) : "\u2014" })
  },
  {
    header: "Details",
    // OD-B3-01 (ruling B): a failed reload leads with actionable customer copy; the exact provider
    // code (stripeErrorCode) sits behind a diagnostic disclosure, never inline.
    cell: ({ row }) => {
      const code = row.original.stripeErrorCode;
      if (!code) return /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: "\u2014" });
      return /* @__PURE__ */ jsxs2("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx3("p", { className: "text-[12px]", children: reloadFailureCopy(code) }),
        /* @__PURE__ */ jsxs2("details", { className: "text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx3("summary", { className: "cursor-pointer select-none", children: "Diagnostic details" }),
          /* @__PURE__ */ jsxs2("span", { className: "font-mono", children: [
            "Provider code: ",
            code
          ] })
        ] })
      ] });
    }
  }
];
function ReloadActivityCard({ activity }) {
  return /* @__PURE__ */ jsxs2(Card2, { children: [
    /* @__PURE__ */ jsxs2(CardHeader2, { children: [
      /* @__PURE__ */ jsx3(CardTitle2, { children: "Reload activity" }),
      /* @__PURE__ */ jsx3(CardDescription2, { children: "Every automatic top-up, and how it went." })
    ] }),
    /* @__PURE__ */ jsxs2(CardContent2, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs2("div", { className: "rounded-md border bg-muted/30 p-3 sm:max-w-xs", children: [
        /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx3(ArrowUpCircle2, { className: "size-3.5" }),
          " Last reload"
        ] }),
        /* @__PURE__ */ jsx3("div", { className: "mt-1 font-mono text-lg tabular-nums", children: activity.lastReloadAmountUsd != null ? formatUsd(activity.lastReloadAmountUsd) : "\u2014" }),
        /* @__PURE__ */ jsx3("div", { className: "text-xs text-muted-foreground", children: activity.lastReloadAt ? formatDate(activity.lastReloadAt) : "No reloads yet" })
      ] }),
      /* @__PURE__ */ jsx3(
        DataTable,
        {
          stackOnMobile: true,
          columns: attemptColumns,
          data: activity.attempts,
          emptyMessage: "No automatic reloads yet."
        }
      )
    ] })
  ] });
}

// src/commerce-provider.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var CommerceServicesContext = createContext2(null);
function consoleNotify2(event) {
  if (event.type === "error") console.error(`[beam-commerce] ${event.message}`);
  else console.info(`[beam-commerce] ${event.message}`);
}
function defaultNavigate(url) {
  if (typeof window !== "undefined") window.location.href = url;
}
function CommerceProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx4(CommerceServicesContext.Provider, { value: services, children });
}
function useCommerceServices() {
  const services = useContext2(CommerceServicesContext);
  if (!services) {
    throw new Error("beam-commerce surfaces must be rendered inside a <CommerceProvider>.");
  }
  return services;
}
function useCommerceNotify() {
  return useCommerceServices().notify ?? consoleNotify2;
}
function useCommerceNavigate() {
  return useCommerceServices().navigate ?? defaultNavigate;
}
function useCommerceCan() {
  return useCommerceServices().can ?? (() => true);
}

// src/commerce-hooks.ts
import { useMutation as useMutation2, useQuery as useQuery2, useQueryClient as useQueryClient2 } from "@tanstack/react-query";
var WALLET_KEY = ["beam-commerce", "wallet"];
var BUDGET_KEY = ["beam-commerce", "budget"];
var BILLS_KEY = ["beam-commerce", "bills"];
var BILL_PREVIEW_KEY = ["beam-commerce", "bill-preview"];
var SUBSCRIPTION_KEY = ["beam-commerce", "subscription"];
var ENTITLEMENTS_KEY = ["beam-commerce", "entitlements"];
var usageKey = (month) => ["beam-commerce", "usage-summary", month ?? "current"];
function useWallet() {
  const { client } = useCommerceServices();
  return useQuery2({ queryKey: WALLET_KEY, queryFn: () => client.getWallet() });
}
function useCreditTopupCheckout() {
  const { client, onError } = useCommerceServices();
  return useMutation2({
    mutationFn: (amountUsd) => client.startTopupCheckout(amountUsd),
    onError: (err) => onError?.(err)
  });
}
function useReloadCredits() {
  const { client, onError } = useCommerceServices();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: async (amountUsd) => {
      if (!client.reloadCredits) {
        throw new Error("This host does not collect credit reloads on a direct rail.");
      }
      return client.reloadCredits(amountUsd);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(WALLET_KEY, result.wallet);
    },
    onError: (err) => onError?.(err)
  });
}
function useBudget() {
  const { client } = useCommerceServices();
  return useQuery2({ queryKey: BUDGET_KEY, queryFn: () => client.getBudget() });
}
function useUsageSummary(month) {
  const { client } = useCommerceServices();
  return useQuery2({ queryKey: usageKey(month), queryFn: () => client.getUsageSummary(month) });
}
function useBills() {
  const { client } = useCommerceServices();
  return useQuery2({ queryKey: BILLS_KEY, queryFn: () => client.getBills() });
}
function useBillPreview() {
  const { client } = useCommerceServices();
  return useQuery2({ queryKey: BILL_PREVIEW_KEY, queryFn: () => client.getBillPreview() });
}
function useSubscription() {
  const { client } = useCommerceServices();
  return useQuery2({ queryKey: SUBSCRIPTION_KEY, queryFn: () => client.getSubscription() });
}
function useEntitlements() {
  const { client } = useCommerceServices();
  return useQuery2({ queryKey: ENTITLEMENTS_KEY, queryFn: () => client.getEntitlements() });
}
function useSubscriptionCheckout() {
  const { client, onError } = useCommerceServices();
  return useMutation2({
    mutationFn: (planId) => client.startSubscriptionCheckout(planId),
    onError: (err) => onError?.(err)
  });
}
function useSubscriptionPortal() {
  const { client, onError } = useCommerceServices();
  return useMutation2({
    mutationFn: () => client.getSubscriptionPortal(),
    onError: (err) => onError?.(err)
  });
}

// src/CreditsSurface.tsx
import {
  Badge as Badge2,
  Button as Button2,
  Card as Card3,
  CardContent as CardContent3,
  CardDescription as CardDescription3,
  CardHeader as CardHeader3,
  CardTitle as CardTitle3,
  cn as cn3,
  DataTable as DataTable2,
  Input as Input2,
  Label as Label2,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@schemastud/ui";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2 as CheckCircle22,
  Loader2,
  Plus,
  RotateCcw
} from "lucide-react";
import { useState as useState2 } from "react";

// src/commerce-types.ts
function toCreditLedgerEntry(entry) {
  return { ...entry, type: entry.type === "credit" ? "credit" : "debit" };
}

// src/SurfaceHeading.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
function SurfaceHeading({ embedded, children }) {
  const className = "text-xl font-semibold tracking-tight";
  return embedded ? /* @__PURE__ */ jsx5("h2", { className, children }) : /* @__PURE__ */ jsx5("h1", { className, children });
}

// src/CreditsSurface.tsx
import { Fragment as Fragment2, jsx as jsx6, jsxs as jsxs3 } from "react/jsx-runtime";
function BalanceHeadline({
  wallet,
  pendingCreditUsd
}) {
  const pending = pendingCreditUsd !== null;
  return /* @__PURE__ */ jsxs3(Card3, { children: [
    /* @__PURE__ */ jsxs3(CardHeader3, { children: [
      /* @__PURE__ */ jsx6("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx6(CardTitle3, { children: "Prepaid balance" }),
        /* @__PURE__ */ jsx6(Badge2, { variant: "outline", children: "Lifetime prepaid wallet" })
      ] }) }),
      /* @__PURE__ */ jsx6(CardDescription3, { children: "Credits are drawn down as you generate. This is your remaining balance, not a per-period cap." })
    ] }),
    /* @__PURE__ */ jsxs3(CardContent3, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-end gap-x-3 gap-y-1", children: [
        /* @__PURE__ */ jsx6("span", { className: "font-mono text-4xl font-semibold tabular-nums tracking-tight", children: formatUsd(wallet.balanceUsd) }),
        /* @__PURE__ */ jsx6("span", { className: "pb-1 text-sm text-muted-foreground", children: "remaining" }),
        pending && /* @__PURE__ */ jsxs3("span", { className: "mb-1 inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-[12px] text-warning-foreground", children: [
          /* @__PURE__ */ jsx6(Loader2, { className: "size-3.5 animate-spin" }),
          "Crediting ",
          formatUsd(pendingCreditUsd ?? 0),
          "\u2026"
        ] })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 rounded-md border bg-muted/30 p-3 font-mono text-sm tabular-nums", children: [
        /* @__PURE__ */ jsx6("span", { className: "text-muted-foreground", children: "Credited (lifetime)" }),
        /* @__PURE__ */ jsx6("span", { className: "text-right", children: formatUsd(wallet.creditedUsd) }),
        /* @__PURE__ */ jsx6("span", { className: "text-muted-foreground", children: "\u2212 Debited (lifetime)" }),
        /* @__PURE__ */ jsxs3("span", { className: "text-right", children: [
          "\u2212",
          formatUsd(wallet.debitedUsd)
        ] }),
        /* @__PURE__ */ jsx6("span", { className: "col-span-2 border-t border-border/70" }),
        /* @__PURE__ */ jsx6("span", { className: "font-medium text-foreground", children: "= Balance" }),
        /* @__PURE__ */ jsx6("span", { className: "text-right font-medium", children: formatUsd(wallet.balanceUsd) })
      ] })
    ] })
  ] });
}
var ledgerColumns = [
  {
    header: "Date",
    cell: ({ row }) => /* @__PURE__ */ jsx6("span", { className: "text-muted-foreground", children: formatDate(row.original.at) })
  },
  {
    header: "Type",
    cell: ({ row }) => {
      const credit = row.original.type === "credit";
      return /* @__PURE__ */ jsxs3(
        "span",
        {
          className: cn3(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]",
            credit ? "border-primary/25 bg-primary/5 text-foreground" : "border-border bg-muted/40 text-muted-foreground"
          ),
          children: [
            credit ? /* @__PURE__ */ jsx6(ArrowUpRight, { className: "size-3.5 text-primary" }) : /* @__PURE__ */ jsx6(ArrowDownRight, { className: "size-3.5" }),
            credit ? "Credit" : "Debit"
          ]
        }
      );
    }
  },
  {
    header: "Event",
    // TC01 (owner ruling B): the ledger event reads a fixed, direction-based label — "Credit added"
    // for a credit, "Usage charge" for a debit — never the raw ledger reason (machine strings like
    // `topup:fake_cs_…` once surfaced here as the primary text). The opaque reference (the reason and
    // any purchase ref) stays only as secondary audit detail; no finer claim is made about the event.
    cell: ({ row }) => {
      const credit = row.original.type === "credit";
      const auditRef = [row.original.reason, row.original.purchaseRef].filter(Boolean).join(" \xB7 ");
      return /* @__PURE__ */ jsxs3("div", { className: "min-w-[8rem]", children: [
        /* @__PURE__ */ jsx6("div", { children: credit ? "Credit added" : "Usage charge" }),
        auditRef && /* @__PURE__ */ jsx6(
          "div",
          {
            "data-ledger-audit-ref": true,
            className: "font-mono text-[11px] text-muted-foreground [overflow-wrap:anywhere]",
            children: auditRef
          }
        )
      ] });
    }
  },
  {
    header: "Amount",
    cell: ({ row }) => {
      const credit = row.original.type === "credit";
      return /* @__PURE__ */ jsxs3(
        "span",
        {
          className: cn3(
            "whitespace-nowrap font-mono tabular-nums",
            credit ? "text-foreground" : "text-muted-foreground"
          ),
          children: [
            credit ? "+" : "",
            formatUsd(row.original.amountUsd)
          ]
        }
      );
    }
  },
  {
    header: "Balance",
    cell: ({ row }) => /* @__PURE__ */ jsx6("span", { className: "whitespace-nowrap font-mono tabular-nums text-muted-foreground", children: formatUsd(row.original.runningUsd) })
  }
];
function CreditLedger({ data, loading }) {
  return /* @__PURE__ */ jsxs3(Card3, { children: [
    /* @__PURE__ */ jsxs3(CardHeader3, { children: [
      /* @__PURE__ */ jsx6(CardTitle3, { children: "Credit ledger" }),
      /* @__PURE__ */ jsx6(CardDescription3, { children: "Append-only \u2014 every top-up and metered draw, with running balance." })
    ] }),
    /* @__PURE__ */ jsx6(CardContent3, { children: /* @__PURE__ */ jsx6(
      DataTable2,
      {
        stackOnMobile: true,
        columns: ledgerColumns,
        data,
        loading,
        clientPageSize: 25,
        emptyMessage: "No credit activity yet \u2014 add credits to get started."
      }
    ) })
  ] });
}
function ReloadOutcome({
  result,
  onRetry,
  onDone
}) {
  if (result.captured) {
    return /* @__PURE__ */ jsxs3("div", { className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxs3(
        "div",
        {
          role: "status",
          className: "flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm",
          children: [
            /* @__PURE__ */ jsx6(CheckCircle22, { className: "mt-0.5 size-4 flex-none text-primary" }),
            /* @__PURE__ */ jsxs3("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx6("div", { className: "font-medium", children: "Credits added." }),
              /* @__PURE__ */ jsxs3("p", { className: "text-muted-foreground", children: [
                formatUsd(result.amountUsd),
                " captured on the",
                " ",
                /* @__PURE__ */ jsx6("span", { className: "font-mono", children: result.driver }),
                " rail. Your balance is",
                " ",
                formatUsd(result.wallet.balanceUsd),
                "."
              ] })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsx6(Button2, { className: "w-full", variant: "outline", onClick: onDone, children: "Done" })
    ] });
  }
  return /* @__PURE__ */ jsxs3("div", { className: "mt-6 space-y-4", children: [
    /* @__PURE__ */ jsxs3(
      "div",
      {
        role: "alert",
        className: "flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm",
        children: [
          /* @__PURE__ */ jsx6(AlertCircle, { className: "mt-0.5 size-4 flex-none text-destructive" }),
          /* @__PURE__ */ jsxs3("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs3("div", { className: "font-medium", children: [
              "Declined",
              result.declineCode ? /* @__PURE__ */ jsxs3("span", { className: "font-mono font-normal", children: [
                " (",
                result.declineCode,
                ")"
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxs3("p", { className: "text-muted-foreground", children: [
              formatUsd(result.amountUsd),
              " was not charged. Your balance is unchanged at",
              " ",
              formatUsd(result.wallet.balanceUsd),
              "."
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs3(Button2, { className: "w-full", onClick: onRetry, children: [
      /* @__PURE__ */ jsx6(RotateCcw, { className: "size-4" }),
      " Try again"
    ] })
  ] });
}
function TopUpSheet({
  open,
  onOpenChange,
  crediting,
  amountUsd,
  onAmountChange,
  onPay,
  submitting,
  error,
  outcome,
  onRetry,
  onDone
}) {
  return /* @__PURE__ */ jsx6(
    Sheet,
    {
      open,
      onOpenChange: (next) => {
        if (crediting && !next) return;
        onOpenChange(next);
      },
      children: /* @__PURE__ */ jsxs3(SheetContent, { className: "w-full overflow-y-auto sm:max-w-md", children: [
        /* @__PURE__ */ jsxs3(SheetHeader, { children: [
          /* @__PURE__ */ jsx6(SheetTitle, { children: "Add credits" }),
          /* @__PURE__ */ jsx6(SheetDescription, { children: "Choose an amount and pay to top up your prepaid balance." })
        ] }),
        outcome ? /* @__PURE__ */ jsx6(ReloadOutcome, { result: outcome, onRetry, onDone }) : crediting ? (
          // The non-dismissable post-return poll state.
          /* @__PURE__ */ jsxs3("div", { className: "mt-6 space-y-4", children: [
            /* @__PURE__ */ jsxs3("div", { className: "flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground", children: [
              /* @__PURE__ */ jsx6(Loader2, { className: "mt-0.5 size-4 flex-none animate-spin" }),
              /* @__PURE__ */ jsxs3("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx6("div", { className: "font-medium", children: "Payment received \u2014 crediting your wallet\u2026" }),
                /* @__PURE__ */ jsx6("p", { className: "text-warning-foreground/80", children: "Funding is webhook-confirmed and idempotent on the session ref. This closes on its own once your balance reflects the top-up." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs3("p", { className: "flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground", children: [
              /* @__PURE__ */ jsx6(AlertCircle, { className: "size-3.5" }),
              "bounded retry \u2014 no infinite spinner."
            ] })
          ] })
        ) : /* @__PURE__ */ jsxs3("div", { className: "mt-6 space-y-5", children: [
          /* @__PURE__ */ jsx6("div", { className: "space-y-2", children: /* @__PURE__ */ jsx6("div", { className: "rounded-md border bg-card p-4", children: /* @__PURE__ */ jsxs3("div", { className: "grid gap-1.5", children: [
            /* @__PURE__ */ jsx6(Label2, { htmlFor: "bc-topup-amount", children: "Amount to add (USD)" }),
            /* @__PURE__ */ jsxs3("div", { className: "relative max-w-[12rem]", children: [
              /* @__PURE__ */ jsx6("span", { className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground", children: "$" }),
              /* @__PURE__ */ jsx6(
                Input2,
                {
                  id: "bc-topup-amount",
                  type: "number",
                  inputMode: "decimal",
                  min: 1,
                  max: 1e4,
                  className: "pl-6 font-mono tabular-nums",
                  value: amountUsd,
                  onChange: (e) => {
                    const value = Number(e.target.value);
                    if (!Number.isNaN(value)) onAmountChange(value);
                  }
                }
              )
            ] })
          ] }) }) }),
          error && /* @__PURE__ */ jsx6("p", { className: "text-sm text-destructive", children: error }),
          /* @__PURE__ */ jsxs3(Button2, { className: "w-full", onClick: onPay, disabled: submitting, children: [
            submitting ? /* @__PURE__ */ jsx6(Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx6(Plus, { className: "size-4" }),
            " ",
            "Pay & add credits"
          ] })
        ] })
      ] })
    }
  );
}
function CreditsSurface({ embedded = false } = {}) {
  const wallet = useWallet();
  const topup = useCreditTopupCheckout();
  const reload = useReloadCredits();
  const directRail = useCommerceServices().client.reloadCredits !== void 0;
  const canBuy = useCommerceCan()("billing.manage");
  const [sheetOpen, setSheetOpen] = useState2(false);
  const [amountUsd, setAmountUsd] = useState2(100);
  const [pendingCreditUsd, setPendingCreditUsd] = useState2(null);
  const [outcome, setOutcome] = useState2(null);
  const onPay = () => {
    if (directRail) {
      reload.mutate(amountUsd, { onSuccess: setOutcome });
      return;
    }
    topup.mutate(amountUsd, {
      onSuccess: (checkout) => {
        if (checkout?.action?.kind === "redirect" && checkout.action.url) {
          window.location.assign(checkout.action.url);
          return;
        }
        setPendingCreditUsd(amountUsd);
      }
    });
  };
  const onRetry = () => {
    setOutcome(null);
    reload.reset();
  };
  const onDone = () => {
    setOutcome(null);
    reload.reset();
    setSheetOpen(false);
  };
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx6(SurfaceHeading, { embedded, children: "Credits" }),
        /* @__PURE__ */ jsx6("p", { className: "text-sm text-muted-foreground", children: "Your prepaid generation wallet \u2014 balance, ledger, and top-ups." })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "flex max-w-64 flex-col items-end gap-1", children: [
        /* @__PURE__ */ jsxs3(
          Button2,
          {
            size: "sm",
            onClick: () => setSheetOpen(true),
            disabled: !canBuy,
            "aria-describedby": !canBuy ? "credits-manage-refusal" : void 0,
            children: [
              /* @__PURE__ */ jsx6(Plus, { className: "size-4" }),
              " Add credits"
            ]
          }
        ),
        !canBuy && /* @__PURE__ */ jsx6("p", { id: "credits-manage-refusal", className: "text-right text-xs text-muted-foreground", children: "Your role can\u2019t manage billing. Ask a workspace owner or admin to add credits." })
      ] })
    ] }),
    wallet.isPending && /* @__PURE__ */ jsx6("p", { className: "text-sm text-muted-foreground", children: "Loading wallet\u2026" }),
    wallet.isError && /* @__PURE__ */ jsx6("p", { className: "py-12 text-center text-sm text-destructive", children: errorMessage(wallet.error, "Could not load your wallet.") }),
    wallet.data && /* @__PURE__ */ jsxs3(Fragment2, { children: [
      /* @__PURE__ */ jsx6(BalanceHeadline, { wallet: wallet.data, pendingCreditUsd }),
      /* @__PURE__ */ jsx6(CreditLedger, { data: wallet.data.ledger.map(toCreditLedgerEntry), loading: false })
    ] }),
    /* @__PURE__ */ jsx6(
      TopUpSheet,
      {
        open: sheetOpen || pendingCreditUsd !== null,
        onOpenChange: (next) => {
          setSheetOpen(next);
          if (!next) onRetry();
        },
        crediting: pendingCreditUsd !== null,
        amountUsd,
        onAmountChange: setAmountUsd,
        onPay,
        submitting: directRail ? reload.isPending : topup.isPending,
        error: directRail ? reload.isError ? errorMessage(reload.error, "Could not reach the payment rail.") : null : topup.isError ? errorMessage(topup.error, "Could not start checkout.") : null,
        outcome,
        onRetry,
        onDone
      }
    )
  ] });
}

// src/BillingSurface.tsx
import {
  Badge as Badge3,
  Button as Button3,
  Card as Card4,
  CardContent as CardContent4,
  CardDescription as CardDescription4,
  CardHeader as CardHeader4,
  CardTitle as CardTitle4,
  cn as cn4,
  DataTable as DataTable3,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@schemastud/ui";
import { useState as useState3 } from "react";
import { Fragment as Fragment3, jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
function isRetryable(error) {
  const status = error?.response?.status;
  return typeof status !== "number" || status >= 500;
}
function Progress({
  value,
  indicatorClassName
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return /* @__PURE__ */ jsx7(
    "div",
    {
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": Math.round(clamped),
      className: "relative h-2 w-full overflow-hidden rounded-full bg-muted",
      children: /* @__PURE__ */ jsx7(
        "div",
        {
          className: cn4("h-full bg-primary transition-all", indicatorClassName),
          style: { width: `${clamped}%` }
        }
      )
    }
  );
}
function BillStatusBadge({ status }) {
  const map = {
    finalized: "border-primary/25 bg-primary/5 text-foreground",
    invoiced: "border-primary/25 bg-primary/5 text-foreground",
    paid: "border-primary/25 bg-primary/5 text-foreground",
    open: "border-warning/40 bg-warning/10 text-warning-foreground",
    draft: "border-border bg-muted/50 text-muted-foreground",
    void: "border-destructive/30 bg-destructive/5 text-foreground"
  };
  const cls = map[status] ?? "border-border bg-muted/50 text-muted-foreground";
  return /* @__PURE__ */ jsxs4(
    "span",
    {
      className: cn4(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium capitalize",
        cls
      ),
      children: [
        /* @__PURE__ */ jsx7("span", { children: billStatusLabel(status) }),
        /* @__PURE__ */ jsx7("span", { className: "ml-1.5 font-mono text-[10px] normal-case opacity-70", children: status })
      ]
    }
  );
}
function currentMonth() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
}
var modelColumns = [
  { header: "Model", accessorKey: "model" },
  { header: "Prompt tokens", cell: ({ row }) => row.original.promptTokens.toLocaleString() },
  {
    header: "Completion tokens",
    cell: ({ row }) => row.original.completionTokens.toLocaleString()
  },
  { header: "Total tokens", cell: ({ row }) => row.original.totalTokens.toLocaleString() },
  { header: "Cost", cell: ({ row }) => formatUsd(row.original.costUsd) }
];
var billColumns = [
  { header: "Period", accessorKey: "billingPeriod" },
  { header: "Status", cell: ({ row }) => /* @__PURE__ */ jsx7(BillStatusBadge, { status: row.original.status }) },
  { header: "Total", cell: ({ row }) => formatUsd(row.original.totalUsd) },
  {
    header: "Finalized",
    cell: ({ row }) => /* @__PURE__ */ jsx7("span", { className: "text-muted-foreground", children: formatDate(row.original.finalizedAt) })
  }
];
function BudgetMeter({ verdict }) {
  const b = verdict;
  if (b.uncapped) {
    return /* @__PURE__ */ jsxs4(Card4, { children: [
      /* @__PURE__ */ jsxs4(CardHeader4, { children: [
        /* @__PURE__ */ jsx7(CardTitle4, { children: "Spending cap" }),
        /* @__PURE__ */ jsx7(CardDescription4, { children: "Your spend this period across all usage." })
      ] }),
      /* @__PURE__ */ jsx7(CardContent4, { children: /* @__PURE__ */ jsxs4("p", { className: "text-sm text-muted-foreground", children: [
        "No spending cap \u2014 ",
        formatUsd(b.spentUsd),
        " spent this period."
      ] }) })
    ] });
  }
  if (b.bindingSourceId === "prepaid_wallet" || b.stopKind === "prepaid_exhausted") {
    return /* @__PURE__ */ jsxs4(Card4, { children: [
      /* @__PURE__ */ jsxs4(CardHeader4, { children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx7(CardTitle4, { children: "Prepaid wallet" }),
          /* @__PURE__ */ jsx7(Badge3, { variant: "outline", children: "Lifetime prepaid \xB7 not a spending cap" })
        ] }),
        /* @__PURE__ */ jsx7(CardDescription4, { children: "Credits drawn down as you generate \u2014 a lifetime balance, not a per-period cap." })
      ] }),
      /* @__PURE__ */ jsxs4(CardContent4, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex flex-wrap items-end gap-x-3 gap-y-1", children: [
          /* @__PURE__ */ jsx7("span", { className: "text-3xl font-semibold tabular-nums tracking-tight", children: formatUsd(b.remainingUsd ?? 0) }),
          /* @__PURE__ */ jsx7("span", { className: "pb-1 text-sm text-muted-foreground", children: "remaining" })
        ] }),
        /* @__PURE__ */ jsx7(
          "p",
          {
            className: cn4(
              "text-sm",
              b.allowed ? "text-muted-foreground" : "font-medium text-destructive"
            ),
            children: b.allowed ? `${formatUsd(b.spentUsd)} drawn down (lifetime).` : `Credit exhausted \u2014 ${formatUsd(b.spentUsd)} drawn down (lifetime). Generation is paused.`
          }
        ),
        b.offer && !b.autoReloadPending && /* @__PURE__ */ jsx7("p", { className: "rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground", children: b.offer.message })
      ] })
    ] });
  }
  const capReached = !b.allowed;
  return /* @__PURE__ */ jsxs4(Card4, { children: [
    /* @__PURE__ */ jsxs4(CardHeader4, { children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsx7(CardTitle4, { children: "Spending cap" }),
        /* @__PURE__ */ jsx7(Badge3, { variant: "outline", children: "Per-period spending cap" })
      ] }),
      /* @__PURE__ */ jsx7(CardDescription4, { children: "Your spend this period across all usage." })
    ] }),
    /* @__PURE__ */ jsxs4(CardContent4, { className: "space-y-3", children: [
      /* @__PURE__ */ jsx7(
        Progress,
        {
          value: (b.fractionUsed ?? 0) * 100,
          indicatorClassName: cn4(
            capReached ? "bg-destructive" : b.warning ? "bg-warning" : void 0
          )
        }
      ),
      /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxs4("span", { children: [
          formatUsd(b.spentUsd),
          " of ",
          formatUsd(b.capUsd ?? 0),
          " used"
        ] }),
        /* @__PURE__ */ jsx7(
          "span",
          {
            className: cn4(
              "text-muted-foreground",
              capReached && "font-medium text-destructive",
              b.allowed && b.warning && "font-medium text-warning-foreground"
            ),
            children: b.allowed ? `${formatUsd(b.remainingUsd ?? 0)} remaining` : "Cap reached \u2014 generation is paused"
          }
        )
      ] }),
      b.offer && !b.autoReloadPending && /* @__PURE__ */ jsxs4("p", { className: "rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground", children: [
        b.offer.message,
        b.offer.planName && b.offer.planCapUsd != null && /* @__PURE__ */ jsxs4(Fragment3, { children: [
          " ",
          /* @__PURE__ */ jsxs4("span", { className: "font-medium text-foreground", children: [
            b.offer.planName,
            " raises it to ",
            formatUsd(b.offer.planCapUsd),
            "."
          ] })
        ] })
      ] })
    ] })
  ] });
}
function BudgetSection() {
  const budget = useBudget();
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    budget.isPending && /* @__PURE__ */ jsxs4(Card4, { children: [
      /* @__PURE__ */ jsxs4(CardHeader4, { children: [
        /* @__PURE__ */ jsx7(CardTitle4, { children: "Spending cap" }),
        /* @__PURE__ */ jsx7(CardDescription4, { children: "Generation budget for the current billing period." })
      ] }),
      /* @__PURE__ */ jsx7(CardContent4, { children: /* @__PURE__ */ jsx7("p", { className: "text-sm text-muted-foreground", children: "Loading budget\u2026" }) })
    ] }),
    budget.isError && /* @__PURE__ */ jsxs4(Card4, { children: [
      /* @__PURE__ */ jsx7(CardHeader4, { children: /* @__PURE__ */ jsx7(CardTitle4, { children: "Spending cap" }) }),
      /* @__PURE__ */ jsx7(CardContent4, { children: /* @__PURE__ */ jsxs4("div", { role: "alert", className: "text-sm text-destructive", children: [
        /* @__PURE__ */ jsx7("p", { children: errorMessage(budget.error, "Could not load the budget.") }),
        isRetryable(budget.error) && /* @__PURE__ */ jsx7(Button3, { size: "sm", variant: "outline", className: "mt-2", onClick: () => void budget.refetch(), children: "Try again" })
      ] }) })
    ] }),
    budget.data && /* @__PURE__ */ jsx7(BudgetMeter, { verdict: budget.data })
  ] });
}
function UsageSection() {
  const [month, setMonth] = useState3(currentMonth);
  const summary = useUsageSummary(month);
  return /* @__PURE__ */ jsxs4(Card4, { children: [
    /* @__PURE__ */ jsxs4(
      CardHeader4,
      {
        "data-usage-header": true,
        className: "flex-col items-stretch gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between",
        children: [
          /* @__PURE__ */ jsxs4("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs4("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsx7(CardTitle4, { children: "Usage summary" }),
              /* @__PURE__ */ jsx7(Badge3, { variant: "secondary", children: "Estimate covers OpenAI usage only" })
            ] }),
            /* @__PURE__ */ jsx7(CardDescription4, { children: "Token spend broken down by model." })
          ] }),
          /* @__PURE__ */ jsx7(
            "input",
            {
              type: "month",
              value: month,
              max: currentMonth(),
              onChange: (event) => setMonth(event.target.value || currentMonth()),
              className: "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto",
              "aria-label": "Usage month"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx7(CardContent4, { className: "space-y-4", children: summary.isError ? /* @__PURE__ */ jsxs4("div", { role: "alert", className: "text-sm text-destructive", children: [
      /* @__PURE__ */ jsx7("p", { children: errorMessage(summary.error, "Could not load the usage summary.") }),
      isRetryable(summary.error) && /* @__PURE__ */ jsx7(Button3, { size: "sm", variant: "outline", className: "mt-2", onClick: () => void summary.refetch(), children: "Try again" })
    ] }) : /* @__PURE__ */ jsxs4(Fragment3, { children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex gap-8", children: [
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx7("div", { className: "text-2xl font-semibold", children: summary.data ? formatUsd(summary.data.totalCostUsd) : "\u2014" }),
          /* @__PURE__ */ jsx7("div", { className: "text-xs text-muted-foreground", children: "Total cost" })
        ] }),
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx7("div", { className: "text-2xl font-semibold", children: summary.data ? summary.data.totalTokens.toLocaleString() : "\u2014" }),
          /* @__PURE__ */ jsx7("div", { className: "text-xs text-muted-foreground", children: "Total tokens" })
        ] })
      ] }),
      /* @__PURE__ */ jsx7(
        DataTable3,
        {
          stackOnMobile: true,
          columns: modelColumns,
          data: summary.data?.models ?? [],
          loading: summary.isPending,
          emptyMessage: "No usage recorded for this month."
        }
      )
    ] }) })
  ] });
}
function BillPreviewCard({ subscribeHref }) {
  const preview = useBillPreview();
  return /* @__PURE__ */ jsxs4(Card4, { children: [
    /* @__PURE__ */ jsxs4(CardHeader4, { children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsx7(CardTitle4, { children: "Next bill (estimate)" }),
        /* @__PURE__ */ jsx7(Badge3, { variant: "outline", children: "Current usage estimate" })
      ] }),
      /* @__PURE__ */ jsx7(CardDescription4, { children: "Current period, not yet finalized \u2014 distinct from your Bills below. Nothing is charged yet." })
    ] }),
    /* @__PURE__ */ jsxs4(CardContent4, { children: [
      preview.isPending && /* @__PURE__ */ jsx7("p", { className: "text-sm text-muted-foreground", children: "Loading preview\u2026" }),
      preview.isError && /* @__PURE__ */ jsxs4("div", { role: "alert", className: "text-sm text-destructive", children: [
        /* @__PURE__ */ jsx7("p", { children: errorMessage(preview.error, "Could not load the bill preview.") }),
        isRetryable(preview.error) && /* @__PURE__ */ jsx7(Button3, { size: "sm", variant: "outline", className: "mt-2", onClick: () => void preview.refetch(), children: "Try again" })
      ] }),
      preview.isSuccess && (preview.data?.hasActivePlan === false ? /* @__PURE__ */ jsxs4("div", { className: "space-y-2 rounded-md border bg-muted/40 p-4 text-sm", children: [
        /* @__PURE__ */ jsx7("p", { className: "font-medium", children: "No active plan" }),
        subscribeHref ? /* @__PURE__ */ jsxs4(Fragment3, { children: [
          /* @__PURE__ */ jsx7("p", { className: "text-muted-foreground", children: "Choose a plan to see an estimate for your next bill." }),
          /* @__PURE__ */ jsx7(
            "a",
            {
              href: subscribeHref,
              className: "inline-flex font-medium text-primary underline underline-offset-4",
              children: "Choose a plan"
            }
          )
        ] }) : /* @__PURE__ */ jsx7("p", { className: "text-muted-foreground", children: "An estimate for your next bill appears once this workspace has a plan." })
      ] }) : preview.data ? /* @__PURE__ */ jsxs4("div", { className: "divide-y rounded-md border text-sm", children: [
        preview.data.lineItems.map((item, i) => /* @__PURE__ */ jsxs4(
          "div",
          {
            className: "flex items-center justify-between gap-4 px-3 py-2",
            children: [
              /* @__PURE__ */ jsxs4("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx7("div", { className: "truncate", children: item.description }),
                /* @__PURE__ */ jsx7("div", { className: "text-xs text-muted-foreground", children: componentLabel(item.componentType) })
              ] }),
              /* @__PURE__ */ jsx7("span", { className: "shrink-0", children: formatUsd(item.amountUsd) })
            ]
          },
          i
        )),
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-4 bg-muted/40 px-3 py-2 font-medium", children: [
          /* @__PURE__ */ jsx7("span", { children: "Estimated total" }),
          /* @__PURE__ */ jsx7("span", { children: formatUsd(preview.data.totalUsd) })
        ] })
      ] }) : /* @__PURE__ */ jsx7("p", { className: "text-sm text-muted-foreground", children: "Nothing billable this period." }))
    ] })
  ] });
}
function BillsSection({ onSelect }) {
  const bills = useBills();
  return /* @__PURE__ */ jsxs4(Card4, { children: [
    /* @__PURE__ */ jsxs4(CardHeader4, { children: [
      /* @__PURE__ */ jsx7(CardTitle4, { children: "Bills" }),
      /* @__PURE__ */ jsx7(CardDescription4, { children: "Finalized billing periods \u2014 click a bill to see its line items." })
    ] }),
    /* @__PURE__ */ jsx7(CardContent4, { children: bills.isError ? /* @__PURE__ */ jsxs4("div", { role: "alert", className: "py-12 text-center text-sm text-destructive", children: [
      /* @__PURE__ */ jsx7("p", { children: errorMessage(bills.error, "Could not load bills.") }),
      isRetryable(bills.error) && /* @__PURE__ */ jsx7(Button3, { size: "sm", variant: "outline", className: "mt-2", onClick: () => void bills.refetch(), children: "Try again" })
    ] }) : /* @__PURE__ */ jsx7(
      DataTable3,
      {
        stackOnMobile: true,
        columns: billColumns,
        data: bills.data ?? [],
        loading: bills.isPending,
        emptyMessage: "No bills yet.",
        onRowClick: onSelect
      }
    ) })
  ] });
}
function BillingSurface({
  embedded = false,
  subscribeHref
} = {}) {
  const can = useCommerceCan();
  const canUsage = can("usage.view");
  const canBilling = can("billing.view");
  const [selectedBill, setSelectedBill] = useState3(null);
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs4("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx7(SurfaceHeading, { embedded, children: embedded ? "Budget, usage and bills" : "Billing" }),
        /* @__PURE__ */ jsx7("p", { className: "text-sm text-muted-foreground", children: "What you're spending and what you'll owe." })
      ] }),
      canBilling && /* @__PURE__ */ jsx7(
        Button3,
        {
          variant: "outline",
          size: "sm",
          onClick: () => window.scrollTo({ top: 0 }),
          children: "Preview next bill"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx7(BudgetSection, {}),
      canUsage && /* @__PURE__ */ jsx7(UsageSection, {}),
      canBilling && /* @__PURE__ */ jsxs4(Fragment3, { children: [
        /* @__PURE__ */ jsx7(BillPreviewCard, { subscribeHref }),
        /* @__PURE__ */ jsx7(BillsSection, { onSelect: setSelectedBill })
      ] })
    ] }),
    /* @__PURE__ */ jsx7(
      Dialog,
      {
        open: selectedBill !== null,
        onOpenChange: (open) => !open && setSelectedBill(null),
        children: /* @__PURE__ */ jsx7(DialogContent, { children: selectedBill && /* @__PURE__ */ jsxs4(Fragment3, { children: [
          /* @__PURE__ */ jsxs4(DialogHeader, { children: [
            /* @__PURE__ */ jsxs4(DialogTitle, { className: "flex items-center gap-2", children: [
              "Bill \u2014 ",
              selectedBill.billingPeriod,
              /* @__PURE__ */ jsx7(BillStatusBadge, { status: selectedBill.status })
            ] }),
            /* @__PURE__ */ jsx7(DialogDescription, { children: selectedBill.finalizedAt ? `Finalized ${formatDate(selectedBill.finalizedAt)}` : "Line items for this billing period." })
          ] }),
          /* @__PURE__ */ jsxs4("div", { className: "divide-y rounded-md border text-sm", children: [
            selectedBill.lineItems.length === 0 && /* @__PURE__ */ jsx7("div", { className: "px-3 py-4 text-center text-muted-foreground", children: "No line items." }),
            selectedBill.lineItems.map((item, index) => /* @__PURE__ */ jsxs4(
              "div",
              {
                className: "flex items-center justify-between gap-4 px-3 py-2",
                children: [
                  /* @__PURE__ */ jsxs4("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx7("div", { className: "truncate", children: item.description }),
                    /* @__PURE__ */ jsx7("div", { className: "text-xs text-muted-foreground", children: componentLabel(item.componentType) })
                  ] }),
                  /* @__PURE__ */ jsx7("span", { className: "shrink-0", children: formatUsd(item.amountUsd) })
                ]
              },
              index
            )),
            /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-4 bg-muted/40 px-3 py-2 font-medium", children: [
              /* @__PURE__ */ jsx7("span", { children: "Total" }),
              /* @__PURE__ */ jsx7("span", { children: formatUsd(selectedBill.totalUsd) })
            ] })
          ] })
        ] }) })
      }
    )
  ] });
}

// src/SubscriptionSurface.tsx
import {
  Button as Button4,
  Card as Card5,
  CardContent as CardContent5,
  CardDescription as CardDescription5,
  CardHeader as CardHeader5,
  CardTitle as CardTitle5,
  cn as cn5
} from "@schemastud/ui";
import { ArrowUpRight as ArrowUpRight2, CheckCircle2 as CheckCircle23, ExternalLink, Sparkles, XCircle as XCircle2 } from "lucide-react";
import { useEffect as useEffect2, useMemo, useState as useState4 } from "react";
import { jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
function LifecycleBadge({ state, endsAt, awaitingPayment }) {
  if (awaitingPayment && state !== "lapsed") {
    return /* @__PURE__ */ jsxs5("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-warning-foreground", children: [
      /* @__PURE__ */ jsx8("span", { className: "size-1.5 rounded-full bg-warning" }),
      " Awaiting payment"
    ] });
  }
  if (state === "none") {
    return /* @__PURE__ */ jsx8("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground", children: "No plan" });
  }
  if (state === "lapsed") {
    return /* @__PURE__ */ jsxs5("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive", children: [
      /* @__PURE__ */ jsx8(XCircle2, { className: "size-3.5" }),
      " Lapsed"
    ] });
  }
  if (state === "cancels_at_period_end") {
    return /* @__PURE__ */ jsxs5("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-warning-foreground", children: [
      /* @__PURE__ */ jsx8("span", { className: "size-1.5 rounded-full bg-warning" }),
      " Active until ",
      endsAt ?? "\u2014",
      " \xB7 cancels"
    ] });
  }
  return /* @__PURE__ */ jsxs5("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-foreground", children: [
    /* @__PURE__ */ jsx8(CheckCircle23, { className: "size-3.5 text-primary" }),
    " Active"
  ] });
}
function fundingLabel(sub) {
  if (sub?.awaitingPayment) return "Awaiting payment";
  switch (sub?.funding) {
    case "card":
      return "Card \xB7 managed in Stripe";
    case "invoice":
      return "Invoiced";
    case "comp":
      return sub.comp ? `Comped: ${sub.comp.reason}${sub.comp.expiresAt ? ` (until ${sub.comp.expiresAt.slice(0, 10)})` : ""}` : "Comped";
    case "none":
      return "Not funded";
    default:
      return "Not recorded";
  }
}
function PlanHeaderCard({ view }) {
  const sub = view.subscription;
  const state = view.lifecycle;
  const lapsed = state === "lapsed";
  const awaitingPayment = sub?.awaitingPayment === true;
  const plan = sub?.plan;
  const endsAt = sub?.endedAt ? sub.endedAt.slice(0, 7) : null;
  return /* @__PURE__ */ jsxs5(Card5, { children: [
    /* @__PURE__ */ jsx8(CardHeader5, { children: /* @__PURE__ */ jsx8("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxs5("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx8(CardTitle5, { children: plan?.name ?? "No plan" }),
        /* @__PURE__ */ jsx8(LifecycleBadge, { state, endsAt, awaitingPayment })
      ] }),
      /* @__PURE__ */ jsx8(CardDescription5, { children: plan?.description ?? "You have no recurring subscription." })
    ] }) }) }),
    /* @__PURE__ */ jsxs5(CardContent5, { children: [
      /* @__PURE__ */ jsxs5("div", { className: "grid gap-4 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxs5("div", { children: [
          /* @__PURE__ */ jsx8("div", { className: "text-xs text-muted-foreground", children: "Funding" }),
          /* @__PURE__ */ jsx8("div", { className: "text-lg font-semibold", children: /* @__PURE__ */ jsx8("span", { className: "text-muted-foreground", children: fundingLabel(sub) }) })
        ] }),
        /* @__PURE__ */ jsxs5("div", { children: [
          /* @__PURE__ */ jsx8("div", { className: "text-xs text-muted-foreground", children: "Commitment" }),
          /* @__PURE__ */ jsx8("div", { className: "text-lg font-semibold", children: sub?.commitmentMonths ? `${sub.commitmentMonths} ${sub.commitmentMonths === 1 ? "month" : "months"}` : "Month-to-month" })
        ] }),
        /* @__PURE__ */ jsxs5("div", { children: [
          /* @__PURE__ */ jsx8("div", { className: "text-xs text-muted-foreground", children: lapsed ? "Coverage ended" : "Billable window" }),
          /* @__PURE__ */ jsxs5(
            "div",
            {
              className: cn5(
                "font-mono text-sm",
                lapsed ? "text-destructive" : "text-foreground"
              ),
              children: [
                sub?.earliestBillablePeriod ?? "\u2014",
                " \u2192 ",
                sub?.latestBillablePeriod ?? "\u2014"
              ]
            }
          )
        ] })
      ] }),
      lapsed && /* @__PURE__ */ jsxs5("p", { className: "mt-4 flex gap-2 rounded-md border border-destructive/30 bg-destructive/[0.06] p-3 text-sm text-destructive", children: [
        /* @__PURE__ */ jsx8(XCircle2, { className: "mt-0.5 size-4 flex-none" }),
        /* @__PURE__ */ jsxs5("span", { children: [
          "This subscription is outside its active window \u2014",
          " ",
          /* @__PURE__ */ jsx8("b", { children: "entitlements and the spending cap are revoked" }),
          " until you re-subscribe. Re-activate via the Customer Portal."
        ] })
      ] })
    ] })
  ] });
}
function SourceBadge({ source }) {
  const style = source === "tenant" ? "border-primary/30 bg-primary/5 text-foreground" : source === "plan" ? "border-border bg-muted/60 text-muted-foreground" : "border-dashed border-border bg-transparent text-muted-foreground";
  return /* @__PURE__ */ jsxs5(
    "span",
    {
      className: cn5(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] tracking-wide",
        style
      ),
      children: [
        /* @__PURE__ */ jsx8("span", { children: entitlementSourceLabel(source) }),
        /* @__PURE__ */ jsx8("span", { className: "ml-1 font-mono text-[9px] normal-case opacity-70", children: source })
      ]
    }
  );
}
function EntitlementGrid({
  entitlements,
  labels,
  lapsed
}) {
  const [facet, setFacet] = useState4("all");
  const rows = useMemo(
    () => facet === "all" ? entitlements : entitlements.filter((e) => e.source === facet),
    [entitlements, facet]
  );
  return /* @__PURE__ */ jsxs5(Card5, { children: [
    /* @__PURE__ */ jsxs5(CardHeader5, { children: [
      /* @__PURE__ */ jsx8("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx8(CardTitle5, { children: "Resolved entitlements" }),
        /* @__PURE__ */ jsxs5(CardDescription5, { children: [
          "What's on your plan \u2014 the RESOLVED map (not plan text), cascaded",
          " ",
          /* @__PURE__ */ jsx8("span", { className: "font-mono text-xs", children: "default \u2192 plan \u2192 tenant" }),
          "."
        ] })
      ] }) }),
      /* @__PURE__ */ jsx8("div", { className: "flex flex-wrap gap-1.5 pt-1", children: ENTITLEMENT_SOURCE_FACETS.map((f) => /* @__PURE__ */ jsx8(
        "button",
        {
          type: "button",
          onClick: () => setFacet(f.key),
          className: cn5(
            "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
            facet === f.key ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted/60"
          ),
          children: f.label
        },
        f.key
      )) })
    ] }),
    /* @__PURE__ */ jsx8(CardContent5, { children: /* @__PURE__ */ jsx8("div", { children: /* @__PURE__ */ jsxs5("div", { className: "divide-y rounded-md border", children: [
      /* @__PURE__ */ jsxs5("div", { "data-entitlement-header": true, className: "hidden grid-cols-[1fr_auto_auto] gap-4 bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid", children: [
        /* @__PURE__ */ jsx8("span", { children: "Capability" }),
        /* @__PURE__ */ jsx8("span", { className: "text-right", children: "State" }),
        /* @__PURE__ */ jsx8("span", { className: "text-right", children: "Source" })
      ] }),
      rows.length === 0 && /* @__PURE__ */ jsx8("div", { className: "px-3 py-6 text-center text-sm text-muted-foreground", children: "No capabilities in this facet." }),
      rows.map((e) => {
        const on = e.enabled && !lapsed;
        return /* @__PURE__ */ jsxs5(
          "div",
          {
            "data-entitlement-row": true,
            className: "grid grid-cols-1 items-center gap-2 px-3 py-2.5 sm:grid-cols-[1fr_auto_auto] sm:gap-4",
            children: [
              /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx8("span", { className: "text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden", children: "Capability" }),
                /* @__PURE__ */ jsx8(
                  "div",
                  {
                    className: cn5(
                      "truncate text-sm",
                      !on && "text-muted-foreground line-through"
                    ),
                    children: labels[e.capability] ?? e.capability
                  }
                ),
                /* @__PURE__ */ jsx8("div", { className: "font-mono text-[10px] text-muted-foreground", children: e.capability })
              ] }),
              /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between gap-3 sm:justify-end", children: [
                /* @__PURE__ */ jsx8("span", { className: "text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden", children: "State" }),
                /* @__PURE__ */ jsxs5(
                  "span",
                  {
                    className: cn5(
                      "inline-flex items-center gap-1.5 text-xs",
                      on ? "text-foreground" : "text-muted-foreground"
                    ),
                    children: [
                      /* @__PURE__ */ jsx8(
                        "span",
                        {
                          className: cn5(
                            "size-1.5 rounded-full",
                            on ? "bg-primary" : "bg-muted-foreground/40"
                          )
                        }
                      ),
                      on ? "Enabled" : lapsed && e.enabled ? "Revoked" : "Off"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between gap-3 sm:justify-end", children: [
                /* @__PURE__ */ jsx8("span", { className: "text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden", children: "Source" }),
                /* @__PURE__ */ jsx8(SourceBadge, { source: e.source })
              ] })
            ]
          },
          e.capability
        );
      })
    ] }) }) })
  ] });
}
function SubscriptionSurface({
  checkoutSignal = null,
  onClearCheckoutSignal,
  embedded = false
} = {}) {
  const entitlements = useEntitlements();
  const view = useSubscription();
  const checkout = useSubscriptionCheckout();
  const portal = useSubscriptionPortal();
  const navigate = useCommerceNavigate();
  const can = useCommerceCan();
  const canManageBilling = can("billing.manage");
  const canCheckoutPlan = can("plans.checkout");
  const syncing = checkoutSignal === "success" && !view.data?.subscription?.active;
  useEffect2(() => {
    if (!syncing) return;
    const t = setInterval(() => view.refetch(), 2500);
    return () => clearInterval(t);
  }, [syncing]);
  useEffect2(() => {
    if (checkoutSignal === "success" && view.data?.subscription?.active) {
      onClearCheckoutSignal?.();
    }
  }, [checkoutSignal, view.data?.subscription?.active]);
  const data = view.data;
  const lapsed = data?.lifecycle === "lapsed";
  const onPortal = () => portal.mutate(void 0, { onSuccess: ({ url }) => navigate(url) });
  const onCheckout = () => {
    const planId = data?.subscription?.planId;
    if (planId) checkout.mutate(planId, { onSuccess: ({ url }) => navigate(url) });
  };
  const actions = data?.subscription?.awaitingPayment && data.subscription.planId ? /* @__PURE__ */ jsxs5("div", { className: "flex max-w-64 flex-col items-end gap-1", children: [
    /* @__PURE__ */ jsxs5(
      Button4,
      {
        size: "sm",
        onClick: onCheckout,
        disabled: !canCheckoutPlan || checkout.isPending,
        "aria-describedby": !canCheckoutPlan ? "subscription-checkout-refusal" : void 0,
        children: [
          "Subscribe ",
          /* @__PURE__ */ jsx8(ArrowUpRight2, { className: "size-3.5" })
        ]
      }
    ),
    !canCheckoutPlan && /* @__PURE__ */ jsx8("p", { id: "subscription-checkout-refusal", className: "text-right text-xs text-muted-foreground", children: "Your role can\u2019t choose a plan. Ask a workspace owner or admin to subscribe." })
  ] }) : data?.hasStripeId ? /* @__PURE__ */ jsxs5("div", { className: "flex max-w-64 flex-col items-end gap-1", children: [
    /* @__PURE__ */ jsxs5(
      Button4,
      {
        variant: "outline",
        size: "sm",
        onClick: onPortal,
        disabled: !canManageBilling || portal.isPending,
        "aria-describedby": !canManageBilling ? "subscription-manage-refusal" : void 0,
        children: [
          "Manage subscription ",
          /* @__PURE__ */ jsx8(ExternalLink, { className: "size-3.5" })
        ]
      }
    ),
    !canManageBilling && /* @__PURE__ */ jsx8("p", { id: "subscription-manage-refusal", className: "text-right text-xs text-muted-foreground", children: "Your role can\u2019t manage billing. Ask a workspace owner or admin to manage the subscription." })
  ] }) : null;
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs5("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx8(SurfaceHeading, { embedded, children: "Subscription" }),
        /* @__PURE__ */ jsx8("p", { className: "text-sm text-muted-foreground", children: "Your recurring plan and what it entitles you to." })
      ] }),
      actions
    ] }),
    syncing && /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx8("span", { className: "size-1.5 animate-pulse rounded-full bg-primary" }),
      "Syncing your plan\u2026 changes made in Stripe land here after the webhook is processed \u2014 this may take a moment."
    ] }),
    checkoutSignal === "cancelled" && /* @__PURE__ */ jsx8("div", { className: "rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground", children: "Checkout was cancelled \u2014 your plan is unchanged." }),
    view.isPending && /* @__PURE__ */ jsx8(Card5, { children: /* @__PURE__ */ jsxs5(CardHeader5, { children: [
      /* @__PURE__ */ jsx8(CardTitle5, { children: "Subscription" }),
      /* @__PURE__ */ jsx8(CardDescription5, { children: "Loading your plan\u2026" })
    ] }) }),
    view.isError && /* @__PURE__ */ jsxs5(Card5, { children: [
      /* @__PURE__ */ jsx8(CardHeader5, { children: /* @__PURE__ */ jsx8(CardTitle5, { children: "Subscription" }) }),
      /* @__PURE__ */ jsx8(CardContent5, { children: /* @__PURE__ */ jsx8("p", { className: "text-sm text-destructive", children: errorMessage(view.error, "Could not load your subscription.") }) })
    ] }),
    data && /* @__PURE__ */ jsxs5("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx8(PlanHeaderCard, { view: data }),
      data.subscription?.awaitingPayment && /* @__PURE__ */ jsxs5("div", { className: "flex items-start gap-3 rounded-md border border-warning/40 bg-warning/[0.06] p-4", children: [
        /* @__PURE__ */ jsx8(Sparkles, { className: "mt-0.5 size-4 flex-none text-warning" }),
        /* @__PURE__ */ jsxs5("div", { className: "space-y-1 text-sm", children: [
          /* @__PURE__ */ jsx8("div", { className: "font-medium text-foreground", children: "Awaiting payment" }),
          /* @__PURE__ */ jsx8("p", { className: "text-muted-foreground", children: "This plan is not paid for yet, so the free plan's features apply until it is." })
        ] })
      ] }),
      /* @__PURE__ */ jsx8(
        EntitlementGrid,
        {
          entitlements: entitlements.data ?? [],
          labels: data.capabilityLabels,
          lapsed
        }
      )
    ] })
  ] });
}

// src/CommerceBillingPanel.tsx
import { useEffect as useEffect3, useRef } from "react";
import { Fragment as Fragment4, jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
function CommerceBillingPanel({
  custody,
  selectedPanel = null,
  autoReload,
  checkoutSignal,
  onClearCheckoutSignal
}) {
  const hasMoneyCustody = custody !== "none";
  const subscriptionRef = useRef(null);
  const creditsRef = useRef(null);
  const autoReloadRef = useRef(null);
  useEffect3(() => {
    if (!selectedPanel) return;
    const target = {
      subscription: subscriptionRef.current,
      credits: creditsRef.current,
      "auto-reload": autoReloadRef.current
    }[selectedPanel];
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }, [selectedPanel]);
  return /* @__PURE__ */ jsxs6("div", { className: "space-y-10", children: [
    /* @__PURE__ */ jsxs6("header", { children: [
      /* @__PURE__ */ jsx9("h1", { className: "text-xl font-semibold tracking-tight", children: "Billing" }),
      /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "Usage, spending, subscription and prepaid credit for this workspace." })
    ] }),
    /* @__PURE__ */ jsx9(BillingSurface, { embedded: true, subscribeHref: hasMoneyCustody ? "#subscription" : void 0 }),
    hasMoneyCustody && /* @__PURE__ */ jsxs6(Fragment4, { children: [
      /* @__PURE__ */ jsx9("section", { id: "subscription", ref: subscriptionRef, tabIndex: -1, "data-commerce-panel": "subscription", children: /* @__PURE__ */ jsx9(
        SubscriptionSurface,
        {
          embedded: true,
          checkoutSignal,
          onClearCheckoutSignal
        }
      ) }),
      /* @__PURE__ */ jsx9("section", { ref: creditsRef, tabIndex: -1, "data-commerce-panel": "credits", children: /* @__PURE__ */ jsx9(CreditsSurface, { embedded: true }) }),
      autoReload && /* @__PURE__ */ jsxs6(
        "section",
        {
          ref: autoReloadRef,
          tabIndex: -1,
          "data-commerce-panel": "auto-reload",
          className: "space-y-4",
          "aria-labelledby": "commerce-auto-reload",
          children: [
            /* @__PURE__ */ jsx9("h2", { id: "commerce-auto-reload", className: "text-xl font-semibold tracking-tight", children: "Auto-reload" }),
            autoReload
          ]
        }
      )
    ] })
  ] });
}
export {
  AutoReloadConfigCard,
  AutoReloadProvider,
  BillingSurface,
  CommerceBillingPanel,
  CommerceProvider,
  CreditsSurface,
  ReloadActivityCard,
  SubscriptionSurface,
  billStatusLabel,
  entitlementSourceLabel,
  errorMessage,
  formatDate,
  formatUsd,
  reloadOutcomeLabel,
  useAutoReloadActivity,
  useAutoReloadConfig,
  useAutoReloadServices,
  useBillPreview,
  useBills,
  useBudget,
  useCommerceCan,
  useCommerceNavigate,
  useCommerceNotify,
  useCommerceServices,
  useCreditTopupCheckout,
  useEntitlements,
  useNotify,
  useReloadCredits,
  useSavePaymentMethod,
  useSubscription,
  useSubscriptionCheckout,
  useSubscriptionPortal,
  useUpdateAutoReloadConfig,
  useUsageSummary,
  useWallet
};
//# sourceMappingURL=index.js.map