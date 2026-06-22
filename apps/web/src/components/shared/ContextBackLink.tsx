"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

type ContextBackLinkProps = ComponentProps<typeof Link>;

export function ContextBackLink(props: ContextBackLinkProps) {
  const router = useRouter();
  const { href, onClick, ...rest } = props;

  return (
    <Link
      {...rest}
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        if (typeof window === "undefined") {
          return;
        }

        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const fallbackHref = typeof href === "string" ? href : href.toString();
        if (window.history.length > 1 && window.document.referrer) {
          try {
            const referrer = new URL(window.document.referrer);
            if (referrer.origin === window.location.origin && referrer.href !== window.location.href) {
              event.preventDefault();
              router.back();
              return;
            }
          } catch {}
        }

        if (fallbackHref === currentPath) {
          event.preventDefault();
        }
      }}
    />
  );
}
