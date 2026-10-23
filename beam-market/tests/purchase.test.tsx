import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EntitlementPanel } from "../src/EntitlementPanel";
import {
  ExtensionDetailSheet,
  ExtensionsProvider,
  InstalledTab,
  type ExtensionsClient,
  type InstalledExtension,
  type MarketEntitlement,
  type MarketExtension,
} from "../src/index";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

/**
 * ux-demo-convergence G5 — the paid-listing states, at the surface.
 *
 * JOURNEYS.md §G5: "Sandbox checkout yields the declared entitlement and permitted acquisition;
 * failed checkout cannot bypass it." The server enforces that (see the PHP
 * `PaidListingEntitlementTest`); what is measured HERE is that the surface never offers an
 * acquisition the server would refuse, and never reads a declined payment as a purchase.
 */
const PAID: MarketExtension = {
  id: 2,
  name: "Waveform pro",
  kind: "beam_extension",
  categories: [],
  trustTier: "Standard",
  requiresSplicewire: false,
  isPlatformTier: false,
  isInstalled: false,
  isFree: false,
  isEntitled: false,
  priceLabel: "$19.00",
  sellerName: "Acme",
  installCount: 0,
  description: "A paid Beam Extension.",
  changelog: [],
  marketName: null,
  syncedAt: null,
  createdAt: "2026-09-01T00:00:00Z",
};

const ENTITLEMENT: MarketEntitlement = {
  entitlementId: "entitlement-uuid",
  productId: PAID.id,
  status: "active",
  grantedAt: "2026-09-12T00:00:00Z",
  amountLabel: "$19.00",
  paymentRef: "fake_ch_1a2b3c",
  licenseId: "lic_01ab",
  licenseKey: "LIC-TEST-KEY-0000",
  registryUsername: "composer",
  registryUrl: "https://app.example.test/registry",
};

function client(overrides: Partial<ExtensionsClient> = {}): ExtensionsClient {
  return {
    getCatalog: vi.fn(async () => ({ listings: [PAID] })),
    getListing: vi.fn(async () => PAID),
    getConnectionStatus: vi.fn(async () => ({
      connected: true,
      pairingGuidance: {
        connectCommand: "php artisan splicewire:connect",
        manualTokenEnvVar: "SPLICEWIRE_TOKEN",
        manualFallbackHint: "Use a token.",
      },
    })),
    getInstalled: vi.fn(async () => []),
    install: vi.fn(),
    purchase: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as ExtensionsClient;
}

function mount(
  node: ReactNode,
  services: ExtensionsClient,
  extra: { can?: (ability: string, listing?: MarketExtension) => boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ExtensionsProvider
        services={{ client: services, notify: () => {}, ...extra }}
      >
        {children}
      </ExtensionsProvider>
    </QueryClientProvider>
  );

  return { ...render(node, { wrapper: Wrapper }), queryClient };
}

describe("a paid listing the buyer does not own", () => {
  it("offers the purchase and never the install", async () => {
    const install = vi.fn();
    mount(
      <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
      client({ install }),
    );

    expect(
      await screen.findByRole("button", { name: "Buy $19.00" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
    expect(install).not.toHaveBeenCalled();
  });

  it("reports a DECLINED payment on the surface, with a retry, and grants nothing", async () => {
    const purchase = vi.fn(async () => {
      throw {
        response: {
          data: {
            message:
              "The payment was not completed (failed: card_declined). Nothing was purchased.",
          },
        },
      };
    });

    mount(
      <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
      client({ purchase } as unknown as Partial<ExtensionsClient>),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Buy $19.00" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("card_declined");
    // The retry is the same control, relabelled — and the install is still not on offer.
    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
    expect(screen.queryByTestId("entitlement-panel")).toBeNull();
  });

  it("delivers the licence key the moment a purchase captures", async () => {
    let entitled = false;
    const purchase = vi.fn(async () => {
      entitled = true;
      return {
        productId: PAID.id,
        alreadyEntitled: false,
        entitlement: ENTITLEMENT,
      };
    });

    mount(
      <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
      client({
        purchase,
        getListing: vi.fn(async () => ({ ...PAID, isEntitled: entitled })),
      } as unknown as Partial<ExtensionsClient>),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Buy $19.00" }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("entitlement-panel")).toBeTruthy(),
    );
    // And the control becomes the acquisition it just unlocked — never a second Buy.
    expect(await screen.findByRole("button", { name: "Install" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Buy/ })).toBeNull();
    // Hidden until asked for — the credential is the buyer's, and a page load is not a request.
    expect(screen.queryByText(ENTITLEMENT.licenseKey!)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Show key" }));
    expect(await screen.findByText(ENTITLEMENT.licenseKey!)).toBeTruthy();
  });
});

describe("a paid listing the buyer owns", () => {
  it("offers the install", async () => {
    mount(
      <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
      client({
        getListing: vi.fn(async () => ({ ...PAID, isEntitled: true })),
      }),
    );

    expect(await screen.findByRole("button", { name: "Install" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Buy/ })).toBeNull();
    expect(await screen.findByText("Purchased")).toBeTruthy();
  });

  it("carries the credential on the Installed row, beside the deployment step it unlocks", async () => {
    const installed: InstalledExtension = {
      installId: "install-uuid",
      productId: PAID.id,
      name: PAID.name,
      kind: PAID.kind,
      trustTier: PAID.trustTier,
      isPlatformTier: false,
      installedAt: "2026-09-12T00:00:00Z",
      installedVersion: null,
      latestVersion: "1.0.0",
      updateAvailable: false,
      entitlement: ENTITLEMENT,
      deployment: {
        state: "instructed",
        package: "acme/waveform-pro",
        requestedVersion: "1.0.0",
        detectedVersion: null,
        lastVerifiedVersion: null,
        lastVerifiedAt: null,
        notes: null,
        instructions: ["composer require acme/waveform-pro:1.0.0"],
        error: null,
      },
    };

    mount(
      <InstalledTab />,
      client({ getInstalled: vi.fn(async () => [installed]) }),
    );

    expect(await screen.findByTestId("entitlement-panel")).toBeTruthy();
    expect(await screen.findByText(/Your licence · \$19\.00/)).toBeTruthy();
    // The deploy command names the package, and the auth line names the registry host.
    expect(
      (await screen.findByTestId("entitlement-panel")).textContent,
    ).toContain("http-basic.app.example.test");
  });
});

describe("a member without the install ability", () => {
  // The server refuses an install to anyone without `market-extensions.install` (InstallExtension's declared ability), and a
  // member used to see an ENABLED Install button that answered 403 (ux-demo screenshot review 2026-09-24,
  // G4-FLAGSHIP-REVIEW). The host tells the package what the viewer may do; the button follows the same ability.
  it("sees the Install button disabled, with the reason", async () => {
    const can = vi.fn(
      (ability: string) => ability !== "market-extensions.install",
    );
    mount(
      <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
      client({
        getListing: vi.fn(async () => ({ ...PAID, isEntitled: true })),
      }),
      { can },
    );

    const button = (await screen.findByRole("button", {
      name: "Install",
    })) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText(/don't have permission to install/i)).toBeTruthy();
    expect(can).toHaveBeenCalledWith("market-extensions.install", expect.objectContaining({id: PAID.id}));
  });

  it("keeps the Install button enabled when the host grants the ability or says nothing", async () => {
    mount(
      <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
      client({
        getListing: vi.fn(async () => ({ ...PAID, isEntitled: true })),
      }),
    );

    const button = (await screen.findByRole("button", {
      name: "Install",
    })) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});

describe("ineffective buyer license history", () => {
  it.each(["revoked", "unavailable"])(
    "shows %s without exposing a cached key or deployment instructions",
    (status) => {
      render(<EntitlementPanel entitlement={{ ...ENTITLEMENT, status }} />);
      expect(
        screen.getByText(
          status === "revoked"
            ? "License revoked — acquisition unavailable"
            : "License unavailable — acquisition unavailable",
        ),
      ).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Show key" })).toBeNull();
      expect(screen.queryByText(/Authenticate Composer/)).toBeNull();
      expect(screen.getByText(/payment fake_ch_1a2b3c/)).toBeTruthy();
      expect(screen.queryByText(ENTITLEMENT.licenseKey!)).toBeNull();
    },
  );
});

it("removes a revealed purchase key after authoritative denial and keeps it absent on cached reopen", async () => {
  let entitled = false;
  const fake = client({
    getListing: vi.fn(async () => ({ ...PAID, isEntitled: entitled })),
    purchase: vi.fn(async () => {
      entitled = true;
      return {
        productId: PAID.id,
        alreadyEntitled: false,
        entitlement: ENTITLEMENT,
      };
    }),
  });
  const view = mount(
    <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
    fake,
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Buy $19.00" }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Show key" }),
  );
  expect(await screen.findByText(ENTITLEMENT.licenseKey!)).toBeTruthy();
  entitled = false;
  await act(async () => {
    await view.queryClient.invalidateQueries({
      queryKey: ["beam-market", "listing", PAID.id],
    });
  });
  await waitFor(() =>
    expect(screen.queryByTestId("entitlement-key")).toBeNull(),
  );
  expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
  view.rerender(
    <ExtensionDetailSheet listingId={null} onOpenChange={() => {}} />,
  );
  view.rerender(
    <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
  );
  expect(
    await screen.findByRole("button", { name: "Buy $19.00" }),
  ).toBeTruthy();
  expect(screen.queryByTestId("entitlement-panel")).toBeNull();
});

it("does not offer an enabled checkout when the host denies purchase", async () => {
  const purchase = vi.fn();
  mount(
    <ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />,
    client({ purchase }),
    { can: (ability) => ability !== "market-extensions.purchase" },
  );
  const button = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Buy $19.00",
  });
  expect(button.disabled).toBe(true);
  await userEvent.click(button);
  expect(purchase).not.toHaveBeenCalled();
});

it.each([
  ["free", { ...PAID, isFree: true, isEntitled: false }, false],
  ["unentitled", PAID, false],
  ["revoked", { ...PAID, isEntitled: false }, false],
  ["effective paid", { ...PAID, isEntitled: true }, true],
])("passes the actual %s listing to subject-bound install admission", async (_name, listing, allowed) => {
  const seen: Array<MarketExtension | undefined> = [];
  const can = (ability: string, subject?: MarketExtension) => {
    if (ability !== "market-extensions.install") return true;
    seen.push(subject);
    return Boolean(subject && !subject.isFree && subject.isEntitled);
  };
  mount(<ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />, client({getListing: vi.fn(async () => listing)}), {can});
  if (listing.isFree || listing.isEntitled) {
    const install = await screen.findByRole<HTMLButtonElement>("button", {name:"Install",exact:true});
    expect(install.disabled).toBe(!allowed);
  } else await screen.findByRole("button",{name:"Buy $19.00"});
  await waitFor(()=>expect(seen.some(subject=>subject===listing)).toBe(true));
  expect(seen).toContain(undefined);
});

it("preserves one-argument operator permission for a free listing", async () => {
  const listing = {...PAID, isFree:true};
  mount(<ExtensionDetailSheet listingId={PAID.id} onOpenChange={() => {}} />, client({getListing:vi.fn(async()=>listing)}), {can: (ability)=>ability === "market-extensions.install"});
  expect((await screen.findByRole<HTMLButtonElement>("button",{name:"Install",exact:true})).disabled).toBe(false);
});
