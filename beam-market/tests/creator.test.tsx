import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
// Through the package barrel — the same entry a host consumes.
import {
  CreatorProvider,
  CreatorWorkspaceArea,
  createCreatorClient,
  presentListingStatus,
  submitBlocker,
  type CreatorClient,
  type CreatorRequest,
  type ExtensionArtifactData,
  type MarketListingData,
  type SellerRepoAuthorizationData,
} from "../src/index";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});

// Pure generated-DTO-shaped fixtures (ADR-0116 §7a) — the render cannot drift from the projected
// shape, and no Laravel is involved.
const LISTING: MarketListingData = {
  id: 7,
  name: "Demo Notes",
  summary: "A package-owned notes screen.",
  kind: "beam_extension",
  status: "draft",
  reviewStatus: null,
  reviewNote: null,
  trustTier: "Standard",
  repoFullName: "splicewire/beam-extension-demo",
  repoAuthorized: true,
  installationNotes: "composer require splicewire/beam-extension-demo",
  compatibility: "Beam ^1.0",
  latestVersion: "1.0.0",
  releases: [{ version: "1.0.0", notes: "First release.", releasedAt: "2026-09-11T00:00:00Z" }],
  createdAt: "2026-09-11T00:00:00Z",
  updatedAt: null,
};

const SIMULATED_AUTH: SellerRepoAuthorizationData = {
  id: "auth-1",
  status: "active",
  installUrl: null,
  repos: [{ id: null, full_name: "splicewire/beam-extension-demo" }],
  authorizedAt: "2026-09-11T00:00:00Z",
  createdAt: "2026-09-11T00:00:00Z",
  simulated: true,
};

function stubClient(overrides: Partial<CreatorClient> = {}): CreatorClient {
  return {
    getSeller: async () => ({
      id: "seller-1",
      name: "E2E Fixture",
      isSystem: false,
      payoutStatus: null,
      createdAt: "2026-09-11T00:00:00Z",
    }),
    getAuthorizations: async () => [SIMULATED_AUTH],
    beginAuthorization: async () => SIMULATED_AUTH,
    inspectArtifact: async () => ({
      repoFullName: "splicewire/beam-extension-demo",
      available: true,
      refs: ["v2.0.0", "v1.0.0"],
      ref: "v2.0.0",
      packageName: "splicewire/beam-extension-demo",
      version: "2.0.0",
      description: "A fixture.",
      suggestedName: "Demo Notes",
      valid: true,
      problems: [],
    }),
    getListings: async () => [LISTING],
    createListing: async () => LISTING,
    updateListing: async () => LISTING,
    release: async () => LISTING,
    submit: async () => LISTING,
    withdraw: async () => LISTING,
    ...overrides,
  };
}

function mount(client: CreatorClient): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CreatorProvider services={{ client, notify: () => {} }}>{children}</CreatorProvider>
      </QueryClientProvider>
    );
  }

  render(<CreatorWorkspaceArea />, { wrapper: Wrapper });
}

describe("CreatorWorkspaceArea", () => {
  it("names the Seller the actor is selling as", async () => {
    mount(stubClient());

    await waitFor(() =>
      expect(screen.getByTestId("creator-seller-name").textContent).toContain("Selling as E2E Fixture"),
    );
  });

  it("labels a simulated authorization permanently, because nothing else distinguishes it", async () => {
    mount(stubClient());

    await waitFor(() => expect(screen.getByTestId("creator-simulated-badge")).toBeTruthy());
    expect(screen.getByTestId("creator-repository-row").textContent).toContain(
      "splicewire/beam-extension-demo",
    );
  });

  it("offers no simulate affordance when the host did not supply one", async () => {
    const client = stubClient({
      getAuthorizations: async () => [
        { ...SIMULATED_AUTH, status: "pending", installUrl: "https://github.test/apps/x", repos: [], simulated: false },
      ],
    });
    delete (client as Partial<CreatorClient>).simulateProviderCallback;

    mount(client);

    await waitFor(() => expect(screen.getByTestId("creator-pending-authorization")).toBeTruthy());
    expect(screen.queryByTestId("creator-simulate-submit")).toBeNull();
  });

  it("reports an UNREADABLE artifact differently from an invalid one", async () => {
    const unavailable: ExtensionArtifactData = {
      repoFullName: "acme/widgets",
      available: false,
      refs: [],
      ref: null,
      packageName: null,
      version: null,
      description: null,
      suggestedName: null,
      valid: false,
      problems: ["This host has no artifact source for acme/widgets, so its package manifest could not be read."],
    };

    mount(stubClient({ inspectArtifact: async () => unavailable }));

    await waitFor(() => expect(screen.getByTestId("creator-inspect")).toBeTruthy());
    fireEvent.click(screen.getByTestId("creator-inspect"));

    await waitFor(() => expect(screen.getByTestId("creator-artifact-unavailable")).toBeTruthy());
    // NOT the "Not listable" verdict: nothing was inspected, so nothing was found invalid.
    expect(screen.queryByTestId("creator-artifact-verdict")).toBeNull();
  });

  it("lists every broken manifest rule, not just the first", async () => {
    mount(
      stubClient({
        inspectArtifact: async () => ({
          repoFullName: "acme/widgets",
          available: true,
          refs: ["v1.0.0"],
          ref: "v1.0.0",
          packageName: null,
          version: "1.0.0",
          description: null,
          suggestedName: null,
          valid: false,
          problems: ["no name", "no beam requirement", "no providers"],
        }),
      }),
    );

    await waitFor(() => expect(screen.getByTestId("creator-inspect")).toBeTruthy());
    fireEvent.click(screen.getByTestId("creator-inspect"));

    await waitFor(() => expect(screen.getByTestId("creator-artifact-problems")).toBeTruthy());
    expect(screen.getByTestId("creator-artifact-problems").querySelectorAll("li")).toHaveLength(3);
  });

  it("shows WHY a submission is unavailable rather than hiding the button", async () => {
    mount(
      stubClient({
        getListings: async () => [{ ...LISTING, repoAuthorized: false }],
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("creator-submit-blocked").textContent).toContain("Authorize"),
    );
    expect((screen.getByTestId("creator-submit-listing") as HTMLButtonElement).disabled).toBe(true);
  });

  it("puts the rejection reason where a rejected creator will read it", async () => {
    mount(
      stubClient({
        getListings: async () => [
          { ...LISTING, reviewStatus: "rejected", reviewNote: "Installation notes omit the migrate step." },
        ],
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("creator-listing-status").textContent).toContain("Rejected"),
    );
    expect(screen.getByTestId("creator-listing-hint").textContent).toContain("migrate step");
    expect(screen.getByTestId("creator-submit-listing").textContent).toContain("Resubmit for review");
  });

  it("submits through the injected client", async () => {
    const submit = vi.fn(async () => LISTING);
    mount(stubClient({ submit }));

    await waitFor(() =>
      expect((screen.getByTestId("creator-submit-listing") as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(screen.getByTestId("creator-submit-listing"));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(7));
  });
});

describe("status vocabulary", () => {
  it("reads the REVIEW marking first, and the catalog status only to split approved from published", () => {
    expect(presentListingStatus({ reviewStatus: null, status: "draft", reviewNote: null }).label).toBe("Draft");
    expect(presentListingStatus({ reviewStatus: "pending_human", status: "draft", reviewNote: null }).label).toBe("In review");
    expect(presentListingStatus({ reviewStatus: "approved_human", status: "published", reviewNote: null }).label).toBe("Published");
    // Approved but not in the catalog is a REAL state, not an inconsistency to smooth over.
    expect(presentListingStatus({ reviewStatus: "approved_human", status: "draft", reviewNote: null }).label).toBe("Approved");
    expect(presentListingStatus({ reviewStatus: "taken_down", status: "draft", reviewNote: null }).label).toBe("Withdrawn");
  });

  it("says existing installs survive a withdrawal, because the policy says so", () => {
    expect(
      presentListingStatus({ reviewStatus: "taken_down", status: "draft", reviewNote: null }).hint,
    ).toContain("Existing installs are untouched");
  });

  it("blocks submission on each precondition in the order a creator hits them", () => {
    expect(submitBlocker({ ...LISTING, repoFullName: null })).toContain("Link the repository");
    expect(submitBlocker({ ...LISTING, repoAuthorized: false })).toContain("Authorize");
    expect(submitBlocker({ ...LISTING, latestVersion: null })).toContain("Publish a release");
    expect(submitBlocker({ ...LISTING, reviewStatus: "pending_human" })).toBe("Already in review.");
    expect(submitBlocker(LISTING)).toBeNull();
  });
});

describe("createCreatorClient", () => {
  function requestSpy(rows: unknown = []) {
    const calls: Array<{ method: string; url: string; options?: unknown }> = [];
    const request: CreatorRequest = (async (method, url, options) => {
      calls.push({ method, url, options });
      return { status: 200, data: { data: rows, total: Array.isArray(rows) ? rows.length : undefined } };
    }) as CreatorRequest;

    return { request, calls };
  }

  const endpoints = {
    seller: "/market-sellers",
    authorizations: "/seller-repo-authorizations",
    inspect: (id: string) => `/seller-repo-authorizations/${id}/inspect`,
    listings: "/market-listings",
    listing: (id: number) => `/market-listings/${id}`,
    submit: (id: number) => `/market-listings/${id}/submit`,
    release: (id: number) => `/market-listings/${id}/release`,
    withdraw: (id: number) => `/market-listings/${id}/withdraw`,
  };

  it("sends `repo_full_name` on the wire, matching the DTO's own MapInputName", async () => {
    const { request, calls } = requestSpy(LISTING);

    await createCreatorClient(request, endpoints).createListing({
      name: "Demo",
      summary: null,
      repoFullName: "acme/widgets",
      installationNotes: null,
      compatibility: null,
    });

    const body = calls[0].options as { body: Record<string, unknown> };
    expect(body.body.repo_full_name).toBe("acme/widgets");
    expect(body.body.repoFullName).toBeUndefined();
  });

  it("reads the actor's one Seller off an index whose scope admits exactly one row", async () => {
    const { request } = requestSpy([{ id: "s1", name: "Acme", isSystem: false, payoutStatus: null, createdAt: "" }]);

    expect((await createCreatorClient(request, endpoints).getSeller())?.name).toBe("Acme");
  });

  it("returns null rather than throwing when the actor resolves to no Seller", async () => {
    const { request } = requestSpy([]);

    expect(await createCreatorClient(request, endpoints).getSeller()).toBeNull();
  });

  it("omits simulateProviderCallback entirely when the host declares no endpoint for it", () => {
    const { request } = requestSpy();

    expect(createCreatorClient(request, endpoints).simulateProviderCallback).toBeUndefined();
    expect(
      createCreatorClient(request, {
        ...endpoints,
        simulateProviderCallback: (id: string) => `/x/${id}/simulate-provider-callback`,
      }).simulateProviderCallback,
    ).toBeTypeOf("function");
  });

  it("fails loudly rather than truncating when pagination does not advance", async () => {
    const request: CreatorRequest = (async () => ({
      status: 200,
      data: { data: [LISTING], total: 99, offset: 0 },
    })) as CreatorRequest;

    await expect(createCreatorClient(request, endpoints).getListings()).rejects.toThrow(
      /did not advance/,
    );
  });
});
