"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Clamps long text (e.g. biographies) with a toggle. */
export function ReadMore({ text, lines = 5, className }: { text: string; lines?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <div className={className}>
      <p
        className={cn(
          "leading-relaxed whitespace-pre-line text-foreground/90",
          !open && long && "line-clamp-[var(--lines)]",
        )}
        style={{ "--lines": lines } as React.CSSProperties}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2 text-sm font-medium text-ember hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
