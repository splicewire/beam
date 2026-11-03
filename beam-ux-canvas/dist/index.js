// src/particle-object.tsx
import { useCallback as useCallback2 } from "react";

// src/fx-canvas.tsx
import { useContext as useContext2, useEffect as useEffect2, useRef as useRef2 } from "react";

// src/capability.ts
import { useEffect, useState, useSyncExternalStore } from "react";
var webglProbe = null;
var warned = false;
var listeners = /* @__PURE__ */ new Set();
function canWebGl() {
  if (webglProbe !== null) return webglProbe;
  if (typeof document === "undefined") return webglProbe = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    webglProbe = gl != null;
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}
function canHtmlInCanvas() {
  return false;
}
function detectCapabilityTier() {
  return canWebGl() ? "full" : "off";
}
function pinCapabilityOff(site, error) {
  webglProbe = false;
  if (!warned) {
    warned = true;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[beam-ux-canvas] effect disabled: ${site}: ${message}`);
  }
  for (const listener of [...listeners]) listener();
}
function subscribeCapability(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function useCapabilityTier() {
  return useSyncExternalStore(subscribeCapability, detectCapabilityTier, () => "off");
}
function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => prefersReducedMotion());
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

// src/fx-boundary.tsx
import { createContext, useCallback, useContext, useMemo, useRef } from "react";

// src/renderers.ts
function selectRenderer(tier) {
  if (tier === "off") return null;
  return canHtmlInCanvas() ? "html-in-canvas" : "webgl-overlay";
}

// src/tiers.ts
var RANK = { off: 0, lite: 1, full: 2 };
var BY_RANK = ["off", "lite", "full"];
function minTier(a, b) {
  return RANK[a] <= RANK[b] ? a : b;
}
function minOfTiers(tiers) {
  return BY_RANK[Math.min(...tiers.map((t) => RANK[t]), RANK.full)];
}
var SURFACE = {
  operate: { default: "off", ceiling: "lite" },
  persuade: { default: "full", ceiling: "full" },
  experience: { default: "full", ceiling: "full" }
};
function resolveTier({
  surface,
  userTier,
  capabilityTier,
  reducedMotion
}) {
  if (reducedMotion) return "off";
  const cfg = SURFACE[surface];
  const base = userTier ?? cfg.default;
  return minOfTiers([cfg.ceiling, base, capabilityTier]);
}

// src/fx-boundary.tsx
import { jsx } from "react/jsx-runtime";
var FxContext = createContext(null);
function FxBoundary({ mode, userTier = null, onUserTierChange, forceReducedMotion = false, children }) {
  const osReducedMotion = usePrefersReducedMotion();
  const reducedMotion = osReducedMotion || forceReducedMotion;
  const capabilityTier = useCapabilityTier();
  const onChange = useRef(onUserTierChange);
  onChange.current = onUserTierChange;
  const setUserTier = useCallback((tier) => onChange.current?.(tier), []);
  const value = useMemo(() => {
    const effectiveTier = resolveTier({ surface: mode, userTier, capabilityTier, reducedMotion });
    return {
      surface: mode,
      effectiveTier,
      renderer: selectRenderer(effectiveTier),
      forcedOff: effectiveTier === "off" && (reducedMotion || capabilityTier === "off"),
      userTier,
      setUserTier
    };
  }, [mode, userTier, capabilityTier, reducedMotion, setUserTier]);
  return /* @__PURE__ */ jsx(FxContext.Provider, { value, children });
}
function useFx() {
  const ctx = useContext(FxContext);
  if (!ctx) throw new Error("useFx must be used within an <FxBoundary>");
  return ctx;
}

// src/load-three.ts
var pending = null;
function loadThree() {
  pending ??= import("three").catch((error) => {
    pending = null;
    throw error;
  });
  return pending;
}

// src/fx-canvas.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var DEFAULT_STYLE = { position: "absolute", inset: 0, pointerEvents: "none" };
var CANVAS_CSS = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
var MEASURE_CAP = 1e4;
var measured = 0;
function pointerKind() {
  if (typeof window === "undefined" || !window.matchMedia) return "none";
  if (window.matchMedia("(pointer: coarse)").matches) return "coarse";
  if (window.matchMedia("(pointer: fine)").matches) return "fine";
  return "none";
}
function measureTick(start) {
  try {
    performance.measure("fx:tick", { start, end: performance.now() });
    if (++measured >= MEASURE_CAP) {
      measured = 0;
      performance.clearMeasures("fx:tick");
    }
  } catch {
  }
}
function disposeGraph(root, done) {
  const once = (resource) => {
    if (!resource || done.has(resource)) return;
    done.add(resource);
    resource.dispose?.();
  };
  root.traverse((object) => {
    const o = object;
    once(o.geometry);
    const materials = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value && typeof value === "object" && value.isTexture) {
          once(value);
        }
      }
      once(material);
    }
  });
}
function FxCanvas({
  scene,
  paused = false,
  playing = false,
  exclusions,
  pointerMargin = 0,
  rootMargin = "25%",
  className,
  style
}) {
  const fx = useContext2(FxContext);
  const reducedMotion = usePrefersReducedMotion();
  const capability = useCapabilityTier();
  const tier = reducedMotion || capability === "off" ? "off" : fx ? fx.effectiveTier : "full";
  const ref = useRef2(null);
  const latest = useRef2({ paused, playing, exclusions, pointerMargin });
  latest.current = { paused, playing, exclusions, pointerMargin };
  const controller = useRef2(null);
  useEffect2(() => {
    controller.current?.update();
  }, [paused]);
  useEffect2(() => {
    controller.current?.wake();
  }, [playing]);
  useEffect2(() => {
    const container = ref.current;
    if (!container || tier === "off") return;
    let disposed = false;
    let built = false;
    let running = false;
    let parked = false;
    let lost = false;
    let visible = false;
    let hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    let raf = 0;
    let startedAt = -1;
    let lastAt = -1;
    let renderer = null;
    let graph = null;
    let camera = null;
    let active = null;
    const released = /* @__PURE__ */ new WeakSet();
    const dprCap = tier === "full" ? 2 : 1.5;
    const state = {
      tier,
      dpr: Math.min(window.devicePixelRatio || 1, dprCap),
      width: 1,
      height: 1,
      exclusions: [],
      pointerKind: pointerKind(),
      scene: null,
      renderer: null,
      canvas: null,
      requestFrame
    };
    const ctx = state;
    const pointer = { x: -1e9, y: -1e9, active: false };
    const inputs = { pointer, playing: latest.current.playing };
    function shouldRun() {
      return built && !disposed && !lost && visible && !hidden && !parked && !latest.current.paused;
    }
    function update() {
      if (shouldRun()) start();
      else stop();
    }
    function start() {
      if (running) return;
      running = true;
      lastAt = -1;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }
    function requestFrame() {
      parked = false;
      update();
    }
    function tick(now) {
      if (!running || !active || !renderer || !graph || !camera) return;
      const t0 = performance.now();
      if (startedAt < 0) startedAt = now;
      const dt = lastAt < 0 ? 0 : Math.min((now - lastAt) / 1e3, 0.1);
      lastAt = now;
      inputs.playing = latest.current.playing;
      const keep = active.frame((now - startedAt) / 1e3, dt, inputs);
      renderer.render(graph, camera);
      measureTick(t0);
      if (keep === false) {
        parked = true;
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    function measure() {
      const rect = container.getBoundingClientRect();
      state.width = container.clientWidth || 1;
      state.height = container.clientHeight || 1;
      const rects = [];
      for (const el of latest.current.exclusions?.() ?? []) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        rects.push({ x: r.left - rect.left, y: r.top - rect.top, width: r.width, height: r.height });
      }
      state.exclusions = rects;
      renderer?.setSize(state.width, state.height, false);
    }
    function onLost(event) {
      event.preventDefault();
      lost = true;
      stop();
      requestAnimationFrame(() => {
        if (lost && !disposed) fail("context-lost", new Error("webglcontextlost with no webglcontextrestored within one frame"));
      });
    }
    function onRestored() {
      lost = false;
      requestFrame();
    }
    function teardownRenderer() {
      stop();
      if (graph) disposeGraph(graph, released);
      if (renderer) {
        const canvas = renderer.domElement;
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      }
      renderer = null;
      graph = null;
      camera = null;
      active = null;
      built = false;
    }
    function fail(site, error) {
      if (disposed) return;
      teardownRenderer();
      pinCapabilityOff(site, error);
    }
    async function mount() {
      let three;
      let created;
      try {
        [three, created] = await Promise.all([loadThree(), Promise.resolve().then(() => scene())]);
      } catch (error) {
        return fail("import", error);
      }
      if (disposed || !canWebGl()) return;
      try {
        renderer = new three.WebGLRenderer({ alpha: true, antialias: true });
      } catch (error) {
        return fail("renderer", error);
      }
      const mine = renderer;
      renderer.setPixelRatio(state.dpr);
      renderer.setClearColor(0, 0);
      const canvas = renderer.domElement;
      canvas.style.cssText = CANVAS_CSS;
      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", onRestored);
      container.appendChild(canvas);
      const own = new three.Scene();
      graph = own;
      state.scene = own;
      state.renderer = renderer;
      state.canvas = canvas;
      measure();
      const tornDown = () => disposed || renderer !== mine;
      let cam;
      try {
        cam = await created.build(three, ctx);
      } catch (error) {
        if (tornDown()) return disposeGraph(own, released);
        console.warn(`[beam-ux-canvas] scene failed: ${error instanceof Error ? error.message : String(error)}`);
        teardownRenderer();
        return;
      }
      if (tornDown()) return disposeGraph(own, released);
      camera = cam;
      active = created;
      built = true;
      mine.render(own, cam);
      update();
    }
    const approach = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        approach.disconnect();
        void mount();
      },
      { rootMargin }
    );
    approach.observe(container);
    const viewport = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        const wasVisible = visible;
        visible = entry.isIntersecting;
        if (visible && !wasVisible) parked = false;
        update();
      },
      { threshold: 0.01 }
    );
    viewport.observe(container);
    const resize = new ResizeObserver(() => {
      measure();
      if (built) requestFrame();
    });
    resize.observe(container);
    for (const el of latest.current.exclusions?.() ?? []) if (el) resize.observe(el);
    const onVisibility = () => {
      hidden = document.visibilityState === "hidden";
      update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const onMove = (e) => {
      const r = container.getBoundingClientRect();
      const m = latest.current.pointerMargin;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      pointer.x = x;
      pointer.y = y;
      pointer.active = x >= -m && x <= r.width + m && y >= -m && y <= r.height + m;
      if (pointer.active && parked) requestFrame();
    };
    const onLeave = () => {
      pointer.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    controller.current = {
      update,
      wake() {
        if (built && parked) requestFrame();
      }
    };
    return () => {
      disposed = true;
      controller.current = null;
      approach.disconnect();
      viewport.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      teardownRenderer();
    };
  }, [tier, scene]);
  return /* @__PURE__ */ jsx2("div", { ref, "aria-hidden": "true", className, style: style ?? (className === void 0 ? DEFAULT_STYLE : void 0) });
}

// src/particle-object.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var STIFFNESS = 0.022;
var DAMPING = 0.86;
var REPEL = 2600;
var REPEL_RADIUS = 70;
var REST_ENERGY = 0.02;
function sampleHomes(img, target) {
  const bufW = 220;
  const bufH = Math.max(1, Math.round(bufW * img.height / img.width));
  const c = document.createElement("canvas");
  c.width = bufW;
  c.height = bufH;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, bufW, bufH);
  const data = ctx.getImageData(0, 0, bufW, bufH).data;
  const opaque = [];
  for (let y = 0; y < bufH; y++) {
    for (let x = 0; x < bufW; x++) {
      if (data[(y * bufW + x) * 4 + 3] > 128) {
        opaque.push(x / bufW, y / bufH);
      }
    }
  }
  const total = opaque.length / 2;
  const stride = Math.max(1, Math.ceil(total / target));
  const homes = [];
  for (let i = 0; i < total; i += stride) {
    homes.push(opaque[i * 2], opaque[i * 2 + 1]);
  }
  return new Float32Array(homes);
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`ParticleObject could not load ${src}`));
    img.src = src;
  });
}
function createParticleScene({ src, tint, count, animateIdle }) {
  let ctx;
  let camera;
  let geometry;
  let homesNorm = new Float32Array(0);
  let homesPx = new Float32Array(0);
  let velocities = new Float32Array(0);
  let positions = new Float32Array(0);
  let markW = 1;
  let markH = 1;
  let laidOutW = 0;
  let laidOutH = 0;
  function layout() {
    const { width, height } = ctx;
    laidOutW = width;
    laidOutH = height;
    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = height;
    camera.updateProjectionMatrix();
    const n = homesNorm.length / 2;
    const markAspect = markW / markH;
    const boxAspect = width / height;
    let dw = width;
    let dh = height;
    if (markAspect > boxAspect) dh = width / markAspect;
    else dw = height * markAspect;
    const ox = (width - dw) / 2;
    const oy = (height - dh) / 2;
    for (let i = 0; i < n; i++) {
      homesPx[i * 2] = ox + homesNorm[i * 2] * dw;
      homesPx[i * 2 + 1] = oy + homesNorm[i * 2 + 1] * dh;
    }
  }
  return {
    async build(three, sceneCtx) {
      ctx = sceneCtx;
      camera = new three.OrthographicCamera(0, 1, 0, 1, -1, 1);
      const img = await loadImage(src);
      markW = img.width;
      markH = img.height;
      homesNorm = sampleHomes(img, count);
      const n = homesNorm.length / 2;
      homesPx = new Float32Array(n * 2);
      velocities = new Float32Array(n * 2);
      positions = new Float32Array(n * 3);
      layout();
      for (let i = 0; i < n; i++) {
        positions[i * 3] = homesPx[i * 2];
        positions[i * 3 + 1] = homesPx[i * 2 + 1];
        positions[i * 3 + 2] = 0;
      }
      geometry = new three.BufferGeometry();
      geometry.setAttribute("position", new three.BufferAttribute(positions, 3));
      const material = new three.PointsMaterial({
        color: new three.Color(tint),
        size: ctx.dpr * 2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.92
      });
      ctx.scene.add(new three.Points(geometry, material));
      return camera;
    },
    frame(_t, _dt, { pointer }) {
      if (ctx.width !== laidOutW || ctx.height !== laidOutH) layout();
      const n = homesPx.length / 2;
      const pos = positions;
      let energy = 0;
      for (let i = 0; i < n; i++) {
        const ix = i * 2;
        const px = pos[i * 3];
        const py = pos[i * 3 + 1];
        let ax = (homesPx[ix] - px) * STIFFNESS;
        let ay = (homesPx[ix + 1] - py) * STIFFNESS;
        if (pointer.active) {
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL_RADIUS * REPEL_RADIUS) {
            const d = Math.sqrt(d2) + 1e-3;
            const f = REPEL * (1 - d / REPEL_RADIUS) / d;
            ax += dx * f;
            ay += dy * f;
          }
        }
        const vx = (velocities[ix] + ax) * DAMPING;
        const vy = (velocities[ix + 1] + ay) * DAMPING;
        velocities[ix] = vx;
        velocities[ix + 1] = vy;
        energy += vx * vx + vy * vy;
        pos[i * 3] = px + vx;
        pos[i * 3 + 1] = py + vy;
      }
      geometry.attributes.position.needsUpdate = true;
      if (!animateIdle && !pointer.active && energy / Math.max(n, 1) < REST_ENERGY) return false;
    }
  };
}
function ParticleObject({ src, tint, count = 3500, animateIdle = true, className }) {
  const scene = useCallback2(() => createParticleScene({ src, tint, count, animateIdle }), [src, tint, count, animateIdle]);
  return /* @__PURE__ */ jsx3(FxCanvas, { scene, pointerMargin: REPEL_RADIUS, className: `pointer-events-none absolute inset-0 ${className ?? ""}` });
}

// src/fx-effect.tsx
import { useContext as useContext3 } from "react";
import { Fragment, jsx as jsx4, jsxs } from "react/jsx-runtime";
var WRAPPER_STYLE = { position: "relative", isolation: "isolate" };
var LAYER_STYLE = {
  // A negative z-index inside the wrapper's own stacking context (isolation) paints above the
  // wrapper's background and beneath its in-flow children.
  under: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: -1 },
  over: { position: "absolute", inset: 0, pointerEvents: "none" }
};
function FxEffect({ kind, children, overlay, placement = "over", className }) {
  const fx = useContext3(FxContext);
  if (!fx || fx.effectiveTier === "off" || fx.renderer === null || kind === "noop") {
    return /* @__PURE__ */ jsx4(Fragment, { children });
  }
  const overlayNode = typeof overlay === "function" ? overlay(fx) : overlay;
  if (overlayNode == null || overlayNode === false) return /* @__PURE__ */ jsx4(Fragment, { children });
  const layer = /* @__PURE__ */ jsx4("div", { "data-fx-overlay": placement, "aria-hidden": "true", style: LAYER_STYLE[placement], children: overlayNode });
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className,
      style: WRAPPER_STYLE,
      "data-fx-kind": kind,
      "data-fx-tier": fx.effectiveTier,
      "data-fx-renderer": fx.renderer,
      "data-fx-placement": placement,
      children: [
        placement === "under" && layer,
        children,
        placement === "over" && layer
      ]
    }
  );
}
export {
  FxBoundary,
  FxCanvas,
  FxEffect,
  ParticleObject,
  SURFACE,
  canHtmlInCanvas,
  canWebGl,
  detectCapabilityTier,
  loadThree,
  minOfTiers,
  minTier,
  prefersReducedMotion,
  resolveTier,
  selectRenderer,
  useCapabilityTier,
  useFx,
  usePrefersReducedMotion
};
//# sourceMappingURL=index.js.map