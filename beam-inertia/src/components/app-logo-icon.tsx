import type { SVGAttributes } from "react";
import { getBeamInertiaConfig } from "../config";
import { useBrand } from "../hooks/use-brand";

/**
 * The brand's mark (ux-walkthrough UX-03b, M8): the brand's `logo` URL when the host declares one, else a mark component
 * the host passes, else a neutral monogram of the brand's name. The package draws no mark of its own; every starter used
 * to pass the Laravel starter kit's logo here.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
  const brand = useBrand();
  const Logo = getBeamInertiaConfig().logo;

  if (brand.logo) {
    return (
      <img src={brand.logo} alt={brand.name} className={props.className} />
    );
  }
  if (Logo) {
    return <Logo {...props} />;
  }

  const initial = brand.name.trim().charAt(0).toUpperCase();

  return initial ? (
    <span
      aria-hidden="true"
      className={`${
        props.className ?? ""
      } inline-flex items-center justify-center font-semibold leading-none`}
    >
      {initial}
    </span>
  ) : null;
}
