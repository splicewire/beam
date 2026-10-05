/**
 * The install's brand as the host shares it (`brand`, laravel-beam's M8 `BrandData` through `Brand::for()`;
 * ux-walkthrough IA-14). The shell renders these fields and spells no brand of its own.
 */
export type Brand = {
    name: string;
    logo: string | null;
    titleTemplate: string | null;
    legalEntity: string | null;
    passkeyCopy: string;
};
