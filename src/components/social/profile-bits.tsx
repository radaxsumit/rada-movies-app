"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, UserCheckIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { setFollow } from "@/app/actions/social";
import { useViewer } from "@/components/auth/viewer-provider";
import { useRequireSignIn } from "@/components/reviews/review-bits";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Follow / Following toggle. Hidden on your own profile (shows "Edit profile" instead). */
export function FollowButton({ userId, username }: { userId: string; username: string }) {
  const { viewer, loading } = useViewer();
  const requireSignIn = useRequireSignIn();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hover, setHover] = useState(false);
  const [pending, startTransition] = useTransition();
  const key = ["following", viewer?.id, userId];

  const { data: following = false } = useQuery({
    queryKey: key,
    enabled: !!viewer && viewer.id !== userId,
    queryFn: async () => {
      const { count } = await createClient()
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", viewer!.id)
        .eq("following_id", userId);
      return (count ?? 0) > 0;
    },
  });

  if (loading) return null;
  if (viewer?.id === userId) {
    return (
      <Button asChild variant="secondary" className="rounded-full">
        <Link href="/settings/profile">Edit profile</Link>
      </Button>
    );
  }

  const toggle = () => {
    if (!viewer) return requireSignIn();
    const next = !following;
    queryClient.setQueryData(key, next);
    startTransition(async () => {
      const res = await setFollow(userId, next);
      if (!res.ok) {
        queryClient.setQueryData(key, !next);
        return void toast.error(res.error);
      }
      toast.success(next ? `Following @${username}` : `Unfollowed @${username}`);
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      router.refresh();
    });
  };

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={following ? "secondary" : "default"}
      className={cn("min-w-32 gap-2 rounded-full", following && hover && "text-destructive")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={following}
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : following ? (
        <>
          <UserCheckIcon className="size-4" /> {hover ? "Unfollow" : "Following"}
        </>
      ) : (
        <>
          <UserPlusIcon className="size-4" /> Follow
        </>
      )}
    </Button>
  );
}

export function ProfileTabs({ username }: { username: string }) {
  const pathname = usePathname();
  const base = `/u/${username}`;
  const tabs = [
    { href: base, label: "Verdicts" },
    { href: `${base}/diary`, label: "Diary" },
    { href: `${base}/lists`, label: "Lists" },
  ];
  return (
    <nav aria-label="Profile sections" className="flex gap-1 border-b">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
              active && "border-ember text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
