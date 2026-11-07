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
function useOptionalIntakeServices() {
  return useContext(IntakeContext);
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

// src/IntakeForm.tsx
import { createContext as createContext2, useContext as useContext2, useRef as useRef2, useState as useState2 } from "react";
import { SchemaForm as SchemaForm2 } from "@schemastud/seam";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var PublicIntakeContext = createContext2({ schemas: {} });
function PublicIntakeProvider({ value, children }) {
  return /* @__PURE__ */ jsx3(PublicIntakeContext.Provider, { value, children });
}
function xsrfToken() {
  if (typeof document === "undefined") return void 0;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : void 0;
}
async function submitToIntakeDoor(captureKey, payload, endpoint = "/beam/intake") {
  const token = xsrfToken();
  const response = await fetch(`${endpoint}/${encodeURI(captureKey)}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...token ? { "X-XSRF-TOKEN": token } : {} },
    body: JSON.stringify(payload)
  });
  if (response.ok) {
    return { ok: true };
  }
  const body = await response.json().catch(() => ({}));
  return { ok: false, status: response.status, message: body.message, errors: body.errors ?? {} };
}
function pointerTokens(pointer) {
  return pointer === "" ? [] : pointer.split("/").slice(1).map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
}
var UNSAFE_TOKENS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function toErrorSchema(errors) {
  const out = /* @__PURE__ */ Object.create(null);
  for (const [pointer, messages] of Object.entries(errors)) {
    const path = pointerTokens(pointer);
    if (path.some((token) => UNSAFE_TOKENS.has(token))) continue;
    let cursor = out;
    for (const token of path) {
      if (!Object.hasOwn(cursor, token)) cursor[token] = /* @__PURE__ */ Object.create(null);
      cursor = cursor[token];
    }
    cursor.__errors = [...Object.hasOwn(cursor, "__errors") ? cursor.__errors : [], ...messages];
  }
  return out;
}
function IntakeForm({ captureKey, submitLabel = "Send", successMessage = "Thank you. Your submission was received.", preview = false }) {
  const { schemas, honeypotField = "website", submit = submitToIntakeDoor, onSent } = useContext2(PublicIntakeContext);
  const services = useOptionalIntakeServices();
  const honeypot = useRef2(null);
  const [formData, setFormData] = useState2({});
  const [state, setState] = useState2({ status: "idle", errors: {} });
  const schema = schemas[captureKey];
  if (!schema) {
    return /* @__PURE__ */ jsx3("div", { role: "note", "data-beam-intake-form": captureKey, children: preview ? `Intake form \xB7 ${captureKey}` : "This form is not available." });
  }
  if (state.status === "sent") {
    return /* @__PURE__ */ jsx3("div", { role: "status", "data-beam-intake-form": captureKey, children: successMessage });
  }
  const send = async (fields) => {
    if (preview || state.status === "sending") return;
    setState({ status: "sending", errors: {} });
    const payload = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== void 0 && value !== ""));
    try {
      const honeypotValue = honeypot.current?.value ?? "";
      const result = await submit(captureKey, { ...payload, [honeypotField]: honeypotValue });
      if (result.ok) {
        setState({ status: "sent", errors: {} });
        if (!honeypotValue) {
          try {
            onSent?.(captureKey);
          } catch {
          }
        }
      } else {
        setState({ status: "idle", errors: result.errors, message: result.status === 429 ? "Too many submissions. Please wait a minute and try again." : result.message });
      }
    } catch {
      setState({ status: "idle", errors: {}, message: "Your submission could not be sent. Check your connection and try again." });
    }
  };
  const form = {
    schema,
    formData,
    disabled: preview || state.status === "sending",
    onChange: setFormData,
    onSubmit: (fields) => void send(fields),
    errors: state.errors,
    submitLabel
  };
  return /* @__PURE__ */ jsxs2("div", { "data-beam-intake-form": captureKey, "aria-busy": state.status === "sending" || void 0, children: [
    state.message && /* @__PURE__ */ jsx3("p", { role: "alert", children: state.message }),
    services?.renderForm ? services.renderForm(form) : /* @__PURE__ */ jsx3(
      SchemaForm2,
      {
        schema,
        formData: form.formData,
        disabled: form.disabled,
        extraErrors: toErrorSchema(state.errors),
        onChange: ({ formData: next }) => setFormData(next ?? {}),
        onSubmit: ({ formData: next }) => form.onSubmit(next ?? {}),
        children: /* @__PURE__ */ jsx3("button", { type: "submit", disabled: form.disabled, children: submitLabel })
      }
    ),
    /* @__PURE__ */ jsx3(
      "input",
      {
        ref: honeypot,
        type: "text",
        name: honeypotField,
        tabIndex: -1,
        autoComplete: "off",
        "aria-hidden": "true",
        style: { position: "absolute", left: "-10000px" },
        defaultValue: ""
      }
    )
  ] });
}
export {
  IntakeForm,
  IntakeProvider,
  IntakeSectionForm,
  PublicIntakeProvider,
  pointerTokens,
  submitToIntakeDoor,
  toErrorSchema,
  useIntakeSubmission,
  useOptionalIntakeServices
};
//# sourceMappingURL=index.js.map