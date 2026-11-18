import {
  notice,
  noticeOf,
  say
} from "./chunk-2G4AXCDS.js";
import {
  useBeamUxMessages
} from "./chunk-YBGMJB3T.js";

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
function ReleasePanel({
  release,
  entries,
  initialEntryId = "",
  onCommand,
  onRemoveRedirect,
  onPreviewOpen
}) {
  const m = useBeamUxMessages();
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
        /* @__PURE__ */ jsx2("ul", { className: "space-y-2", children: release.members.map((member) => /* @__PURE__ */ jsxs2("li", { children: [
          /* @__PURE__ */ jsxs2("span", { className: "break-all", children: [
            entries.find((item) => item.id === member.entryId)?.title ?? member.entryId,
            ":",
            " ",
            member.versionId === null ? m.t("splicewire-beam-ux::messages.releases_take_down") : m.t("splicewire-beam-ux::messages.releases_saved_version_member", { version: member.versionId })
          ] }),
          member.redirectTarget && /* @__PURE__ */ jsxs2("span", { children: [
            " ",
            m.t("splicewire-beam-ux::messages.releases_redirect_target", { target: member.redirectTarget })
          ] }),
          member.stale && /* @__PURE__ */ jsx2("p", { role: "status", children: m.t("splicewire-beam-ux::messages.releases_stale") }),
          !immutable && /* @__PURE__ */ jsxs2("span", { className: "ml-2 inline-flex gap-2", children: [
            /* @__PURE__ */ jsx2(
              Button2,
              {
                size: "sm",
                variant: "secondary",
                disabled: pending,
                onClick: () => void act({ action: "rebase", entryId: member.entryId }),
                children: m.t("splicewire-beam-ux::messages.releases_rebase")
              }
            ),
            member.versionId !== null && /* @__PURE__ */ jsx2(
              Button2,
              {
                size: "sm",
                variant: "secondary",
                disabled: pending,
                onClick: () => void act({
                  action: "use-latest",
                  entryId: member.entryId
                }),
                children: m.t("splicewire-beam-ux::messages.releases_use_latest")
              }
            ),
            /* @__PURE__ */ jsx2(
              Button2,
              {
                size: "sm",
                variant: "secondary",
                disabled: pending,
                onClick: () => void act({ action: "drop", entryId: member.entryId }),
                children: m.t("splicewire-beam-ux::messages.releases_drop")
              }
            )
          ] })
        ] }, member.entryId)) }),
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
//# sourceMappingURL=chunk-E33ACEYB.js.map