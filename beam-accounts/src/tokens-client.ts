import type { SessionRequest } from "@schemastud/frame/session";
import type { ApiTokenData, CreatedTokenData, TokensClient } from "./types";

/**
 * Where the account-tier token routes are mounted, as laravel-beam-accounts builds them from its own route names
 * (`beam.accounts.tokens.*`, under the configured `beam.accounts.api_root`) and hands them to the tokens page as
 * props. Nothing here spells the root: a host that moves `ACCOUNT_API_ROOT` moves these with it.
 *
 * A record's routes hang off `index`: `${index}/${id}` (archive), `/renew`, `/rotate` and `/permanent`.
 */
export interface TokensEndpoints {
  /** `tokens.index` (GET, the roster) and `tokens.store` (POST, the reveal-once mint): one URL. */
  index: string;
  /** `tokens.permissions`: the held permission names the scoped-create picker offers. */
  permissions: string;
  /** `tokens.sessions.others`: revoke every session token but the current one. */
  sessionsOthers: string;
}

/**
 * The tokens client over the host's session request (ruled in frame-foundation 48, ticket 51). It unwraps the
 * `{data}` envelope and ships no default request: the host passes `createSessionRequest()` from
 * `@schemastud/frame/session`. A refusal is the request's `FrameActionError`, read structurally (`status`, `errors`,
 * `message`), so a 422's field errors reach the form and any other refusal its message.
 */
export function createTokensClient(
  request: SessionRequest,
  endpoints: TokensEndpoints
): TokensClient {
  const record = (id: string, action?: "renew" | "rotate" | "permanent") =>
    `${endpoints.index}/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;

  async function data<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<T> {
    const res = await request<{ data: T } | null>(method, url, undefined, body);
    return res.data?.data as T;
  }

  return {
    list: async () =>
      (await data<ApiTokenData[] | null>("GET", endpoints.index)) ?? [],
    create: ({ name, abilities, expiresInDays }) => {
      // Omitted, not null: no abilities is the unscoped default and no expiry a token that never expires.
      const body: Record<string, unknown> = { name };
      if (abilities && abilities.length > 0) body.abilities = abilities;
      if (expiresInDays) body.expiresInDays = expiresInDays;
      return data<CreatedTokenData>("POST", endpoints.index, body);
    },
    renew: ({ id, expiresInDays }) =>
      data<ApiTokenData>(
        "POST",
        record(id, "renew"),
        expiresInDays ? { expiresInDays } : {}
      ),
    rotate: ({ id, expiresInDays }) =>
      data<CreatedTokenData>(
        "POST",
        record(id, "rotate"),
        expiresInDays ? { expiresInDays } : {}
      ),
    // Archive is the soft revoke (the row is kept for audit); remove is the hard delete of an archived token.
    archive: async (id) => {
      await request("DELETE", record(id));
    },
    remove: async (id) => {
      await request("DELETE", record(id, "permanent"));
    },
    revokeOtherSessions: async () => {
      const res = await request<{ message: string; data: { revoked: number } }>(
        "DELETE",
        endpoints.sessionsOthers
      );
      return { message: res.data.message, revoked: res.data.data.revoked };
    },
    listPermissions: async () =>
      (
        await data<{ permissions: string[] } | null>(
          "GET",
          endpoints.permissions
        )
      )?.permissions ?? [],
  };
}
