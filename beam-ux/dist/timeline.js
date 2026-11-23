import {
  NoticeError,
  notice,
  say
} from "./chunk-YARN53FB.js";
import {
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

// src/timeline/TimelineWidget.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// src/timeline/otio.ts
function itemKind(item) {
  const schema = item.OTIO_SCHEMA.split(".")[0];
  return schema === "Clip" ? "clip" : schema === "Gap" ? "gap" : null;
}
var OtioTimeError = class extends NoticeError {
};
var NO_TIME = {
  section: "splicewire-beam-ux::messages.timeline_section_no_time",
  clip: "splicewire-beam-ux::messages.timeline_clip_no_time",
  gap: "splicewire-beam-ux::messages.timeline_gap_no_time"
};
var NO_RATE = {
  section: "splicewire-beam-ux::messages.timeline_section_no_rate",
  clip: "splicewire-beam-ux::messages.timeline_clip_no_rate",
  gap: "splicewire-beam-ux::messages.timeline_gap_no_rate"
};
function seconds(time, where) {
  const { kind, ...parameters } = where;
  if (!time || typeof time.value !== "number" || !Number.isFinite(time.value)) {
    throw new OtioTimeError(notice(NO_TIME[kind], parameters));
  }
  if (typeof time.rate !== "number" || !Number.isFinite(time.rate) || time.rate <= 0) {
    throw new OtioTimeError(notice(NO_RATE[kind], parameters));
  }
  return time.value / time.rate;
}
var defaultClipId = (_item, laneIndex, itemIndex) => `lane:${laneIndex}/item:${itemIndex}`;
var defaultSectionId = (_marker, index) => `section:${index}`;
function isFormByShape(track) {
  return (track.markers?.length ?? 0) > 0 && !track.children.some((item) => itemKind(item) === "clip");
}
function layoutTimeline(doc, options = {}) {
  const clipId = options.clipId ?? defaultClipId;
  const sectionId = options.sectionId ?? defaultSectionId;
  const tracks = doc.tracks?.children ?? [];
  const lanes = [];
  const sections = [];
  let duration = 0;
  tracks.forEach((track, index) => {
    const info = options.lane?.(track, index) ?? {};
    const form = info.form ?? isFormByShape(track);
    if (form) {
      for (const marker of track.markers ?? []) {
        const place = { kind: "section", name: marker.name };
        const start = seconds(marker.marked_range?.start_time, place);
        const length = seconds(marker.marked_range?.duration, place);
        sections.push({ id: sectionId(marker, sections.length), name: marker.name, start, duration: length, color: marker.color ?? null, marker });
        duration = Math.max(duration, start + length);
      }
      return;
    }
    let cursor = 0;
    const clips = [];
    track.children.forEach((item, itemIndex) => {
      const kind = itemKind(item);
      if (kind === null) return;
      const length = seconds(item.source_range?.duration, kind === "gap" ? { kind, track: track.name } : { kind, name: item.name, track: track.name });
      if (kind === "clip") {
        clips.push({ id: clipId(item, index, itemIndex, track), kind, name: item.name, start: cursor, duration: length, laneIndex: index, itemIndex, item });
      }
      cursor += length;
    });
    duration = Math.max(duration, cursor);
    lanes.push({
      id: `lane:${index}`,
      index,
      name: track.name,
      label: info.label ?? track.name,
      kind: track.kind ?? null,
      editable: info.editable === true && info.take !== true,
      take: info.take === true,
      clips,
      track
    });
  });
  return { duration, sections, lanes };
}

// src/timeline/ports.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var PortsContext = createContext({});
function TimelinePortsProvider({ value, children }) {
  return /* @__PURE__ */ jsx(PortsContext.Provider, { value, children });
}
function useTimelinePorts() {
  return useContext(PortsContext);
}

// src/timeline/TimelineWidget.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var round = (value) => Math.round(value * 1e4) / 1e4;
var formatSeconds = (m, value) => m.t("splicewire-beam-ux::messages.timeline_seconds", { seconds: round(value) });
var spanOf = (m, start, length) => ({ start: formatSeconds(m, start), end: formatSeconds(m, start + length) });
var ring = (on, color) => on ? `inset 0 0 0 2px ${color}` : "none";
function clipPaint(isSelected) {
  return {
    boxSizing: "border-box",
    padding: 0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--beam-green, #14803f)",
    borderRadius: 4,
    backgroundColor: "var(--beam-green-tint, #eaf6ee)",
    color: "var(--beam-green-deep, #0f5f2e)",
    boxShadow: ring(isSelected, "var(--beam-green-deep, #0f5f2e)")
  };
}
function sectionPaint(color, index, isSelected) {
  return {
    boxSizing: "border-box",
    padding: "0 6px",
    borderWidth: 0,
    borderStyle: "solid",
    borderLeftWidth: index > 0 ? 2 : 0,
    borderLeftColor: "var(--beam-paper-raised, #ffffff)",
    backgroundColor: color ?? "var(--beam-green-tint, #eaf6ee)",
    color: "var(--beam-ink, #2e2c26)",
    textAlign: "left",
    overflow: "hidden",
    whiteSpace: "nowrap",
    boxShadow: ring(isSelected, "var(--beam-ink, #2e2c26)")
  };
}
function TimelineWidget({ value, formData, editShellMount: mount, readonly = false, scale = 48 }) {
  const ports = useTimelinePorts();
  const m = useBeamUxMessages();
  const given = value ?? formData ?? null;
  const [loaded, setLoaded] = useState(null);
  const doc = loaded ?? given;
  const [overrides, setOverrides] = useState({});
  const [localSelection, setLocalSelection] = useState(null);
  const [error, setError] = useState(null);
  const [notice2, setNotice] = useState(null);
  const selected = mount ? mount.selectedNodeId : localSelection;
  useEffect(() => setLoaded(null), [given]);
  const layout = useMemo(() => {
    if (!doc) return { value: null, error: null };
    try {
      return { value: layoutTimeline(doc, ports), error: null };
    } catch (failure) {
      if (failure instanceof OtioTimeError) return { value: null, error: failure.notice };
      throw failure;
    }
  }, [doc, ports]);
  const layoutRef = useRef(layout.value);
  layoutRef.current = layout.value;
  const portsRef = useRef(ports);
  portsRef.current = ports;
  const readonlyRef = useRef(readonly);
  readonlyRef.current = readonly;
  const mountRef = useRef(mount);
  mountRef.current = mount;
  const messagesRef = useRef(m);
  messagesRef.current = m;
  const docRef = useRef(doc);
  docRef.current = doc;
  const dragRef = useRef(null);
  const laneRefs = useRef(/* @__PURE__ */ new Map());
  const select = useCallback((id) => {
    setLocalSelection(id);
    mountRef.current?.selectNode(id);
  }, []);
  const reload = useCallback(async () => {
    const load = portsRef.current.load;
    if (!load) return;
    const next = await load();
    setLoaded(next);
    setOverrides({});
  }, []);
  const findClip = (id) => {
    if (!id) return null;
    for (const lane of layoutRef.current?.lanes ?? []) {
      const clip = lane.clips.find((candidate) => candidate.id === id);
      if (clip) return clip;
    }
    return null;
  };
  const findSection = (id) => layoutRef.current?.sections.find((section) => section.id === id) ?? null;
  const laneOf = (clip) => layoutRef.current?.lanes.find((lane) => lane.index === clip.laneIndex) ?? null;
  const canEdit = (clip) => !readonlyRef.current && Boolean(portsRef.current.patchClip) && laneOf(clip)?.editable === true;
  const snap = (seconds2) => {
    const step = portsRef.current.snapSeconds;
    return step && step > 0 ? Math.round(seconds2 / step) * step : seconds2;
  };
  const commit = useCallback(async (clip, change) => {
    const patchClip = portsRef.current.patchClip;
    if (!patchClip || !canEdit(clip)) return;
    const current = mountRef.current;
    setError(null);
    current?.markDirty(true);
    current?.markSaving(true);
    try {
      await patchClip(clip.id, change);
      mountRef.current?.markSaving(false);
      mountRef.current?.markDirty(false);
      await reload();
    } catch (failure) {
      mountRef.current?.markSaving(false);
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }, [reload]);
  const finishDrag = useCallback(async () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !drag.moved) return;
    const clip = findClip(drag.clipId);
    const times = clip ? overridesRef.current[drag.clipId] : void 0;
    if (!clip || !times) return;
    const change = drag.mode === "move" ? { startSeconds: round(times.start) } : { durationSeconds: round(times.duration) };
    await commit(clip, change);
  }, [commit]);
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;
  useEffect(() => {
    const onMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = (event.clientX - drag.originX) / scale;
      if (delta !== 0) drag.moved = true;
      const next = drag.mode === "move" ? { start: Math.max(0, snap(drag.start + delta)), duration: drag.duration } : { start: drag.start, duration: Math.max(snap(drag.duration + delta), portsRef.current.snapSeconds ?? 0.01) };
      setOverrides((previous) => ({ ...previous, [drag.clipId]: next }));
      mountRef.current?.markDirty(true);
    };
    const onUp = () => {
      if (dragRef.current) void finishDrag();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [scale, finishDrag]);
  const startDrag = (clip, mode) => (event) => {
    if (!canEdit(clip) || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const times = overrides[clip.id] ?? { start: clip.start, duration: clip.duration };
    dragRef.current = { clipId: clip.id, mode, originX: event.clientX, start: times.start, duration: times.duration, moved: false };
    select(clip.id);
  };
  useEffect(() => {
    if (!mount) return;
    return mount.registerNodeAccess({
      getNode: (nodeId) => {
        const clip = findClip(nodeId);
        if (clip) {
          const times = overridesRef.current[clip.id] ?? { start: clip.start, duration: clip.duration };
          const take = laneOf(clip)?.take === true;
          const words = messagesRef.current;
          const span = spanOf(words, times.start, times.duration);
          if (!canEdit(clip)) {
            return {
              type: take ? "take" : "clip",
              attrsSchema: {
                type: "object",
                title: clip.name,
                description: take ? words.t("splicewire-beam-ux::messages.timeline_take_description", span) : words.t("splicewire-beam-ux::messages.timeline_span", span),
                properties: {}
              },
              attrs: {}
            };
          }
          return {
            type: "clip",
            attrsSchema: {
              type: "object",
              title: clip.name,
              properties: {
                startSeconds: { type: "number", title: words.t("splicewire-beam-ux::messages.timeline_start_seconds"), minimum: 0 },
                durationSeconds: { type: "number", title: words.t("splicewire-beam-ux::messages.timeline_length_seconds"), exclusiveMinimum: 0 }
              }
            },
            attrs: { startSeconds: round(times.start), durationSeconds: round(times.duration) }
          };
        }
        const section = findSection(nodeId);
        if (!section) return null;
        return {
          type: "section",
          attrsSchema: {
            type: "object",
            title: section.name,
            description: messagesRef.current.t("splicewire-beam-ux::messages.timeline_section_description", spanOf(messagesRef.current, section.start, section.duration)),
            properties: {}
          },
          attrs: {}
        };
      },
      setNodeAttrs: (nodeId, attrs) => {
        const clip = findClip(nodeId);
        if (!clip || !canEdit(clip)) return;
        const times = overridesRef.current[clip.id] ?? { start: clip.start, duration: clip.duration };
        const change = {};
        const start = typeof attrs.startSeconds === "number" ? round(snap(attrs.startSeconds)) : void 0;
        const duration2 = typeof attrs.durationSeconds === "number" ? round(snap(attrs.durationSeconds)) : void 0;
        if (start !== void 0 && start !== round(times.start)) change.startSeconds = start;
        if (duration2 !== void 0 && duration2 !== round(times.duration)) change.durationSeconds = duration2;
        if (change.startSeconds === void 0 && change.durationSeconds === void 0) return;
        setOverrides((previous) => ({
          ...previous,
          [clip.id]: { start: change.startSeconds ?? times.start, duration: change.durationSeconds ?? times.duration }
        }));
        void commit(clip, change);
      }
    });
  }, [layout.value, readonly, ports, commit]);
  useEffect(() => {
    if (!mount) return;
    return mount.registerRevealHandler((nodeId) => {
      laneRefs.current.get(nodeId)?.scrollIntoView?.({ block: "nearest", inline: "center" });
    });
  }, []);
  useEffect(() => {
    if (!mount) return;
    return mount.registerFlush(async () => {
      if (dragRef.current) await finishDrag();
    });
  }, [finishDrag]);
  if (!doc) return /* @__PURE__ */ jsx2("div", { "data-otio-timeline": "empty", children: m.t("splicewire-beam-ux::messages.timeline_empty") });
  if (layout.error || !layout.value) {
    return /* @__PURE__ */ jsx2("div", { "data-otio-timeline": "error", role: "alert", children: layout.error ? say(m, layout.error) : null });
  }
  const { duration, sections, lanes } = layout.value;
  const width = Math.max(duration * scale, 1);
  const selectedNode = nodeFor(selected, layout.value);
  const actions = selectedNode && !readonly && ports.actionsFor && doc ? ports.actionsFor(selectedNode, doc) : [];
  const box = (start, length) => ({
    position: "absolute",
    left: start * scale,
    width: Math.max(length * scale, 2),
    top: 2,
    bottom: 2
  });
  return /* @__PURE__ */ jsxs("div", { "data-otio-timeline": "", style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: [
    /* @__PURE__ */ jsx2("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs("div", { style: { width, minWidth: "100%" }, children: [
      sections.length > 0 ? /* @__PURE__ */ jsx2("div", { role: "group", "aria-label": m.t("splicewire-beam-ux::messages.timeline_sections"), "data-timeline-ruler": "", style: { position: "relative", height: 28 }, children: sections.map((section, index) => /* @__PURE__ */ jsx2(
        "button",
        {
          type: "button",
          "data-timeline-section": section.id,
          "aria-pressed": selected === section.id,
          "aria-label": m.t("splicewire-beam-ux::messages.timeline_section_button", { name: section.name, ...spanOf(m, section.start, section.duration) }),
          onClick: () => select(section.id),
          style: { ...box(section.start, section.duration), ...sectionPaint(section.color, index, selected === section.id) },
          children: section.name
        },
        section.id
      )) }) : null,
      lanes.map((lane) => /* @__PURE__ */ jsx2("div", { role: "group", "aria-label": lane.label, "data-timeline-lane": lane.index, style: { display: "flex", alignItems: "stretch" }, children: /* @__PURE__ */ jsx2(
        "div",
        {
          style: { position: "relative", height: 36, width },
          onClick: (event) => {
            if (event.target === event.currentTarget) select(null);
          },
          children: lane.clips.map((clip) => {
            const times = overrides[clip.id] ?? { start: clip.start, duration: clip.duration };
            const editable = canEdit(clip);
            const peaks = ports.peaksFor?.(clip.item) ?? null;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                ref: (element) => {
                  if (element) laneRefs.current.set(clip.id, element);
                  else laneRefs.current.delete(clip.id);
                },
                "data-timeline-clip": clip.id,
                "data-editable": editable ? "" : void 0,
                style: box(times.start, times.duration),
                children: [
                  /* @__PURE__ */ jsx2(
                    "button",
                    {
                      type: "button",
                      "aria-pressed": selected === clip.id,
                      "aria-label": m.t("splicewire-beam-ux::messages.timeline_clip_button", { lane: lane.label, name: clip.name, ...spanOf(m, times.start, times.duration) }),
                      onClick: () => select(clip.id),
                      onMouseDown: editable ? startDrag(clip, "move") : void 0,
                      style: { width: "100%", height: "100%", cursor: editable ? "grab" : "default", overflow: "hidden", ...clipPaint(selected === clip.id) },
                      children: peaks ? /* @__PURE__ */ jsx2(Peaks, { peaks }) : null
                    }
                  ),
                  editable ? /* @__PURE__ */ jsx2(
                    "span",
                    {
                      role: "separator",
                      "aria-orientation": "vertical",
                      "aria-label": m.t("splicewire-beam-ux::messages.timeline_trim", { name: clip.name }),
                      "data-timeline-trim": "",
                      onMouseDown: startDrag(clip, "trim"),
                      style: { position: "absolute", right: 0, top: 0, bottom: 0, width: 6, cursor: "ew-resize" }
                    }
                  ) : null
                ]
              },
              clip.id
            );
          })
        }
      ) }, lane.id))
    ] }) }),
    error ? /* @__PURE__ */ jsx2("p", { role: "alert", "data-timeline-refusal": "", children: say(m, error) }) : null,
    notice2 ? /* @__PURE__ */ jsx2("p", { role: "status", "data-timeline-notice": "", children: notice2 }) : null,
    actions.length > 0 ? /* @__PURE__ */ jsx2(
      Actions,
      {
        actions,
        onDone: async (message) => {
          setError(null);
          setNotice(message);
          await reload();
        },
        onRefused: (message) => {
          setNotice(null);
          setError(message);
        }
      }
    ) : null,
    ports.versions ? /* @__PURE__ */ jsx2(
      Versions,
      {
        readonly,
        onRestored: async () => {
          select(null);
          await reload();
        },
        onRefused: setError
      }
    ) : null
  ] });
}
function nodeFor(id, layout) {
  if (!id) return null;
  for (const lane of layout.lanes) {
    const clip = lane.clips.find((candidate) => candidate.id === id);
    if (clip) return { kind: "clip", clip, editable: lane.editable, take: lane.take };
  }
  const section = layout.sections.find((candidate) => candidate.id === id);
  return section ? { kind: "section", section } : null;
}
function Peaks({ peaks }) {
  const top = Math.max(...peaks.map(Math.abs), 1e-9);
  return /* @__PURE__ */ jsx2("span", { "data-timeline-peaks": "", "aria-hidden": "true", style: { display: "flex", alignItems: "center", height: "100%", gap: 1 }, children: peaks.map((peak, index) => /* @__PURE__ */ jsx2("span", { style: { flex: 1, height: `${Math.abs(peak) / top * 100}%`, background: "currentColor" } }, index)) });
}
function Actions({
  actions,
  onDone,
  onRefused
}) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsx2("div", { role: "group", "aria-label": m.t("splicewire-beam-ux::messages.timeline_actions"), "data-timeline-actions": "", children: actions.map((action) => /* @__PURE__ */ jsx2(ActionControl, { action, onDone, onRefused }, action.key)) });
}
function ActionControl({ action, onDone, onRefused }) {
  const m = useBeamUxMessages();
  const [choice, setChoice] = useState(action.choices?.[0]?.value);
  const [busy, setBusy] = useState(false);
  if (action.unavailable) {
    return /* @__PURE__ */ jsx2("p", { "data-timeline-action-unavailable": action.key, children: m.t("splicewire-beam-ux::messages.timeline_action_unavailable", { label: action.label, reason: action.unavailable }) });
  }
  return /* @__PURE__ */ jsxs("div", { "data-timeline-action": action.key, children: [
    action.choices ? /* @__PURE__ */ jsxs("label", { children: [
      action.choiceLabel ?? m.t("splicewire-beam-ux::messages.timeline_choice_from"),
      " ",
      /* @__PURE__ */ jsx2("select", { value: choice, onChange: (event) => setChoice(event.target.value), children: action.choices.map((option) => /* @__PURE__ */ jsx2("option", { value: option.value, children: option.label }, option.value)) })
    ] }) : null,
    /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        disabled: busy,
        onClick: async () => {
          setBusy(true);
          try {
            const result = await action.run(choice);
            await onDone(result.message);
          } catch (failure) {
            onRefused(failure instanceof Error ? failure.message : String(failure));
          } finally {
            setBusy(false);
          }
        },
        children: action.label
      }
    )
  ] });
}
function Versions({ readonly, onRestored, onRefused }) {
  const ports = useTimelinePorts();
  const m = useBeamUxMessages();
  const port = ports.versions;
  const [versions, setVersions] = useState([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setVersions(await port.list());
    } catch (failure) {
      onRefused(failure instanceof Error ? failure.message : String(failure));
    }
  }, [port, onRefused]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const run = async (write, after) => {
    setBusy(true);
    try {
      await write();
      await after?.();
      await refresh();
    } catch (failure) {
      onRefused(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs("section", { "aria-label": m.t("splicewire-beam-ux::messages.timeline_versions"), "data-timeline-versions": "", children: [
    /* @__PURE__ */ jsx2("ul", { children: versions.map((version) => /* @__PURE__ */ jsxs("li", { "data-timeline-version": version.ref, children: [
      version.label || version.ref,
      version.head ? ` ${m.t("splicewire-beam-ux::messages.timeline_version_current")}` : null,
      !readonly && !version.head ? /* @__PURE__ */ jsx2("button", { type: "button", disabled: busy, onClick: () => run(() => port.restore(version.ref), onRestored), children: m.t("splicewire-beam-ux::messages.timeline_restore", { label: version.label || version.ref }) }) : null
    ] }, version.ref)) }),
    !readonly ? /* @__PURE__ */ jsxs(
      "form",
      {
        onSubmit: (event) => {
          event.preventDefault();
          const name = label.trim();
          if (!name) return;
          void run(() => port.snapshot(name), async () => setLabel(""));
        },
        children: [
          /* @__PURE__ */ jsxs("label", { children: [
            m.t("splicewire-beam-ux::messages.timeline_version_label"),
            " ",
            /* @__PURE__ */ jsx2("input", { value: label, onChange: (event) => setLabel(event.target.value) })
          ] }),
          /* @__PURE__ */ jsx2("button", { type: "submit", disabled: busy || label.trim() === "", children: m.t("splicewire-beam-ux::messages.timeline_snapshot") })
        ]
      }
    ) : null
  ] });
}

// src/timeline/widgetRegistry.ts
import { createWidgetRegistry } from "@schemastud/seam";
var TIMELINE_WIDGET_NAME = "otio-timeline";
function registerTimelineWidget(registry = createWidgetRegistry(), widget = TimelineWidget) {
  registry.registerWidget(TIMELINE_WIDGET_NAME, widget);
  return registry;
}
export {
  OtioTimeError,
  TIMELINE_WIDGET_NAME,
  TimelinePortsProvider,
  TimelineWidget,
  defaultClipId,
  defaultSectionId,
  itemKind,
  layoutTimeline,
  registerTimelineWidget,
  seconds,
  useTimelinePorts
};
//# sourceMappingURL=timeline.js.map