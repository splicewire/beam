type ResolvedAppearance = 'light' | 'dark';
type Appearance = ResolvedAppearance | 'system';
type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};
declare function initializeTheme(): void;
declare function useAppearance(): UseAppearanceReturn;

export { type Appearance, type ResolvedAppearance, type UseAppearanceReturn, initializeTheme, useAppearance };
