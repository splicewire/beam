import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// TOWER-05 shots-r6 follow-up (integrator, 2026-10-09): the Account page showed "Passkeys" twice. A host that frames
// the section in its own card (tower-ux CustomerAccountPage: its heading plus the host's branded passkey copy) needs
// the section to drop its own header; every other mount keeps it.
vi.mock("../src/webauthn", () => ({
  isWebAuthnSupported: vi.fn(() => true),
  runAssertionCeremony: vi.fn(),
  runAttestationCeremony: vi.fn(),
}));

import { AuthProvider, PasskeysSection } from "../src/index";
import type { AuthClient } from "../src/index";

afterEach(cleanup);
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function client(): AuthClient {
  return {
    login: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    passkey: {
      loginOptions: vi.fn(),
      login: vi.fn(),
      registrationOptions: vi.fn(),
      register: vi.fn(),
      list: vi.fn(async () => []),
      rename: vi.fn(),
      remove: vi.fn(),
    },
  };
}

function mount(ui: React.ReactNode): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider services={{ client: client() }}>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

it("keeps its own Passkeys heading by default", () => {
  mount(<PasskeysSection />);
  expect(screen.getAllByRole("heading", { name: "Passkeys" })).toHaveLength(1);
});

it("drops its own header when the host frames the section", () => {
  mount(<PasskeysSection showHeader={false} />);
  expect(screen.queryByRole("heading", { name: "Passkeys" })).toBeNull();
  // The section's controls still render.
  expect(screen.getByLabelText("Add a passkey")).toBeTruthy();
});
