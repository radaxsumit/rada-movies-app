"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CornerDownRightIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { addComment, deleteComment } from "@/app/actions/reviews";
import { useViewer } from "@/components/auth/viewer-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/lib/reviews";
import { AuthorChip, TimeAgo, useRequireSignIn } from "./review-bits";

/** Comments under a review, one level of replies (Moctale-style). */
export function CommentThread({ reviewId, comments }: { reviewId: string; comments: Comment[] }) {
  const top = comments.filter((c) => !c.parentId);
  const replies = (id: string) => comments.filter((c) => c.parentId === id);

  return (
    <section aria-labelledby="comments-heading" className="space-y-5">
      <h2 id="comments-heading" className="text-xl font-semibold">
        Comments <span className="text-muted-foreground">{comments.length}</span>
      </h2>

      <CommentForm reviewId={reviewId} />

      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-5">
          {top.map((c) => (
            <li key={c.id} className="space-y-3">
              <CommentItem reviewId={reviewId} comment={c} canReply />
              {replies(c.id).length > 0 && (
                <ul className="space-y-3 border-l pl-5 sm:ml-4">
                  {replies(c.id).map((r) => (
                    <li key={r.id}>
                      <CommentItem reviewId={reviewId} comment={r} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({ reviewId, comment, canReply }: { reviewId: string; comment: Comment; canReply?: boolean }) {
  const { viewer } = useViewer();
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [pending, startTransition] = useTransition();
  const mine = viewer?.id === comment.author.id;

  const remove = () =>
    startTransition(async () => {
      const res = await deleteComment(comment.id, reviewId);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });

  return (
    <div className="space-y-2">
      <AuthorChip
        author={comment.author}
        meta={
          <>
            {" · "}
            <TimeAgo date={comment.createdAt} />
          </>
        }
      />
      <p className="pl-11.5 text-sm leading-relaxed whitespace-pre-line">{comment.body}</p>
      <div className="flex gap-3 pl-11.5 text-xs text-muted-foreground">
        {canReply && (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => setReplying((r) => !r)}
          >
            <CornerDownRightIcon className="size-3" /> Reply
          </button>
        )}
        {mine && (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-destructive"
            onClick={remove}
            disabled={pending}
          >
            <Trash2Icon className="size-3" /> Delete
          </button>
        )}
      </div>
      {replying && (
        <div className="pl-11.5">
          <CommentForm reviewId={reviewId} parentId={comment.id} onDone={() => setReplying(false)} autoFocus />
        </div>
      )}
    </div>
  );
}

function CommentForm({
  reviewId,
  parentId,
  onDone,
  autoFocus,
}: {
  reviewId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const { viewer, loading } = useViewer();
  const requireSignIn = useRequireSignIn();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  if (!loading && !viewer) {
    return (
      <Button variant="secondary" className="rounded-full" onClick={requireSignIn}>
        Sign in to comment
      </Button>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addComment({ reviewId, body, parentId });
      if (!res.ok) return void toast.error(res.error);
      setBody("");
      onDone?.();
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="sr-only" htmlFor={`comment-${parentId ?? "root"}`}>
        {parentId ? "Write a reply" : "Write a comment"}
      </label>
      <Textarea
        id={`comment-${parentId ?? "root"}`}
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        placeholder={parentId ? "Write a reply…" : "Add to the conversation…"}
        rows={parentId ? 2 : 3}
        autoFocus={autoFocus}
        className="rounded-2xl"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="rounded-full" disabled={pending || !body.trim()}>
          {pending ? <Loader2Icon className="size-4 animate-spin" /> : parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
