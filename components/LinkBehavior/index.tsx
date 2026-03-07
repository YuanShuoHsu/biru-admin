import React from "react";

import { Link } from "@/i18n/navigation";

const LinkBehavior = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link>
>((props, ref) => {
  return <Link ref={ref} {...props} />;
});

LinkBehavior.displayName = "LinkBehavior";

export default LinkBehavior;
