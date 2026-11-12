// src/recording.tsx
import { Button } from "@schemastud/ui";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function ReleaseRecordingSummary({
  recording,
  filesHref
}) {
  return /* @__PURE__ */ jsxs("section", { "aria-label": "Local Git record", className: "my-3 space-y-1 rounded border p-3 text-sm", children: [
    /* @__PURE__ */ jsx("h3", { className: "font-medium", children: "Local Git record" }),
    /* @__PURE__ */ jsx("p", { role: "status", children: recording.message ?? recording.status }),
    recording.sha && /* @__PURE__ */ jsxs("p", { title: recording.sha, children: [
      "Git ",
      recording.sha.slice(0, 7)
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      recording.sha && /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: () => void navigator.clipboard?.writeText(recording.sha), children: "Copy SHA" }),
      filesHref && /* @__PURE__ */ jsx("a", { href: filesHref, className: "underline", children: "Open Files recording" })
    ] })
  ] });
}
function VersionRecordingReferences({ recordings = [] }) {
  return /* @__PURE__ */ jsx(Fragment, { children: recordings.map((recording) => /* @__PURE__ */ jsxs("span", { className: "ml-2 text-sm", title: recording.sha ?? recording.message ?? void 0, children: [
    recording.sha ? `Git ${recording.sha.slice(0, 7)}` : "Not committed",
    recording.noChange ? " \xB7 No new commit" : "",
    " \xB7 Release ",
    recording.releaseId
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
      setError(
        failure instanceof Error ? failure.message : "The Release could not be updated."
      );
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
      "aria-label": "Release",
      "aria-busy": pending,
      className: "mt-4 space-y-3 rounded-lg border bg-card p-4 text-sm",
      children: [
        /* @__PURE__ */ jsx2("h2", { className: "font-semibold", children: release.title }),
        /* @__PURE__ */ jsxs2("p", { children: [
          "Status: ",
          release.status.replace("_", " ")
        ] }),
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
            children: "Preview"
          }
        ),
        previewError && /* @__PURE__ */ jsx2("p", { role: "alert", children: "Could not open this Release Preview." }),
        !immutable && !onPreviewOpen && release.previewHref && // ADR-0232 d15: the Release page's Preview, signed in; a new tab, so the panel stays open.
        /* @__PURE__ */ jsx2("a", { href: release.previewHref, target: "_blank", rel: "noopener noreferrer", className: "underline", children: "Preview" }),
        !immutable && release.previewLinksEnabled && !release.canManagePreviewLinks && /* @__PURE__ */ jsx2("p", { children: "Preview Links are on." }),
        !immutable && release.previewLinksEnabled !== void 0 && release.canManagePreviewLinks && /* @__PURE__ */ jsxs2("div", { role: "group", "aria-label": "Preview Links", className: "space-y-2 rounded border p-3", children: [
          /* @__PURE__ */ jsx2("p", { children: "A Preview Link lets anyone who has it preview this Release, signed in or not, for 7 days. Rotating ends every link at once." }),
          release.previewLinksEnabled ? /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-2", children: [
            release.previewLink && /* @__PURE__ */ jsxs2(Fragment2, { children: [
              /* @__PURE__ */ jsx2(
                "input",
                {
                  readOnly: true,
                  "aria-label": "Preview Link",
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
                  children: "Copy link"
                }
              )
            ] }),
            /* @__PURE__ */ jsx2(Button2, { size: "sm", variant: "secondary", disabled: pending, onClick: () => void act({ action: "rotate-links" }), children: "Rotate links" }),
            /* @__PURE__ */ jsx2(Button2, { size: "sm", variant: "secondary", disabled: pending, onClick: () => void act({ action: "links-off" }), children: "Turn links off" })
          ] }) : /* @__PURE__ */ jsx2(Button2, { size: "sm", variant: "secondary", disabled: pending, onClick: () => void act({ action: "links-on" }), children: "Turn on Preview Links" })
        ] }),
        release.recording && /* @__PURE__ */ jsx2(
          ReleaseRecordingSummary,
          {
            recording: release.recording,
            filesHref: release.filesHref
          }
        ),
        release.reviewRequired && /* @__PURE__ */ jsx2("p", { children: "Review is required before publication. The server checks every member\u2019s permissions again at publish time." }),
        error && /* @__PURE__ */ jsx2("p", { role: "alert", children: error }),
        /* @__PURE__ */ jsx2("ul", { className: "space-y-2", children: release.members.map((member) => /* @__PURE__ */ jsxs2("li", { children: [
          /* @__PURE__ */ jsxs2("span", { className: "break-all", children: [
            entries.find((item) => item.id === member.entryId)?.title ?? member.entryId,
            ":",
            " ",
            member.versionId === null ? "Take-down" : `Saved version ${member.versionId}`
          ] }),
          member.redirectTarget && /* @__PURE__ */ jsxs2("span", { children: [
            " \u2014 Redirect target: ",
            member.redirectTarget
          ] }),
          member.stale && /* @__PURE__ */ jsx2("p", { role: "status", children: "The published version changed. Rebase onto theirs or drop the entry." }),
          !immutable && /* @__PURE__ */ jsxs2("span", { className: "ml-2 inline-flex gap-2", children: [
            /* @__PURE__ */ jsx2(
              Button2,
              {
                size: "sm",
                variant: "secondary",
                disabled: pending,
                onClick: () => void act({ action: "rebase", entryId: member.entryId }),
                children: "Rebase onto theirs"
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
                children: "Use latest saved version"
              }
            ),
            /* @__PURE__ */ jsx2(
              Button2,
              {
                size: "sm",
                variant: "secondary",
                disabled: pending,
                onClick: () => void act({ action: "drop", entryId: member.entryId }),
                children: "Drop the entry"
              }
            )
          ] })
        ] }, member.entryId)) }),
        !immutable && /* @__PURE__ */ jsxs2("fieldset", { disabled: pending, className: "space-y-2 rounded border p-3", children: [
          /* @__PURE__ */ jsx2("legend", { children: "Add a saved version or Take-down" }),
          /* @__PURE__ */ jsxs2("label", { children: [
            "Entry",
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
                  /* @__PURE__ */ jsx2("option", { value: "", children: "Choose an entry" }),
                  entries.map((item) => /* @__PURE__ */ jsx2("option", { value: item.id, children: item.title }, item.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("label", { children: [
            "Saved version",
            " ",
            /* @__PURE__ */ jsxs2(
              "select",
              {
                className: "mx-2 rounded border bg-background px-2 py-1",
                value: ref,
                onChange: (event) => setRef(event.target.value),
                children: [
                  /* @__PURE__ */ jsx2("option", { value: "", children: "Choose a saved version" }),
                  entry?.versions.map((version) => /* @__PURE__ */ jsx2("option", { value: version.id, children: version.label }, version.id)),
                  entry?.canTakeDown && /* @__PURE__ */ jsx2("option", { value: "take-down", children: "Take-down" })
                ]
              }
            )
          ] }),
          ref === "take-down" && /* @__PURE__ */ jsxs2("label", { children: [
            "Redirect to a published page (optional)",
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
              children: "Add to Release"
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
            children: action === "submit" ? "Request review" : action === "approve" ? "Approve" : "Publish now"
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
            children: "Create rollback Release"
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
        !immutable && !release.canSchedule && /* @__PURE__ */ jsx2("p", { children: "Scheduling is unavailable on this host. Reviewed Releases can still publish now." }),
        release.redirects && release.redirects.length > 0 && /* @__PURE__ */ jsx2(ReleaseRedirects, { redirects: release.redirects, onRemove: onRemoveRedirect })
      ]
    }
  );
}
function ReleaseRedirects({
  redirects,
  onRemove
}) {
  const [removed, setRemoved] = useState([]);
  const [error, setError] = useState(null);
  const remove = async (id) => {
    setError(null);
    try {
      await onRemove(id);
      setRemoved((current) => [...current, id]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The Redirect could not be removed.");
    }
  };
  return /* @__PURE__ */ jsxs2("section", { "aria-label": "Redirects this Release leaves", children: [
    /* @__PURE__ */ jsx2("h3", { className: "font-semibold", children: "Redirects this Release leaves" }),
    /* @__PURE__ */ jsx2("ul", { children: redirects.filter((redirect) => redirect.id === null || !removed.includes(redirect.id)).map((redirect) => /* @__PURE__ */ jsxs2("li", { children: [
      /* @__PURE__ */ jsxs2("span", { children: [
        redirect.path,
        redirect.match === "prefix" ? " and below" : "",
        " \u2192 ",
        redirect.to ?? "not found",
        redirect.origin === "takedown" ? " (taken down)" : ""
      ] }),
      redirect.id !== null && onRemove && /* @__PURE__ */ jsx2(
        Button2,
        {
          size: "sm",
          variant: "secondary",
          "aria-label": `Remove the Redirect from ${redirect.path}`,
          onClick: () => void remove(redirect.id),
          children: "Remove"
        }
      )
    ] }, `${redirect.path} ${redirect.match}`)) }),
    error && /* @__PURE__ */ jsx2("p", { role: "alert", children: error })
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
        setError(
          reason instanceof Error ? reason.message : "Could not load Releases."
        );
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
      setError(
        reason instanceof Error ? reason.message : "Could not create the Release."
      );
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
  return /* @__PURE__ */ jsxs2("section", { "aria-label": "Build a Release", className: "mt-4 space-y-3", children: [
    /* @__PURE__ */ jsxs2("fieldset", { disabled: pending, className: "space-y-2 rounded border p-3", children: [
      /* @__PURE__ */ jsx2("legend", { children: "Create a built Release" }),
      /* @__PURE__ */ jsxs2("label", { children: [
        "Release title",
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
          children: "Create built Release"
        }
      )
    ] }),
    releases.length > 0 && /* @__PURE__ */ jsxs2("label", { children: [
      "Release to assemble",
      " ",
      /* @__PURE__ */ jsxs2(
        "select",
        {
          value: releaseId,
          onChange: (event) => setReleaseId(event.target.value),
          children: [
            /* @__PURE__ */ jsx2("option", { value: "", children: "Choose a Release" }),
            releases.map((release) => /* @__PURE__ */ jsx2("option", { value: release.id, children: release.title }, release.id))
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx2("p", { role: "alert", children: error }),
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
//# sourceMappingURL=chunk-SR6UINVU.js.map