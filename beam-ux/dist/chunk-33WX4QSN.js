import {
  EffectTag,
  PlainValue,
  TierPill
} from "./chunk-HTRF3PAU.js";
import {
  notice,
  noticeOf,
  say
} from "./chunk-YARN53FB.js";
import {
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

// src/recording.tsx
import { Button } from "@schemastud/ui";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function ReleaseRecordingSummary({
  recording,
  filesHref
}) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs("section", { "aria-label": m.t("splicewire-beam-ux::messages.recording_local_git_record"), className: "my-3 space-y-1 rounded border p-3 text-sm", children: [
    /* @__PURE__ */ jsx("h3", { className: "font-medium", children: m.t("splicewire-beam-ux::messages.recording_local_git_record") }),
    /* @__PURE__ */ jsx("p", { role: "status", children: recording.message ?? recording.status }),
    recording.sha && /* @__PURE__ */ jsx("p", { title: recording.sha, children: m.t("splicewire-beam-ux::messages.recording_git_sha", { sha: recording.sha.slice(0, 7) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      recording.sha && /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: () => void navigator.clipboard?.writeText(recording.sha), children: m.t("splicewire-beam-ux::messages.recording_copy_sha") }),
      filesHref && /* @__PURE__ */ jsx("a", { href: filesHref, className: "underline", children: m.t("splicewire-beam-ux::messages.recording_open_files") })
    ] })
  ] });
}
function VersionRecordingReferences({ recordings = [] }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsx(Fragment, { children: recordings.map((recording) => /* @__PURE__ */ jsxs("span", { className: "ml-2 text-sm", title: recording.sha ?? recording.message ?? void 0, children: [
    recording.sha ? m.t("splicewire-beam-ux::messages.recording_git_sha", { sha: recording.sha.slice(0, 7) }) : m.t("splicewire-beam-ux::messages.recording_not_committed"),
    recording.noChange ? ` ${m.t("splicewire-beam-ux::messages.recording_no_new_commit")}` : "",
    ` ${m.t("splicewire-beam-ux::messages.recording_release", { id: recording.releaseId })}`
  ] }, recording.releaseId)) });
}

// src/releases.tsx
import { useEffect, useState } from "react";
import { Button as Button2 } from "@schemastud/ui";
import { WorkflowActionForm } from "@splicewire/beam-workflows/action-form";
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var CONFIG_MEMBER_KIND = "config-override";
var ENTRY_GROUPS = [
  {
    key: "page",
    labelKey: "splicewire-beam-ux::messages.releases_group_page",
    match: (type) => type === "page"
  },
  {
    key: "theme",
    labelKey: "splicewire-beam-ux::messages.releases_group_theme",
    match: (type) => type === "theme"
  },
  {
    key: "other",
    labelKey: "splicewire-beam-ux::messages.releases_group_other",
    match: (type) => type !== "page" && type !== "theme"
  }
];
function ReleasePanel({
  release,
  entries,
  changes,
  initialEntryId = "",
  onCommand,
  onRemoveRedirect,
  onPreviewOpen
}) {
  const m = useBeamUxMessages();
  const configChanges = changes?.config ?? [];
  const configMembers = release.members.filter(
    (member) => member.kind === CONFIG_MEMBER_KIND
  );
  const entryMembers = release.members.filter(
    (member) => member.kind !== CONFIG_MEMBER_KIND
  );
  const tenantRealm = release.realm === "tenant";
  const [entryId, setEntryId] = useState(initialEntryId);
  const [ref, setRef] = useState("");
  const [redirect, setRedirect] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const entry = entries.find((item) => item.id === entryId);
  const immutable = release.status === "published";
  const act = async (command) => {
    setPending(true);
    setError(null);
    try {
      await onCommand(command);
    } catch (failure) {
      setError(noticeOf(failure, notice("splicewire-beam-ux::messages.releases_update_failed")));
    } finally {
      setPending(false);
    }
  };
  const publishProjection = release.workflow && {
    ...release.workflow,
    transitions: release.workflow.transitions.filter(
      (item) => item.name === "publish"
    )
  };
  const renderEntryItem = (member, index) => {
    const entryId2 = member.entryId;
    const title = entries.find((item) => item.id === entryId2)?.title ?? member.label ?? entryId2;
    return /* @__PURE__ */ jsxs2("li", { children: [
      /* @__PURE__ */ jsxs2("span", { className: "break-all", children: [
        title,
        ":",
        " ",
        member.versionId === null ? m.t("splicewire-beam-ux::messages.releases_take_down") : m.t("splicewire-beam-ux::messages.releases_saved_version_member", { version: member.versionId })
      ] }),
      member.redirectTarget && /* @__PURE__ */ jsxs2("span", { children: [
        " ",
        m.t("splicewire-beam-ux::messages.releases_redirect_target", { target: member.redirectTarget })
      ] }),
      member.stale && /* @__PURE__ */ jsx2("p", { role: "status", children: m.t("splicewire-beam-ux::messages.releases_stale") }),
      !immutable && entryId2 !== null && /* @__PURE__ */ jsxs2("span", { className: "ml-2 inline-flex gap-2", children: [
        /* @__PURE__ */ jsx2(
          Button2,
          {
            size: "sm",
            variant: "secondary",
            disabled: pending,
            onClick: () => void act({ action: "rebase", entryId: entryId2 }),
            children: m.t("splicewire-beam-ux::messages.releases_rebase")
          }
        ),
        member.versionId !== null && /* @__PURE__ */ jsx2(
          Button2,
          {
            size: "sm",
            variant: "secondary",
            disabled: pending,
            onClick: () => void act({ action: "use-latest", entryId: entryId2 }),
            children: m.t("splicewire-beam-ux::messages.releases_use_latest")
          }
        ),
        /* @__PURE__ */ jsx2(
          Button2,
          {
            size: "sm",
            variant: "secondary",
            disabled: pending,
            onClick: () => void act({ action: "drop", entryId: entryId2 }),
            children: m.t("splicewire-beam-ux::messages.releases_drop")
          }
        )
      ] })
    ] }, entryId2 ?? member.ref ?? index);
  };
  return /* @__PURE__ */ jsxs2(
    "section",
    {
      "aria-label": m.t("splicewire-beam-ux::messages.releases_label"),
      "aria-busy": pending,
      className: "mt-4 space-y-3 rounded-lg border bg-card p-4 text-sm",
      children: [
        /* @__PURE__ */ jsx2("h2", { className: "font-semibold", children: release.title }),
        /* @__PURE__ */ jsx2("p", { children: m.t("splicewire-beam-ux::messages.releases_status", { status: release.status.replace("_", " ") }) }),
        !immutable && onPreviewOpen && /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            className: "underline",
            onClick: () => {
              setPreviewError(false);
              const popup = window.open("about:blank", "_blank");
              if (popup) popup.opener = null;
              void onPreviewOpen().then((href) => {
                if (popup) popup.location.replace(href);
                else window.location.assign(href);
              }).catch(() => {
                popup?.close();
                setPreviewError(true);
              });
            },
            children: m.t("splicewire-beam-ux::messages.releases_preview")
          }
        ),
        previewError && /* @__PURE__ */ jsx2("p", { role: "alert", children: m.t("splicewire-beam-ux::messages.releases_preview_failed") }),
        !immutable && !onPreviewOpen && release.previewHref && // ADR-0232 d15: the Release page's Preview, signed in; a new tab, so the panel stays open.
        /* @__PURE__ */ jsx2("a", { href: release.previewHref, target: "_blank", rel: "noopener noreferrer", className: "underline", children: m.t("splicewire-beam-ux::messages.releases_preview") }),
        !immutable && release.previewLinksEnabled && !release.canManagePreviewLinks && /* @__PURE__ */ jsx2("p", { children: m.t("splicewire-beam-ux::messages.releases_preview_links_on") }),
        !immutable && release.previewLinksEnabled !== void 0 && release.canManagePreviewLinks && /* @__PURE__ */ jsxs2("div", { role: "group", "aria-label": m.t("splicewire-beam-ux::messages.releases_preview_links"), className: "space-y-2 rounded border p-3", children: [
          /* @__PURE__ */ jsx2("p", { children: m.t("splicewire-beam-ux::messages.releases_preview_links_explainer") }),
          release.previewLinksEnabled ? /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-2", children: [
            release.previewLink && /* @__PURE__ */ jsxs2(Fragment2, { children: [
              /* @__PURE__ */ jsx2(
                "input",
                {
                  readOnly: true,
                  "aria-label": m.t("splicewire-beam-ux::messages.releases_preview_link"),
                  className: "min-w-0 flex-1 rounded border bg-background px-2 py-1",
                  value: release.previewLink
                }
              ),
              /* @__PURE__ */ jsx2(
                Button2,
                {
                  size: "sm",
                  variant: "secondary",
                  onClick: () => void navigator.clipboard?.writeText(release.previewLink),
                  children: m.t("splicewire-beam-ux::messages.releases_copy_link")
                }
              )
            ] }),
            /* @__PURE__ */ jsx2(Button2, { size: "sm", variant: "secondary", disabled: pending, onClick: () => void act({ action: "rotate-links" }), children: m.t("splicewire-beam-ux::messages.releases_rotate_links") }),
            /* @__PURE__ */ jsx2(Button2, { size: "sm", variant: "secondary", disabled: pending, onClick: () => void act({ action: "links-off" }), children: m.t("splicewire-beam-ux::messages.releases_links_off") })
          ] }) : /* @__PURE__ */ jsx2(Button2, { size: "sm", variant: "secondary", disabled: pending, onClick: () => void act({ action: "links-on" }), children: m.t("splicewire-beam-ux::messages.releases_links_on") })
        ] }),
        release.recording && /* @__PURE__ */ jsx2(
          ReleaseRecordingSummary,
          {
            recording: release.recording,
            filesHref: release.filesHref
          }
        ),
        release.reviewRequired && /* @__PURE__ */ jsx2("p", { children: m.t("splicewire-beam-ux::messages.releases_review_required") }),
        error && /* @__PURE__ */ jsx2("p", { role: "alert", children: say(m, error) }),
        ENTRY_GROUPS.map((group) => {
          const groupMembers = entryMembers.filter((member) => group.match(member.entryType));
          if (groupMembers.length === 0) return null;
          return /* @__PURE__ */ jsxs2("section", { "aria-label": m.t(group.labelKey), className: "space-y-2", children: [
            /* @__PURE__ */ jsx2("h3", { className: "font-semibold", children: m.t(group.labelKey) }),
            /* @__PURE__ */ jsx2("ul", { className: "space-y-2", children: groupMembers.map(renderEntryItem) })
          ] }, group.key);
        }),
        configMembers.length > 0 && /* @__PURE__ */ jsx2(
          ConfigMembers,
          {
            members: configMembers,
            changes: configChanges,
            immutable,
            pending,
            onDrop: (ref2) => act({ action: "drop", kind: CONFIG_MEMBER_KIND, ref: ref2 }),
            onTakeDraft: (ref2) => act({ action: "member", kind: CONFIG_MEMBER_KIND, ref: ref2 })
          }
        ),
        configMembers.length > 0 && /* @__PURE__ */ jsx2(
          ConfigPublishPlan,
          {
            members: configMembers,
            changes: configChanges,
            tenantRealm
          }
        ),
        !immutable && /* @__PURE__ */ jsxs2("fieldset", { disabled: pending, className: "space-y-2 rounded border p-3", children: [
          /* @__PURE__ */ jsx2("legend", { children: m.t("splicewire-beam-ux::messages.releases_add_member_legend") }),
          /* @__PURE__ */ jsxs2("label", { children: [
            m.t("splicewire-beam-ux::messages.releases_entry"),
            " ",
            /* @__PURE__ */ jsxs2(
              "select",
              {
                className: "mx-2 rounded border bg-background px-2 py-1",
                value: entryId,
                onChange: (event) => {
                  setEntryId(event.target.value);
                  setRef("");
                },
                children: [
                  /* @__PURE__ */ jsx2("option", { value: "", children: m.t("splicewire-beam-ux::messages.releases_choose_entry") }),
                  entries.map((item) => /* @__PURE__ */ jsx2("option", { value: item.id, children: item.title }, item.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("label", { children: [
            m.t("splicewire-beam-ux::messages.releases_saved_version"),
            " ",
            /* @__PURE__ */ jsxs2(
              "select",
              {
                className: "mx-2 rounded border bg-background px-2 py-1",
                value: ref,
                onChange: (event) => setRef(event.target.value),
                children: [
                  /* @__PURE__ */ jsx2("option", { value: "", children: m.t("splicewire-beam-ux::messages.releases_choose_saved_version") }),
                  entry?.versions.map((version) => /* @__PURE__ */ jsx2("option", { value: version.id, children: version.label }, version.id)),
                  entry?.canTakeDown && /* @__PURE__ */ jsx2("option", { value: "take-down", children: m.t("splicewire-beam-ux::messages.releases_take_down") })
                ]
              }
            )
          ] }),
          ref === "take-down" && /* @__PURE__ */ jsxs2("label", { children: [
            m.t("splicewire-beam-ux::messages.releases_redirect_to"),
            " ",
            /* @__PURE__ */ jsx2(
              "input",
              {
                value: redirect,
                onChange: (event) => setRedirect(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsx2(
            Button2,
            {
              size: "sm",
              variant: "secondary",
              disabled: !entry || !ref,
              onClick: () => void act({
                action: "member",
                entryId,
                ref: ref === "take-down" ? null : ref,
                redirectTarget: ref === "take-down" ? redirect || null : null
              }),
              children: m.t("splicewire-beam-ux::messages.releases_add_to_release")
            }
          )
        ] }),
        /* @__PURE__ */ jsx2("div", { className: "flex flex-wrap gap-2", children: ["submit", "approve", "publish"].filter(
          (action) => release.workflow?.available.includes(action) && (action !== "publish" || !release.reviewRequired || ["approved", "scheduled"].includes(release.status))
        ).map((action) => /* @__PURE__ */ jsx2(
          Button2,
          {
            size: "sm",
            variant: "secondary",
            disabled: pending || action === "publish" && release.members.some((member) => member.stale),
            onClick: () => void act({ action }),
            children: action === "submit" ? m.t("splicewire-beam-ux::messages.releases_request_review") : action === "approve" ? m.t("splicewire-beam-ux::messages.releases_approve") : m.t("splicewire-beam-ux::messages.releases_publish_now")
          },
          action
        )) }),
        immutable && /* @__PURE__ */ jsx2(
          Button2,
          {
            size: "sm",
            variant: "secondary",
            disabled: pending,
            onClick: () => void act({ action: "rollback" }),
            children: m.t("splicewire-beam-ux::messages.releases_rollback")
          }
        ),
        !immutable && release.canSchedule && release.status === "approved" && /* @__PURE__ */ jsx2(
          WorkflowActionForm,
          {
            projection: publishProjection,
            initialTransition: "publish",
            subjectLabel: release.title,
            onSchedule: async (selection) => {
              await onCommand({
                action: "schedule",
                dueAt: selection.dueAt,
                timezone: selection.timezone
              });
            }
          }
        ),
        !immutable && !release.canSchedule && /* @__PURE__ */ jsx2("p", { children: m.t("splicewire-beam-ux::messages.releases_scheduling_unavailable") }),
        release.redirects && release.redirects.length > 0 && /* @__PURE__ */ jsx2(ReleaseRedirects, { redirects: release.redirects, onRemove: onRemoveRedirect })
      ]
    }
  );
}
var KNOWN_TIERS = /* @__PURE__ */ new Set(["package", "host", "provider", "operator", "tenant"]);
var KNOWN_EFFECTS = /* @__PURE__ */ new Set(["live", "reload", "deploy"]);
function SetByCell({ setBy }) {
  return KNOWN_TIERS.has(setBy) ? /* @__PURE__ */ jsx2(TierPill, { tier: setBy }) : /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: setBy });
}
function AppliesCell({ applies }) {
  return KNOWN_EFFECTS.has(applies) ? /* @__PURE__ */ jsx2(EffectTag, { effect: applies }) : /* @__PURE__ */ jsx2("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: applies });
}
function secretChangeText(m, secretChange) {
  if (secretChange === "replaced") return m.t("splicewire-beam-ux::messages.releases_config_secret_replaced");
  if (secretChange === "removed") return m.t("splicewire-beam-ux::messages.releases_config_secret_removed");
  if (secretChange === "unchanged") return m.t("splicewire-beam-ux::messages.releases_config_secret_unchanged");
  return "\u2014";
}
function ConfigMembers({
  members,
  changes,
  immutable,
  pending,
  onDrop,
  onTakeDraft
}) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs2(
    "section",
    {
      "aria-label": m.t("splicewire-beam-ux::messages.releases_config_heading"),
      className: "space-y-2",
      children: [
        /* @__PURE__ */ jsx2("h3", { className: "font-semibold", children: m.t("splicewire-beam-ux::messages.releases_config_heading") }),
        /* @__PURE__ */ jsx2("ul", { className: "space-y-2", children: members.map((member) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsx2(
          ConfigMemberCard,
          {
            member,
            change: changes.find((change) => change.root === member.ref),
            immutable,
            pending,
            onDrop,
            onTakeDraft
          }
        ) }, member.ref)) })
      ]
    }
  );
}
function ConfigMemberCard({
  member,
  change,
  immutable,
  pending,
  onDrop,
  onTakeDraft
}) {
  const m = useBeamUxMessages();
  const ref = member.ref;
  const keySecrets = changeKeySecrets(change?.keys ?? []);
  const mirrorMarkers = change?.readable && change.mirror != null ? sanitizeMirror(change.mirror, keySecrets)?.markers ?? [] : [];
  const isSecret = secretMatcher([...keySecrets, ...mirrorMarkers]);
  return /* @__PURE__ */ jsxs2("div", { "data-config-member": ref, className: "rounded border p-3", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-baseline gap-x-2 gap-y-1", children: [
      /* @__PURE__ */ jsx2("span", { className: "font-medium", children: change?.title ?? member.label }),
      /* @__PURE__ */ jsx2("code", { className: "font-mono text-xs text-muted-foreground", children: ref }),
      change && /* @__PURE__ */ jsx2("span", { className: "font-mono text-xs text-muted-foreground", children: change.package }),
      change && /* @__PURE__ */ jsxs2("span", { className: "font-mono text-xs text-muted-foreground", children: [
        "v",
        change.fromVersion ?? 0,
        " \u2192",
        " ",
        change.toVersion === null ? m.t("splicewire-beam-ux::messages.releases_config_version_removed") : `v${change.toVersion}`
      ] }),
      change?.reloadsWorkers && /* @__PURE__ */ jsx2("span", { className: "font-mono text-xs text-info", children: m.t("splicewire-beam-ux::messages.releases_config_reloads_workers") })
    ] }),
    member.stale && /* @__PURE__ */ jsx2("p", { role: "status", children: m.t("splicewire-beam-ux::messages.releases_config_stale") }),
    change && !change.readable && /* @__PURE__ */ jsx2("p", { className: "mt-1 text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.releases_config_unreadable") }),
    change && change.readable && change.keys.length > 0 && /* @__PURE__ */ jsx2("div", { className: "mt-2 overflow-x-auto", children: /* @__PURE__ */ jsxs2("table", { className: "w-full text-left text-xs", children: [
      /* @__PURE__ */ jsx2("thead", { className: "text-[11px] text-muted-foreground", children: /* @__PURE__ */ jsxs2("tr", { children: [
        /* @__PURE__ */ jsx2("th", { className: "py-1 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.releases_config_col_key") }),
        /* @__PURE__ */ jsx2("th", { className: "py-1 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.releases_config_col_published") }),
        /* @__PURE__ */ jsx2("th", { className: "py-1 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.releases_config_col_after") }),
        /* @__PURE__ */ jsx2("th", { className: "py-1 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.releases_config_col_setby") }),
        /* @__PURE__ */ jsx2("th", { className: "py-1 pr-3 font-medium", children: m.t("splicewire-beam-ux::messages.releases_config_col_applies") })
      ] }) }),
      /* @__PURE__ */ jsx2("tbody", { children: change.keys.map((key) => /* @__PURE__ */ jsx2(ConfigKeyRow, { row: key, isSecret }, key.pointer)) })
    ] }) }),
    !immutable && /* @__PURE__ */ jsxs2("div", { className: "mt-2 inline-flex gap-2", children: [
      /* @__PURE__ */ jsx2(
        Button2,
        {
          size: "sm",
          variant: "secondary",
          disabled: pending,
          onClick: () => onTakeDraft(ref),
          children: m.t("splicewire-beam-ux::messages.releases_config_take_draft")
        }
      ),
      /* @__PURE__ */ jsx2(
        Button2,
        {
          size: "sm",
          variant: "secondary",
          disabled: pending,
          onClick: () => onDrop(ref),
          children: m.t("splicewire-beam-ux::messages.releases_config_drop")
        }
      )
    ] })
  ] });
}
function ConfigKeyRow({ row, isSecret }) {
  const m = useBeamUxMessages();
  const secretKey = row.secret !== false && row.secret !== void 0;
  const base = typeof row.pointer === "string" ? normalizePointer(row.pointer) : null;
  const pointerText = typeof row.pointer === "string" ? row.pointer : String(row.pointer);
  const safe = (value) => {
    if (base === null) return null;
    const result = sanitizeValue(value, base, isSecret);
    return result === OMIT ? null : result;
  };
  return /* @__PURE__ */ jsxs2("tr", { "data-config-key": pointerText, className: "align-top", children: [
    /* @__PURE__ */ jsx2("td", { className: "py-1 pr-3 font-mono", children: pointerText }),
    /* @__PURE__ */ jsx2("td", { className: "py-1 pr-3", children: secretKey || base === null ? /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: "\u2014" }) : /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2(PlainValue, { value: safe(row.published), struck: true }),
      !row.publishedSet && /* @__PURE__ */ jsx2("span", { className: "block text-[10px] text-muted-foreground", children: m.t("splicewire-beam-ux::messages.releases_config_inherited") })
    ] }) }),
    /* @__PURE__ */ jsx2("td", { className: "py-1 pr-3", children: secretKey ? /* @__PURE__ */ jsx2("span", { className: "font-mono", children: secretChangeText(m, row.secretChange) }) : base === null ? /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: "\u2014" }) : /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2(PlainValue, { value: safe(row.after) }),
      row.op === null && /* @__PURE__ */ jsx2("span", { className: "block text-[10px] text-muted-foreground", children: m.t("splicewire-beam-ux::messages.releases_config_override_dropped") }),
      row.op === "null" && /* @__PURE__ */ jsx2("span", { className: "block text-[10px] text-muted-foreground", children: m.t("splicewire-beam-ux::messages.releases_config_explicit_null") })
    ] }) }),
    /* @__PURE__ */ jsx2("td", { className: "py-1 pr-3", children: /* @__PURE__ */ jsx2(SetByCell, { setBy: row.setBy }) }),
    /* @__PURE__ */ jsx2("td", { className: "py-1 pr-3", children: /* @__PURE__ */ jsx2(AppliesCell, { applies: row.applies }) })
  ] });
}
function escapeSegment(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
function normalizePointer(pointer) {
  if (pointer === "") return "";
  return pointer.startsWith("/") ? pointer : `/${pointer}`;
}
var OMIT = /* @__PURE__ */ Symbol("omit");
function secretMatcher(secretPointers) {
  const roots = [...secretPointers].map(normalizePointer);
  const rootSecret = roots.includes("");
  return (pointer) => rootSecret || roots.some((root) => root !== "" && (pointer === root || pointer.startsWith(`${root}/`)));
}
function sanitizeValue(value, pointer, isSecret) {
  if (isSecret(pointer)) return OMIT;
  if (Array.isArray(value)) {
    return value.map((element, index) => {
      const safe = sanitizeValue(element, `${pointer}/${index}`, isSecret);
      return safe === OMIT ? null : safe;
    });
  }
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      const safe = sanitizeValue(child, `${pointer}/${escapeSegment(key)}`, isSecret);
      if (safe !== OMIT) out[key] = safe;
    }
    return out;
  }
  return value;
}
var MIRROR_ROOT_KEYS = /* @__PURE__ */ new Set(["$schema", "root", "version", "overrides"]);
var MIRROR_ROW_KEYS = /* @__PURE__ */ new Set(["pointer", "op", "value", "secret", "inherit"]);
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function keysWithin(obj, allowed) {
  return Object.keys(obj).every((key) => allowed.has(key));
}
function validPointer(value) {
  return typeof value === "string" && value.startsWith("/") && !/~(?![01])/.test(value);
}
function anyDrop(value, pointer, dropped) {
  if (dropped(pointer)) return true;
  if (Array.isArray(value)) {
    return value.some((element, index) => anyDrop(element, `${pointer}/${index}`, dropped));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).some(([key, child]) => anyDrop(child, `${pointer}/${escapeSegment(key)}`, dropped));
  }
  return false;
}
function sanitizeMirror(mirror, changeKeySecretPointers) {
  let parsed;
  try {
    parsed = JSON.parse(mirror);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  const rootKeys = Object.keys(parsed);
  if (rootKeys.length !== MIRROR_ROOT_KEYS.size || !rootKeys.every((key) => MIRROR_ROOT_KEYS.has(key))) return null;
  const { $schema, root, version, overrides } = parsed;
  if (typeof $schema !== "string" || typeof root !== "string" || !(version === null || typeof version === "number") || !Array.isArray(overrides)) {
    return null;
  }
  const seen = /* @__PURE__ */ new Set();
  const markerPointers = [];
  for (const row of overrides) {
    if (!isPlainObject(row) || !keysWithin(row, MIRROR_ROW_KEYS)) return null;
    const { pointer, op } = row;
    if (!validPointer(pointer) || op !== "set" && op !== "null") return null;
    if ("secret" in row && row.secret !== true) return null;
    const marker = row.secret === true;
    if (marker || op === "null") {
      if ("value" in row || "inherit" in row) return null;
    } else if (!("value" in row)) {
      return null;
    }
    if ("inherit" in row) {
      if (marker || op !== "set" || !Array.isArray(row.inherit)) return null;
      const items = /* @__PURE__ */ new Set();
      for (const item of row.inherit) {
        if (typeof item !== "string" || item.length <= 1 || !validPointer(item) || items.has(item)) return null;
        items.add(item);
      }
    }
    if (seen.has(pointer)) return null;
    seen.add(pointer);
    if (marker) markerPointers.push(pointer);
  }
  const isSecret = secretMatcher([...changeKeySecretPointers, ...markerPointers]);
  const rebuilt = [];
  for (const row of overrides) {
    const pointer = row.pointer;
    const op = row.op;
    if (row.secret === true) {
      rebuilt.push({ pointer, op, secret: true });
      continue;
    }
    if (isSecret(pointer)) return null;
    if (op === "null") {
      rebuilt.push({ pointer, op });
      continue;
    }
    const inheritedAbs = (row.inherit ?? []).map((item) => `${pointer}${item}`);
    const dropped = (leaf) => isSecret(leaf) || inheritedAbs.some((base) => leaf === base || leaf.startsWith(`${base}/`));
    if (anyDrop(row.value, pointer, dropped)) return null;
    const out = { pointer, op, value: row.value };
    if ("inherit" in row) out.inherit = row.inherit;
    rebuilt.push(out);
  }
  return { text: JSON.stringify({ $schema, root, version, overrides: rebuilt }, null, 2), markers: markerPointers };
}
function changeKeySecrets(keys) {
  const out = /* @__PURE__ */ new Set();
  for (const key of keys) {
    const secret = key.secret;
    if (secret !== false && secret !== void 0 && typeof key.pointer === "string") {
      out.add(key.pointer);
    }
  }
  return out;
}
function ConfigMirrorFile({ change }) {
  const parsed = change.readable && change.mirror !== null ? sanitizeMirror(change.mirror, changeKeySecrets(change.keys)) : null;
  if (parsed === null) {
    return /* @__PURE__ */ jsx2("span", { className: "font-mono text-xs", children: change.mirrorPath });
  }
  return /* @__PURE__ */ jsxs2("details", { className: "rounded border bg-muted/30", children: [
    /* @__PURE__ */ jsx2("summary", { className: "cursor-pointer px-2 py-1 font-mono text-xs", children: change.mirrorPath }),
    /* @__PURE__ */ jsx2("pre", { className: "overflow-x-auto px-2 pb-2 font-mono text-[11px] leading-relaxed", children: parsed.text })
  ] });
}
function ConfigPublishPlan({
  members,
  changes,
  tenantRealm
}) {
  const m = useBeamUxMessages();
  const memberChanges = members.map((member) => changes.find((change) => change.root === member.ref)).filter((change) => !!change);
  if (tenantRealm) {
    return /* @__PURE__ */ jsxs2(
      "section",
      {
        "aria-label": m.t("splicewire-beam-ux::messages.releases_config_db_history_heading"),
        className: "space-y-1 rounded border p-3",
        children: [
          /* @__PURE__ */ jsx2("h3", { className: "font-semibold", children: m.t("splicewire-beam-ux::messages.releases_config_db_history_heading") }),
          /* @__PURE__ */ jsx2("p", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-ux::messages.releases_config_db_history_body") }),
          memberChanges.length > 0 && /* @__PURE__ */ jsx2("ul", { className: "space-y-0.5 font-mono text-[11px] text-muted-foreground", children: memberChanges.map((change) => /* @__PURE__ */ jsxs2("li", { children: [
            change.root,
            " ",
            change.toVersion === null ? m.t("splicewire-beam-ux::messages.releases_config_version_removed") : `v${change.toVersion}`,
            " ",
            "\xB7",
            " ",
            change.readable ? m.choice("splicewire-beam-ux::messages.config_count_keys", change.keys.length, { count: change.keys.length }) : m.t("splicewire-beam-ux::messages.releases_config_keys_unreadable")
          ] }, change.root)) })
        ]
      }
    );
  }
  const files = memberChanges.filter((change) => change.mirrorPath !== null);
  const secretCount = memberChanges.flatMap((change) => change.keys).filter((key) => key.secret).length;
  if (files.length === 0 && secretCount === 0) return null;
  const secretsNote = secretCount > 0 && /* @__PURE__ */ jsx2("p", { className: "text-xs text-muted-foreground", children: m.choice("splicewire-beam-ux::messages.releases_config_secrets_note", secretCount, { count: secretCount }) });
  if (files.length === 0) {
    return /* @__PURE__ */ jsx2("section", { className: "space-y-1 rounded border p-3", children: secretsNote });
  }
  return /* @__PURE__ */ jsxs2(
    "section",
    {
      "aria-label": m.t("splicewire-beam-ux::messages.releases_config_commit_heading"),
      className: "space-y-1 rounded border p-3",
      children: [
        /* @__PURE__ */ jsx2("h3", { className: "font-semibold", children: m.t("splicewire-beam-ux::messages.releases_config_commit_heading") }),
        /* @__PURE__ */ jsx2("ul", { className: "space-y-1", children: files.map((change) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsx2(ConfigMirrorFile, { change }) }, change.root)) }),
        secretsNote
      ]
    }
  );
}
function ReleaseRedirects({
  redirects,
  onRemove
}) {
  const m = useBeamUxMessages();
  const [removed, setRemoved] = useState([]);
  const [error, setError] = useState(null);
  const remove = async (id) => {
    setError(null);
    try {
      await onRemove(id);
      setRemoved((current) => [...current, id]);
    } catch (failure) {
      setError(noticeOf(failure, notice("splicewire-beam-ux::messages.releases_redirect_remove_failed")));
    }
  };
  return /* @__PURE__ */ jsxs2("section", { "aria-label": m.t("splicewire-beam-ux::messages.releases_redirects"), children: [
    /* @__PURE__ */ jsx2("h3", { className: "font-semibold", children: m.t("splicewire-beam-ux::messages.releases_redirects") }),
    /* @__PURE__ */ jsx2("ul", { children: redirects.filter((redirect) => redirect.id === null || !removed.includes(redirect.id)).map((redirect) => /* @__PURE__ */ jsxs2("li", { children: [
      /* @__PURE__ */ jsxs2("span", { children: [
        m.t(redirect.match === "prefix" ? "splicewire-beam-ux::messages.releases_redirect_prefix" : "splicewire-beam-ux::messages.releases_redirect_exact", {
          path: redirect.path,
          to: redirect.to ?? m.t("splicewire-beam-ux::messages.releases_redirect_not_found")
        }),
        redirect.origin === "takedown" ? ` ${m.t("splicewire-beam-ux::messages.releases_redirect_taken_down")}` : ""
      ] }),
      redirect.id !== null && onRemove && /* @__PURE__ */ jsx2(
        Button2,
        {
          size: "sm",
          variant: "secondary",
          "aria-label": m.t("splicewire-beam-ux::messages.releases_redirect_remove_label", { path: redirect.path }),
          onClick: () => void remove(redirect.id),
          children: m.t("splicewire-beam-ux::messages.releases_redirect_remove")
        }
      )
    ] }, `${redirect.path} ${redirect.match}`)) }),
    error && /* @__PURE__ */ jsx2("p", { role: "alert", children: say(m, error) })
  ] });
}
function BuiltReleaseAssembly({
  entryId,
  entryTitle,
  versions,
  canTakeDown = false,
  relatedEntries = [],
  listReleases,
  createRelease,
  releaseCommand,
  removeRedirect
}) {
  const m = useBeamUxMessages();
  const [releases, setReleases] = useState([]);
  const [releaseId, setReleaseId] = useState("");
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const activeRelease = releases.find((release) => release.id === releaseId);
  useEffect(() => {
    let live = true;
    void listReleases().then((records) => {
      if (!live) return;
      const editable = records.filter((record) => record.status === "draft");
      setReleases(editable);
      setReleaseId(
        (current) => editable.some((record) => record.id === current) ? current : editable[0]?.id ?? ""
      );
    }).catch((reason) => {
      if (live) {
        setError(noticeOf(reason, notice("splicewire-beam-ux::messages.releases_load_failed")));
      }
    });
    return () => {
      live = false;
    };
  }, [entryId]);
  const create = async () => {
    const name = title.trim();
    if (!name) return;
    setPending(true);
    setError(null);
    try {
      const release = await createRelease(entryId, name);
      setReleases((current) => [
        release,
        ...current.filter((item) => item.id !== release.id)
      ]);
      setReleaseId(release.id);
      setTitle("");
    } catch (reason) {
      setError(noticeOf(reason, notice("splicewire-beam-ux::messages.releases_create_failed")));
    } finally {
      setPending(false);
    }
  };
  const command = async (input) => {
    if (!activeRelease) return;
    const updated = await releaseCommand(activeRelease.id, input);
    setReleases(
      (current) => current.map((item) => item.id === updated.id ? updated : item)
    );
  };
  return /* @__PURE__ */ jsxs2("section", { "aria-label": m.t("splicewire-beam-ux::messages.releases_build"), className: "mt-4 space-y-3", children: [
    /* @__PURE__ */ jsxs2("fieldset", { disabled: pending, className: "space-y-2 rounded border p-3", children: [
      /* @__PURE__ */ jsx2("legend", { children: m.t("splicewire-beam-ux::messages.releases_create_built_legend") }),
      /* @__PURE__ */ jsxs2("label", { children: [
        m.t("splicewire-beam-ux::messages.releases_title"),
        " ",
        /* @__PURE__ */ jsx2(
          "input",
          {
            value: title,
            onChange: (event) => setTitle(event.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsx2(
        Button2,
        {
          size: "sm",
          variant: "secondary",
          disabled: !title.trim(),
          onClick: () => void create(),
          children: m.t("splicewire-beam-ux::messages.releases_create_built")
        }
      )
    ] }),
    releases.length > 0 && /* @__PURE__ */ jsxs2("label", { children: [
      m.t("splicewire-beam-ux::messages.releases_to_assemble"),
      " ",
      /* @__PURE__ */ jsxs2(
        "select",
        {
          value: releaseId,
          onChange: (event) => setReleaseId(event.target.value),
          children: [
            /* @__PURE__ */ jsx2("option", { value: "", children: m.t("splicewire-beam-ux::messages.releases_choose_release") }),
            releases.map((release) => /* @__PURE__ */ jsx2("option", { value: release.id, children: release.title }, release.id))
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx2("p", { role: "alert", children: say(m, error) }),
    activeRelease && /* @__PURE__ */ jsx2(
      ReleasePanel,
      {
        release: activeRelease,
        entries: [{ id: entryId, title: entryTitle, versions, canTakeDown }, ...relatedEntries.filter((entry) => entry.id !== entryId)],
        initialEntryId: entryId,
        onCommand: command,
        onRemoveRedirect: removeRedirect
      }
    )
  ] });
}

export {
  ReleaseRecordingSummary,
  VersionRecordingReferences,
  ReleasePanel,
  BuiltReleaseAssembly
};
//# sourceMappingURL=chunk-33WX4QSN.js.map