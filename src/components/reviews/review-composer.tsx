"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteReview, saveReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { verdicts, type VerdictId } from "@/config/verdicts";
import type { MediaType } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

export interface MyReview {
  id: string;
  verdict: VerdictId;
  body: string | null;
  hasSpoilers: boolean;
}

const MAX = 5000;

/** Pick one of four verdicts, optionally write a review, flag spoilers. Edits if one exists. */
export function ReviewComposer({
  open,
  onOpenChange,
  mediaType,
  tmdbId,
  title,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  existing: MyReview | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [verdict, setVerdict] = useState<VerdictId | null>(existing?.verdict ?? null);
  const [body, setBody] = useState(existing?.body ?? "");
  const [spoilers, setSpoilers] = useState(existing?.hasSpoilers ?? false);
  const [pending, startTransition] = useTransition();

  // Reset the form whenever it opens, so edits start from the saved review.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setVerdict(existing?.verdict ?? null);
      setBody(existing?.body ?? "");
      setSpoilers(existing?.hasSpoilers ?? false);
    }, 0);
    return () => clearTimeout(t);
  }, [open, existing]);

  const done = (message: string) => {
    toast.success(message);
    void queryClient.invalidateQueries({ queryKey: ["my-review", mediaType, tmdbId] });
    onOpenChange(false);
    router.refresh();
  };

  const submit = () => {
    if (!verdict) return;
    startTransition(async () => {
      const res = await saveReview({ mediaType, tmdbId, verdict, body, hasSpoilers: spoilers });
      if (res.ok) done(existing ? "Review updated" : "Verdict posted");
      else toast.error(res.error);
    });
  };

  const remove = () => {
    if (!existing) return;
    startTransition(async () => {
      const res = await deleteReview(existing.id);
      if (res.ok) done("Review deleted");
      else toast.error(res.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit your verdict" : "Your verdict"}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Verdict" className="grid grid-cols-2 gap-2">
          {verdicts.map((v) => {
            const selected = verdict === v.id;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setVerdict(v.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition hover:border-foreground/30",
                  selected && "border-current bg-card",
                  selected && v.colorClass,
                )}
              >
                <span className={cn("mb-1 block size-2 rounded-full", v.bgClass)} />
                <span className={cn("block font-semibold", !selected && "text-foreground")}>{v.label}</span>
                <span className="block text-xs text-muted-foreground">{v.hint}</span>
              </button>
            );
          })}
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Review <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            rows={5}
            placeholder="What worked? What didn’t?"
            className="rounded-2xl"
          />
          <span className="block text-right text-xs text-muted-foreground tabular-nums">
            {body.length.toLocaleString()}/{MAX.toLocaleString()}
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={spoilers}
            onChange={(e) => setSpoilers(e.target.checked)}
            className="accent-ember"
          />
          Contains spoilers (we’ll blur it until readers choose to see it)
        </label>

        <div className="flex items-center gap-2 pt-2">
          {existing && (
            <Button variant="ghost" className="gap-2 text-destructive" onClick={remove} disabled={pending}>
              <Trash2Icon className="size-4" /> Delete
            </Button>
          )}
          <Button className="ml-auto rounded-full" onClick={submit} disabled={!verdict || pending}>
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : existing ? "Save changes" : "Post verdict"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
