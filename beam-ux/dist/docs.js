import {
  ArtifactChrome,
  BUILTIN_LAYOUTS,
  BUILTIN_TEMPLATES,
  CHROME_LAYOUTS_ROOT,
  CHROME_TEMPLATES_ROOT,
  DOCS_TEMPLATE_CSS,
  ProseTemplate,
  SpreadTemplate,
  chromeRegistries,
  clearChromeRegistry,
  configureEntryPage,
  entryPageConfig,
  layoutRegistrant,
  registerChrome,
  registerLayout,
  registerTemplate,
  registeredChromeNames,
  resetEntryPageConfig,
  resolveLayout,
  resolveTemplate,
  templateRegistrant
} from "./chunk-R37KG5MV.js";
import "./chunk-Y6NKQXDT.js";
import "./chunk-5APTQIDU.js";
import "./chunk-YC5ZNKLO.js";
import "./chunk-PZNSQ73I.js";
import "./chunk-J4K4YBKB.js";
import "./chunk-2NOVFPER.js";
import "./chunk-YBGMJB3T.js";

// src/docs/snapshot.ts
import { createRegistryIndex, snapshotRegistryIndex } from "@schemastud/registry";
var DESCRIBED_BY = "@splicewire/beam-ux";
var keyData = (key) => ({ segments: [...key.segments], display: key.display });
function chromeRegistrySnapshot() {
  const { layouts, templates } = chromeRegistries();
  const index = createRegistryIndex().describe(layouts, DESCRIBED_BY).describe(templates, DESCRIBED_BY);
  return {
    ...snapshotRegistryIndex(index),
    builtins: [
      { root: keyData(layouts.declaration.root), names: Object.keys(BUILTIN_LAYOUTS) },
      { root: keyData(templates.declaration.root), names: Object.keys(BUILTIN_TEMPLATES) }
    ]
  };
}
export {
  ArtifactChrome,
  BUILTIN_LAYOUTS,
  BUILTIN_TEMPLATES,
  CHROME_LAYOUTS_ROOT,
  CHROME_TEMPLATES_ROOT,
  DOCS_TEMPLATE_CSS,
  ProseTemplate,
  SpreadTemplate,
  chromeRegistrySnapshot,
  clearChromeRegistry,
  configureEntryPage,
  entryPageConfig,
  layoutRegistrant,
  registerChrome,
  registerLayout,
  registerTemplate,
  registeredChromeNames,
  resetEntryPageConfig,
  resolveLayout,
  resolveTemplate,
  templateRegistrant
};
//# sourceMappingURL=docs.js.map