"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: ReactNode;
};

const INTERACTIVE_SELECTOR = "a,button,input,select,textarea,summary,label";

export default function AuditLogsTableInteractive({ children }: Props) {
  const router = useRouter();

  const openRow = (element: HTMLElement | null) => {
    const row = element?.closest<HTMLTableRowElement>("tr[data-row-href]");
    const href = row?.dataset.rowHref;
    if (!href) {
      return;
    }
    router.push(href, { scroll: false });
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest(INTERACTIVE_SELECTOR)) {
      return;
    }
    openRow(target);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const target = event.target as HTMLElement | null;
    const row = target?.closest<HTMLTableRowElement>("tr[data-row-href]");
    if (!row) {
      return;
    }

    if (target && target !== row && target.closest(INTERACTIVE_SELECTOR)) {
      return;
    }

    event.preventDefault();
    openRow(row);
  };

  return (
    <div onClick={handleClick} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}
