import { englishBeamMessages, useBeamMessages } from '../../messages';
import { setLayoutProps } from '@inertiajs/react';
import { featureEnabled } from "../../config";
import { Form, Head } from "@inertiajs/react";
import { useRef } from "react";
import Heading from "../../components/heading";
import InputError from "../../components/input-error";
import PasswordInput from "../../components/password-input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";

import ManagePasskeys from "../../components/manage-passkeys";

import ManageTwoFactor from "../../components/manage-two-factor";

import type { SecurityPageData } from "@splicewire/beam-resources/types/accounts-pages";

export default function Security(props: SecurityPageData) {
    const messages = useBeamMessages();
    setLayoutProps({ breadcrumbs: [{ title: messages.t('splicewire-beam-inertia::messages.auth_security_settings'), href: { method: 'get', url: '/settings/security' } }] });
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  return (
    // Sections space themselves: the settings layout's `space-y-12` only reaches a page's
    // direct children when that layout wraps it, so a bare mount put each section's Save
    // flush against the next heading.
    <div className="space-y-12">
      <Head title={messages.t('splicewire-beam-inertia::messages.auth_security_settings')} />

      <h1 className="sr-only">{messages.t('splicewire-beam-inertia::messages.auth_security_settings')}</h1>

      <div className="space-y-6">
        <Heading
          variant="small"
          title={messages.t('splicewire-beam-inertia::messages.auth_update_password')}
          description={messages.t('splicewire-beam-inertia::messages.auth_ensure_your_account_is_using_a_long_random_password_to_stay_secure')}
        />

        <Form
          action="/settings/password"
          method="put"
          options={{
            preserveScroll: true,
          }}
          resetOnError={["password", "passwordConfirmation", "currentPassword"]}
          resetOnSuccess
          onError={(errors) => {
            if (errors.password) {
              passwordInput.current?.focus();
            }

            if (errors.currentPassword) {
              currentPasswordInput.current?.focus();
            }
          }}
          className="space-y-6"
        >
          {({ errors, processing }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="current_password">{messages.t('splicewire-beam-inertia::messages.auth_current_password')}</Label>

                <PasswordInput
                  id="current_password"
                  ref={currentPasswordInput}
                  name="currentPassword"
                  className="mt-1 block w-full"
                  autoComplete="current-password"
                  placeholder={messages.t('splicewire-beam-inertia::messages.auth_current_password')}
                />

                <InputError message={errors.currentPassword} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{messages.t('splicewire-beam-inertia::messages.auth_new_password')}</Label>

                <PasswordInput
                  id="password"
                  ref={passwordInput}
                  name="password"
                  className="mt-1 block w-full"
                  autoComplete="new-password"
                  placeholder={messages.t('splicewire-beam-inertia::messages.auth_new_password')}
                  passwordrules={props.passwordRules}
                />

                <InputError message={errors.password} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">{messages.t('splicewire-beam-inertia::messages.auth_confirm_password')}</Label>

                <PasswordInput
                  id="password_confirmation"
                  name="passwordConfirmation"
                  className="mt-1 block w-full"
                  autoComplete="new-password"
                  placeholder={messages.t('splicewire-beam-inertia::messages.auth_confirm_password')}
                  passwordrules={props.passwordRules}
                />

                <InputError message={errors.passwordConfirmation} />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  disabled={processing}
                  data-test="update-password-button"
                >
                  {messages.t('splicewire-beam-inertia::messages.auth_save')}</Button>
              </div>
            </>
          )}
        </Form>
      </div>

      {featureEnabled("2fa") && (
        <>
          <ManageTwoFactor
            canManageTwoFactor={props.canManageTwoFactor}
            requiresConfirmation={props.requiresConfirmation}
            twoFactorEnabled={props.twoFactorEnabled}
          />
        </>
      )}

      {featureEnabled("passkeys") && (
        <>
          <ManagePasskeys
            canManagePasskeys={props.canManagePasskeys}
            passkeys={props.passkeys}
          />
        </>
      )}
    </div>
  );
}

Security.layout = {
  breadcrumbs: [
    {
      title: englishBeamMessages.t('splicewire-beam-inertia::messages.auth_security_settings'),
      href: { method: "get", url: "/settings/security" },
    },
  ],
};
