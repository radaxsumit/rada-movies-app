"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOffIcon, HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { setLike } from "@/app/actions/reviews";
import { initials } from "@/components/auth/user-menu";
import { useViewer } from "@/components/auth/viewer-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getVerdict, type VerdictId } from "@/config/verdicts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* ───────────── Verdict badge ───────────── */

export function VerdictBadge({ verdict, size = "sm" }: { verdict: VerdictId; size?: "sm" | "lg" }) {
  const v = getVerdict(verdict);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        v.colorClass,
      )}
      style={{ borderColor: "currentColor" }}
    >
      <span className={cn("size-1.5 rounded-full", v.bgClass)} />
      {v.label}
    </span>
  );
}

/* ───────────── Author ───────────── */

export function AuthorChip({
  author,
  meta,
}: {
  author: { username: string; displayName: string | null; avatarUrl: string | null };
  meta?: React.ReactNode;
}) {
  const name = author.displayName || author.username;
  return (
    <Link href={`/u/${author.username}`} className="group flex min-w-0 items-center gap-2.5">
      <Avatar className="size-9 ring-1 ring-border">
        {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt="" />}
        <AvatarFallback className="bg-ember-soft text-xs font-semibold">{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold group-hover:text-ember">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          @{author.username}
          {meta}
        </span>
      </span>
    </Link>
  );
}

/* ───────────── Relative time (computed in the browser so cached HTML never goes stale) ───────────── */

const noop = () => () => {};
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function TimeAgo({ date }: { date: string }) {
  const label = useSyncExternalStore(
    noop,
    () => {
      const secs = (new Date(date).getTime() - Date.now()) / 1000;
      for (const [unit, size] of UNITS) {
        if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
      }
      return "just now";
    },
    () => null,
  );
  return (
    <time dateTime={date} title={new Date(date).toUTCString()}>
      {label ?? new Date(date).toISOString().slice(0, 10)}
    </time>
  );
}

/* ───────────── Spoiler-protected text ───────────── */

export function ReviewBody({
  body,
  hasSpoilers,
  clamp = true,
}: {
  body: string;
  hasSpoilers: boolean;
  clamp?: boolean;
}) {
  const [revealed, setRevealed] = useState(!hasSpoilers);
  return (
    <div className="relative">
      <p
        className={cn(
          "leading-relaxed whitespace-pre-line text-foreground/90 transition",
          clamp && "line-clamp-6",
          !revealed && "pointer-events-none blur-sm select-none",
        )}
        aria-hidden={!revealed}
      >
        {body}
      </p>
      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="absolute inset-0 m-auto flex h-fit w-fit items-center gap-2 rounded-full border bg-background/90 px-4 py-2 text-sm font-medium backdrop-blur hover:border-ember/60"
        >
          <EyeOffIcon className="size-4" /> Contains spoilers — show anyway
        </button>
      )}
    </div>
  );
}

/* ───────────── Likes ───────────── */

/** IDs of reviews the viewer has liked. One query shared by every like button on the page. */
export function useMyLikes() {
  const { viewer } = useViewer();
  return useQuery({
    queryKey: ["my-likes", viewer?.id],
    enabled: !!viewer,
    queryFn: async () => {
      const { data } = await createClient()
        .from("review_likes")
        .select("review_id")
        .eq("user_id", viewer!.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      return new Set((data ?? []).map((r) => r.review_id));
    },
  });
}

export function useRequireSignIn() {
  const router = useRouter();
  const pathname = usePathname();
  return () => router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
}

export function LikeButton({ reviewId, count }: { reviewId: string; count: number }) {
  const { viewer } = useViewer();
  const { data: liked } = useMyLikes();
  const queryClient = useQueryClient();
  const requireSignIn = useRequireSignIn();
  const [pending, startTransition] = useTransition();
  // Optimistic overrides until the server-rendered count catches up.
  const [override, setOverride] = useState<{ liked: boolean; count: number } | null>(null);

  const isLiked = override?.liked ?? liked?.has(reviewId) ?? false;
  const shown = override?.count ?? count;

  const toggle = () => {
    if (!viewer) return requireSignIn();
    const next = !isLiked;
    setOverride({ liked: next, count: Math.max(0, shown + (next ? 1 : -1)) });
    startTransition(async () => {
      const res = await setLike(reviewId, next);
      if (!res.ok) {
        setOverride(null);
        toast.error(res.error);
        return;
      }
      queryClient.setQueryData<Set<string>>(["my-likes", viewer.id], (old) => {
        const s = new Set(old);
        if (next) s.add(reviewId);
        else s.delete(reviewId);
        return s;
      });
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isLiked}
      aria-label={isLiked ? "Unlike review" : "Like review"}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground transition hover:text-foreground",
        isLiked && "text-ember hover:text-ember",
      )}
    >
      <HeartIcon className={cn("size-4 transition", isLiked && "scale-110 fill-current")} />
      <span className="tabular-nums">{shown}</span>
    </button>
  );
}
