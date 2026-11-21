import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  ReleasePanel,
  type ReleaseRecord,
  type ReleaseConfigChange,
  type ReleaseConfigKeyChange,
} from "./releases";
import { RELEASE_KIND_CONFIG } from "./config/edit";
import { entryMember } from "./release-member.fixtures";

const release: ReleaseRecord = {
  id: "r1",
  title: "Launch",
  realm: "site",
  status: "draft",
  reviewedBy: null,
  members: [],
  workflow: {
    available: ["submit", "publish"],
    transitions: [],
    places: [],
    marking: ["draft"],
  } as unknown as ReleaseRecord["workflow"],
  canSchedule: false,
  reviewRequired: true,
};
const entries = [
  {
    id: "page",
    title: "Page",
    versions: [
      { id: "v1", label: "Version one" },
      { id: "v2", label: "Version two" },
    ],
    canTakeDown: true,
  },
];

describe("Release assembly", () => {
  it("sends the chosen saved version, not an implicit working head", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel release={release} entries={entries} onCommand={command} />,
    );
    fireEvent.change(screen.getByLabelText("Entry"), {
      target: { value: "page" },
    });
    fireEvent.change(screen.getByLabelText("Saved version"), {
      target: { value: "v1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to Release" }));
    await waitFor(() =>
      expect(command).toHaveBeenCalledWith({
        action: "member",
        entryId: "page",
        ref: "v1",
        redirectTarget: null,
      }),
    );
    expect(screen.queryByRole("button", { name: "Publish now" })).toBeNull();
    expect(
      screen.queryByRole("form", { name: "Schedule workflow transition" }),
    ).toBeNull();
  });
  it("offers explicit rebase and drop for a moved pin and blocks publish", () => {
    const command = vi.fn();
    render(
      <ReleasePanel
        release={{
          ...release,
          status: "approved",
          workflow: { ...release.workflow!, available: ["publish"] },
          members: [
            entryMember({
              entryId: "page",
              versionId: "v1",
              observedPin: "old",
              stale: true,
            }),
          ],
        }}
        entries={entries}
        onCommand={command}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Publish now" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Rebase onto theirs" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Drop the entry" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Drop the entry" }));
    expect(command).toHaveBeenCalledWith({ action: "drop", entryId: "page" });
  });
  it("keeps a failed admission visible and never reports success", async () => {
    render(
      <ReleasePanel
        release={release}
        entries={entries}
        onCommand={async () => {
          throw new Error("Review required");
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Request review" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Review required",
    );
  });
  it("uses the existing workflow scheduling form only when calendars is available", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{
          ...release,
          status: "approved",
          canSchedule: true,
          workflow: {
            ...release.workflow!,
            available: ["publish"],
            transitions: [{ name: "publish" }] as NonNullable<
              ReleaseRecord["workflow"]
            >["transitions"],
          },
        }}
        entries={entries}
        onCommand={command}
      />,
    );
    fireEvent.change(screen.getByLabelText("Date and time"), {
      target: { value: "2030-01-15T12:30" },
    });
    fireEvent.change(screen.getByLabelText("Timezone"), {
      target: { value: "UTC" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Schedule transition" }),
    );
    await waitFor(() =>
      expect(command).toHaveBeenCalledWith({
        action: "schedule",
        dueAt: "2030-01-15T12:30:00.000Z",
        timezone: "UTC",
      }),
    );
  });
});

describe("Preview from the Release (ADR-0232 d8, d15; EP-18)", () => {
  it("opens a tenant Preview through the injected capability exchange", async () => {
    const command = vi.fn(async () => undefined);
    const onPreviewOpen = vi.fn(async () => "https://acme.site.example.test/_beam/preview/tenant-open/r1?signature=opaque");
    const popup = { opener: window, location: { replace: vi.fn() }, close: vi.fn() };
    const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    render(
      <ReleasePanel release={release} entries={entries} onCommand={command} onPreviewOpen={onPreviewOpen} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(popup.location.replace).toHaveBeenCalledWith(expect.stringContaining("acme.site.example.test")));
    expect(onPreviewOpen).toHaveBeenCalledOnce();
    expect(popup.opener).toBeNull();
    open.mockRestore();
  });

  it("opens the Release's Preview and turns its Preview Links on", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{ ...release, previewHref: "/_beam/preview/open/r1", previewLinksEnabled: false, canManagePreviewLinks: true }}
        entries={entries}
        onCommand={command}
      />,
    );

    expect(screen.getByRole("link", { name: "Preview" }).getAttribute("href")).toBe("/_beam/preview/open/r1");
    fireEvent.click(screen.getByRole("button", { name: "Turn on Preview Links" }));
    await waitFor(() => expect(command).toHaveBeenCalledWith({ action: "links-on" }));
  });

  it("offers the link to copy, rotate or turn off", async () => {
    const link = "https://site.test/_beam/preview/release/r1?expires=1&signature=a";
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{ ...release, previewLinksEnabled: true, previewLink: link, canManagePreviewLinks: true }}
        entries={entries}
        onCommand={command}
      />,
    );

    expect((screen.getByLabelText("Preview Link") as HTMLInputElement).value).toBe(link);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(link);
    fireEvent.click(screen.getByRole("button", { name: "Rotate links" }));
    await waitFor(() => expect(command).toHaveBeenCalledWith({ action: "rotate-links" }));
    fireEvent.click(screen.getByRole("button", { name: "Turn links off" }));
    await waitFor(() => expect(command).toHaveBeenCalledWith({ action: "links-off" }));
  });

  it("shows no link controls to a reader who can't edit every member (review of 3d7565ec)", () => {
    const { rerender } = render(
      <ReleasePanel
        release={{ ...release, previewLinksEnabled: false, canManagePreviewLinks: false }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Turn on Preview Links" })).toBeNull();

    rerender(
      <ReleasePanel
        release={{ ...release, previewLinksEnabled: true, previewLink: null, canManagePreviewLinks: false }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("Preview Links are on.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Rotate links" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Turn links off" })).toBeNull();
  });

  it("has no Preview or links on a published Release", () => {
    render(
      <ReleasePanel
        release={{ ...release, status: "published", previewHref: null, previewLinksEnabled: false }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: "Preview" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Turn on Preview Links" })).toBeNull();
  });
});

describe("A Release's Redirects", () => {
  // ux-0236 d2 (EP-31 slice 5): the Release page lists the Redirects it leaves: those it would leave while open, and
  // those it left once published, where an unwanted one is removed from the list.
  it("lists the Redirects it would leave while open, with nothing to remove yet", () => {
    render(
      <ReleasePanel
        release={{ ...release, redirects: [
          { id: null, path: "/about", match: "exact", to: "/company", origin: "release" },
          { id: null, path: "/legacy", match: "exact", to: "/pricing", origin: "takedown" },
        ] }}
        entries={entries}
        onCommand={vi.fn()}
        onRemoveRedirect={vi.fn()}
      />,
    );
    const list = screen.getByRole("region", { name: "Redirects this Release leaves" });
    expect(Array.from(list.querySelectorAll("li")).map((item) => item.textContent)).toEqual([
      "/about → /company",
      "/legacy → /pricing (taken down)",
    ]);
    expect(screen.queryByRole("button", { name: /^Remove/ })).toBeNull();
  });

  it("removes one it left, once published", async () => {
    const remove = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{ ...release, status: "published", redirects: [
          { id: "rd1", path: "/about", match: "exact", to: "/company", origin: "release" },
          { id: "rd2", path: "/blog", match: "prefix", to: "/posts", origin: "release" },
        ] }}
        entries={entries}
        onCommand={vi.fn()}
        onRemoveRedirect={remove}
      />,
    );
    expect(screen.getByText("/blog and below → /posts")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove the Redirect from /about" }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith("rd1"));
    await waitFor(() => expect(screen.queryByText("/about → /company")).toBeNull());
    expect(screen.getByText("/blog and below → /posts")).toBeTruthy();
  });
});

describe("Config members in the Release panel (ticket 11)", () => {
  const configMember = (
    over: Partial<ReleaseRecord["members"][number]> = {},
  ): ReleaseRecord["members"][number] => ({
    entryId: null,
    versionId: "cv2",
    observedPin: "cv1",
    redirectTarget: null,
    stale: false,
    kind: RELEASE_KIND_CONFIG,
    ref: "beam.ux",
    label: "Beam UX",
    entryType: null,
    ...over,
  });
  const configKey = (
    over: Partial<ReleaseConfigKeyChange> = {},
  ): ReleaseConfigKeyChange => ({
    pointer: "/heading",
    op: "set",
    published: "Old heading",
    publishedSet: true,
    after: "New heading",
    setBy: "operator",
    applies: "live",
    secret: false,
    secretChange: null,
    ...over,
  });
  const configChange = (
    over: Partial<ReleaseConfigChange> = {},
  ): ReleaseConfigChange => ({
    readable: true,
    root: "beam.ux",
    title: "Beam UX",
    package: "splicewire/laravel-beam-ux",
    fromVersion: 1,
    toVersion: 2,
    reloadsWorkers: false,
    keys: [configKey()],
    mirrorPath: null,
    mirror: null,
    ...over,
  });

  it("keeps its config member kind in step with the Config area", () => {
    // A drift tripwire: the panel groups on the literal "config-override"; the Config area owns the constant.
    expect(RELEASE_KIND_CONFIG).toBe("config-override");
  });

  it("groups a config member apart from entries and shows its key diff", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [
          entryMember({ entryId: "page", versionId: "v1" }),
          configMember(),
        ] }}
        entries={entries}
        changes={{ config: [configChange()] }}
        onCommand={vi.fn()}
      />,
    );
    const group = screen.getByRole("region", { name: "Config" });
    // The config member lives in the Config group, not the entry list; its key diff and columns render.
    expect(group.querySelector('[data-config-member="beam.ux"]')).toBeTruthy();
    expect(screen.getByText("Key")).toBeTruthy();
    expect(screen.getByText("After publishing")).toBeTruthy();
    expect(screen.getByText("Old heading")).toBeTruthy();
    expect(screen.getByText("New heading")).toBeTruthy();
    // The entry still renders in the entry list, outside the Config group.
    expect(group.textContent).not.toContain("Page:");
  });

  it("groups a mixed Release into Page / Theme / Other / Config by entry type and kind", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [
          entryMember({ entryId: "home", entryType: "page" }),
          entryMember({ entryId: "brand", entryType: "theme" }),
          entryMember({ entryId: "hero", entryType: "component" }),
          configMember(),
        ] }}
        entries={[
          { id: "home", title: "Home", versions: [] },
          { id: "brand", title: "Brand", versions: [] },
          { id: "hero", title: "Hero", versions: [] },
        ]}
        changes={{ config: [configChange()] }}
        onCommand={vi.fn()}
      />,
    );
    const page = screen.getByRole("region", { name: "Page" });
    const theme = screen.getByRole("region", { name: "Theme" });
    const other = screen.getByRole("region", { name: "Other" });
    const config = screen.getByRole("region", { name: "Config" });
    expect(page.textContent).toContain("Home");
    expect(theme.textContent).toContain("Brand");
    expect(other.textContent).toContain("Hero"); // a component is neither page nor theme
    expect(config.querySelector('[data-config-member="beam.ux"]')).toBeTruthy();
    expect(page.textContent).not.toContain("Hero");
    expect(page.textContent).not.toContain("Brand");
  });

  it("groups an entry whose entry row is gone (entryType null) under Other, never Config", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [
          entryMember({ entryId: "ghost", entryType: null }),
          configMember(),
        ] }}
        entries={entries}
        changes={{ config: [configChange()] }}
        onCommand={vi.fn()}
      />,
    );
    const other = screen.getByRole("region", { name: "Other" });
    const config = screen.getByRole("region", { name: "Config" });
    // An entry of unknown type is still an entry: Other, decided by kind !== "config-override".
    expect(other.textContent).toContain("ghost");
    expect(config.textContent).not.toContain("ghost");
    expect(config.querySelector('[data-config-member="beam.ux"]')).toBeTruthy();
    // No page or theme members ⇒ no such groups.
    expect(screen.queryByRole("region", { name: "Page" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Theme" })).toBeNull();
  });

  it("shows reloads workers and masks a secret to its change word (removed), never a value", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            reloadsWorkers: true,
            keys: [
              configKey({
                pointer: "/api_token",
                op: null,
                published: null,
                after: null,
                secret: true,
                secretChange: "removed",
                applies: "reload",
                setBy: "host",
              }),
            ],
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("reloads workers")).toBeTruthy();
    const row = screen.getByText("/api_token").closest("tr") as HTMLElement;
    expect(row.textContent).toContain("removed");
    // No value leaks for a secret row.
    expect(row.textContent).not.toContain("api_token_value");
  });

  it("shows a dropped override's fallback value and the tier that now sets it", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            keys: [
              configKey({
                op: null,
                published: "Operator heading",
                after: "Package heading",
                setBy: "package",
              }),
            ],
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    const row = screen.getByText("/heading").closest("tr") as HTMLElement;
    expect(row.textContent).toContain("Package heading");
    expect(row.textContent).toContain("override dropped");
    expect(row.querySelector('[data-config-tier="package"]')).toBeTruthy();
  });

  it("renders only the no-read note for an unreadable section", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange({ readable: false, reloadsWorkers: false, keys: [], mirror: null })] }}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("You can't read this section's values.")).toBeTruthy();
    expect(screen.queryByText("After publishing")).toBeNull();
  });

  it("records database history only for a tenant Release", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "tenant", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange({ mirrorPath: null, mirror: null })] }}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("What publishing records")).toBeTruthy();
    expect(screen.getByText(/write no files and make no commit/)).toBeTruthy();
    expect(screen.queryByText("Config files in this commit")).toBeNull();
  });

  // Strict mirror parser (r6, CONTRACT-11 §2b): the mirror is the ONE document {$schema, root, version, overrides:[…]}.
  const wrap = (overrides: unknown[], version: number | null = 2) =>
    JSON.stringify({ $schema: "beam-config-section:beam.ux", root: "beam.ux", version, overrides });
  const secretKey = (pointer: string) =>
    configKey({ pointer, secret: true, published: null, after: null, secretChange: "replaced" });
  const renderWithMirror = (mirror: string, keys: ReleaseConfigKeyChange[] = []) =>
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange({ mirrorPath: "config/overrides/beam.ux.json", mirror, keys })] }}
        onCommand={vi.fn()}
      />,
    );
  const renderDoc = (overrides: unknown[], keys: ReleaseConfigKeyChange[] = []) => renderWithMirror(wrap(overrides), keys);
  const previewed = (c: HTMLElement) => c.querySelector("pre") !== null; // a <pre> means the mirror WAS previewed (not path-only)

  it("previews a well-formed mirror and shows a public value", () => {
    const { container } = renderDoc([{ pointer: "/heading", op: "set", value: "Welcome-Public" }]);
    expect(previewed(container)).toBe(true);
    expect(container.innerHTML).toContain("Welcome-Public");
    expect(screen.getByText("config/overrides/beam.ux.json")).toBeTruthy();
  });

  it("previews the contract's section 2b worked example verbatim", () => {
    const { container } = renderWithMirror(
      JSON.stringify({
        $schema: "beam-config-section:release-later",
        root: "release-later",
        version: 2,
        overrides: [
          { pointer: "/relay", op: "set", value: { host: "relay.op.test" }, inherit: ["/token"] },
          { pointer: "/relay/token", op: "set", secret: true },
        ],
      }),
    );
    expect(previewed(container)).toBe(true);
    expect(container.innerHTML).toContain("relay.op.test");
  });

  it("previews a document with a plain row, a null row, an inherit parent and two markers", () => {
    const { container } = renderWithMirror(
      wrap([
        { pointer: "/heading", op: "set", value: "Public-Heading" },
        { pointer: "/removed", op: "null" },
        { pointer: "/relay", op: "set", value: { host: "relay.host.test" }, inherit: ["/token", "/password"] },
        { pointer: "/relay/token", op: "set", secret: true },
        { pointer: "/relay/password", op: "set", secret: true },
      ]),
    );
    expect(previewed(container)).toBe(true);
    expect(container.innerHTML).toContain("Public-Heading");
    expect(container.innerHTML).toContain("relay.host.test");
  });

  // The key table (NOT the mirror) still MASKS: a secret leaf nested in a key's published / after value is dropped.
  it("drops a secret leaf nested in a key's published value (key-table defence)", () => {
    const { container } = render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            mirrorPath: null,
            mirror: null,
            keys: [
              configKey({ pointer: "/relay", secret: false, publishedSet: true, published: { host: "ok-kt", token: "FAKE-KEYTABLE-SECRET" }, after: null }),
              secretKey("/relay/token"),
            ],
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    expect(container.innerHTML).not.toContain("FAKE-KEYTABLE-SECRET");
    expect(container.innerHTML).toContain("ok-kt");
  });

  // Fail-closed refusals: anything outside §2b is named by path only, never previewed.
  it.each([
    ["a map form keyed by a pointer", '{"/token":"FAKE-MAP-SECRET"}'],
    ["a map form under a metadata key", '{"set":{"token":"FAKE-MAP2-SECRET"}}'],
    ["overrides that is not an array", '{"$schema":"s","root":"beam.ux","version":1,"overrides":"FAKE-OVERRIDES"}'],
    ["an extra root key", '{"$schema":"s","root":"beam.ux","version":1,"overrides":[],"extra":"FAKE-EXTRA-KEY"}'],
    ["a scalar root", '"FAKE-SCALAR-ROOT"'],
    ["malformed JSON", "{ this is not valid json FAKE-MALFORMED"],
  ])("refuses %s (path only, no preview)", (_label, mirror) => {
    const { container } = renderWithMirror(mirror);
    expect(previewed(container)).toBe(false);
    expect(container.innerHTML).not.toMatch(/FAKE-[A-Z0-9-]+/);
    expect(screen.getByText("config/overrides/beam.ux.json")).toBeTruthy();
  });

  it.each<[string, unknown[], ReleaseConfigKeyChange[]]>([
    // finding 1: `secret` is checked, not coerced — only exactly true is a marker; anything else refuses.
    ["secret: 0", [{ pointer: "/token", op: "set", secret: 0, value: "FAKE-SEC0" }], []],
    ["secret: empty string", [{ pointer: "/token", op: "set", secret: "", value: "FAKE-SECEMPTY" }], []],
    ["secret: null", [{ pointer: "/token", op: "set", secret: null, value: "FAKE-SECNULL" }], []],
    ['secret: "true"', [{ pointer: "/token", op: "set", secret: "true", value: "FAKE-SECSTR" }], []],
    ["secret: false", [{ pointer: "/token", op: "set", secret: false, value: "FAKE-SECFALSE" }], []],
    // finding 2: a marker masks only itself — a sibling/child value, or a mis-named inherit, must refuse.
    ["a value under a marker's pointer, no key row", [{ pointer: "/relay", op: "set", value: { token: "FAKE-FINDING2" } }, { pointer: "/relay/token", op: "set", secret: true }], []],
    ["a child row below a marker, no key row", [{ pointer: "/relay", op: "set", secret: true }, { pointer: "/relay/token", op: "set", value: "FAKE-CHILD" }], []],
    ["a value holding a key its own inherit names", [{ pointer: "/relay", op: "set", value: { token: "FAKE-OWN-INHERIT" }, inherit: ["/token"] }], []],
    // secret / inherited leaves detected through the walk (change.keys side)
    ["a secret leaf nested in a parent value", [{ pointer: "/relay", op: "set", value: { host: "h", token: "FAKE-NESTED" } }], [secretKey("/relay/token")]],
    ["an array element under a secret pointer", [{ pointer: "/hosts", op: "set", value: ["a", "FAKE-ARRAY", "c"] }], [secretKey("/hosts/1")]],
    ["a secret leaf behind an escaped segment", [{ pointer: "/parent", op: "set", value: { "a/b": "FAKE-ESCAPED" } }], [secretKey("/parent/a~1b")]],
    ["any value when the empty pointer is secret (root)", [{ pointer: "/token", op: "set", value: "FAKE-ROOT" }], [secretKey("")]],
    // finding 3: no normalising, no stripping — slashless / bad-escape pointers and duplicates refuse.
    ["a slashless row pointer", [{ pointer: "relay", op: "set", value: "FAKE-NOSLASH" }], []],
    ["a bad escape in the pointer", [{ pointer: "/a~2b", op: "set", value: "FAKE-BADESC" }], []],
    ["two rows with one pointer", [{ pointer: "/a", op: "set", value: "x" }, { pointer: "/a", op: "set", value: "FAKE-DUP" }], []],
    ["a marker row with a value", [{ pointer: "/token", op: "set", secret: true, value: "FAKE-MARKERVAL" }], []],
    ["a marker row with inherit", [{ pointer: "/token", op: "set", secret: true, inherit: ["/x"] }], []],
    ["an op:null row with a value", [{ pointer: "/token", op: "null", value: "FAKE-NULLVAL" }], []],
    ["a set row with no value", [{ pointer: "/token", op: "set" }], []],
    // inherit malformations
    ["an inherit item without a leading slash", [{ pointer: "/relay", op: "set", value: {}, inherit: ["token"] }], []],
    ["an empty inherit item", [{ pointer: "/relay", op: "set", value: {}, inherit: [""] }], []],
    ["an inherit item that is just a slash", [{ pointer: "/relay", op: "set", value: {}, inherit: ["/"] }], []],
    ["a duplicate inherit item", [{ pointer: "/relay", op: "set", value: {}, inherit: ["/token", "/token"] }], []],
    ["a non-string inherit item", [{ pointer: "/relay", op: "set", value: {}, inherit: [1] }], []],
    // unknown / wrong-type fields (as r6)
    ["an unknown row key", [{ pointer: "/a", op: "set", note: "FAKE-NOTE" }], []],
    ["a value under a non-grammar field", [{ pointer: "/relay", op: "set", old: { token: "FAKE-OLD" } }], []],
    ["a previous field", [{ pointer: "/token", op: "set", previous: "FAKE-PREV" }], []],
    ["a non-string pointer", [{ pointer: 7, op: "set", secret: true, value: "FAKE-BADPTR" }], []],
    ["no pointer at all", [{ op: "set", secret: true, value: "FAKE-NOPTR" }], []],
    ["an op outside set/null", [{ pointer: "/a", op: "unset", value: "FAKE-OP" }], []],
  ])("refuses a document with %s (path only)", (_label, overrides, keys) => {
    const { container } = renderDoc(overrides, keys);
    expect(previewed(container)).toBe(false);
    expect(container.innerHTML).not.toMatch(/FAKE-[A-Z0-9-]+/);
  });

  it("lists no config file for an operator Release that writes none (null mirrorPath)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange({ mirrorPath: null, mirror: null })] }}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.queryByText("Config files in this commit")).toBeNull();
  });

  it("drops a config member by kind and ref, and takes its current draft", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange()] }}
        onCommand={command}
      />,
    );
    // Each command awaits (the panel disables its buttons while pending), so let drop settle before taking the draft.
    fireEvent.click(screen.getByRole("button", { name: "Drop the section" }));
    await waitFor(() =>
      expect(command).toHaveBeenCalledWith({ action: "drop", kind: "config-override", ref: "beam.ux" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Take the current draft" }));
    await waitFor(() =>
      expect(command).toHaveBeenCalledWith({ action: "member", kind: "config-override", ref: "beam.ux" }),
    );
    // rebase / use-latest are entry-only: never offered on a config member.
    expect(screen.queryByRole("button", { name: "Rebase onto theirs" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Use latest saved version" })).toBeNull();
  });

  it("never renders a secret's old or new value, only its change word (S1)", () => {
    const { container } = render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            keys: [
              configKey({
                pointer: "/stripe_secret",
                secret: true,
                published: "FAKE-OLD-SECRET-VALUE",
                after: "FAKE-NEW-SECRET-VALUE",
                secretChange: "replaced",
              }),
            ],
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    // Neither value reaches the DOM (innerHTML also covers attributes/titles); only the change word renders.
    expect(container.innerHTML).not.toContain("FAKE-OLD-SECRET-VALUE");
    expect(container.innerHTML).not.toContain("FAKE-NEW-SECRET-VALUE");
    expect(screen.getByText("replaced")).toBeTruthy();
  });

  it("shows a neutral dash for a secret with no change word (S1 nit)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange({ keys: [configKey({ secret: true, published: null, after: null, secretChange: null })] })] }}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.queryByText("replaced")).toBeNull();
    const cells = (screen.getByText("/heading").closest("tr") as HTMLElement).querySelectorAll("td");
    // The After-publishing cell (index 2) shows the neutral dash, not a defaulted "replaced".
    expect(cells[2].textContent?.trim()).toBe("—");
  });

  it("never previews the mirror of an unreadable section (S2)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            readable: false,
            keys: [],
            mirrorPath: "config/overrides/beam.ux.json",
            mirror: '{ "leaked": "should-never-show" }',
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    // The file is named by path, but a buggy server's mirror content is never rendered when unreadable.
    expect(screen.getByText("config/overrides/beam.ux.json")).toBeTruthy();
    expect(screen.queryByText(/should-never-show/)).toBeNull();
  });

  it("notes the secrets a central Release never writes to git (S5)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            mirrorPath: "config/overrides/beam.ux.json",
            mirror: '{}',
            keys: [
              configKey({ pointer: "/a", secret: true, published: null, after: null, secretChange: "replaced" }),
              configKey({ pointer: "/b", secret: true, published: null, after: null, secretChange: "removed" }),
            ],
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("2 secrets are stored encrypted and never written to a file or a commit.")).toBeTruthy();
  });

  it("lists each config section in a tenant Release's database-history block (S5)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "tenant", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange({ root: "beam.ux", toVersion: 3, keys: [configKey(), configKey({ pointer: "/sub" })] })] }}
        onCommand={vi.fn()}
      />,
    );
    const block = screen.getByRole("region", { name: "What publishing records" });
    expect(block.textContent).toContain("beam.ux");
    expect(block.textContent).toContain("v3");
    expect(block.textContent).toContain("2 keys");
  });

  it("reads a rollback's version move as removed, not v0 (nit)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [configChange({ fromVersion: 4, toVersion: null, mirrorPath: null, mirror: null })] }}
        onCommand={vi.fn()}
      />,
    );
    const card = document.querySelector('[data-config-member="beam.ux"]') as HTMLElement;
    expect(card.textContent).toContain("v4 → removed");
    expect(card.textContent).not.toContain("v0");
  });

  it("renders config members by label with no diff when no changes are passed (fallback)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );
    const card = document.querySelector('[data-config-member="beam.ux"]') as HTMLElement;
    expect(card.textContent).toContain("Beam UX");
    expect(screen.queryByText("After publishing")).toBeNull();
    // No operator file list without changes.
    expect(screen.queryByText("Config files in this commit")).toBeNull();
  });

  it("falls back to member.label for an entry with no matching entry choice (S6)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [
          entryMember({ entryId: "missing-entry", label: "Homepage", entryType: "page" }),
        ] }}
        entries={[]}
        onCommand={vi.fn()}
      />,
    );
    const page = screen.getByRole("region", { name: "Page" });
    expect(page.textContent).toContain("Homepage");
  });

  it("puts an unknown future kind with a null entryId under Other, with no entry controls", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [
          { entryId: null, versionId: null, observedPin: null, redirectTarget: null, stale: false, kind: "future", ref: "x1", label: "A future member", entryType: null },
        ] }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );
    const other = screen.getByRole("region", { name: "Other" });
    expect(other.textContent).toContain("A future member");
    // It is not Config (decided by kind === "config-override" alone), and it carries no entry controls.
    expect(screen.queryByRole("region", { name: "Config" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Rebase onto theirs" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Drop the entry" })).toBeNull();
  });

  it("renders an unknown applies and setBy as their raw strings without throwing", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            keys: [
              configKey({
                applies: "someday" as unknown as ReleaseConfigKeyChange["applies"],
                setBy: "future-tier" as unknown as ReleaseConfigKeyChange["setBy"],
              }),
            ],
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    const row = screen.getByText("/heading").closest("tr") as HTMLElement;
    expect(row.textContent).toContain("someday");
    expect(row.textContent).toContain("future-tier");
  });

  it("shows no 'Config files in this commit' heading when a central Release writes only secrets (nit)", () => {
    render(
      <ReleasePanel
        release={{ ...release, realm: "operator", members: [configMember()] }}
        entries={entries}
        changes={{ config: [
          configChange({
            mirrorPath: null,
            mirror: null,
            keys: [configKey({ secret: true, published: null, after: null, secretChange: "replaced" })],
          }),
        ] }}
        onCommand={vi.fn()}
      />,
    );
    // No files to commit, but the secrets note still reassures; the file-list heading must not appear over nothing.
    expect(screen.queryByText("Config files in this commit")).toBeNull();
    expect(screen.getByText("1 secret is stored encrypted and never written to a file or a commit.")).toBeTruthy();
  });
});
