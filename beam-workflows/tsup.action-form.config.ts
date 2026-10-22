import { defineConfig } from "tsup";
export default defineConfig({
  entry: { "action-form": "src/action-form.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: false,
  external: ["react", "react/jsx-runtime", "react-dom", "@schemastud/ui"],
});
