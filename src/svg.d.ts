// Los SVG se compilan a componentes React con @svgr/webpack.
declare module "*.svg" {
  import * as React from "react";
  const SvgComponent: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default SvgComponent;
}
