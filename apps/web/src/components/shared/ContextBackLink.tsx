"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type ContextBackLinkProps = ComponentProps<typeof Link>;

export function ContextBackLink(props: ContextBackLinkProps) {
  return <Link {...props} />;
}
