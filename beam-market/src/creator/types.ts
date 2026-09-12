// The CREATOR half of the marketplace domain, typed off the same generated projection the buyer's
// half already uses (`@splicewire/beam-resources/types/market`, emitted from the PHP `#[TypeScript]`
// declarations by the host's `resources:beam` pipeline). Same load-bearing build-time dependency,
// same reason: the PHP declaration is the contract, and it travels rather than being retyped here.
import type {
  ExtensionArtifactData,
  MarketListingData,
  MarketListingInputData,
  MarketSellerData,
  SellerRepoAuthorizationData,
} from "@splicewire/beam-resources/types/market";

export type {
  ExtensionArtifactData,
  MarketListingData,
  MarketListingInputData,
  MarketSellerData,
  SellerRepoAuthorizationData,
};

/**
 * The `listing-review` workflow's places, as the creator surface renders them. TS-only (the DTO
 * ships `reviewStatus` as a bare `string | null`), so it narrows without claiming to be generated.
 *
 * `null` is a real member of this vocabulary and the most common one: a Listing that has never been
 * submitted has no marking at all — `LifecycleService::currentPlace()` reads the absent column as
 * `not_submitted` without ever writing it.
 */
export type ReviewStatus =
  | "pending_automated"
  | "pending_human"
  | "approved_automated"
  | "approved_human"
  | "rejected"
  | "taken_down"
  | (string & {});

/** What the creator surface calls the state a Listing is actually in, for one badge. */
export interface ListingStatusPresentation {
  label: string;
  tone: "draft" | "pending" | "approved" | "rejected" | "withdrawn";
  /** One sentence a creator can act on — never only the state's own name. */
  hint: string;
}

/**
 * The whole state vocabulary in one place, so the badge, the empty states and the action
 * availability cannot disagree about what a Listing is.
 *
 * ⚠️ Two FIELDS decide this, not one, and collapsing them is the trap. `reviewStatus` is the
 * workflow marking and `status` is Lunar's own catalog state — a Listing sits at
 * `approved_human` + `draft` for the moment between approval and publish, and at `taken_down` +
 * `draft` forever after a withdrawal. The review marking is the one a creator is asking about, so
 * it wins wherever both have something to say.
 */
export function presentListingStatus(
  listing: Pick<MarketListingData, "reviewStatus" | "status" | "reviewNote">,
): ListingStatusPresentation {
  switch (listing.reviewStatus) {
    case "pending_automated":
    case "pending_human":
      return {
        label: "In review",
        tone: "pending",
        hint: "Submitted. An operator has to approve it before anyone can install it.",
      };
    case "approved_automated":
    case "approved_human":
      return listing.status === "published"
        ? {
            label: "Published",
            tone: "approved",
            hint: "Live in the catalog. Releasing a new version sends it back through review.",
          }
        : {
            label: "Approved",
            tone: "approved",
            hint: "Approved but not currently in the catalog.",
          };
    case "rejected":
      return {
        label: "Rejected",
        tone: "rejected",
        hint:
          listing.reviewNote ??
          "Rejected without a stated reason. Edit and resubmit when you have changed something.",
      };
    case "taken_down":
      return {
        label: "Withdrawn",
        tone: "withdrawn",
        hint: "Out of the catalog, so nobody new can install it. Existing installs are untouched.",
      };
    default:
      return {
        label: "Draft",
        tone: "draft",
        hint: "Only you can see this. Submit it for review when a release is ready.",
      };
  }
}

/** Whether `submit` is a thing the creator can usefully press, and why not when it is not. */
export function submitBlocker(listing: MarketListingData): string | null {
  if (!listing.repoFullName) {
    return "Link the repository that backs this listing first.";
  }
  if (!listing.repoAuthorized) {
    return `Authorize ${listing.repoFullName} before submitting — the server refuses a submission without it.`;
  }
  if (!listing.latestVersion) {
    return "Publish a release before submitting: there is nothing to review yet.";
  }
  if (
    listing.reviewStatus === "pending_automated" ||
    listing.reviewStatus === "pending_human"
  ) {
    return "Already in review.";
  }
  return null;
}
