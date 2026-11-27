"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// The palette (cmdk + dialog + results) is only downloaded the first time someone opens search.
const SearchPalette = dynamic(() => import("./search-palette"), { ssr: false });

/** Header search button + Ctrl/⌘+K (or "/") shortcut. */
export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);

  const show = (value: boolean) => {
    if (value) setRequested(true);
    setOpen(value);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setRequested(true);
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="gap-2 rounded-full text-muted-foreground"
        onClick={() => show(true)}
        // Warm up the palette code when the pointer comes near, so it opens instantly.
        onPointerEnter={() => setRequested(true)}
        aria-label="Search movies, shows and people"
        aria-keyshortcuts="Control+K"
      >
        <SearchIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
      </Button>
      {requested && <SearchPalette open={open} onOpenChange={show} />}
    </>
  );
}
