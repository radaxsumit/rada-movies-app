"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheckIcon, ListPlusIcon, Loader2Icon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { createList, logWatch, setListItem } from "@/app/actions/social";
import { useViewer } from "@/components/auth/viewer-provider";
import { useRequireSignIn } from "@/components/reviews/review-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { MediaType } from "@/lib/tmdb/types";

type Ref = { mediaType: MediaType; tmdbId: number; title: string };

/** "⋯" menu on title pages: log a watch to your diary, add to a list. */
export function TitleMoreMenu({ mediaType, tmdbId, title }: Ref) {
  const { viewer } = useViewer();
  const requireSignIn = useRequireSignIn();
  const [dialog, setDialog] = useState<"watch" | "list" | null>(null);
  const open = (d: "watch" | "list") => (viewer ? setDialog(d) : requireSignIn());

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" variant="secondary" className="rounded-full px-3" aria-label="More actions">
            <MoreHorizontalIcon className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onSelect={() => open("watch")}>
            <CalendarCheckIcon /> Log a watch
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => open("list")}>
            <ListPlusIcon /> Add to a list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {viewer && (
        <>
          <LogWatchDialog
            open={dialog === "watch"}
            onOpenChange={(o) => setDialog(o ? "watch" : null)}
            item={{ mediaType, tmdbId, title }}
          />
          <AddToListDialog
            open={dialog === "list"}
            onOpenChange={(o) => setDialog(o ? "list" : null)}
            item={{ mediaType, tmdbId, title }}
            viewerId={viewer.id}
          />
        </>
      )}
    </>
  );
}

function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function LogWatchDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: Ref;
}) {
  const [date, setDate] = useState(todayLocal);
  const [rewatch, setRewatch] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const res = await logWatch({ mediaType: item.mediaType, tmdbId: item.tmdbId, watchedOn: date, rewatch });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Logged to your diary");
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log a watch</DialogTitle>
          <DialogDescription>{item.title}</DialogDescription>
        </DialogHeader>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Watched on</span>
          <Input
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-full px-4"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={rewatch}
            onChange={(e) => setRewatch(e.target.checked)}
            className="accent-ember"
          />
          I’ve seen it before (rewatch)
        </label>
        <Button className="rounded-full" onClick={save} disabled={pending || !date}>
          {pending ? <Loader2Icon className="size-4 animate-spin" /> : "Add to diary"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AddToListDialog({
  open,
  onOpenChange,
  item,
  viewerId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: Ref;
  viewerId: string;
}) {
  const queryClient = useQueryClient();
  const key = ["my-lists", viewerId, item.mediaType, item.tmdbId];
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  // The viewer's lists (public and private), with whether this title is already in each.
  const { data: lists, isLoading } = useQuery({
    queryKey: key,
    enabled: open,
    queryFn: async () => {
      const { data } = await createClient()
        .from("lists")
        .select("id, title, is_public, list_items(tmdb_id, media_type)")
        .eq("user_id", viewerId)
        .order("created_at", { ascending: false });
      return (data ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        isPublic: l.is_public,
        count: l.list_items.length,
        has: l.list_items.some((i) => i.tmdb_id === item.tmdbId && i.media_type === item.mediaType),
      }));
    },
  });

  const toggle = (listId: string, has: boolean) =>
    startTransition(async () => {
      const res = await setListItem(listId, { mediaType: item.mediaType, tmdbId: item.tmdbId }, !has);
      if (!res.ok) return void toast.error(res.error);
      toast.success(has ? "Removed from list" : "Added to list");
      await queryClient.invalidateQueries({ queryKey: key });
    });

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      const res = await createList({
        title: newName,
        isPublic: true,
        firstItem: { mediaType: item.mediaType, tmdbId: item.tmdbId },
      });
      if (!res.ok) return void toast.error(res.error);
      setNewName("");
      toast.success("List created");
      await queryClient.invalidateQueries({ queryKey: key });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to a list</DialogTitle>
          <DialogDescription>{item.title}</DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1 overflow-y-auto" data-lenis-prevent>
          {isLoading ? (
            <Loader2Icon className="mx-auto size-5 animate-spin text-muted-foreground" />
          ) : lists?.length ? (
            lists.map((l) => (
              <label
                key={l.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary"
              >
                <input
                  type="checkbox"
                  checked={l.has}
                  disabled={pending}
                  onChange={() => toggle(l.id, l.has)}
                  className="size-4 accent-ember"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {l.count} title{l.count === 1 ? "" : "s"} · {l.isPublic ? "Public" : "Private"}
                  </span>
                </span>
              </label>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">You don’t have any lists yet.</p>
          )}
        </div>

        <form onSubmit={create} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value.slice(0, 100))}
            placeholder="New list, e.g. “Rainy Sunday picks”"
            className="h-10 rounded-full px-4"
            aria-label="New list name"
          />
          <Button type="submit" className="gap-1 rounded-full" disabled={pending || !newName.trim()}>
            <PlusIcon className="size-4" /> Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
