import { DemoHero, DemoFeatureRow } from "./islands";
import { richFieldComponents } from '../bindings/rich-field';
export function defaultComponents() {
  return { DemoHero, DemoFeatureRow, ...richFieldComponents };
}
