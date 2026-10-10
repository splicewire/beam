type Props = {
    /** The object the actor cannot access ("agents", "this list"). */
    label: string;
};

/** A direct forbidden view for callers whose refusal does not come from a query. */
export function ForbiddenState({ label }: Props) {
    return (
        <div data-page-state="forbidden">
            <div role="alert" className="p-6 text-sm">
                <p className="font-medium">You don't have access to {label}.</p>
                <p className="text-muted-foreground">An owner or admin of this workspace can grant it.</p>
            </div>
        </div>
    );
}
