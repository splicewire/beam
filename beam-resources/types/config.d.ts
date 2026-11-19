// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type ConfigSectionData = {
id: string,
root: string,
title: string,
description: string,
owner: string,
files: ConfigSectionFilesData,
schema: Record<string, any>,
values: Record<string | number, any>,
keys: ConfigKeyData[],
shadowedPackageKeys: string[],
counts: ConfigSectionCountsData,
overrides: ConfigOverrideData[],
pins: ConfigPinsData,
notice: string | null,
tier: ConfigTier,
};

export type ConfigKeyData = {
pointer: string,
value: any,
tier: ConfigTier,
hostShadowsPackage: boolean,
layers: ConfigLayerData[],
env: ConfigEnvData | null,
effect: ConfigEffect,
ceiling: ConfigTier,
overridable: boolean,
secret: boolean,
set: boolean,
merge: ConfigMerge,
lock: ConfigLockData | null,
};

export type ConfigLayerData = {
tier: ConfigTier,
value: any,
source: string | null,
shadowed: boolean,
removed: boolean,
};

export type ConfigEnvData = {
name: string,
set: boolean | null,
file: string | null,
line: number | null,
};

export type ConfigSectionFilesData = {
package: string | null,
host: string | null,
};

export type ConfigSectionCountsData = {
keys: number,
overridable: number,
deploy: number,
secrets: number,
envBound: number,
};

export type ConfigOverrideData = {
pointer: string,
op: ConfigOverrideOp,
value: any,
secret: boolean,
set: boolean,
setAt: string | null,
revision: string,
};

export type ConfigPinsData = {
draft: number | null,
published: number | null,
draftPending: boolean,
};

export type ConfigLockData = {
pointer: string,
reason: string,
lockedAt: string | null,
};

export type ConfigVersionData = {
id: string,
version: number,
label: string | null,
createdBy: string | null,
createdAt: string | null,
draft: boolean,
published: boolean,
};

export type ConfigVersionsData = {
root: string,
versions: ConfigVersionData[],
};

export type ConfigSaveDraftInputData = {
root: string,
pointer: string,
op: ConfigOverrideOp,
value: string | null,
};

export type ConfigRestoreInputData = {
root: string,
version: number,
};

export type ConfigLockInputData = {
root: string,
pointer: string,
locked: boolean,
reason: string | null,
};

export type ConfigSectionRefInputData = {
root: string,
};

export type ConfigTier = 'package' | 'host' | 'provider' | 'operator' | 'tenant';

export type ConfigEffect = 'live' | 'reload' | 'deploy';

export type ConfigMerge = 'replace' | 'deep' | 'extend';

export type ConfigOverrideOp = 'set' | 'null' | 'unset';
