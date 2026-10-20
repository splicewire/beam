// src/IntakeSectionForm.tsx
import { useMemo, useRef, useState } from "react";
import { SchemaForm } from "@schemastud/seam";
import { Card, CardContent, CardHeader, CardTitle } from "@schemastud/ui";

// src/hooks.ts
import { useMutation } from "@tanstack/react-query";

// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var IntakeContext = createContext(null);
function IntakeProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(IntakeContext.Provider, { value: services, children });
}
function useIntakeServices() {
  const services = useContext(IntakeContext);
  if (!services)
    throw new Error("IntakeSectionForm requires an IntakeProvider.");
  return services;
}

// src/hooks.ts
function useIntakeSubmission(sectionKey) {
  const { client, onError } = useIntakeServices();
  return useMutation({
    mutationFn: (fields) => client.submit(sectionKey, fields),
    onError
  });
}

// src/IntakeSectionForm.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function IntakeSectionForm({
  section,
  disabled = false
}) {
  const [fields, setFields] = useState(
    Array.isArray(section.fields) ? {} : section.fields
  );
  const submit = useIntakeSubmission(section.key);
  const submitting = useRef(false);
  const { renderForm } = useIntakeServices();
  const formSchema = useMemo(() => {
    const { title: _rootTitle, ...untitled } = section.schema;
    return untitled;
  }, [section.schema]);
  const form = {
    schema: section.schema,
    formData: fields,
    disabled: disabled || submit.isPending,
    onChange: (next) => {
      if (submitting.current || submit.isPending) return;
      setFields(next);
      submit.reset();
    },
    onSubmit: (next) => {
      if (disabled || submitting.current || submit.isPending) return;
      submitting.current = true;
      submit.mutate(next, {
        onSettled: () => {
          submitting.current = false;
        }
      });
    }
  };
  return /* @__PURE__ */ jsxs(Card, { "aria-busy": submit.isPending || void 0, children: [
    /* @__PURE__ */ jsx2(CardHeader, { children: /* @__PURE__ */ jsx2(CardTitle, { children: String(section.schema.title ?? section.key) }) }),
    /* @__PURE__ */ jsxs(CardContent, { children: [
      renderForm ? renderForm(form) : /* @__PURE__ */ jsx2(
        SchemaForm,
        {
          schema: formSchema,
          className: "rjsf grid gap-4",
          formData: form.formData,
          disabled: form.disabled,
          onChange: ({ formData }) => form.onChange(formData ?? {}),
          onSubmit: ({ formData }) => form.onSubmit(formData ?? {})
        }
      ),
      submit.isPending && /* @__PURE__ */ jsx2("p", { role: "status", className: "mt-3 text-sm text-muted-foreground", children: "Submitting section\u2026" }),
      submit.isError && /* @__PURE__ */ jsx2("p", { role: "alert", className: "mt-3 text-sm text-destructive", children: submit.error instanceof Error && submit.error.message ? submit.error.message : "Unable to submit this section." }),
      submit.isSuccess && /* @__PURE__ */ jsxs("p", { role: "status", className: "mt-3 text-sm", children: [
        "Section received. Reference: ",
        submit.data.submissionId
      ] })
    ] })
  ] });
}
export {
  IntakeProvider,
  IntakeSectionForm,
  useIntakeSubmission
};
//# sourceMappingURL=index.js.map