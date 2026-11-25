"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { createList, deleteList, setListItem, updateList } from "@/app/actions/social";
import { useViewer } from "@/components/auth/viewer-provider";
import { useRequireSignIn } from "@/components/reviews/review-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MediaType } from "@/lib/tmdb/types";

interface ListFields {
  title: string;
  description: string;
  isPublic: boolean;
}

function ListForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: ListFields;
  submitLabel: string;
  onSubmit: (v: ListFields) => Promise<boolean>;
}) {
  const [v, setV] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => void (await onSubmit(v)));
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Name</span>
        <Input
          value={v.title}
          onChange={(e) => setV({ ...v, title: e.target.value.slice(0, 100) })}
          required
          className="h-11 rounded-full px-4"
          placeholder="e.g. Best Malayalam thrillers"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <Textarea
          value={v.description}
          onChange={(e) => setV({ ...v, description: e.target.value.slice(0, 1000) })}
          rows={3}
          className="rounded-2xl"
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={v.isPublic}
          onChange={(e) => setV({ ...v, isPublic: e.target.checked })}
          className="accent-ember"
        />
        Public — anyone can see this list
      </label>
      <Button type="submit" className="w-full rounded-full" disabled={pending || !v.title.trim()}>
        {pending ? <Loader2Icon className="size-4 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );
}

export function NewListButton() {
  const { viewer } = useViewer();
  const requireSignIn = useRequireSignIn();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="gap-2 rounded-full" onClick={() => (viewer ? setOpen(true) : requireSignIn())}>
        <PlusIcon className="size-4" /> New list
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New list</DialogTitle>
            <DialogDescription>Add titles from any movie or show page with ⋯ → Add to a list.</DialogDescription>
          </DialogHeader>
          <ListForm
            initial={{ title: "", description: "", isPublic: true }}
            submitLabel="Create list"
            onSubmit={async (v) => {
              const res = await createList(v);
              if (!res.ok) return (toast.error(res.error), false);
              setOpen(false);
              router.push(`/lists/${res.data!.id}`);
              return true;
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Edit / delete controls, shown only to the list's owner. */
export function ListOwnerControls({
  listId,
  ownerId,
  initial,
}: {
  listId: string;
  ownerId: string;
  initial: ListFields;
}) {
  const { viewer } = useViewer();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  if (viewer?.id !== ownerId) return null;

  const remove = () => {
    if (!window.confirm("Delete this list? This can’t be undone.")) return;
    startTransition(async () => {
      const res = await deleteList(listId);
      if (!res.ok) return void toast.error(res.error);
      toast.success("List deleted");
      router.push(`/u/${viewer.username}/lists`);
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="secondary" className="gap-2 rounded-full" onClick={() => setOpen(true)}>
        <PencilIcon className="size-4" /> Edit
      </Button>
      <Button variant="ghost" className="gap-2 rounded-full text-destructive" onClick={remove} disabled={pending}>
        <Trash2Icon className="size-4" /> Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
            <DialogDescription className="sr-only">Change the name, description or visibility.</DialogDescription>
          </DialogHeader>
          <ListForm
            initial={initial}
            submitLabel="Save"
            onSubmit={async (v) => {
              const res = await updateList(listId, v);
              if (!res.ok) return (toast.error(res.error), false);
              setOpen(false);
              router.refresh();
              return true;
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Small ✕ on a poster to remove it from the list (owner only). */
export function RemoveFromListButton({
  listId,
  ownerId,
  item,
}: {
  listId: string;
  ownerId: string;
  item: { mediaType: MediaType; tmdbId: number; title: string };
}) {
  const { viewer } = useViewer();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (viewer?.id !== ownerId) return null;
  return (
    <button
      type="button"
      aria-label={`Remove ${item.title} from list`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setListItem(listId, { mediaType: item.mediaType, tmdbId: item.tmdbId }, false);
          if (!res.ok) return void toast.error(res.error);
          router.refresh();
        })
      }
      className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-background/90 shadow hover:bg-destructive hover:text-white"
    >
      {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : <XIcon className="size-3.5" />}
    </button>
  );
}
