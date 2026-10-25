import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ComponentCanvasData,
  EntryComponentCapabilitiesOutputData,
} from "@splicewire/beam-resources/types/beam-ux";
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
    top: number;
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
          top: Math.max(
            12,
            Math.min(
              element.getBoundingClientRect().top,
              window.innerHeight / 2
            )
          ),
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
          role="dialog"
          aria-label={`Edit component ${active.entry.definition.name}`}
          aria-modal="true"
          style={{
            position: "fixed",
            top: active.top,
            left: 16,
            right: 16,
            maxHeight: "calc(100vh - 32px)",
            overflow: "auto",
            zIndex: 1000,
            background: "var(--stud-surface, Canvas)",
            color: "var(--stud-text, CanvasText)",
            border: "1px solid currentColor",
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <header>
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
        </section>
      )}
    </Context.Provider>
  );
}
