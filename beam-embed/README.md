# @splicewire/beam-embed

Shared embed privacy and retention UI. Render `PrivacyRetentionPage` inside `RetentionProvider` and the host QueryClientProvider. Supply a RetentionClient that resolves the host endpoints and unwraps their data envelope. `canManage` controls destructive affordances; the server remains the authorization authority.

Default posture wording describes retention without assuming who processes a host’s data. Supply `policyDescription` for the host’s controller/processor policy. Styling uses shared UI tokens. Hosts must include the package dist in their Tailwind source scan.

Prune displays its preview and refreshes posture/preview after success. Erase requires a nonempty subject and typed ERASE confirmation in a dialog; failures stay visible inside the dialog. Result types come from the generated public Beam Embed Data projection.
