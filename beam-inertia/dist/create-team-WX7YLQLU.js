import {
  resetFrameAfterTeamChange
} from "./chunk-4JU2VFES.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/pages/account/create-team.tsx
import { Head, router, usePage } from "@inertiajs/react";
import { CreateTeamForm } from "@splicewire/beam-accounts";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CreateTeam() {
  const messages = useBeamMessages();
  const { action, cancelUrl, errors } = usePage().props;
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: messages.t("splicewire-beam-inertia::messages.chrome_create_team") }),
    /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx(
      CreateTeamForm,
      {
        processing,
        errors: { name: errors?.name },
        cancelHref: cancelUrl,
        onSubmit: (input) => router.post(action, input, {
          onStart: () => setProcessing(true),
          onFinish: () => setProcessing(false),
          onSuccess: () => resetFrameAfterTeamChange(queryClient)
        })
      }
    ) })
  ] });
}
export {
  CreateTeam as default
};
//# sourceMappingURL=create-team-WX7YLQLU.js.map