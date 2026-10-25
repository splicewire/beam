import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import type {
  ComponentCanvasData,
  EntryComponentCapabilitiesOutputData,
} from "@splicewire/beam-resources/types/beam-ux";
import { DEFAULT_CANVAS_THEME } from "../canvas/css";
import type { EditorKitInputs } from "./context";
import { EditorKitProvider } from "./context";
const ComponentEditor = lazy(() => import("./mount"));
type Open = (
  entry: ComponentCanvasData,
  props: Record<string, unknown>,
  element: HTMLElement
) => void;
const Context = createContext<Open | undefined>(undefined);
export const useComponentSession = () => useContext(Context);

/** Keep the parent's mounted Local Session intact while a separately keyed component editor is active. */
export function ComponentSessionHost({
  kit,
  children,
}: {
  kit: Required<EditorKitInputs>;
  children: ReactNode;
}) {
  const [active, setActive] = useState<{
    entry: ComponentCanvasData;
    props: Record<string, unknown>;
    admission: EntryComponentCapabilitiesOutputData;
    target: HTMLElement;
  } | null>(null);
  const sequence = useRef(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    sequence.current++;
    setActive(null);
    setError(null);
    return () => {
      sequence.current++;
    };
  }, [kit.userId, kit.canAuthor]);
  const open: Open = (entry, props, element) => {
    const request = ++sequence.current;
    const actor = kit.userId;
    if (!actor || !kit.canAuthor || !kit.transport.componentCapabilities)
      return;
    void kit.transport.componentCapabilities(entry.id).then(
      (admission) => {
        if (request !== sequence.current) return;
        if (!admission.canEdit || admission.id !== entry.id) {
          setError("Editing this component is unavailable.");
          return;
        }
        setError(null);
        setActive({
          entry,
          props,
          admission,
          target: element,
        });
      },
      () => {
        if (request === sequence.current)
          setError("Editing this component was refused.");
      }
    );
  };
  const close = () => {
    sequence.current++;
    const target = active?.target;
    setActive(null);
    requestAnimationFrame(() => target?.focus());
  };
  const defaults = Object.fromEntries(
    (active?.entry.definition.props ?? [])
      .filter((prop) => prop.default != null)
      .map((prop) => [prop.name, prop.default])
  );
  const colors = { ...DEFAULT_CANVAS_THEME, ...kit.theme };
  return (
    <Context.Provider value={open}>
      {error && <p role="alert">{error}</p>}
      <div
        inert={active ? true : undefined}
        style={active ? { opacity: 0.25, pointerEvents: "none" } : undefined}
      >
        {children}
      </div>
      {active && (
        <section
          className="component-session"
          role="dialog"
          aria-label={`Edit component ${active.entry.definition.name}`}
          aria-modal="true"
          style={{
            "--component-panel": colors.panelBg,
            "--component-ink": colors.panelFg,
            "--component-muted": colors.muted,
            "--component-accent": colors.editAccent,
            "--stud-surface": colors.panelBg,
            "--stud-ink": colors.panelFg,
            "--stud-ink-muted": colors.muted,
            "--stud-line": "color-mix(in srgb, currentColor 25%, transparent)",
            fontFamily: colors.fontBody,
          } as CSSProperties}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <style>{componentSessionCss}</style>
          <header className="component-session-heading">
            <strong>{active.entry.definition.name}</strong> —{" "}
            {active.admission.reachEntries === null
              ? `direct reach unavailable (over ${active.admission.reachLimit} entries)`
              : `used directly by ${active.admission.reachEntries} ${
                  active.admission.reachEntries === 1 ? "entry" : "entries"
                }`}
            <button type="button" autoFocus onClick={close}>
              Back to parent
            </button>
          </header>
          <p>Transitive page reach is not included.</p>
          <p>
            Undo and Save belong to this component. The parent’s unsaved work
            waits unchanged. Closing retains this component’s Local Session.
          </p>
          <div className="component-session-editor">
            <EditorKitProvider
              {...kit}
              canvasConfig={{
                ...kit.canvasConfig,
                componentProps: { ...defaults, ...active.props },
              }}
            >
              <Suspense fallback={<p role="status">Loading component editor…</p>}>
                <ComponentEditor
                  entryRef={{
                    id: active.entry.id,
                    slug: active.entry.definition.name,
                    format: "tsx",
                    bodyKind: "blocks",
                  }}
                />
              </Suspense>
            </EditorKitProvider>
          </div>
        </section>
      )}
    </Context.Provider>
  );
}

/** Scoped to this nested window; the mounted parent keeps its own viewport chrome. */
const componentSessionCss = `
.component-session{position:fixed;inset:12px;z-index:2147483300;box-sizing:border-box;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:var(--component-panel);color:var(--component-ink);border:1px solid var(--component-muted);border-radius:10px;box-shadow:0 16px 80px #0008;font-size:14px;line-height:1.5;isolation:isolate}
.component-session-heading{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--stud-line)}
.component-session-heading button{margin-left:auto}
.component-session>p{margin:6px 16px;flex:none}
.component-session-editor{position:relative;min-height:0;min-width:0;flex:1;overflow:auto;padding:12px;transform:translateZ(0)}
.component-session :is(button,input,select,textarea):not(.ve-canvas *){box-sizing:border-box;max-width:100%;min-height:32px;border:1px solid var(--stud-line);border-radius:5px;background:var(--component-panel);color:var(--component-ink);font:inherit;padding:4px 8px}
.component-session button:not(.ve-canvas *){cursor:pointer}
.component-session button:disabled{opacity:.45;cursor:not-allowed}
.component-session :focus-visible{outline:2px solid var(--component-accent);outline-offset:2px}
.component-session-editor :is([aria-label="Publication controls"],[data-frame-region="top-bar"]){display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
.component-session-editor fieldset{min-width:0;margin:12px 0;padding:12px;border:1px solid var(--stud-line)}
.component-session-editor [data-frame-shell="edit-five"]{min-width:0;height:auto!important}
.component-session-editor [data-frame-region="body"]{display:grid!important;grid-template-columns:minmax(140px,180px) minmax(0,1fr) minmax(220px,280px);gap:12px}
.component-session-editor [data-frame-region]{min-width:0}
.component-session-editor [data-frame-region="canvas"]{background:var(--stud-surface)}
.component-session-editor [data-frame-region="palette"] button{display:block;width:100%;margin-bottom:6px;text-align:left}
.component-session-editor [data-frame-region="inspector-region"]{padding:12px;overflow:auto}
@media(max-width:900px){.component-session{inset:6px}.component-session-editor [data-frame-region="body"]{grid-template-columns:minmax(0,1fr)}.component-session-editor [data-frame-region="palette"]{max-height:160px;overflow:auto}.component-session-heading{padding:8px}.component-session>p{margin:4px 8px}}
`;
