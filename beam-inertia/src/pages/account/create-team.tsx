import { Head, router, usePage } from '@inertiajs/react';
import { CreateTeamForm } from '@splicewire/beam-accounts';
import { useState } from 'react';

/**
 * `teams.create` — start a team (`splicewire/laravel-beam-accounts` `TeamController::create`).
 *
 * The body is `@splicewire/beam-accounts`' <CreateTeamForm>; this page only wires it to Inertia: it posts
 * the name to the `teams.store` operation the server named in `action`, and hands the operation's
 * validation errors back to the form. On success the server redirects (the team page, else the
 * dashboard) and Inertia follows.
 *
 * Props mirror `Splicewire\Beam\Accounts\Data\Pages\CreateTeamPageData`.
 */
type CreateTeamPageProps = {
    action: string;
    cancelUrl: string | null;
    errors?: Record<string, string>;
};

export default function CreateTeam() {
    const { action, cancelUrl, errors } = usePage<CreateTeamPageProps>().props;
    const [processing, setProcessing] = useState(false);

    return (
        <>
            <Head title="Create a team" />
            <div className="p-6">
                <CreateTeamForm
                    processing={processing}
                    errors={{ name: errors?.name }}
                    cancelHref={cancelUrl}
                    onSubmit={(input) =>
                        router.post(action, input, {
                            onStart: () => setProcessing(true),
                            onFinish: () => setProcessing(false),
                        })
                    }
                />
            </div>
        </>
    );
}
