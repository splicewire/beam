// src/NotificationBell.tsx
import { Popover, PopoverContent, PopoverTrigger, hitTargetFloor } from "@schemastud/ui";
import { Bell } from "lucide-react";
import { useState } from "react";

// src/data.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourceQueryKey, useFrameInjection } from "@schemastud/frame";
var NOTIFICATIONS_RESOURCE = "notifications";
var UNREAD_POLL_MS = 6e4;
function useUnreadNotificationCount(pollMs = UNREAD_POLL_MS) {
  const { transport } = useFrameInjection();
  return useQuery({
    queryKey: resourceQueryKey(transport, NOTIFICATIONS_RESOURCE, "summary"),
    queryFn: async () => {
      const summary = await transport.summary(NOTIFICATIONS_RESOURCE, {});
      const unread = summary.figures.find((figure) => figure.key === "unread")?.value;
      return typeof unread === "number" && Number.isSafeInteger(unread) && unread >= 0 ? unread : 0;
    },
    refetchInterval: pollMs,
    staleTime: pollMs
  });
}
function useRecentNotifications(open, limit) {
  const { transport } = useFrameInjection();
  return useQuery({
    queryKey: resourceQueryKey(transport, NOTIFICATIONS_RESOURCE, "recent", limit),
    queryFn: async () => (await transport.list(NOTIFICATIONS_RESOURCE, { per_page: String(limit) })).data,
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always"
  });
}
function useMarkNotificationsRead(failedMessage) {
  const { transport, manifestFor, notify } = useFrameInjection();
  const client = useQueryClient();
  const actions = manifestFor?.(NOTIFICATIONS_RESOURCE)?.actions ?? [];
  const mutation = useMutation({
    mutationFn: async (target) => {
      const action = actions.find((candidate) => candidate.key === target.key);
      if (!action || !transport.invoke) throw new Error(`The notifications resource declares no [${target.key}] action here.`);
      return transport.invoke(action, { id: target.id ?? null });
    },
    // A refused or failed write reaches the host's one notice sink (66-1), never a silent no-op.
    onError: () => notify?.({ tone: "error", message: failedMessage }),
    onSettled: () => client.invalidateQueries({ queryKey: ["frame", NOTIFICATIONS_RESOURCE] })
  });
  return {
    markRead: (id) => mutation.mutate({ key: "read", id }),
    markAllRead: () => mutation.mutate({ key: "read-all" }),
    canMarkRead: actions.some((action) => action.key === "read") && Boolean(transport.invoke),
    canMarkAllRead: actions.some((action) => action.key === "read-all") && Boolean(transport.invoke),
    pending: mutation.isPending
  };
}

// src/messages.ts
import { createMessages } from "@schemastud/messages";
import { useMessages } from "@schemastud/messages/react";
import catalog from "@splicewire/beam-notifications/messages.js";
var englishBeamNotificationsMessages = createMessages(catalog.messages);
var useBeamNotificationsMessages = () => useMessages(catalog.messages);

// src/NotificationBell.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var plainLink = ({ href, className, children }) => /* @__PURE__ */ jsx("a", { href, className, children });
function NotificationBell({ needsYou, seeAllHref, recentLimit = 5, unreadPollMs, renderLink = plainLink }) {
  const messages = useBeamNotificationsMessages();
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount(unreadPollMs);
  const recent = useRecentNotifications(open, recentLimit);
  const marks = useMarkNotificationsRead(messages.t("splicewire-beam-notifications::messages.mark_read_failed"));
  const hasUnread = (unread.data ?? 0) > 0;
  const rows = recent.data ?? [];
  const label = messages.t("splicewire-beam-notifications::messages.bell_label");
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        "aria-label": hasUnread ? `${label}, ${messages.t("splicewire-beam-notifications::messages.unread")}` : label,
        "data-unread": hasUnread ? "true" : "false",
        className: `${hitTargetFloor} inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium`,
        children: [
          /* @__PURE__ */ jsx(Bell, { className: "size-[13px]", "aria-hidden": true }),
          needsYou && needsYou.count > 0 ? /* @__PURE__ */ jsx("span", { "data-testid": "bell-count", className: "rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground", children: needsYou.count > 9 ? "9+" : needsYou.count }) : null,
          hasUnread ? /* @__PURE__ */ jsx("span", { "data-testid": "bell-unread-dot", "aria-hidden": true, className: "absolute right-1 top-1 size-2 rounded-full bg-primary" }) : null
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs(PopoverContent, { align: "end", className: "w-80 p-0", children: [
      needsYou ? /* @__PURE__ */ jsxs("section", { "aria-label": messages.t("splicewire-beam-notifications::messages.needs_you"), className: "border-b p-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold", children: messages.t("splicewire-beam-notifications::messages.needs_you") }),
        renderLink({
          href: needsYou.href,
          className: "mt-1 flex items-center justify-between text-sm",
          children: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { children: messages.t("splicewire-beam-notifications::messages.needs_you_open") }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold tabular-nums", children: needsYou.count })
          ] })
        })
      ] }) : null,
      rows.length > 0 ? /* @__PURE__ */ jsxs("section", { "aria-label": messages.t("splicewire-beam-notifications::messages.recent"), className: "p-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold", children: messages.t("splicewire-beam-notifications::messages.recent") }),
        /* @__PURE__ */ jsx("ul", { className: "mt-1 divide-y", children: rows.map((row) => /* @__PURE__ */ jsx(
          RecentRow,
          {
            row,
            locale: messages.locale,
            renderLink,
            canMarkRead: marks.canMarkRead,
            onMarkRead: () => marks.markRead(row.id),
            markReadLabel: messages.t("splicewire-beam-notifications::messages.mark_read")
          },
          row.id
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between text-xs", children: [
          marks.canMarkAllRead ? /* @__PURE__ */ jsx("button", { type: "button", onClick: marks.markAllRead, disabled: marks.pending, children: messages.t("splicewire-beam-notifications::messages.mark_all_read") }) : /* @__PURE__ */ jsx("span", {}),
          renderLink({ href: seeAllHref, children: messages.t("splicewire-beam-notifications::messages.see_all") })
        ] })
      ] }) : null
    ] })
  ] });
}
function RecentRow({
  row,
  locale,
  renderLink,
  canMarkRead,
  onMarkRead,
  markReadLabel
}) {
  const text = row.text ?? "";
  return /* @__PURE__ */ jsxs("li", { "data-unread": row.unread ? "true" : "false", className: "flex items-start gap-2 py-2 text-sm", children: [
    row.unread ? /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" }) : /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "mt-1.5 size-1.5 shrink-0" }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      row.link ? renderLink({ href: row.link, className: "line-clamp-2", children: text }) : /* @__PURE__ */ jsx("span", { className: "line-clamp-2", children: text }),
      row.createdAt ? /* @__PURE__ */ jsx("time", { dateTime: row.createdAt, className: "block text-xs text-muted-foreground", children: relativeTime(row.createdAt, locale) }) : null
    ] }),
    row.unread && canMarkRead ? /* @__PURE__ */ jsx("button", { type: "button", onClick: onMarkRead, className: "text-xs", "aria-label": markReadLabel, children: markReadLabel }) : null
  ] });
}
function relativeTime(iso, locale) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1e3);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps = [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 4.35], ["month", 12], ["year", Number.POSITIVE_INFINITY]];
  let value = seconds;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return format.format(Math.round(value), unit);
    value /= size;
  }
  return format.format(Math.round(value), "year");
}
export {
  NOTIFICATIONS_RESOURCE,
  NotificationBell,
  UNREAD_POLL_MS,
  englishBeamNotificationsMessages,
  useBeamNotificationsMessages,
  useMarkNotificationsRead,
  useRecentNotifications,
  useUnreadNotificationCount
};
//# sourceMappingURL=index.js.map