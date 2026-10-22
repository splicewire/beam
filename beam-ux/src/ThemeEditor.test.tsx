import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeEditor } from "./ThemeEditor";
import { UxBuilderProvider } from "./provider";
import { entryIds, themeEntryBody } from "./story-fixtures";
import type { BeamUxEntryBodyData, UxBuilderClient } from "./types";

/**
 * G2-BEAM-THEME-NAV. The theme entry had no editor seat at all: editing a token meant hand-editing a
 * host seeder and reseeding. {@link ThemeEditor} is that seat — a COMPOSITION over the package's own
 * parts, so what these cases pin is the WIRING (the id it loads by, the schema it renders, the body it
 * commits), never a widget this file re-implements.
 *
 * The third case is the one worth reading twice. The server hands the form a schema describing
 * `{canvas, site}` while the body carries `{canvas, shell, site}` (`EntryBodyEnvelope::schemaFor()`
 * omits `shell` deliberately), so a save that wrote back only what the form rendered would reset every
 * OS-shell token to its package default — silently, since nothing on screen ever showed that
 * namespace. The case asserts the OUTCOME: a theme save preserves the namespace the form never drew.
 *
 * ⚠️ **It does not isolate the component's own merge, and does not pretend to.** Measured 2026-09-12:
 * `@rjsf`'s `omitExtraData` defaults to `false`, so `formData` already carries `shell` through, and
 * this case passes against a `ThemeEditor` whose `onChange` is a bare `setDraft(next)` (run that way
 * to check). It is a regression pin on the round trip — it would fail the day `FormEditor` gained
 * `omitExtraData: true` or the buffer stopped being seeded from the loaded body — not evidence that
 * the merge line is what carries it today.
 */

function mount(client: Partial<UxBuilderClient>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const full = {
    loadBody: vi.fn(),
    saveBody: vi.fn(),
    ...client,
  } as UxBuilderClient;

  render(
    <QueryClientProvider client={queryClient}>
      <UxBuilderProvider services={{ client: full, notify: () => {} }}>
        <ThemeEditor entryId={entryIds.theme} />
      </UxBuilderProvider>
    </QueryClientProvider>,
  );

  return full;
}

const themeState = {
  id: entryIds.theme,
  headVersion: "v1",
  publishedVersion: "v1",
  headReadable: "v1",
  publishedReadable: "v1",
  draftPending: false,
  versions: [],
  compileError: null,
};
const loadsTheTheme = () => ({
  listVersions: vi.fn(async () => themeState),
  saveDraft: vi.fn(
    async (
      _id: string,
      _body: Record<string, unknown>,
      _base: string | null,
    ) => ({ ...themeState, headVersion: "v2", draftPending: true }),
  ),
  loadBody: vi.fn(async () => themeEntryBody as BeamUxEntryBodyData),
  saveBody: vi.fn(async (_id: string, body: Record<string, unknown>) => ({
    ...themeEntryBody,
    body,
  })),
});

describe("the theme entry gets Frame’s form, addressed by entry id", () => {
  it("waits for the independent version base before enabling Save", async () => {
    let ready: (state: typeof themeState) => void = () => {};
    const client = loadsTheTheme();
    client.listVersions = vi.fn(
      () =>
        new Promise<typeof themeState>((resolve) => {
          ready = resolve;
        }),
    );
    mount(client);
    await screen.findByText("Site theme");
    const save = screen.getByRole("button", { name: "Save draft" });
    expect(save.hasAttribute("disabled")).toBe(true);
    expect(client.saveDraft).not.toHaveBeenCalled();
    await act(async () => ready(themeState));
    await waitFor(() => expect(save.hasAttribute("disabled")).toBe(false));
  });

  it("loads the body through the injected client, by the id it was given", async () => {
    const client = loadsTheTheme();
    mount(client);

    await screen.findByText("Theme tokens");
    expect(client.loadBody).toHaveBeenCalledWith(entryIds.theme);
  });

  it("renders the fields the SERVER’s schema declares, not a hand-written token list", async () => {
    mount(loadsTheTheme());

    // The two namespaces `schemaFor()` answers with, as the real SchemaForm renders them.
    expect(await screen.findByText("Canvas theme")).toBeTruthy();
    expect(screen.getByText("Site theme")).toBeTruthy();
    // `shell` is in the BODY but not in the schema, so it must render no fieldset at all — a
    // heading here would mean the form had invented one.
    expect(screen.queryByText("Shell theme")).toBeNull();
  });

  it("commits the un-schema’d `shell` namespace back untouched, alongside the edit", async () => {
    const client = loadsTheTheme();
    mount(client);

    await screen.findByText("Site theme");

    // Edit one real token through the rendered form — `site.accentHover`, a field the schema
    // declares and the public site's `.btn-primary:hover` actually reads.
    // `format: 'color'` renders a native `<input type="color">`, which is not typeable — a
    // `change` event carrying the swatch's new value is what a real picker fires.
    const field = screen.getByLabelText("Accent hover") as HTMLInputElement;
    expect(field.type).toBe("color");
    fireEvent.change(field, { target: { value: "#b91c1c" } });

    await userEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(client.saveDraft).toHaveBeenCalled());
    const [id, body] = client.saveDraft.mock.calls[0];
    expect(id).toBe(entryIds.theme);
    // The edit landed …
    expect((body.site as Record<string, string>).accentHover).toBe("#b91c1c");
    // … the rest of its own namespace survived …
    expect((body.site as Record<string, string>).accent).toBe("#0f172a");
    // … and so did the whole namespace the form never showed.
    expect(body.shell).toEqual(themeEntryBody.body.shell);
  });

  it("says the read is in flight rather than rendering an empty form", () => {
    mount({
      loadBody: vi.fn(() => new Promise<BeamUxEntryBodyData>(() => {})),
    });

    expect(screen.getByRole("status").textContent).toContain(
      "Loading the theme",
    );
    expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull();
  });

  it("says the read FAILED rather than rendering an authored-looking blank form", async () => {
    mount({
      loadBody: vi.fn(async () => {
        throw new Error("load 403");
      }),
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("could not be loaded");
    expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull();
  });
});

describe("direct Release publication", () => {
  it.each([false, true])(
    "publishes the saved ref through server admission, review=%s",
    async (reviewRequired) => {
      const calls: string[] = [];
      const release = {
        id: "r1",
        title: "Publish Theme",
        realm: "site",
        status: reviewRequired ? "in_review" : "published",
        reviewedBy: null,
        members: [],
        workflow: null,
        canSchedule: false,
        reviewRequired,
      };
      const client = {
        ...loadsTheTheme(),
        saveDraft: vi.fn(async () => {
          calls.push("draft");
          return { ...themeState, headVersion: "v2", draftPending: true };
        }),
        publish: vi.fn(async (_id: string, ref: string) => {
          calls.push("publish");
          expect(ref).toBe("v2");
          return { ...themeState, release };
        }),
      };
      mount(client);
      await screen.findByText("Site theme");
      fireEvent.change(screen.getAllByLabelText("Accent")[1], {
        target: { value: "#7c3aed" },
      });
      await userEvent.click(screen.getByRole("button", { name: "Publish" }));
      await waitFor(() => expect(calls).toEqual(["draft", "publish"]));
      expect(client.saveBody).not.toHaveBeenCalled();
      await screen.findByText(
        reviewRequired
          ? "Theme Release submitted for review."
          : "Theme published.",
      );
    },
  );
  it("shows a publish refusal without save-body fallback", async () => {
    const client = {
      ...loadsTheTheme(),
      publish: vi.fn(async () => {
        throw new Error("Permission revoked");
      }),
    };
    mount(client);
    await screen.findByText("Site theme");
    await userEvent.click(screen.getByRole("button", { name: "Publish" }));
    await screen.findByText("Permission revoked");
    expect(client.saveBody).not.toHaveBeenCalled();
  });
});

describe("responsive tokens and Release assembly survive integration", () => {
  it("saves a theme as a draft against its base and can join the returned version to a Release", async () => {
    const state = {
      id: entryIds.theme,
      headVersion: "v2",
      publishedVersion: "v1",
      headReadable: "v2",
      publishedReadable: "v1",
      draftPending: true,
      versions: [],
      compileError: null,
    };
    const saveDraft = vi.fn(async () => state);
    const releaseCommand = vi.fn(async () => ({}) as never);
    const client = {
      ...loadsTheTheme(),
      listVersions: vi.fn(async () => ({
        ...state,
        headVersion: "v1",
        draftPending: false,
      })),
      saveDraft,
      listReleases: vi.fn(async () => [
        {
          id: "launch",
          title: "Launch",
          realm: "site",
          status: "draft",
          reviewedBy: null,
          members: [],
          workflow: null,
          canSchedule: false,
          reviewRequired: false,
        },
      ]),
      releaseCommand,
    };
    mount(client);
    await screen.findByText("Site theme");
    await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(saveDraft).toHaveBeenCalledWith(
        entryIds.theme,
        expect.any(Object),
        "v1",
      ),
    );
    expect(client.saveBody).not.toHaveBeenCalled();
    fireEvent.change(await screen.findByLabelText("Release"), {
      target: { value: "launch" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Add saved theme to Release" }),
    );
    await waitFor(() =>
      expect(releaseCommand).toHaveBeenCalledWith("launch", {
        action: "member",
        entryId: entryIds.theme,
        ref: "v2",
      }),
    );
  });
  it("edits a responsive token without changing base tokens or another breakpoint", async () => {
    const original: Record<string, unknown> = {
      ...themeEntryBody.body,
      responsive: {
        breakpoints: { md: "52rem" },
        tokens: { lg: { site: { accentHover: "#123456" } } },
      },
    };
    const client = loadsTheTheme();
    client.loadBody = vi.fn(
      async () =>
        ({ ...themeEntryBody, body: original }) as BeamUxEntryBodyData,
    );
    mount(client);
    await screen.findByText("Site theme");
    fireEvent.change(screen.getByLabelText("Token breakpoint"), {
      target: { value: "md" },
    });
    fireEvent.change(screen.getByLabelText("Accent hover"), {
      target: { value: "#b91c1c" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(client.saveDraft).toHaveBeenCalled());
    const body = client.saveDraft.mock.calls[0][1];
    expect(body.site).toEqual(original.site);
    expect(body.shell).toEqual(original.shell);
    expect(body.responsive).toMatchObject({
      breakpoints: { md: "52rem" },
      tokens: {
        md: { site: { accentHover: "#b91c1c" } },
        lg: { site: { accentHover: "#123456" } },
      },
    });
  });
});
