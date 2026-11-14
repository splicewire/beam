// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

// B12-4: this package's vitest config leaves globals off, so RTL's automatic cleanup is not installed; unmount each
// render here, or later cases see earlier forms.
afterEach(() => {
  cleanup();
});

vi.mock("@inertiajs/react", () => ({
  Form: ({
    children,
  }: {
    children: (state: {
      errors: Record<string, string>;
      processing: boolean;
    }) => ReactNode;
  }) => (
    <form data-testid="profile-form">
      {children({ errors: {}, processing: false })}
    </form>
  ),
  Head: () => null,
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  usePage: () => ({
    props: {
      auth: {
        user: {
          name: "Ana",
          email: "ana@example.test",
          email_verified_at: "2026-01-01T00:00:00Z",
        },
      },
    },
  }),
}));
vi.mock("../../config", () => ({ featureEnabled: () => false }));
vi.mock("../../components/delete-user", () => ({ default: () => null }));

import Profile, { languageName } from "./profile";

/*
 * localization 36: a person chooses their language. The picker submits `preferredLocale` with the existing profile
 * form; "Automatic" (empty) clears the saved choice; each language is named in itself.
 */

function renderProfile(
  preferredLocale: string | null,
  supportedLocales: string[]
) {
  render(
    <Profile
      entry={null}
      mustVerifyEmail={false}
      status={null}
      preferredLocale={preferredLocale}
      supportedLocales={supportedLocales}
    />
  );

  return new FormData(screen.getByTestId<HTMLFormElement>("profile-form"));
}

it("submits the saved language with the profile form, under the camel wire key", () => {
  const body = renderProfile("es", ["en", "es"]);

  expect(body.get("preferredLocale")).toBe("es");
  expect(body.has("preferred_locale")).toBe(false);
});

it("offers Automatic first, which submits empty to clear the choice", () => {
  const body = renderProfile(null, ["en", "es"]);
  const options = [
    ...screen.getByLabelText<HTMLSelectElement>("Language").options,
  ];

  expect(body.get("preferredLocale")).toBe("");
  expect(options.map((o) => o.value)).toEqual(["", "en", "es"]);
  expect(options[0].textContent).toBe("Automatic");
  expect(options[2].getAttribute("lang")).toBe("es");
});

it("shows no picker when the host supports no language choice", () => {
  const body = renderProfile(null, []);

  expect(screen.queryByLabelText("Language")).toBeNull();
  expect(body.has("preferredLocale")).toBe(false);
});

it("names each language in itself, and falls back to its tag", () => {
  expect(languageName("es")).toBe("español");
  expect(languageName("de")).toBe("Deutsch");
  expect(languageName("not a tag!")).toBe("not a tag!");
});
