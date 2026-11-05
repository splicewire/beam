import { cn } from "@schemastud/ui";
import type { ApiTokenData } from "./types";

/**
 * What tells two same-named tokens apart (owner-review-20261102 K-28): "can we show a last 4 or
 * something on the api tokens so they're easier to identify?"
 *
 * - `secret`: the last four characters of the token's plaintext, captured at mint and served as
 *   `lastFour`. They sit at the end of the string the holder pasted somewhere, which is where people
 *   look.
 * - `id`: the fallback for a token with no `lastFour`. That covers every token minted before the
 *   column existed, a host that has not migrated it, and the mint paths that do not stamp it
 *   (sign-in sessions among them). The plaintext of those is gone, so the server cannot supply four
 *   characters of it. The id is still part of the holder's string (`{id}|{secret}`), so its tail
 *   identifies the token too. It is labelled "id", because it sits before the `|`, not at the end.
 */
export interface TokenFragment {
  kind: "secret" | "id";
  /** What the row shows. */
  text: string;
  /** What a screen reader and the tooltip say instead of an ellipsis. */
  label: string;
}

export function tokenFragment(
  token: Pick<ApiTokenData, "id" | "lastFour">
): TokenFragment {
  if (token.lastFour) {
    return {
      kind: "secret",
      text: `…${token.lastFour}`,
      label: `Token ends in ${token.lastFour}`,
    };
  }

  const id = String(token.id);
  // A bigint-keyed host's ids can be shorter than four characters; show those whole.
  const tail = id.length > 4 ? id.slice(-4) : id;

  return {
    kind: "id",
    text: id.length > 4 ? `id …${tail}` : `id ${tail}`,
    label: `Token id ends in ${tail}`,
  };
}

/** The fragment as a small monospace chip of text, for a roster row. */
export function TokenFragmentText({
  token,
  className,
}: {
  token: Pick<ApiTokenData, "id" | "lastFour">;
  className?: string;
}) {
  const fragment = tokenFragment(token);

  return (
    <span
      data-token-fragment={fragment.kind}
      title={fragment.label}
      className={cn(
        "shrink-0 font-mono text-[11px] text-muted-foreground",
        className
      )}
    >
      <span aria-hidden="true">{fragment.text}</span>
      <span className="sr-only">{fragment.label}</span>
    </span>
  );
}
