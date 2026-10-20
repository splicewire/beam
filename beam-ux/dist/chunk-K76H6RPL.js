// src/releases.tsx
import { useState } from "react";
import { WorkflowActionForm } from "@splicewire/beam-workflows";
import { jsx, jsxs } from "react/jsx-runtime";
function ReleasePanel({ release, entries, onCommand }) {
  const [entryId, setEntryId] = useState("");
  const [ref, setRef] = useState("");
  const [redirect, setRedirect] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const entry = entries.find((item) => item.id === entryId);
  const immutable = release.status === "published";
  const act = async (command) => {
    setPending(true);
    setError(null);
    try {
      await onCommand(command);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The Release could not be updated.");
    } finally {
      setPending(false);
    }
  };
  const publishProjection = release.workflow && {
    ...release.workflow,
    transitions: release.workflow.transitions.filter((item) => item.name === "publish")
  };
  return /* @__PURE__ */ jsxs("section", { "aria-label": "Release", "aria-busy": pending, children: [
    /* @__PURE__ */ jsx("h2", { children: release.title }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Status: ",
      release.status.replace("_", " ")
    ] }),
    release.reviewRequired && /* @__PURE__ */ jsx("p", { children: "Review is required before publication. The server checks every member\u2019s permissions again at publish time." }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", children: error }),
    /* @__PURE__ */ jsx("ul", { children: release.members.map((member) => /* @__PURE__ */ jsxs("li", { children: [
      /* @__PURE__ */ jsxs("span", { children: [
        entries.find((item) => item.id === member.entryId)?.title ?? member.entryId,
        ": ",
        member.versionId === null ? "Take-down" : `Saved version ${member.versionId}`
      ] }),
      member.redirectTarget && /* @__PURE__ */ jsxs("span", { children: [
        " \u2014 Redirect target: ",
        member.redirectTarget
      ] }),
      member.stale && /* @__PURE__ */ jsx("p", { role: "status", children: "The published version changed. Rebase or drop this member." }),
      !immutable && /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("button", { disabled: pending, onClick: () => void act({ action: "rebase", entryId: member.entryId }), children: "Rebase" }),
        member.versionId !== null && /* @__PURE__ */ jsx("button", { disabled: pending, onClick: () => void act({ action: "use-latest", entryId: member.entryId }), children: "Use latest saved version" }),
        /* @__PURE__ */ jsx("button", { disabled: pending, onClick: () => void act({ action: "drop", entryId: member.entryId }), children: "Drop" })
      ] })
    ] }, member.entryId)) }),
    !immutable && /* @__PURE__ */ jsxs("fieldset", { disabled: pending, children: [
      /* @__PURE__ */ jsx("legend", { children: "Add a saved version or Take-down" }),
      /* @__PURE__ */ jsxs("label", { children: [
        "Entry ",
        /* @__PURE__ */ jsxs("select", { value: entryId, onChange: (event) => {
          setEntryId(event.target.value);
          setRef("");
        }, children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Choose an entry" }),
          entries.map((item) => /* @__PURE__ */ jsx("option", { value: item.id, children: item.title }, item.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "Saved version ",
        /* @__PURE__ */ jsxs("select", { value: ref, onChange: (event) => setRef(event.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Choose a saved version" }),
          entry?.versions.map((version) => /* @__PURE__ */ jsx("option", { value: version.id, children: version.label }, version.id)),
          entry?.canTakeDown && /* @__PURE__ */ jsx("option", { value: "take-down", children: "Take-down" })
        ] })
      ] }),
      ref === "take-down" && /* @__PURE__ */ jsxs("label", { children: [
        "Redirect to a published page (optional) ",
        /* @__PURE__ */ jsx("input", { value: redirect, onChange: (event) => setRedirect(event.target.value) })
      ] }),
      /* @__PURE__ */ jsx("button", { disabled: !entry || !ref, onClick: () => void act({ action: "member", entryId, ref: ref === "take-down" ? null : ref, redirectTarget: ref === "take-down" ? redirect || null : null }), children: "Add to Release" })
    ] }),
    /* @__PURE__ */ jsx("div", { children: ["submit", "approve", "publish"].filter((action) => release.workflow?.available.includes(action) && (action !== "publish" || !release.reviewRequired || ["approved", "scheduled"].includes(release.status))).map((action) => /* @__PURE__ */ jsx(
      "button",
      {
        disabled: pending || action === "publish" && release.members.some((member) => member.stale),
        onClick: () => void act({ action }),
        children: action === "submit" ? "Request review" : action === "approve" ? "Approve" : "Publish now"
      },
      action
    )) }),
    immutable && /* @__PURE__ */ jsx("button", { disabled: pending, onClick: () => void act({ action: "rollback" }), children: "Create rollback Release" }),
    !immutable && release.canSchedule && release.status === "approved" && /* @__PURE__ */ jsx(
      WorkflowActionForm,
      {
        projection: publishProjection,
        initialTransition: "publish",
        subjectLabel: release.title,
        onSchedule: async (selection) => {
          await onCommand({ action: "schedule", dueAt: selection.dueAt, timezone: selection.timezone });
        }
      }
    ),
    !immutable && !release.canSchedule && /* @__PURE__ */ jsx("p", { children: "Scheduling is unavailable on this host. Reviewed Releases can still publish now." })
  ] });
}

export {
  ReleasePanel
};
//# sourceMappingURL=chunk-K76H6RPL.js.map