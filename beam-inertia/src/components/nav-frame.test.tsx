// @vitest-environment jsdom
/**
 * The server emits a realm's `{realm}-dashboard` leaf as a TOP-LEVEL node with an href and no children
 * (laravel-beam-ux NavSectionProjector::dashboardLeaf). Drawn as a group, it became an empty "Dashboard"
 * heading over an empty menu under Platform on every AccountShell page (launch ticket 00, overnight-ui2 06).
 */
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { FrameNavNode } from "../frame/manifest";
import { NavFrame } from "./nav-frame";

const nav: { items: FrameNavNode[] } = { items: [] };

vi.mock("@inertiajs/react", () => ({
  Link: ({ href, children }: { href: string; children?: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("../frame/manifest", () => ({
  useFrameManifest: () => ({ data: { nav } }),
}));
vi.mock("../hooks/use-current-url", () => ({
  useCurrentUrl: () => ({ isCurrentUrl: () => false }),
}));
vi.mock("./ui/sidebar", () => {
  const slot =
    (name: string) =>
    ({ children }: { children?: ReactNode; asChild?: boolean }) =>
      <div data-slot={name}>{children}</div>;
  return {
    SidebarGroup: slot("group"),
    SidebarGroupLabel: slot("group-label"),
    SidebarMenu: slot("menu"),
    SidebarMenuItem: slot("menu-item"),
    SidebarMenuButton: slot("menu-button"),
  };
});

afterEach(cleanup);

const node = (over: Partial<FrameNavNode>): FrameNavNode => ({
  kind: "link",
  title: "",
  href: null,
  icon: null,
  routeName: null,
  locked: null,
  children: [],
  ...over,
});

it("draws a childless linked node as a menu row, not an empty group heading", () => {
  nav.items = [
    node({
      title: "Platform",
      children: [node({ title: "Entries", href: "/entries" })],
    }),
    node({
      title: "Dashboard",
      href: "/operator/dashboard",
      routeName: "operator-dashboard.index",
    }),
  ];

  const { container } = render(<NavFrame />);

  const dashboard = screen.getByRole("link", { name: "Dashboard" });
  expect(dashboard.closest('[data-slot="menu-item"]')).not.toBeNull();
  expect(dashboard.closest('[data-slot="group-label"]')).toBeNull();
  for (const menu of container.querySelectorAll('[data-slot="menu"]')) {
    expect(menu.children.length).toBeGreaterThan(0);
  }
  expect(
    screen.getByText("Platform").closest('[data-slot="group-label"]')
  ).not.toBeNull();
});
