import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FollowButton, ProfileTabs } from "@/components/social/profile-bits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, initials } from "@/lib/format";
import { getProfileByUsername } from "@/lib/reviews";
import { getFollowCounts } from "@/lib/social";

/** Needed by Cache Components for validation; real profiles render on first visit, then cache. */
export async function generateStaticParams() {
  return [{ username: "__placeholder__" }];
}

/** Shared profile header + tabs for /u/[username], /diary and /lists. */
export default function ProfileLayout({ children, params }: LayoutProps<"/u/[username]">) {
  return (
    <div className="container-page max-w-4xl space-y-8 pt-28 pb-10">
      <Suspense fallback={<HeaderSkeleton />}>
        <ProfileHeader params={params} />
      </Suspense>
      {children}
    </div>
  );
}

async function ProfileHeader({ params }: Pick<LayoutProps<"/u/[username]">, "params">) {
  const profile = await getProfileByUsername((await params).username);
  if (!profile) notFound();
  const counts = await getFollowCounts(profile.id);
  const name = profile.displayName || profile.username;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar className="size-24 ring-2 ring-border">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
          <AvatarFallback className="bg-ember-soft text-2xl font-semibold">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <h1 className="font-display text-5xl leading-none tracking-wide">{name}</h1>
          <p className="text-sm text-muted-foreground">
            @{profile.username} · Joined {formatDate(profile.joinedAt.slice(0, 10))}
          </p>
          <p className="flex gap-4 text-sm">
            <span>
              <span className="font-semibold">{counts.followers}</span>{" "}
              <span className="text-muted-foreground">follower{counts.followers === 1 ? "" : "s"}</span>
            </span>
            <span>
              <span className="font-semibold">{counts.following}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
          </p>
          {profile.bio && <p className="max-w-xl">{profile.bio}</p>}
        </div>
        <FollowButton userId={profile.id} username={profile.username} />
      </header>
      <ProfileTabs username={profile.username} />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-6">
      <Skeleton className="size-24 rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}
