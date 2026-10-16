// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type BeamUxEntryBodyData = {
slug: string,
id: string,
type: string,
format: string,
schema: Record<string, any> | null,
body: Record<string, any>,
source: string | null,
compileError: string | null,
};

export type EntryVersionData = {
id: string,
version: number,
readable: string,
label: string | null,
createdBy: string | null,
createdAt: string | null,
isHead: boolean,
isPublished: boolean,
};

export type JsonNode = JsonBlockNode & {
kind: 'block',
} | JsonTextNode & {
kind: 'text',
} | JsonOpaqueNode & {
kind: 'opaque',
};

export type JsonBlockNode = {
name: string | null,
isComponent: boolean,
props: JsonProp[],
children: JsonNode[],
dynamic: boolean,
kind: 'block',
};

export type JsonTextNode = {
value: string,
kind: 'text',
};

export type JsonOpaqueNode = {
reason: OpaqueReason,
source: string,
kind: 'opaque',
};

export type JsonProp = {
name: string,
kind: PropKind,
value: string | number | boolean | null,
};

export type PropKind = 'boolean-shorthand' | 'string' | 'number' | 'boolean' | 'expression';

export type OpaqueReason = 'map' | 'conditional' | 'ternary' | 'expression' | 'spread';
