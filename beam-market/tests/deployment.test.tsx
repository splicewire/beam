import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  ExtensionsProvider,
  InstalledTab,
  type ExtensionsClient,
  type InstalledExtension,
} from "../src/index";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

/**
 * ux-demo-convergence G5 — the Installed tab reports the runtime deployment, not the write.
 *
 * JOURNEYS.md §G5: the UI "cannot label code installed or updated because only a database row
 * changed", and on a failed deployment it must "report the observed runtime state, retain the last
 * verified deployment receipt and offer documented recovery/retry".
 */
function row(deployment: InstalledExtension["deployment"], overrides: Partial<InstalledExtension> = {}): InstalledExtension {
  return {
    installId: "install-uuid",
    productId: 7,
    name: "Demo Notes",
    kind: "beam_extension",
    trustTier: "Standard",
    isPlatformTier: false,
    installedAt: "2026-09-01T00:00:00Z",
    installedVersion: deployment.detectedVersion,
    latestVersion: "2.0.0",
    updateAvailable: deployment.detectedVersion !== "2.0.0",
    deployment,
    ...overrides,
  };
}

function mount(installed: InstalledExtension[]) {
  const client = {
    getInstalled: vi.fn(async () => installed),
  } as unknown as ExtensionsClient;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ExtensionsProvider services={{ client, notify: () => {} }}>
        {children}
      </ExtensionsProvider>
    </QueryClientProvider>
  );

  return render(<InstalledTab />, { wrapper: Wrapper });
}

describe("deployment state on the Installed tab", () => {
  it("says Deploy pending and prints the CLI step when nothing is deployed — and prints no version", async () => {
    mount([
      row({
        state: "instructed",
        package: "splicewire/beam-extension-demo",
        requestedVersion: "1.0.0",
        detectedVersion: null,
        lastVerifiedVersion: null,
        lastVerifiedAt: null,
        instructions: [
          "composer require splicewire/beam-extension-demo:1.0.0",
          "php artisan splicewire:beam:install --no-interaction",
        ],
        error: null,
      }),
    ]);

    await waitFor(() =>
      expect(screen.getByText("Deploy pending")).toBeTruthy(),
    );
    expect(
      screen.getByText(/composer require splicewire\/beam-extension-demo:1\.0\.0/),
    ).toBeTruthy();
    expect(
      screen.getByText("No deployment verified on this host yet"),
    ).toBeTruthy();
    // The regression this exists for: a version printed for code nobody deployed.
    expect(screen.queryByText(/· v1\.0\.0/)).toBeNull();
  });

  it("says Active with the DETECTED version, and shows no instructions", async () => {
    mount([
      row({
        state: "detected",
        package: "splicewire/beam-extension-demo",
        requestedVersion: "2.0.0",
        detectedVersion: "2.0.0",
        lastVerifiedVersion: "2.0.0",
        lastVerifiedAt: "2026-09-12T00:00:00Z",
        instructions: [],
        error: null,
      }),
    ]);

    await waitFor(() =>
      expect(screen.getByText("Active v2.0.0")).toBeTruthy(),
    );
    expect(screen.queryByTestId("deployment-panel")).toBeNull();
  });

  it("reports the observed runtime state, retains the receipt and offers a retry on a failed deploy", async () => {
    mount([
      row({
        state: "instructed",
        package: "splicewire/beam-extension-demo",
        requestedVersion: "2.0.0",
        detectedVersion: "1.0.0",
        lastVerifiedVersion: "1.0.0",
        lastVerifiedAt: "2026-09-11T00:00:00Z",
        instructions: ["composer require splicewire/beam-extension-demo:2.0.0"],
        error:
          "This host is running splicewire/beam-extension-demo 1.0.0. Version 2.0.0 is requested but not deployed yet.",
      }),
    ]);

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "This host is running splicewire/beam-extension-demo 1.0.0",
      ),
    );
    expect(
      screen.getByText("Last verified deployment: v1.0.0"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Check again" }),
    ).toBeTruthy();
    // The version the row claims to RUN did not advance to the requested one.
    expect(screen.getByText(/· v1\.0\.0/)).toBeTruthy();
  });

  it("says Removal pending and prints the removal step while the package is still deployed", async () => {
    mount([
      row({
        state: "removal_pending",
        package: "splicewire/beam-extension-demo",
        requestedVersion: "2.0.0",
        detectedVersion: "2.0.0",
        lastVerifiedVersion: "2.0.0",
        lastVerifiedAt: "2026-09-12T00:00:00Z",
        instructions: ["composer remove splicewire/beam-extension-demo"],
        error: null,
      }),
    ]);

    await waitFor(() =>
      expect(screen.getByText("Removal pending")).toBeTruthy(),
    );
    expect(
      screen.getByText(/composer remove splicewire\/beam-extension-demo/),
    ).toBeTruthy();
  });
});
