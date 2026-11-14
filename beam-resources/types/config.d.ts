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

export type ConfigTier = 'package' | 'host' | 'provider' | 'operator' | 'tenant';

export type ConfigEffect = 'live' | 'reload' | 'deploy';

export type ConfigMerge = 'replace' | 'deep' | 'extend';
