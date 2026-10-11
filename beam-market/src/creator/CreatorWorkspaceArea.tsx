import { Badge, cn } from "@schemastud/ui";
import { useCreatorSeller } from "./hooks";
import { ListingsSection } from "./ListingsSection";
import { RepositorySection } from "./RepositorySection";

/**
 * The creator workspace — the ONE exported top-level component a host mounts, the twin of
 * {@link ../ExtensionsArea.ExtensionsArea} for the other side of the marketplace.
 *
 * A buyer browses `/extensions`; a creator prepares what appears there. Those were the same
 * marketplace with only one of its two halves reachable through product UI: the backend had
 * Sellers, repo authorizations, a review workflow and a takedown policy, and no screen led to any
 * of it (`BASELINE.md`: "creator UX is not evidenced by the existing seller backend").
 *
 * Package-tier because it is generic: nothing here knows about tenancy, routing, or which host it
 * is. The host supplies the transport adapter and the mount; the flagship's tenant→Seller
 * resolution happens entirely server-side, which is why this component never asks who the creator
 * is beyond rendering the answer.
 */
export function CreatorWorkspaceArea({ className }: { className?: string }) {
  const seller = useCreatorSeller();

  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      data-testid="creator-workspace"
    >
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Creator workspace</h1>
        {seller.data ? (
          <Badge variant="secondary" data-testid="creator-seller-name">
            Selling as {seller.data.name}
          </Badge>
        ) : null}
        {seller.isPending ? (
          <span className="text-sm text-muted-foreground">
            Resolving your seller identity…
          </span>
        ) : null}
      </header>

      {!seller.isPending && !seller.data ? (
        // Not an error state: a host whose actor resolves to no Seller (no tenant, or a
        // deliberately null resolver) reaches this surface and can do nothing on it. Keep the
        // explanation bounded and do not render repository/listing controls that will be refused.
        <div
          className="flex flex-col gap-1 rounded-md border border-dashed p-6 text-sm"
          data-testid="creator-no-seller"
        >
          <p className="font-medium">No creator workspace</p>
          <p className="text-muted-foreground">
            This account has no seller identity here, so there is nothing to
            manage.
          </p>
        </div>
      ) : null}

      {seller.data ? (
        <>
          <RepositorySection />
          <ListingsSection />
        </>
      ) : null}
    </div>
  );
}
