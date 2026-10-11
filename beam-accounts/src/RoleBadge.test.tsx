// @vitest-environment jsdom
// C35 (wave-6 role-label cue): the flagship /settings/team role badge rendered the RAW key
// CSS-capitalized ("Tenant_admin"), with no humanizing and no exact-key diagnostic. RoleBadge now
// shows the humanized label and keeps the exact role key as the native title (the C28 pattern).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

// Distinct humanized form so the test can tell the label from the raw key; mock the UI + seam deps so
// the component is testable node-only (no @schemastud/ui workspace resolution needed).
vi.mock("@schemastud/seam", () => ({ humanizeKey: (key: string) => `Human ${key}` }));
vi.mock("@schemastud/ui", () => ({
  Badge: ({ children, title }: { children: unknown; title?: string }) => (
    <span data-testid="role-badge" title={title}>
      {children as never}
    </span>
  ),
}));

import { RoleBadge } from "./RoleBadge";

afterEach(cleanup);

it("renders the humanized role label, keeping the exact key as the secondary title (C35)", () => {
  render(<RoleBadge role="tenant_admin" />);
  const badge = screen.getByTestId("role-badge");

  // Visible text is the humanized label …
  expect(badge.textContent).toBe("Human tenant_admin");
  // … the exact role key is kept only as the title (secondary diagnostic identity) …
  expect(badge.getAttribute("title")).toBe("tenant_admin");
  // … and the raw key is never the visible badge text.
  expect(screen.queryByText("tenant_admin")).toBeNull();
});
