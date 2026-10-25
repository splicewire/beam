// Checked by the package tsc; no runtime or parallel hand-declared node model.
import type { JsonNode as GeneratedNode, EntryVersionData } from '@splicewire/beam-resources/types/beam-ux';
import type { JsonNode } from '../blockdoc/json';
import type { EntryVersion } from '../types';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
export type NodeIsGenerated = Assert<Equal<JsonNode, GeneratedNode>>;
export type VersionIsGenerated = Assert<Equal<EntryVersion, EntryVersionData>>;
export type RecordingIsTyped = Assert<Equal<IsAny<NonNullable<EntryVersion['recordings']>[number]>, false>>;
