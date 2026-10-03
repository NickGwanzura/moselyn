"use client";

import type { ComponentProps } from "react";

/**
 * Native link fallback for the current Vinext client-router incompatibility.
 * Keeping this as an anchor preserves reliable browser navigation while
 * avoiding Vinext's failing RSC prefetch and transition setup.
 */
export default function SiteLink(props: ComponentProps<"a">) {
  return <a {...props} />;
}
