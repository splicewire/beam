// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";

const observed = vi.hoisted(() => ({
  resetOnSuccess: new Map<string, string[]>(),
}));

vi.mock("@inertiajs/react", () => ({
  Form: ({
    action,
    children,
    resetOnSuccess,
  }: {
    action: string;
    children: (state: {
      errors: Record<string, string>;
      processing: boolean;
    }) => ReactNode;
    resetOnSuccess: string[];
  }) => {
    observed.resetOnSuccess.set(action, resetOnSuccess);

    return (
      <form data-testid={action}>
        {children({ errors: {}, processing: false })}
      </form>
    );
  },
  Link: ({ children, ...props }: { children: ReactNode; href: string }) => (
    <a {...props}>{children}</a>
  ),
  usePage: () => ({
    props: {
      email: "ada@example.test",
      passwordRules: "min:12",
      token: "token",
    },
  }),
}));

import Register from "./register";
import ResetPassword from "./reset-password";

beforeEach(() => observed.resetOnSuccess.clear());

it("submits the registration confirmation with the camel wire key", () => {
  render(<Register />);

  const body = new FormData(screen.getByTestId<HTMLFormElement>("/register"));
  expect([...body.keys()]).toEqual([
    "name",
    "email",
    "password",
    "passwordConfirmation",
  ]);
  expect(body.has("password_confirmation")).toBe(false);
  expect(observed.resetOnSuccess.get("/register")).toEqual([
    "password",
    "passwordConfirmation",
  ]);
});

it("submits the reset confirmation with the camel wire key", () => {
  render(<ResetPassword />);

  const body = new FormData(
    screen.getByTestId<HTMLFormElement>("/reset-password")
  );
  expect([...body.keys()]).toEqual([
    "email",
    "password",
    "passwordConfirmation",
  ]);
  expect(body.has("password_confirmation")).toBe(false);
  expect(observed.resetOnSuccess.get("/reset-password")).toEqual([
    "password",
    "passwordConfirmation",
  ]);
});
