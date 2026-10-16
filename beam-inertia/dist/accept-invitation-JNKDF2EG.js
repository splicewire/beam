// src/pages/auth/accept-invitation.tsx
import { Head, router, usePage } from "@inertiajs/react";
import { AcceptInvitationPanel } from "@splicewire/beam-accounts";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var TITLES = {
  ready: "Accept invitation",
  guest: "Accept invitation",
  "wrong-account": "Invitation",
  expired: "Invitation expired",
  used: "Invitation used",
  invalid: "Invitation"
};
function AcceptInvitation() {
  const props = usePage().props;
  const [processing, setProcessing] = useState(false);
  const accept = props.acceptUrl ? () => router.post(
    props.acceptUrl,
    {},
    {
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false)
    }
  ) : void 0;
  const logout = props.logoutUrl ? () => {
    const here = window.location.href;
    router.post(props.logoutUrl, {}, { onFinish: () => window.location.assign(here) });
  } : void 0;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: TITLES[props.state] ?? "Invitation" }),
    /* @__PURE__ */ jsx(
      AcceptInvitationPanel,
      {
        state: props.state,
        teamName: props.teamName,
        email: props.email,
        role: props.role,
        inviterName: props.inviterName,
        viewerEmail: props.viewerEmail,
        onAccept: accept,
        processing,
        error: props.errors?.invitation,
        registerHref: props.registerUrl,
        loginHref: props.loginUrl,
        onLogout: logout,
        homeHref: props.viewerEmail ? "/dashboard" : null
      }
    )
  ] });
}
export {
  AcceptInvitation as default
};
//# sourceMappingURL=accept-invitation-JNKDF2EG.js.map