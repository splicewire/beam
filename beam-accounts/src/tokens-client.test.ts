// @vitest-environment jsdom
import { createSessionRequest } from "@schemastud/frame/session";
import { describe, expect, it } from "vitest";
import { createTokensClient, type TokensEndpoints } from "./tokens-client";

/**
 * beam-accounts' tokens client (frame-foundation 51) over frame's published session request and the same fake
 * `fetch` frame's own adapter tests use (`frame/tests/session.test.ts`): every request is recorded, and each answer
 * is chosen by method and path, so a wrong URL or verb is a failed lookup rather than a silent pass.
 */
function fakeFetch(answers: Record<string, () => Response>) {
  const calls: Array<{ method: string; url: string; body: unknown }> = [];
  const fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const method = init.method ?? "GET";
    const url = String(input);
    calls.push({
      method,
      url,
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    });
    const answer = answers[`${method} ${url}`];
    if (!answer) throw new Error(`unexpected ${method} ${url}`);
    return answer();
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

/** As laravel-beam-accounts builds them from its routes, under a NON-default api_root. */
const endpoints: TokensEndpoints = {
  index: "/custom/root/tokens",
  permissions: "/custom/root/tokens/permissions",
  sessionsOthers: "/custom/root/tokens/sessions/others",
};

const token = {
  id: "tok 1",
  name: "CI",
  abilities: ["*"],
  lastUsedAt: null,
  expiresAt: null,
  archivedAt: null,
};
const created = { token, plainTextToken: "secret" };

describe("createTokensClient", () => {
  it("lists, mints, renews, rotates, archives and permanently deletes at the endpoints it is handed, unwrapping {data}", async () => {
    const { calls, fetch } = fakeFetch({
      "GET /custom/root/tokens": () => Response.json({ data: [token] }),
      "POST /custom/root/tokens": () =>
        Response.json({ data: created }, { status: 201 }),
      "POST /custom/root/tokens/tok%201/renew": () =>
        Response.json({ data: token }),
      "POST /custom/root/tokens/tok%201/rotate": () =>
        Response.json({ data: created }),
      "DELETE /custom/root/tokens/tok%201": () =>
        new Response(null, { status: 204 }),
      "DELETE /custom/root/tokens/tok%201/permanent": () =>
        new Response(null, { status: 204 }),
      "DELETE /custom/root/tokens/sessions/others": () =>
        Response.json({
          message: "Signed out 2 other sessions.",
          data: { revoked: 2 },
        }),
      "GET /custom/root/tokens/permissions": () =>
        Response.json({ data: { permissions: ["tokens.mint"] } }),
    });
    const client = createTokensClient(
      createSessionRequest({ fetch }),
      endpoints
    );

    expect(await client.list()).toEqual([token]);
    expect(
      await client.create({
        name: "CI",
        abilities: ["tokens.mint"],
        expiresInDays: 30,
      })
    ).toEqual(created);
    expect(await client.renew({ id: "tok 1", expiresInDays: 7 })).toEqual(
      token
    );
    expect(await client.rotate({ id: "tok 1" })).toEqual(created);
    await expect(client.archive("tok 1")).resolves.toBeUndefined();
    await expect(client.remove("tok 1")).resolves.toBeUndefined();
    expect(await client.revokeOtherSessions()).toEqual({
      message: "Signed out 2 other sessions.",
      revoked: 2,
    });
    expect(await client.listPermissions()).toEqual(["tokens.mint"]);

    expect(calls.map(({ method, url, body }) => [method, url, body])).toEqual([
      ["GET", "/custom/root/tokens", undefined],
      [
        "POST",
        "/custom/root/tokens",
        { name: "CI", abilities: ["tokens.mint"], expiresInDays: 30 },
      ],
      ["POST", "/custom/root/tokens/tok%201/renew", { expiresInDays: 7 }],
      ["POST", "/custom/root/tokens/tok%201/rotate", {}],
      ["DELETE", "/custom/root/tokens/tok%201", undefined],
      ["DELETE", "/custom/root/tokens/tok%201/permanent", undefined],
      ["DELETE", "/custom/root/tokens/sessions/others", undefined],
      ["GET", "/custom/root/tokens/permissions", undefined],
    ]);
  });

  it("omits an unscoped mint's abilities and a never-expiring expiry, and lists an empty answer as []", async () => {
    const { calls, fetch } = fakeFetch({
      "GET /custom/root/tokens": () => Response.json({ data: null }),
      "POST /custom/root/tokens": () =>
        Response.json({ data: created }, { status: 201 }),
    });
    const client = createTokensClient(
      createSessionRequest({ fetch }),
      endpoints
    );

    expect(await client.list()).toEqual([]);
    await client.create({ name: "Plain", abilities: [] });
    expect(calls[1].body).toEqual({ name: "Plain" });
  });

  it("rejects with the session request's FrameActionError: the server's message, status and field errors", async () => {
    const { fetch } = fakeFetch({
      "POST /custom/root/tokens": () =>
        Response.json(
          {
            message: "The name field is required.",
            errors: { name: ["Required."] },
          },
          { status: 422 }
        ),
    });
    const client = createTokensClient(
      createSessionRequest({ fetch }),
      endpoints
    );

    const error = await client.create({ name: "" }).catch((e: unknown) => e);
    expect(error).toMatchObject({
      status: 422,
      message: "The name field is required.",
      errors: { name: ["Required."] },
    });
  });
});
