import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@schemastud/ui";
import { useState } from "react";
import {
  useCreatorListings,
  usePublishRelease,
  useSaveListing,
  useSubmitListing,
  useWithdrawListing,
} from "./hooks";
import {
  presentListingStatus,
  submitBlocker,
  type MarketListingData,
  type MarketListingInputData,
} from "./types";

const EMPTY: MarketListingInputData = {
  name: "",
  summary: null,
  repoFullName: null,
  installationNotes: null,
  compatibility: null,
};

/**
 * The creator's own Listings — create, edit, release, submit, withdraw.
 *
 * ## Why the blocked reason is rendered instead of the button being hidden
 *
 * `submitBlocker()` names why a submission would be refused, and the button stays visible and
 * disabled beside it. A hidden button teaches a creator nothing; and the server refusal is the real
 * gate either way (`SubmitListingForReview::ensureRepoAuthorized()` 422s regardless of what this
 * screen rendered), so this is a hint about a gate, never the gate itself.
 *
 * ## The rejection reason is the first thing on a rejected row
 *
 * Because it is the only thing a creator can act on. `review_note` exists precisely because the
 * review queue used to answer "rejected" and nothing else.
 */
export function ListingsSection() {
  const listings = useCreatorListings();
  const [editing, setEditing] = useState<MarketListingData | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = listings.data ?? [];

  return (
    <Card data-testid="creator-listings">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Listings</CardTitle>
          <CardDescription>
            Everything you have published or are preparing to.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          data-testid="creator-new-listing"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          New listing
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {listings.isPending ? (
          <p className="text-sm text-muted-foreground">Loading listings…</p>
        ) : null}

        {!listings.isPending && rows.length === 0 && !creating ? (
          <p className="text-sm text-muted-foreground" data-testid="creator-no-listings">
            No listings yet. Create one to prepare an extension for the marketplace.
          </p>
        ) : null}

        {creating ? (
          <ListingForm
            initial={EMPTY}
            listingId={null}
            onDone={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        ) : null}

        {rows.map((listing) =>
          editing?.id === listing.id ? (
            <ListingForm
              key={listing.id}
              listingId={listing.id}
              initial={{
                name: listing.name,
                summary: listing.summary,
                repoFullName: listing.repoFullName,
                installationNotes: listing.installationNotes,
                compatibility: listing.compatibility,
              }}
              onDone={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <ListingRow key={listing.id} listing={listing} onEdit={() => setEditing(listing)} />
          ),
        )}
      </CardContent>
    </Card>
  );
}

function ListingRow({
  listing,
  onEdit,
}: {
  listing: MarketListingData;
  onEdit: () => void;
}) {
  const status = presentListingStatus(listing);
  const blocker = submitBlocker(listing);
  const submit = useSubmitListing();
  const withdraw = useWithdrawListing();
  const [releaseRef, setReleaseRef] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const release = usePublishRelease();

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3" data-testid="creator-listing-row">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium" data-testid="creator-listing-name">
          {listing.name}
        </span>
        <Badge
          variant={status.tone === "rejected" ? "destructive" : "secondary"}
          data-testid="creator-listing-status"
        >
          {status.label}
        </Badge>
        {listing.latestVersion ? (
          <Badge variant="outline" data-testid="creator-listing-version">
            v{listing.latestVersion}
          </Badge>
        ) : null}
        <Button size="sm" variant="ghost" className="ml-auto" data-testid="creator-edit-listing" onClick={onEdit}>
          Edit
        </Button>
      </div>

      <p className="text-sm text-muted-foreground" data-testid="creator-listing-hint">
        {status.hint}
      </p>

      {listing.repoFullName ? (
        <p className="text-xs text-muted-foreground">
          Backed by {listing.repoFullName}
          {listing.repoAuthorized ? "" : " — not authorized"}
        </p>
      ) : null}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!releaseRef.trim()) return;
          release.mutate(
            { id: listing.id, ref: releaseRef.trim(), notes: releaseNotes.trim() || null },
            {
              onSuccess: () => {
                setReleaseRef("");
                setReleaseNotes("");
              },
            },
          );
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor={`ref-${listing.id}`}>Release tag</Label>
          <Input
            id={`ref-${listing.id}`}
            data-testid="creator-release-ref"
            value={releaseRef}
            placeholder="v1.0.0"
            onChange={(event) => setReleaseRef(event.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor={`notes-${listing.id}`}>Release notes</Label>
          <Input
            id={`notes-${listing.id}`}
            data-testid="creator-release-notes"
            value={releaseNotes}
            onChange={(event) => setReleaseNotes(event.target.value)}
          />
        </div>
        <Button type="submit" size="sm" variant="outline" data-testid="creator-release-submit" disabled={release.isPending}>
          Publish release
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          data-testid="creator-submit-listing"
          disabled={blocker !== null || submit.isPending}
          onClick={() => submit.mutate(listing.id)}
        >
          {listing.reviewStatus === "rejected" ? "Resubmit for review" : "Submit for review"}
        </Button>
        {blocker ? (
          <span className="text-xs text-muted-foreground" data-testid="creator-submit-blocked">
            {blocker}
          </span>
        ) : null}
        {listing.status === "published" ? (
          <Button
            size="sm"
            variant="outline"
            data-testid="creator-withdraw-listing"
            disabled={withdraw.isPending}
            onClick={() => withdraw.mutate(listing.id)}
          >
            Withdraw
          </Button>
        ) : null}
      </div>

      {listing.releases.length > 0 ? (
        <ul className="text-xs text-muted-foreground" data-testid="creator-release-history">
          {listing.releases.map((entry) => (
            <li key={entry.version}>
              v{entry.version} — {entry.notes || "no notes"}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ListingForm({
  listingId,
  initial,
  onDone,
  onCancel,
}: {
  listingId: number | null;
  initial: MarketListingInputData;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MarketListingInputData>(initial);
  const save = useSaveListing();

  const set = (key: keyof MarketListingInputData) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value === "" ? null : value }));

  return (
    <form
      className="flex flex-col gap-3 rounded-md border border-dashed p-3"
      data-testid="creator-listing-form"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({ id: listingId, input: { ...form, name: form.name.trim() } }, { onSuccess: onDone });
      }}
    >
      <Field id="listing-name" label="Name" testId="creator-field-name" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} />
      <Field id="listing-summary" label="Description" testId="creator-field-summary" value={form.summary ?? ""} onChange={set("summary")} />
      <Field
        id="listing-repo"
        label="Backing repository (owner/repo)"
        testId="creator-field-repo"
        value={form.repoFullName ?? ""}
        onChange={set("repoFullName")}
      />
      <Field
        id="listing-compat"
        label="Compatibility"
        testId="creator-field-compatibility"
        value={form.compatibility ?? ""}
        onChange={set("compatibility")}
      />
      <div className="flex flex-col gap-1">
        <Label htmlFor="listing-install">Installation instructions</Label>
        <Textarea
          id="listing-install"
          data-testid="creator-field-installation"
          rows={3}
          value={form.installationNotes ?? ""}
          onChange={(event) => set("installationNotes")(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          A Composer extension needs a CLI step on the installing site. Say what it is — this is the
          product step, not a footnote.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" data-testid="creator-save-listing" disabled={save.isPending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  testId,
  value,
  onChange,
}: {
  id: string;
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} data-testid={testId} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
