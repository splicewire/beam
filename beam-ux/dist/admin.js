import {
  useBeamUxMessages
} from "./chunk-YBGMJB3T.js";

// src/admin/EntryRowActions.tsx
import { Button } from "@schemastud/ui";
import { jsx, jsxs } from "react/jsx-runtime";
function EntryRowActions({
  record,
  onEdit,
  onDuplicate,
  onDelete,
  onPromoteToCentral,
  confirmDelete
}) {
  const m = useBeamUxMessages();
  const confirmed = confirmDelete ?? ((entry) => window.confirm(m.t("splicewire-beam-ux::messages.admin_delete_confirm", { label: entry.title ?? entry.slug })));
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", role: "group", "aria-label": m.t("splicewire-beam-ux::messages.admin_entry_actions"), children: [
    /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onEdit(record), children: m.t("splicewire-beam-ux::messages.admin_edit") }),
    /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onDuplicate(record), children: m.t("splicewire-beam-ux::messages.admin_duplicate") }),
    record.canPromoteToCentral ? /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        onClick: () => onPromoteToCentral?.(record),
        children: m.t("splicewire-beam-ux::messages.admin_promote_to_central")
      }
    ) : null,
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        onClick: () => {
          if (confirmed(record)) {
            onDelete(record);
          }
        },
        children: m.t("splicewire-beam-ux::messages.admin_delete")
      }
    )
  ] });
}
export {
  EntryRowActions
};
//# sourceMappingURL=admin.js.map