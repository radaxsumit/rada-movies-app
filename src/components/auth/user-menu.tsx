"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewer } from "./viewer-provider";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu() {
  const { viewer, loading } = useViewer();
  const pathname = usePathname();

  if (loading) return <Skeleton className="size-9 rounded-full" />;

  if (!viewer) {
    const next = pathname === "/sign-in" ? "/" : pathname;
    return (
      <Button asChild size="sm" className="gap-2 rounded-full">
        <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>
          <UserIcon className="size-4" />
          <span className="hidden sm:inline">Sign in</span>
        </Link>
      </Button>
    );
  }

  const name = viewer.displayName || viewer.username;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="size-9 ring-1 ring-border">
            {viewer.avatarUrl && <AvatarImage src={viewer.avatarUrl} alt="" />}
            <AvatarFallback className="bg-ember-soft text-xs font-semibold">{initials(name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">@{viewer.username}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/u/${viewer.username}`}>
            <UserIcon /> Your profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/watchlist">
            <BookmarkIcon /> Watchlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <SettingsIcon /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOutIcon /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
