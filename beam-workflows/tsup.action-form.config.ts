import { defineConfig } from "tsup";
export default defineConfig({
  entry: { "action-form": "src/action-form.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: false,
  // The messages runtime is the host's one instance (a peer), listed explicitly (REVIEW-30W2); the package catalog is
  // imported through the package's own ./messages subpath and kept external too, so this entry does not inline it
  // (root's condition, localization 30 W3).
  external: [
    "react", "react/jsx-runtime", "react-dom", "@schemastud/ui",
    "@schemastud/messages", "@schemastud/messages/react", "@splicewire/beam-workflows/messages.js",
  ],
});
