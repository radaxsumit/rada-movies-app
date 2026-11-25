"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteMyAccount } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/** Danger zone: permanently delete your account (typed confirmation). */
export function DeleteAccount({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = typed.trim().toLowerCase() === username.toLowerCase();

  return (
    <section aria-labelledby="danger-heading" className="space-y-3 rounded-2xl border border-destructive/40 p-5">
      <h2 id="danger-heading" className="flex items-center gap-2 font-semibold text-destructive">
        <TriangleAlertIcon className="size-4" aria-hidden /> Delete account
      </h2>
      <p className="text-sm text-muted-foreground">
        Permanently deletes your profile, verdicts, reviews, comments, likes, lists, diary and watchlist. This can’t be
        undone.
      </p>
      <Button variant="destructive" className="rounded-full" onClick={() => setOpen(true)}>
        Delete my account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Everything you’ve posted will be erased immediately. Type <strong>{username}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={username}
            autoComplete="off"
            className="h-11 rounded-full px-4"
            aria-label="Type your username to confirm"
          />
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={!matches || pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteMyAccount(typed);
                // On success the action redirects home; we only get here on failure.
                if (res && !res.ok) toast.error(res.error);
              })
            }
          >
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : "Permanently delete"}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
