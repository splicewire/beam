import type { SVGAttributes } from 'react';
import { getBeamInertiaConfig } from '../config';
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    const Logo = getBeamInertiaConfig().logo;
    return Logo ? <Logo {...props} /> : null;
}
