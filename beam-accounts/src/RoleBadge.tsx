import { Badge } from "@schemastud/ui";
import { humanizeKey } from "@schemastud/seam";

/**
 * A tenant member/invite role as a read-only badge (C35, wave-6 role-label cue; the same pattern
 * tower-ux C28 applied to the customer account). The humanized label is the visible text while the
 * exact role key stays as the native `title` (secondary diagnostic identity) — so a compound key like
 * `tenant_admin` reads "Tenant admin" while the exact key remains available where tooling/operators
 * need it. The role VALUE is unchanged (humanizing is presentation only); the raw key previously shown
 * CSS-capitalized ("Tenant_admin") is no longer the visible text.
 */
export function RoleBadge({
  role,
  label,
}: {
  role: string;
  label?: string;
}) {
  return (
    <Badge variant="secondary" title={role}>
      {label ?? humanizeKey(role)}
    </Badge>
  );
}
