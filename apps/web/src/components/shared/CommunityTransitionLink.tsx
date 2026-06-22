"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type MouseEvent } from "react";
import { useCommunityRouteTransition } from "@/components/shared/CommunityRouteTransitionProvider";

type TransitionNav = "home" | "featured" | "community";

type CommunityTransitionLinkProps = ComponentProps<typeof Link> & {
  transitionNav?: TransitionNav;
  transitionLabel?: string;
  disableTransition?: boolean;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function CommunityTransitionLink({
  href,
  onClick,
  onMouseEnter,
  onFocus,
  onTouchStart,
  prefetch,
  target,
  rel,
  transitionNav,
  transitionLabel,
  disableTransition = false,
  ...props
}: CommunityTransitionLinkProps) {
  const router = useRouter();
  const { beginTransition } = useCommunityRouteTransition();
  const hrefValue = typeof href === "string" ? href : null;

  function handlePrefetch() {
    if (!hrefValue || !hrefValue.startsWith("/")) {
      return;
    }

    router.prefetch(hrefValue);
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || disableTransition) {
      return;
    }

    if (!hrefValue || !hrefValue.startsWith("/") || target === "_blank" || !isPlainLeftClick(event)) {
      return;
    }

    event.preventDefault();
    beginTransition({
      href: hrefValue,
      nav: transitionNav,
      label: transitionLabel
    });
  }

  return (
    <Link
      {...props}
      href={href}
      onClick={handleClick}
      onFocus={(event) => {
        handlePrefetch();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        handlePrefetch();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        handlePrefetch();
        onTouchStart?.(event);
      }}
      prefetch={prefetch}
      rel={rel}
      target={target}
    />
  );
}
