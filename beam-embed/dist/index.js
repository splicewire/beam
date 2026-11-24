// src/PrivacyRetentionPage.tsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Eraser, Info, Loader2, Shield, Trash2, X } from "lucide-react";
import { Badge } from "@schemastud/ui";
import { Button } from "@schemastud/ui";
import { Card, CardContent, CardDescription, CardHeader } from "@schemastud/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@schemastud/ui";
import { Input } from "@schemastud/ui";
import { Label } from "@schemastud/ui";
import { cn } from "@schemastud/ui";

// src/api.tsx
import { createContext, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { jsx } from "react/jsx-runtime";
var Context = createContext(null);
function RetentionProvider({ services, children }) {
  return /* @__PURE__ */ jsx(Context.Provider, { value: services, children });
}
function useRetentionServices() {
  const services = useContext(Context);
  if (!services) throw new Error("PrivacyRetentionPage requires RetentionProvider.");
  return services;
}
function useRetentionPosture() {
  const { client } = useRetentionServices();
  return useQuery({ queryKey: ["embed", "posture"], queryFn: () => client.posture() });
}
function usePrunePreview() {
  const { client } = useRetentionServices();
  return useQuery({ queryKey: ["embed", "prune-preview"], queryFn: () => client.preview() });
}
function usePruneSessions() {
  const { client } = useRetentionServices();
  return useMutation({ mutationFn: () => client.prune() });
}
function useEraseSubject() {
  const { client } = useRetentionServices();
  return useMutation({ mutationFn: (input) => client.erase(input) });
}
function apiErrorMessage(error, fallback) {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response;
    if (response && typeof response === "object" && "data" in response) {
      const data = response.data;
      if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
    }
  }
  return error instanceof Error ? error.message : fallback;
}

// src/PrivacyRetentionPage.tsx
import { useMessageLocale } from "@schemastud/messages/react";

// src/messages.ts
import { createMessages } from "@schemastud/messages";
import { useMessages } from "@schemastud/messages/react";

// messages.default.json
var messages_default_default = {
  version: 1,
  package: "@splicewire/beam-embed",
  sourceLocale: "en",
  namespace: "splicewire-beam-embed",
  sharesWith: null,
  messages: {
    "splicewire-beam-embed::messages.admin_required": "Admin required.",
    "splicewire-beam-embed::messages.banner": "Only workspace admins can prune or erase retained data.",
    "splicewire-beam-embed::messages.cancel": "Cancel",
    "splicewire-beam-embed::messages.confirm_body": "You are about to erase :subject. You are erasing the :person, not just their chats \u2014 every matching session and its messages are deleted, and the visitor's personal data drops when their last session goes.",
    "splicewire-beam-embed::messages.confirm_title_session": "Erase this session?",
    "splicewire-beam-embed::messages.confirm_title_visitor": "Erase this visitor?",
    "splicewire-beam-embed::messages.consent_default_bold": "Default: no.",
    "splicewire-beam-embed::messages.consent_description": "Whether each Published Chat lets its transcripts be used for corpus or training. :default There\u2019s no setting for this yet, so new chats are opted out and can\u2019t be opted in.",
    "splicewire-beam-embed::messages.consent_empty": "No published chats yet. New chats default to :opted_out.",
    "splicewire-beam-embed::messages.consent_failed": "Could not load training consent.",
    "splicewire-beam-embed::messages.consent_loading": "Loading consent\u2026",
    "splicewire-beam-embed::messages.consent_none": "No published chats have opted into corpus/training.",
    "splicewire-beam-embed::messages.consent_summary": ":opted of :total published chat opted into corpus/training.|:opted of :total published chats opted into corpus/training.",
    "splicewire-beam-embed::messages.consent_title": "Corpus / training consent",
    "splicewire-beam-embed::messages.day_adjective": ":count-day|:count-day",
    "splicewire-beam-embed::messages.days": ":count days|:count days",
    "splicewire-beam-embed::messages.erase_action": "Erase subject\u2026",
    "splicewire-beam-embed::messages.erase_description": "A subject-access erasure request. Provide exactly one of a visitor ID or session ID. This erases the :person \u2014 the visitor's personal data drops when their last session goes. :irreversible",
    "splicewire-beam-embed::messages.erase_failed": "Could not erase the subject.",
    "splicewire-beam-embed::messages.erase_permanently": "Erase permanently",
    "splicewire-beam-embed::messages.erase_person_bold": "person, not just their chats",
    "splicewire-beam-embed::messages.erase_title": "Erase a subject",
    "splicewire-beam-embed::messages.erase_token": "ERASE",
    "splicewire-beam-embed::messages.erased": "Erased :n session for :subject. This cannot be undone.|Erased :n sessions for :subject. This cannot be undone.",
    "splicewire-beam-embed::messages.erasing": "Erasing\u2026",
    "splicewire-beam-embed::messages.footer": "Prune previews its blast radius, then runs immediately; erase runs immediately. Both report how many sessions were affected. A browsable per-session list is coming in a future update.",
    "splicewire-beam-embed::messages.irreversible": "This is irreversible. There is no undo and no recovery.",
    "splicewire-beam-embed::messages.irreversible_bold": "Irreversible.",
    "splicewire-beam-embed::messages.kind_session": "Session ID",
    "splicewire-beam-embed::messages.kind_visitor": "Visitor ID",
    "splicewire-beam-embed::messages.not_enforced": "Retention is :not_enforced \u2014 nothing sweeps on a schedule. Sessions past their window persist until you :prune below. Default window is :window.",
    "splicewire-beam-embed::messages.not_enforced_bold": "not auto-enforced",
    "splicewire-beam-embed::messages.nothing_to_prune": "Nothing to prune.",
    "splicewire-beam-embed::messages.opted_in": "opted in",
    "splicewire-beam-embed::messages.opted_out": "opted out",
    "splicewire-beam-embed::messages.page_title": "Privacy & retention",
    "splicewire-beam-embed::messages.person_bold": "person",
    "splicewire-beam-embed::messages.posture_description": "Retention is a per-Published-Chat window that is snapshotted onto each session when it starts.",
    "splicewire-beam-embed::messages.posture_title": "Retention posture",
    "splicewire-beam-embed::messages.provide_one": "Provide exactly one of a visitor ID or session ID.",
    "splicewire-beam-embed::messages.prune_action": "Prune expired sessions",
    "splicewire-beam-embed::messages.prune_bold": "prune",
    "splicewire-beam-embed::messages.prune_checking": "Checking what would be removed\u2026",
    "splicewire-beam-embed::messages.prune_description": "Delete every embed session (and its messages) past its retention window. A visitor's personal data drops once their last session is gone.",
    "splicewire-beam-embed::messages.prune_failed": "Could not prune sessions.",
    "splicewire-beam-embed::messages.prune_preview": ":n session past their window would be removed by a prune right now.|:n sessions past their window would be removed by a prune right now.",
    "splicewire-beam-embed::messages.prune_preview_failed": "Could not preview the prune.",
    "splicewire-beam-embed::messages.prune_title": "Prune by policy",
    "splicewire-beam-embed::messages.pruned": "Pruned :n session past their retention window.|Pruned :n sessions past their retention window.",
    "splicewire-beam-embed::messages.pruning": "Pruning\u2026",
    "splicewire-beam-embed::messages.read_only": "read-only",
    "splicewire-beam-embed::messages.subject_session": "session",
    "splicewire-beam-embed::messages.subject_visitor": "visitor",
    "splicewire-beam-embed::messages.type_to_confirm": "Type :token to confirm",
    "splicewire-beam-embed::messages.untitled": "Untitled chat",
    "splicewire-beam-embed::messages.windows_empty": "No published chats yet. New chats default to a :window window.",
    "splicewire-beam-embed::messages.windows_failed": "Could not load retention windows.",
    "splicewire-beam-embed::messages.windows_label": "Per-Published-Chat windows",
    "splicewire-beam-embed::messages.windows_loading": "Loading windows\u2026"
  }
};

// src/messages.ts
var englishBeamEmbedMessages = createMessages(messages_default_default.messages);
var useBeamEmbedMessages = () => useMessages(messages_default_default.messages);

// src/rich-message.tsx
import { Fragment } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
function richMessage(messages, key, parts, count) {
  const values = Object.values(parts);
  const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `\uFFFC${index}\uFFFC`]));
  const occurrences = /* @__PURE__ */ new Map();
  const text = count === void 0 ? messages.t(key, parameters) : messages.choice(key, count, parameters);
  return text.split(/(￼\d+￼)/u).map((part, index) => {
    const match = /^￼(\d+)￼$/u.exec(part);
    const occurrence = match ? occurrences.get(match[1]) ?? 0 : 0;
    if (match) occurrences.set(match[1], occurrence + 1);
    return /* @__PURE__ */ jsx2(Fragment, { children: match ? values[Number(match[1])] : part }, match ? `slot-${match[1]}-${occurrence}` : `text-${index}`);
  });
}

// src/PrivacyRetentionPage.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var DEFAULT_RETENTION_DAYS = 90;
function GovernanceBanner() {
  const m = useBeamEmbedMessages();
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-3xl items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground", children: [
    /* @__PURE__ */ jsx3(Shield, { className: "mt-0.5 size-4 flex-none" }),
    /* @__PURE__ */ jsx3("span", { children: m.t("splicewire-beam-embed::messages.banner") })
  ] });
}
function PostureCard() {
  const m = useBeamEmbedMessages();
  const { policyDescription } = useRetentionServices();
  const posture = useRetentionPosture();
  const defaultDays = posture.data?.default_days ?? DEFAULT_RETENTION_DAYS;
  const chats = posture.data?.chats ?? [];
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx3("h2", { className: "font-semibold leading-none tracking-tight", children: m.t("splicewire-beam-embed::messages.posture_title") }),
      /* @__PURE__ */ jsx3(CardDescription, { children: policyDescription ?? m.t("splicewire-beam-embed::messages.posture_description") })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground", children: [
        /* @__PURE__ */ jsx3(Info, { className: "mt-0.5 size-4 flex-none" }),
        /* @__PURE__ */ jsx3("p", { className: "leading-relaxed", children: richMessage(m, "splicewire-beam-embed::messages.not_enforced", {
          not_enforced: /* @__PURE__ */ jsx3("b", { children: m.t("splicewire-beam-embed::messages.not_enforced_bold") }),
          prune: /* @__PURE__ */ jsx3("b", { children: m.t("splicewire-beam-embed::messages.prune_bold") }),
          window: /* @__PURE__ */ jsx3("b", { children: m.choice("splicewire-beam-embed::messages.days", defaultDays) })
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx3(Label, { children: m.t("splicewire-beam-embed::messages.windows_label") }),
        posture.isPending ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx3(Loader2, { className: "size-4 animate-spin" }),
          " ",
          m.t("splicewire-beam-embed::messages.windows_loading")
        ] }) : posture.isError ? /* @__PURE__ */ jsx3("div", { className: "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive", children: apiErrorMessage(posture.error, m.t("splicewire-beam-embed::messages.windows_failed")) }) : chats.length === 0 ? /* @__PURE__ */ jsx3("div", { className: "rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground", children: richMessage(m, "splicewire-beam-embed::messages.windows_empty", {
          window: /* @__PURE__ */ jsx3("b", { children: m.choice("splicewire-beam-embed::messages.day_adjective", defaultDays) })
        }) }) : /* @__PURE__ */ jsx3("div", { className: "divide-y rounded-md border", children: chats.map((chat) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center justify-between gap-3 px-3 py-2.5 text-sm",
            children: [
              /* @__PURE__ */ jsx3("span", { className: "truncate", children: chat.title || /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: m.t("splicewire-beam-embed::messages.untitled") }) }),
              /* @__PURE__ */ jsx3(Badge, { variant: "outline", className: "flex-none tabular-nums", children: m.choice("splicewire-beam-embed::messages.days", chat.retention_days) })
            ]
          },
          chat.id
        )) })
      ] })
    ] })
  ] });
}
function PruneCard({ disabled }) {
  const m = useBeamEmbedMessages();
  const queryClient = useQueryClient();
  const prune = usePruneSessions();
  const preview = usePrunePreview();
  const [result, setResult] = useState(null);
  const wouldPrune = preview.data?.would_prune ?? 0;
  function runPrune() {
    prune.mutate(void 0, {
      onSuccess: (data) => {
        setResult(data);
        queryClient.invalidateQueries({ queryKey: ["embed", "prune-preview"] });
        queryClient.invalidateQueries({ queryKey: ["embed", "posture"] });
      }
    });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 font-semibold leading-none tracking-tight", children: [
        /* @__PURE__ */ jsx3(Trash2, { className: "size-4 text-muted-foreground" }),
        " ",
        m.t("splicewire-beam-embed::messages.prune_title")
      ] }),
      /* @__PURE__ */ jsx3(CardDescription, { children: m.t("splicewire-beam-embed::messages.prune_description") })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5 text-sm", children: [
        /* @__PURE__ */ jsx3(Info, { className: "size-4 flex-none text-muted-foreground" }),
        preview.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
          /* @__PURE__ */ jsx3(Loader2, { className: "size-3.5 animate-spin" }),
          " ",
          m.t("splicewire-beam-embed::messages.prune_checking")
        ] }) : preview.isError ? /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: apiErrorMessage(preview.error, m.t("splicewire-beam-embed::messages.prune_preview_failed")) }) : /* @__PURE__ */ jsx3("span", { className: "leading-tight text-muted-foreground", children: richMessage(m, "splicewire-beam-embed::messages.prune_preview", {
          n: /* @__PURE__ */ jsx3("b", { className: "text-foreground", children: wouldPrune })
        }, wouldPrune) })
      ] }),
      prune.isError && /* @__PURE__ */ jsx3("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(prune.error, m.t("splicewire-beam-embed::messages.prune_failed")) }),
      result ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm", children: [
        /* @__PURE__ */ jsx3("span", { className: "size-2 rounded-full bg-primary" }),
        richMessage(m, "splicewire-beam-embed::messages.pruned", {
          n: /* @__PURE__ */ jsx3("b", { children: result.pruned })
        }, result.pruned)
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            disabled: disabled || prune.isPending || preview.isSuccess && wouldPrune === 0,
            onClick: runPrune,
            variant: "secondary",
            children: [
              /* @__PURE__ */ jsx3(Trash2, { className: "size-4" }),
              " ",
              prune.isPending ? m.t("splicewire-beam-embed::messages.pruning") : m.t("splicewire-beam-embed::messages.prune_action")
            ]
          }
        ),
        disabled ? /* @__PURE__ */ jsx3("span", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-embed::messages.admin_required") }) : preview.isSuccess && wouldPrune === 0 ? /* @__PURE__ */ jsx3("span", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-embed::messages.nothing_to_prune") }) : null
      ] })
    ] })
  ] });
}
var SUBJECT_KIND_LABELS = {
  visitorId: "splicewire-beam-embed::messages.kind_visitor",
  sessionId: "splicewire-beam-embed::messages.kind_session"
};
var SUBJECT_KIND_WORDS = {
  visitorId: "splicewire-beam-embed::messages.subject_visitor",
  sessionId: "splicewire-beam-embed::messages.subject_session"
};
function EraseCard({ disabled }) {
  const m = useBeamEmbedMessages();
  const erase = useEraseSubject();
  const [kind, setKind] = useState("visitorId");
  const [subjectId, setSubjectId] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [receipt, setReceipt] = useState(
    null
  );
  const canOpen = subjectId.trim().length > 0;
  const locale = useMessageLocale();
  const eraseToken = m.t("splicewire-beam-embed::messages.erase_token");
  const canDestroy = confirmText.trim().toLocaleUpperCase(locale) === eraseToken.toLocaleUpperCase(locale);
  function runErase() {
    const id = subjectId.trim();
    erase.mutate(
      { kind, subjectId: id },
      {
        onSuccess: (data) => {
          setReceipt({ ...data, kind, id });
          setOpen(false);
          setConfirmText("");
        }
      }
    );
  }
  return (
    // Destructive card — unmistakably tinted apart from the ink-on-paper cards above.
    /* @__PURE__ */ jsxs(Card, { className: "border-destructive/40 bg-destructive/[0.03]", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-destructive font-semibold leading-none tracking-tight", children: [
          /* @__PURE__ */ jsx3(Eraser, { className: "size-4" }),
          " ",
          m.t("splicewire-beam-embed::messages.erase_title")
        ] }),
        /* @__PURE__ */ jsx3(CardDescription, { children: richMessage(m, "splicewire-beam-embed::messages.erase_description", {
          person: /* @__PURE__ */ jsx3("b", { children: m.t("splicewire-beam-embed::messages.erase_person_bold") }),
          irreversible: /* @__PURE__ */ jsx3("b", { children: m.t("splicewire-beam-embed::messages.irreversible_bold") })
        }) })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx3("div", { className: "flex gap-2", children: ["visitorId", "sessionId"].map((k) => /* @__PURE__ */ jsx3(
          "button",
          {
            type: "button",
            disabled,
            onClick: () => setKind(k),
            className: cn(
              "flex-1 rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors disabled:opacity-50",
              kind === k ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border bg-background text-muted-foreground hover:bg-muted/50"
            ),
            children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx3(
                "span",
                {
                  className: cn(
                    "size-2 rounded-full",
                    kind === k ? "bg-destructive" : "bg-muted-foreground/30"
                  )
                }
              ),
              m.t(SUBJECT_KIND_LABELS[k])
            ] })
          },
          k
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
          /* @__PURE__ */ jsx3(Label, { htmlFor: "subject-id", children: m.t(SUBJECT_KIND_LABELS[kind]) }),
          /* @__PURE__ */ jsx3(
            Input,
            {
              id: "subject-id",
              value: subjectId,
              onChange: (e) => setSubjectId(e.target.value),
              placeholder: kind === "visitorId" ? "vis_\u2026" : "sess_\u2026",
              className: "font-mono",
              disabled
            }
          ),
          !canOpen ? /* @__PURE__ */ jsx3("p", { className: "text-[11px] text-muted-foreground", children: m.t("splicewire-beam-embed::messages.provide_one") }) : null
        ] }),
        erase.isError && !open && /* @__PURE__ */ jsx3("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(erase.error, m.t("splicewire-beam-embed::messages.erase_failed")) }),
        receipt ? (
          // Post-erase RECEIPT — the missing pre-erase list, after the fact.
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm", children: [
            /* @__PURE__ */ jsx3(Eraser, { className: "mt-0.5 size-4 flex-none text-destructive" }),
            /* @__PURE__ */ jsx3("div", { children: richMessage(m, "splicewire-beam-embed::messages.erased", {
              n: /* @__PURE__ */ jsx3("b", { children: receipt.erased }),
              subject: /* @__PURE__ */ jsxs("code", { className: "font-mono text-xs", children: [
                m.t(SUBJECT_KIND_WORDS[receipt.kind]),
                " ",
                receipt.id
              ] })
            }, receipt.erased) })
          ] })
        ) : null,
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "destructive",
              disabled: disabled || !canOpen,
              onClick: () => {
                setConfirmText("");
                setOpen(true);
              },
              children: [
                /* @__PURE__ */ jsx3(Eraser, { className: "size-4" }),
                " ",
                m.t("splicewire-beam-embed::messages.erase_action")
              ]
            }
          ),
          disabled ? /* @__PURE__ */ jsx3("span", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-embed::messages.admin_required") }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsx3(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2 text-destructive", children: [
            /* @__PURE__ */ jsx3(AlertTriangle, { className: "size-5" }),
            " ",
            kind === "visitorId" ? m.t("splicewire-beam-embed::messages.confirm_title_visitor") : m.t("splicewire-beam-embed::messages.confirm_title_session")
          ] }),
          /* @__PURE__ */ jsx3(DialogDescription, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx3("p", { children: richMessage(m, "splicewire-beam-embed::messages.confirm_body", {
              subject: /* @__PURE__ */ jsxs("code", { className: "font-mono text-xs text-foreground", children: [
                m.t(SUBJECT_KIND_WORDS[kind]),
                " ",
                subjectId || "\u2014"
              ] }),
              person: /* @__PURE__ */ jsx3("b", { className: "text-foreground", children: m.t("splicewire-beam-embed::messages.person_bold") })
            }) }),
            /* @__PURE__ */ jsx3("p", { className: "font-medium text-destructive", children: m.t("splicewire-beam-embed::messages.irreversible") })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
          /* @__PURE__ */ jsx3(Label, { htmlFor: "erase-confirm", children: richMessage(m, "splicewire-beam-embed::messages.type_to_confirm", {
            token: /* @__PURE__ */ jsx3("span", { className: "font-mono font-semibold", children: eraseToken })
          }) }),
          /* @__PURE__ */ jsx3(
            Input,
            {
              id: "erase-confirm",
              value: confirmText,
              onChange: (e) => setConfirmText(e.target.value),
              placeholder: eraseToken,
              className: "font-mono",
              autoComplete: "off"
            }
          )
        ] }),
        erase.isError && /* @__PURE__ */ jsx3("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(erase.error, m.t("splicewire-beam-embed::messages.erase_failed")) }),
        /* @__PURE__ */ jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsx3(Button, { variant: "outline", onClick: () => setOpen(false), children: m.t("splicewire-beam-embed::messages.cancel") }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "destructive",
              disabled: disabled || !canDestroy || erase.isPending,
              onClick: runErase,
              children: [
                /* @__PURE__ */ jsx3(Eraser, { className: "size-4" }),
                " ",
                erase.isPending ? m.t("splicewire-beam-embed::messages.erasing") : m.t("splicewire-beam-embed::messages.erase_permanently")
              ]
            }
          )
        ] })
      ] }) })
    ] })
  );
}
function CorpusConsentCard() {
  const m = useBeamEmbedMessages();
  const posture = useRetentionPosture();
  const chats = posture.data?.chats ?? [];
  const optedIn = chats.filter((c) => c.corpus_optin).length;
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx3(Badge, { variant: "outline", className: "font-mono text-[10px] uppercase", children: m.t("splicewire-beam-embed::messages.read_only") }),
        /* @__PURE__ */ jsx3("h2", { className: "font-semibold leading-none tracking-tight", children: m.t("splicewire-beam-embed::messages.consent_title") })
      ] }),
      /* @__PURE__ */ jsx3(CardDescription, { children: richMessage(m, "splicewire-beam-embed::messages.consent_description", {
        default: /* @__PURE__ */ jsx3("b", { children: m.t("splicewire-beam-embed::messages.consent_default_bold") })
      }) })
    ] }),
    /* @__PURE__ */ jsx3(CardContent, { children: posture.isPending ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx3(Loader2, { className: "size-4 animate-spin" }),
      " ",
      m.t("splicewire-beam-embed::messages.consent_loading")
    ] }) : posture.isError ? /* @__PURE__ */ jsx3("div", { className: "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive", children: apiErrorMessage(posture.error, m.t("splicewire-beam-embed::messages.consent_failed")) }) : chats.length === 0 ? /* @__PURE__ */ jsx3("div", { className: "rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground", children: richMessage(m, "splicewire-beam-embed::messages.consent_empty", {
      opted_out: /* @__PURE__ */ jsx3("b", { children: m.t("splicewire-beam-embed::messages.opted_out") })
    }) }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx3("p", { className: "text-xs text-muted-foreground", children: optedIn === 0 ? m.t("splicewire-beam-embed::messages.consent_none") : m.choice("splicewire-beam-embed::messages.consent_summary", chats.length, { opted: optedIn, total: chats.length }) }),
      /* @__PURE__ */ jsx3("div", { className: "divide-y rounded-md border", children: chats.map((chat) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between gap-3 px-3 py-2.5 text-sm",
          children: [
            /* @__PURE__ */ jsx3("span", { className: "truncate", children: chat.title || /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: m.t("splicewire-beam-embed::messages.untitled") }) }),
            chat.corpus_optin ? /* @__PURE__ */ jsxs("span", { className: "flex flex-none items-center gap-1 text-xs font-medium text-warning-foreground", children: [
              /* @__PURE__ */ jsx3(Check, { className: "size-3.5" }),
              " ",
              m.t("splicewire-beam-embed::messages.opted_in")
            ] }) : /* @__PURE__ */ jsxs("span", { className: "flex flex-none items-center gap-1 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx3(X, { className: "size-3.5" }),
              " ",
              m.t("splicewire-beam-embed::messages.opted_out")
            ] })
          ]
        },
        chat.id
      )) })
    ] }) })
  ] });
}
function PrivacyRetentionPage({ canManage, title }) {
  const m = useBeamEmbedMessages();
  const actionsDisabled = !canManage;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 py-2", children: [
    /* @__PURE__ */ jsx3("h1", { className: "mx-auto max-w-3xl text-lg font-semibold tracking-tight", children: title ?? m.t("splicewire-beam-embed::messages.page_title") }),
    /* @__PURE__ */ jsx3(GovernanceBanner, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsx3(PostureCard, {}),
      /* @__PURE__ */ jsx3(PruneCard, { disabled: actionsDisabled }),
      /* @__PURE__ */ jsx3(EraseCard, { disabled: actionsDisabled }),
      /* @__PURE__ */ jsx3(CorpusConsentCard, {})
    ] }),
    /* @__PURE__ */ jsx3("p", { className: "mx-auto max-w-3xl pt-2 text-[11px] leading-relaxed text-muted-foreground", children: m.t("splicewire-beam-embed::messages.footer") })
  ] });
}
export {
  PrivacyRetentionPage,
  RetentionProvider
};
//# sourceMappingURL=index.js.map