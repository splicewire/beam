import { useState, type FormEvent } from 'react';
import { Button, Input, Label } from '@schemastud/ui';
import { AuthError } from './auth-fields';

export interface CreateTeamFormProps {
    /** Submit the new team's name. The host posts it to the `teams.store` operation. */
    onSubmit: (input: { name: string }) => void;
    /** True while the host's request is in flight. */
    processing?: boolean;
    /** Field errors from the server (`name`), keyed as the operation's validator names them. */
    errors?: { name?: string };
    /** Where "Cancel" goes. Omitted ⇒ no cancel link. */
    cancelHref?: string | null;
    /** Pre-fill the name (a story, or a host suggesting one). */
    defaultName?: string;
}

/**
 * Start a team: one field, one button. The creator becomes the team's Owner and it becomes their current
 * team — facts of the server operation, not of this form, which only collects the name.
 *
 * Transport-free like every surface in this package: the host decides how `onSubmit` reaches the
 * server (beam-inertia's `account/create-team` page posts through Inertia so validation errors come
 * back as `errors`).
 */
export function CreateTeamForm({ onSubmit, processing = false, errors, cancelHref, defaultName = '' }: CreateTeamFormProps) {
    const [name, setName] = useState(defaultName);
    const valid = name.trim().length > 0;

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!valid || processing) return;
        onSubmit({ name: name.trim() });
    }

    return (
        <form className="w-full max-w-lg space-y-6" onSubmit={submit} aria-labelledby="create-team-heading">
            <div className="space-y-1">
                <h1 id="create-team-heading" className="text-lg font-semibold">
                    Create a team
                </h1>
                <p className="text-sm text-muted-foreground">
                    A team is where you and your teammates share work. You'll be its owner, and you can invite
                    people once it exists.
                </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                    id="team-name"
                    name="name"
                    autoFocus
                    autoComplete="organization"
                    maxLength={255}
                    placeholder="e.g. Acme Design"
                    value={name}
                    aria-invalid={errors?.name ? true : undefined}
                    aria-describedby={errors?.name ? 'team-name-error' : undefined}
                    onChange={(event) => setName(event.target.value)}
                />
                <div id="team-name-error">
                    <AuthError message={errors?.name} />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={!valid || processing}>
                    {processing ? 'Creating…' : 'Create team'}
                </Button>
                {cancelHref ? (
                    <a href={cancelHref} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                        Cancel
                    </a>
                ) : null}
            </div>
        </form>
    );
}
