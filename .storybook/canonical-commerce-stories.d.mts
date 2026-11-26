export const commerceStoryFiles: string[];
type CommerceInput = { packageRoot: string; stories: string[] };
export function canonicalCommerceInput(manifestPath: string, options?: { optional?: false }): CommerceInput;
export function canonicalCommerceInput(manifestPath: string, options: { optional: boolean }): CommerceInput | null;
export function workspaceStoryPatterns(workspaces: string[]): string[];
