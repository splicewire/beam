import { useBeamMessages } from '../messages';
import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import Heading from './heading';
import InputError from './input-error';
import PasswordInput from './password-input';
import { Button } from './ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';

export default function DeleteUser() {
    const messages = useBeamMessages();
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={messages.t('splicewire-beam-inertia::messages.auth_delete_account')}
                description={messages.t('splicewire-beam-inertia::messages.auth_delete_your_account_and_all_of_its_resources')}
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">{messages.t('splicewire-beam-inertia::messages.auth_warning')}</p>
                    <p className="text-sm">
                        {messages.t('splicewire-beam-inertia::messages.auth_please_proceed_with_caution_this_cannot_be_undone')}</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        >
                            {messages.t('splicewire-beam-inertia::messages.auth_delete_account')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            {messages.t('splicewire-beam-inertia::messages.auth_are_you_sure_you_want_to_delete_your_account')}</DialogTitle>
                        <DialogDescription>
                            {messages.t('splicewire-beam-inertia::messages.auth_once_your_account_is_deleted_all_of_its_resources_and_data_will_also_be_permanently_deleted_please_enter_your')}</DialogDescription>

                        <Form
                            action="/settings/profile"
                            method="delete"
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="password"
                                            className="sr-only"
                                        >
                                            {messages.t('splicewire-beam-inertia::messages.auth_password')}</Label>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder={messages.t('splicewire-beam-inertia::messages.auth_password')}
                                            autoComplete="current-password"
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            >
                                                {messages.t('splicewire-beam-inertia::messages.auth_cancel')}</Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            asChild
                                        >
                                            <button
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                {messages.t('splicewire-beam-inertia::messages.auth_delete_account')}</button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
