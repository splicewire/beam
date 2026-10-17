import { defaultCanvasConfig } from '@splicewire/beam-ux/editor';
import { defaultComponents } from './registry';
export const canvasConfig = { ...defaultCanvasConfig, get registry() { return defaultComponents(); } };
