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
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
var DEFAULT_RETENTION_DAYS = 90;
function GovernanceBanner() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-3xl items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground", children: [
    /* @__PURE__ */ jsx2(Shield, { className: "mt-0.5 size-4 flex-none" }),
    /* @__PURE__ */ jsx2("span", { children: "Only workspace admins can prune or erase retained data." })
  ] });
}
function PostureCard() {
  const { policyDescription } = useRetentionServices();
  const posture = useRetentionPosture();
  const defaultDays = posture.data?.default_days ?? DEFAULT_RETENTION_DAYS;
  const chats = posture.data?.chats ?? [];
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx2("h2", { className: "font-semibold leading-none tracking-tight", children: "Retention posture" }),
      /* @__PURE__ */ jsx2(CardDescription, { children: policyDescription ?? /* @__PURE__ */ jsx2(Fragment, { children: "Retention is a per-Published-Chat window that is snapshotted onto each session when it starts." }) })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground", children: [
        /* @__PURE__ */ jsx2(Info, { className: "mt-0.5 size-4 flex-none" }),
        /* @__PURE__ */ jsxs("p", { className: "leading-relaxed", children: [
          "Retention is ",
          /* @__PURE__ */ jsx2("b", { children: "not auto-enforced" }),
          " \u2014 nothing sweeps on a schedule. Sessions past their window persist until you ",
          /* @__PURE__ */ jsx2("b", { children: "prune" }),
          " below. Default window is",
          " ",
          /* @__PURE__ */ jsxs("b", { children: [
            defaultDays,
            " days"
          ] }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx2(Label, { children: "Per-Published-Chat windows" }),
        posture.isPending ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx2(Loader2, { className: "size-4 animate-spin" }),
          " Loading windows\u2026"
        ] }) : posture.isError ? /* @__PURE__ */ jsx2("div", { className: "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive", children: apiErrorMessage(posture.error, "Could not load retention windows.") }) : chats.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground", children: [
          "No published chats yet. New chats default to a",
          " ",
          /* @__PURE__ */ jsxs("b", { children: [
            defaultDays,
            "-day"
          ] }),
          " window."
        ] }) : /* @__PURE__ */ jsx2("div", { className: "divide-y rounded-md border", children: chats.map((chat) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center justify-between gap-3 px-3 py-2.5 text-sm",
            children: [
              /* @__PURE__ */ jsx2("span", { className: "truncate", children: chat.title || /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: "Untitled chat" }) }),
              /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "flex-none tabular-nums", children: [
                chat.retention_days,
                " days"
              ] })
            ]
          },
          chat.id
        )) })
      ] })
    ] })
  ] });
}
function PruneCard({ disabled }) {
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
        /* @__PURE__ */ jsx2(Trash2, { className: "size-4 text-muted-foreground" }),
        " Prune by policy"
      ] }),
      /* @__PURE__ */ jsx2(CardDescription, { children: "Delete every embed session (and its messages) past its retention window. A visitor's personal data drops once their last session is gone." })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5 text-sm", children: [
        /* @__PURE__ */ jsx2(Info, { className: "size-4 flex-none text-muted-foreground" }),
        preview.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [
          /* @__PURE__ */ jsx2(Loader2, { className: "size-3.5 animate-spin" }),
          " Checking what would be removed\u2026"
        ] }) : preview.isError ? /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: apiErrorMessage(preview.error, "Could not preview the prune.") }) : /* @__PURE__ */ jsxs("span", { className: "leading-tight text-muted-foreground", children: [
          /* @__PURE__ */ jsx2("b", { className: "text-foreground", children: wouldPrune }),
          " session",
          wouldPrune === 1 ? "" : "s",
          " past their window would be removed by a prune right now."
        ] })
      ] }),
      prune.isError && /* @__PURE__ */ jsx2("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(prune.error, "Could not prune sessions.") }),
      result ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm", children: [
        /* @__PURE__ */ jsx2("span", { className: "size-2 rounded-full bg-primary" }),
        "Pruned ",
        /* @__PURE__ */ jsx2("b", { children: result.pruned }),
        " session",
        result.pruned === 1 ? "" : "s",
        " past their retention window."
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            disabled: disabled || prune.isPending || preview.isSuccess && wouldPrune === 0,
            onClick: runPrune,
            variant: "secondary",
            children: [
              /* @__PURE__ */ jsx2(Trash2, { className: "size-4" }),
              " ",
              prune.isPending ? "Pruning\u2026" : "Prune expired sessions"
            ]
          }
        ),
        disabled ? /* @__PURE__ */ jsx2("span", { className: "text-xs text-muted-foreground", children: "Admin required." }) : preview.isSuccess && wouldPrune === 0 ? /* @__PURE__ */ jsx2("span", { className: "text-xs text-muted-foreground", children: "Nothing to prune." }) : null
      ] })
    ] })
  ] });
}
var SUBJECT_KIND_LABELS = {
  visitorId: "Visitor ID",
  sessionId: "Session ID"
};
function EraseCard({ disabled }) {
  const erase = useEraseSubject();
  const [kind, setKind] = useState("visitorId");
  const [subjectId, setSubjectId] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [receipt, setReceipt] = useState(
    null
  );
  const canOpen = subjectId.trim().length > 0;
  const canDestroy = confirmText.trim().toUpperCase() === "ERASE";
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
          /* @__PURE__ */ jsx2(Eraser, { className: "size-4" }),
          " Erase a subject"
        ] }),
        /* @__PURE__ */ jsxs(CardDescription, { children: [
          "A subject-access erasure request. Provide exactly one of a visitor ID or session ID. This erases the ",
          /* @__PURE__ */ jsx2("b", { children: "person, not just their chats" }),
          " \u2014 the visitor's personal data drops when their last session goes. ",
          /* @__PURE__ */ jsx2("b", { children: "Irreversible." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx2("div", { className: "flex gap-2", children: ["visitorId", "sessionId"].map((k) => /* @__PURE__ */ jsx2(
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
              /* @__PURE__ */ jsx2(
                "span",
                {
                  className: cn(
                    "size-2 rounded-full",
                    kind === k ? "bg-destructive" : "bg-muted-foreground/30"
                  )
                }
              ),
              SUBJECT_KIND_LABELS[k]
            ] })
          },
          k
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
          /* @__PURE__ */ jsx2(Label, { htmlFor: "subject-id", children: SUBJECT_KIND_LABELS[kind] }),
          /* @__PURE__ */ jsx2(
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
          !canOpen ? /* @__PURE__ */ jsx2("p", { className: "text-[11px] text-muted-foreground", children: "Provide exactly one of a visitor ID or session ID." }) : null
        ] }),
        erase.isError && !open && /* @__PURE__ */ jsx2("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(erase.error, "Could not erase the subject.") }),
        receipt ? (
          // Post-erase RECEIPT — the missing pre-erase list, after the fact.
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm", children: [
            /* @__PURE__ */ jsx2(Eraser, { className: "mt-0.5 size-4 flex-none text-destructive" }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Erased ",
              /* @__PURE__ */ jsx2("b", { children: receipt.erased }),
              " session",
              receipt.erased === 1 ? "" : "s",
              " for",
              " ",
              /* @__PURE__ */ jsxs("code", { className: "font-mono text-xs", children: [
                receipt.kind === "visitorId" ? "visitor" : "session",
                " ",
                receipt.id
              ] }),
              ". This cannot be undone."
            ] })
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
                /* @__PURE__ */ jsx2(Eraser, { className: "size-4" }),
                " Erase subject\u2026"
              ]
            }
          ),
          disabled ? /* @__PURE__ */ jsx2("span", { className: "text-xs text-muted-foreground", children: "Admin required." }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsx2(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2 text-destructive", children: [
            /* @__PURE__ */ jsx2(AlertTriangle, { className: "size-5" }),
            " ",
            "Erase this ",
            kind === "visitorId" ? "visitor" : "session",
            "?"
          ] }),
          /* @__PURE__ */ jsx2(DialogDescription, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("p", { children: [
              "You are about to erase",
              " ",
              /* @__PURE__ */ jsxs("code", { className: "font-mono text-xs text-foreground", children: [
                kind === "visitorId" ? "visitor" : "session",
                " ",
                subjectId || "\u2014"
              ] }),
              ". You are erasing the ",
              /* @__PURE__ */ jsx2("b", { className: "text-foreground", children: "person" }),
              ", not just their chats \u2014 every matching session and its messages are deleted, and the visitor's personal data drops when their last session goes."
            ] }),
            /* @__PURE__ */ jsx2("p", { className: "font-medium text-destructive", children: "This is irreversible. There is no undo and no recovery." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "erase-confirm", children: [
            "Type ",
            /* @__PURE__ */ jsx2("span", { className: "font-mono font-semibold", children: "ERASE" }),
            " to confirm"
          ] }),
          /* @__PURE__ */ jsx2(
            Input,
            {
              id: "erase-confirm",
              value: confirmText,
              onChange: (e) => setConfirmText(e.target.value),
              placeholder: "ERASE",
              className: "font-mono",
              autoComplete: "off"
            }
          )
        ] }),
        erase.isError && /* @__PURE__ */ jsx2("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(erase.error, "Could not erase the subject.") }),
        /* @__PURE__ */ jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsx2(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "destructive",
              disabled: disabled || !canDestroy || erase.isPending,
              onClick: runErase,
              children: [
                /* @__PURE__ */ jsx2(Eraser, { className: "size-4" }),
                " ",
                erase.isPending ? "Erasing\u2026" : "Erase permanently"
              ]
            }
          )
        ] })
      ] }) })
    ] })
  );
}
function CorpusConsentCard() {
  const posture = useRetentionPosture();
  const chats = posture.data?.chats ?? [];
  const optedIn = chats.filter((c) => c.corpus_optin).length;
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx2(Badge, { variant: "outline", className: "font-mono text-[10px] uppercase", children: "read-only" }),
        /* @__PURE__ */ jsx2("h2", { className: "font-semibold leading-none tracking-tight", children: "Corpus / training consent" })
      ] }),
      /* @__PURE__ */ jsxs(CardDescription, { children: [
        "Whether each Published Chat opted transcripts into corpus/training.",
        " ",
        /* @__PURE__ */ jsx2("b", { children: "Default: no." }),
        " Set on the Embed product surface \u2014 this is a read-out, not a write path."
      ] })
    ] }),
    /* @__PURE__ */ jsx2(CardContent, { children: posture.isPending ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx2(Loader2, { className: "size-4 animate-spin" }),
      " Loading consent\u2026"
    ] }) : posture.isError ? /* @__PURE__ */ jsx2("div", { className: "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive", children: apiErrorMessage(posture.error, "Could not load training consent.") }) : chats.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground", children: [
      "No published chats yet. New chats default to ",
      /* @__PURE__ */ jsx2("b", { children: "opted out" }),
      "."
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx2("p", { className: "text-xs text-muted-foreground", children: optedIn === 0 ? "No published chats have opted into corpus/training." : `${optedIn} of ${chats.length} published chat${chats.length === 1 ? "" : "s"} opted into corpus/training.` }),
      /* @__PURE__ */ jsx2("div", { className: "divide-y rounded-md border", children: chats.map((chat) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between gap-3 px-3 py-2.5 text-sm",
          children: [
            /* @__PURE__ */ jsx2("span", { className: "truncate", children: chat.title || /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: "Untitled chat" }) }),
            chat.corpus_optin ? /* @__PURE__ */ jsxs("span", { className: "flex flex-none items-center gap-1 text-xs font-medium text-warning-foreground", children: [
              /* @__PURE__ */ jsx2(Check, { className: "size-3.5" }),
              " opted in"
            ] }) : /* @__PURE__ */ jsxs("span", { className: "flex flex-none items-center gap-1 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx2(X, { className: "size-3.5" }),
              " opted out"
            ] })
          ]
        },
        chat.id
      )) })
    ] }) })
  ] });
}
function PrivacyRetentionPage({ canManage, title = "Privacy & retention" }) {
  const actionsDisabled = !canManage;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 py-2", children: [
    /* @__PURE__ */ jsx2("h1", { className: "mx-auto max-w-3xl text-lg font-semibold tracking-tight", children: title }),
    /* @__PURE__ */ jsx2(GovernanceBanner, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsx2(PostureCard, {}),
      /* @__PURE__ */ jsx2(PruneCard, { disabled: actionsDisabled }),
      /* @__PURE__ */ jsx2(EraseCard, { disabled: actionsDisabled }),
      /* @__PURE__ */ jsx2(CorpusConsentCard, {})
    ] }),
    /* @__PURE__ */ jsx2("p", { className: "mx-auto max-w-3xl pt-2 text-[11px] leading-relaxed text-muted-foreground", children: "Prune previews its blast radius, then runs immediately; erase runs immediately. Both report how many sessions were affected. A browsable per-session list is coming in a future update." })
  ] });
}
export {
  PrivacyRetentionPage,
  RetentionProvider
};
//# sourceMappingURL=index.js.map