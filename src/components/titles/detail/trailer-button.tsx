"use client";

import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Trailer } from "@/lib/tmdb/types";

/** Plays the YouTube trailer in a modal. Uses youtube-nocookie so nothing loads until it's opened. */
export function TrailerButton({ trailer, title }: { trailer: Trailer; title: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 rounded-full">
          <PlayIcon className="size-4 fill-current" />
          Play trailer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(92vw,1100px)] overflow-hidden border-none bg-black p-0 sm:max-w-[min(92vw,1100px)]">
        <DialogTitle className="sr-only">{`${title} — ${trailer.name}`}</DialogTitle>
        <DialogDescription className="sr-only">YouTube video player</DialogDescription>
        <div className="aspect-video w-full">
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
            title={trailer.name}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
