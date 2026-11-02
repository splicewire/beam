// src/admin/EntryRowActions.tsx
import { Button } from "@schemastud/ui";
import { jsx, jsxs } from "react/jsx-runtime";
function EntryRowActions({
  record,
  onEdit,
  onDuplicate,
  onDelete,
  onPromoteToCentral,
  confirmDelete = defaultConfirmDelete
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", role: "group", "aria-label": "Entry actions", children: [
    /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onEdit(record), children: "Edit" }),
    /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onDuplicate(record), children: "Duplicate" }),
    record.canPromoteToCentral ? /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        onClick: () => onPromoteToCentral?.(record),
        children: "Promote to central"
      }
    ) : null,
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        onClick: () => {
          if (confirmDelete(record)) {
            onDelete(record);
          }
        },
        children: "Delete"
      }
    )
  ] });
}
function defaultConfirmDelete(record) {
  const label = record.title ?? record.slug;
  return window.confirm(`Delete "${label}"? This can be restored later.`);
}
export {
  EntryRowActions
};
//# sourceMappingURL=admin.js.map