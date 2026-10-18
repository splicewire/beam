import { defaultCanvasConfig } from '@splicewire/beam-ux/editor';
import type { CanvasConfig } from '@splicewire/beam-ux/canvas';
import { defaultComponents } from './registry';
export const canvasConfig: CanvasConfig = { ...defaultCanvasConfig, get registry() { return defaultComponents(); } };
