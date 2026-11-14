import {
  fromProse,
  proseManifest,
  toProse
} from "./chunk-RVN3TANY.js";

// src/canvas/ProseRun.tsx
import { useMemo, useRef, useCallback } from "react";
import { BlockdocEditor } from "@schemastud/blockdoc/react";
import { jsx } from "react/jsx-runtime";
function ProseRun({ value, profile, onChange }) {
  const manifest = useMemo(() => proseManifest(profile), [profile]);
  const focused = useRef(false);
  const attach = useCallback((handle) => {
    if (handle?.editor && !focused.current) {
      focused.current = true;
      handle.editor.commands.focus();
    }
  }, []);
  const emitted = useRef(null);
  const doc = useMemo(() => {
    const previous = emitted.current;
    return previous?.profile === profile && previous.json === JSON.stringify(value) ? previous.prose : toProse(value, profile);
  }, [value, profile]);
  return /* @__PURE__ */ jsx("div", { "data-prose-edit": true, onClick: (event) => event.stopPropagation(), onDoubleClick: (event) => event.stopPropagation(), children: /* @__PURE__ */ jsx(
    BlockdocEditor,
    {
      ref: attach,
      manifests: manifest,
      value: doc,
      history: false,
      palette: false,
      commitPolicy: { debounceMs: 0, onBlur: true },
      onChange: (next) => {
        const prose = next;
        const body = fromProse(prose, profile);
        emitted.current = { json: JSON.stringify(body), prose, profile };
        onChange(body);
      }
    }
  ) });
}
export {
  ProseRun as default
};
//# sourceMappingURL=ProseRun-RXMI5TLK.js.map