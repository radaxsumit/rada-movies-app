"use client";

import { useState, useTransition } from "react";
import { FlagIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { reportContent } from "@/app/actions/moderation";
import { useViewer } from "@/components/auth/viewer-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS, type ReportReason } from "@/config/moderation";
import { cn } from "@/lib/utils";
import { useRequireSignIn } from "./review-bits";

/** Flag a review or comment. Hidden on your own posts. */
export function ReportButton({
  target,
  authorId,
  className,
}: {
  target: { reviewId: string } | { commentId: string };
  authorId: string;
  className?: string;
}) {
  const { viewer } = useViewer();
  const requireSignIn = useRequireSignIn();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();
  if (viewer?.id === authorId) return null;

  const what = "reviewId" in target ? "review" : "comment";
  const submit = () => {
    if (!reason) return;
    startTransition(async () => {
      const res = await reportContent({ ...target, reason, details: details || undefined });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Thanks — a moderator will take a look.");
      setOpen(false);
      setReason(null);
      setDetails("");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (viewer ? setOpen(true) : requireSignIn())}
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
          className,
        )}
        aria-label={`Report this ${what}`}
      >
        <FlagIcon className="size-3.5" />
        <span className="hidden sm:inline">Report</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Report this {what}</DialogTitle>
            <DialogDescription>
              Moderators review every report. The author isn’t told who reported it.
            </DialogDescription>
          </DialogHeader>
          <div role="radiogroup" aria-label="Reason" className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-secondary"
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-ember"
                />
                {r}
              </label>
            ))}
          </div>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 400))}
            placeholder="Anything else we should know? (optional)"
            rows={2}
            className="rounded-2xl"
          />
          <Button className="rounded-full" onClick={submit} disabled={!reason || pending}>
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : "Send report"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
