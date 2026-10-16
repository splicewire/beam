// src/pages/account/create-team.tsx
import { Head, router, usePage } from "@inertiajs/react";
import { CreateTeamForm } from "@splicewire/beam-accounts";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CreateTeam() {
  const { action, cancelUrl, errors } = usePage().props;
  const [processing, setProcessing] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Create a team" }),
    /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx(
      CreateTeamForm,
      {
        processing,
        errors: { name: errors?.name },
        cancelHref: cancelUrl,
        onSubmit: (input) => router.post(action, input, {
          onStart: () => setProcessing(true),
          onFinish: () => setProcessing(false)
        })
      }
    ) })
  ] });
}
export {
  CreateTeam as default
};
//# sourceMappingURL=create-team-OYDO7SH2.js.map