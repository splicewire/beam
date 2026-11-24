// src/widgets/register.ts
import { createElement } from "react";

// src/widgets/agreement-member.tsx
import { useEffect, useId, useRef, useState } from "react";

// src/widgets/agreement-read.ts
async function fetchAgreement(readUrl) {
  const response = await fetch(readUrl, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" }
  });
  if (response.status === 401 || response.status === 403 || response.status === 404 || !response.ok) {
    throw new Error("Agreement read failed.");
  }
  return (await response.json()).data;
}

// src/widgets/agreement-member.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function optionsOf(options) {
  return options && typeof options === "object" ? options : {};
}
function AgreementMemberWidget(props) {
  const id = props.id ?? props.idSchema?.$id;
  const label = props.label ?? props.schema?.title;
  const value = props.value ?? props.formData;
  const disabled = props.disabled;
  const readonly = props.readonly ?? props.readOnly;
  const onChange = props.onChange;
  const emitChange = (next, error) => {
    const errorSchema = error ? { __errors: [error] } : void 0;
    if (props.fieldPathId !== void 0) {
      const changeField = onChange;
      if (errorSchema) changeField(next, props.fieldPathId.path ?? [], errorSchema);
      else changeField(next, props.fieldPathId.path ?? []);
    } else if (errorSchema) onChange(next, errorSchema);
    else onChange(next);
  };
  const options = optionsOf(props.options ?? props.uiSchema?.["ui:options"]);
  const generatedId = useId();
  const checkboxId = id || generatedId;
  const key = options.key ?? "";
  const version = typeof options.version === "number" && Number.isInteger(options.version) ? options.version : void 0;
  const expectedDigest = options.digest;
  const readUrl = options.readUrl ?? (key === "" ? "" : `/beam/agreements/agreements/${encodeURIComponent(key)}`);
  const embedded = typeof options.kind === "string" && typeof options.content === "string";
  const complete = key !== "" && version !== void 0 && typeof expectedDigest === "string" && expectedDigest !== "" && (embedded || readUrl !== "");
  const member = value && typeof value === "object" ? value : void 0;
  const onChangeRef = useRef(emitChange);
  onChangeRef.current = emitChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const readRef = useRef(props.read);
  readRef.current = props.read;
  const [agreement, setAgreement] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const digestMatches = agreement !== null && agreement.digest === expectedDigest;
  const checked = digestMatches && member?.key === key && member.version === version && member.digest === agreement.digest;
  useEffect(() => {
    let cancelled = false;
    setAgreement(null);
    setUnavailable(false);
    if (!complete) {
      setUnavailable(true);
      emitChange(null, "The current agreement could not be verified.");
      return () => {
        cancelled = true;
      };
    }
    if (embedded) {
      setAgreement({
        title: options.title ?? key,
        content: options.content,
        digest: expectedDigest,
        kind: options.kind,
        legalUrl: options.legalUrl
      });
      const existing = valueRef.current && typeof valueRef.current === "object" ? valueRef.current : void 0;
      if (options.kind === "notice") {
        if (valueRef.current !== void 0) onChangeRef.current(void 0);
      } else if (existing?.key !== key || existing.version !== version || existing.digest !== expectedDigest) onChangeRef.current(null);
      return () => {
        cancelled = true;
      };
    }
    void Promise.resolve().then(() => (readRef.current ?? fetchAgreement)(readUrl)).then((data) => {
      const current = data?.version;
      if (cancelled) return;
      if (!current || data?.key !== key || typeof current.digest !== "string" || current.digest === "" || current.digest !== expectedDigest || typeof current.content !== "string") {
        setUnavailable(true);
        onChangeRef.current(null, "The current agreement could not be verified.");
        return;
      }
      setAgreement({
        title: typeof data.title === "string" ? data.title : options.title ?? key,
        content: current.content,
        digest: current.digest,
        kind: typeof data.kind === "string" ? data.kind : void 0,
        legalUrl: options.legalUrl
      });
      const existing = valueRef.current && typeof valueRef.current === "object" ? valueRef.current : void 0;
      if (data.kind === "notice") {
        if (valueRef.current !== void 0) onChangeRef.current(void 0);
      } else if (existing?.key !== key || existing.version !== version || existing.digest !== current.digest) onChangeRef.current(null);
    }).catch(() => {
      if (!cancelled) {
        setUnavailable(true);
        onChangeRef.current(null, "The current agreement could not be verified.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [complete, embedded, expectedDigest, key, options.content, options.kind, options.legalUrl, options.title, readUrl]);
  const locked = Boolean(disabled || readonly || !complete || !digestMatches);
  const change = (event) => {
    emitChange(
      event.currentTarget.checked && version !== void 0 && digestMatches ? { key, version, digest: agreement.digest } : null
    );
  };
  return /* @__PURE__ */ jsxs("fieldset", { "data-agreement-member": key || void 0, disabled: locked, style: { border: 0, margin: 0, padding: 0 }, children: [
    agreement && options.showTitle !== false ? /* @__PURE__ */ jsx("legend", { style: { fontWeight: 600, marginBottom: 8 }, children: agreement.title }) : null,
    agreement ? /* @__PURE__ */ jsx("div", { "data-agreement-text": "", style: { whiteSpace: "pre-wrap", marginBottom: 12 }, children: agreement.content }) : null,
    agreement?.legalUrl ? /* @__PURE__ */ jsx("a", { href: agreement.legalUrl, children: "Read the full agreement" }) : null,
    unavailable ? /* @__PURE__ */ jsx("p", { role: "alert", children: "This agreement changed or is unavailable. Reload the form before accepting." }) : null,
    agreement?.kind === "notice" ? null : /* @__PURE__ */ jsxs("label", { htmlFor: checkboxId, style: { display: "flex", alignItems: "flex-start", gap: 8 }, children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          id: checkboxId,
          type: "checkbox",
          name: props.name,
          "aria-label": options.label ?? label,
          checked,
          disabled: locked,
          onChange: change
        }
      ),
      /* @__PURE__ */ jsx("span", { children: options.label ?? label })
    ] })
  ] });
}

// src/widgets/agreement-prompt.tsx
import { useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function AgreementPrompt({ agreementKey, readUrl, required = true, version, digest, kind, title: embeddedTitle, label, effectiveAt, summary, content: embeddedContent, legalUrl, value, onChange, read }) {
  const [agreement, setAgreement] = useState2(null);
  const [unavailable, setUnavailable] = useState2(false);
  const valueRef = useRef2(value);
  valueRef.current = value;
  const onChangeRef = useRef2(onChange);
  onChangeRef.current = onChange;
  const readRef = useRef2(read);
  readRef.current = read;
  useEffect2(() => {
    let cancelled = false;
    setAgreement(null);
    setUnavailable(false);
    if (typeof kind === "string" && typeof embeddedContent === "string" && typeof digest === "string" && typeof version === "number") {
      setAgreement({
        key: agreementKey,
        kind,
        title: embeddedTitle ?? agreementKey,
        version: { digest, content: embeddedContent, label, effectiveAt, summary }
      });
      if (kind === "notice" && valueRef.current !== void 0) onChangeRef.current(void 0);
      return () => {
        cancelled = true;
      };
    }
    if (!readUrl) {
      setUnavailable(true);
      return () => {
        cancelled = true;
      };
    }
    void Promise.resolve().then(() => (readRef.current ?? fetchAgreement)(readUrl)).then((data) => {
      if (cancelled) return;
      if (data?.key !== agreementKey || typeof data.kind !== "string" || !data.version || typeof data.version.content !== "string") {
        setUnavailable(true);
        return;
      }
      if (data.kind === "notice" && valueRef.current !== void 0) onChangeRef.current(void 0);
      if (data.kind !== "notice" && (!required || typeof version !== "number" || typeof digest !== "string" || data.version.digest !== digest)) {
        if (required) setUnavailable(true);
        else setAgreement(data);
        return;
      }
      setAgreement(data);
    }).catch(() => {
      if (!cancelled) setUnavailable(true);
    });
    return () => {
      cancelled = true;
    };
  }, [agreementKey, digest, effectiveAt, embeddedContent, embeddedTitle, kind, label, readUrl, required, summary, version]);
  if (unavailable) {
    return /* @__PURE__ */ jsx2("p", { role: "alert", children: "This agreement changed or is unavailable. Reload the form before continuing." });
  }
  if (agreement === null) return null;
  const title = typeof agreement.title === "string" ? agreement.title : agreementKey;
  const content = typeof agreement.version?.content === "string" ? agreement.version.content : "";
  if (agreement.kind === "notice") {
    return /* @__PURE__ */ jsxs2("section", { role: "status", "aria-label": title, "data-agreement-notice": agreementKey, children: [
      /* @__PURE__ */ jsx2("h2", { children: title }),
      /* @__PURE__ */ jsx2("div", { style: { whiteSpace: "pre-wrap" }, children: content }),
      legalUrl ? /* @__PURE__ */ jsx2("a", { href: legalUrl, children: "Read the full agreement" }) : null
    ] });
  }
  if (!required) return null;
  return /* @__PURE__ */ jsx2(
    AgreementMemberWidget,
    {
      id: `agreement-${agreementKey}`,
      name: "agreementMembers",
      value,
      options: { key: agreementKey, version, digest, readUrl, kind, content, legalUrl, title, label: `I agree to ${title}` },
      schema: { title },
      read,
      onChange: (member) => onChange(member)
    }
  );
}

// src/interlock/requirements.ts
function isOutstanding(value) {
  if (!value || typeof value !== "object") return false;
  const r = value;
  return typeof r.key === "string" && typeof r.version === "number" && typeof r.digest === "string" && typeof r.title === "string" && (typeof r.acceptOperation === "string" || r.acceptOperation === null) && (typeof r.member === "string" || r.member === null);
}
function requirementsOf(body) {
  if (!body || typeof body !== "object") return null;
  const b = body;
  const list = b.requirements ?? b.data?.requirements;
  if (!Array.isArray(list) || list.length === 0 || !list.every(isOutstanding)) return null;
  return list;
}

// src/widgets/register.ts
function registerAgreementWidgets(registry, options = {}) {
  const { read } = options;
  if (read === void 0) {
    registry.registerWidget("agreement-member", AgreementMemberWidget);
    return;
  }
  function ReadingAgreementMemberWidget(props) {
    return createElement(AgreementMemberWidget, { ...props, read });
  }
  registry.registerWidget("agreement-member", ReadingAgreementMemberWidget);
}

export {
  requirementsOf,
  AgreementMemberWidget,
  AgreementPrompt,
  registerAgreementWidgets
};
//# sourceMappingURL=chunk-FIIDAEE2.js.map