import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LockIcon } from "lucide-react";
import { AuthorChip } from "@/components/reviews/review-bits";
import { ListOwnerControls, RemoveFromListButton } from "@/components/social/list-editor";
import { TitleCard } from "@/components/titles/title-card";
import { TitleGridSkeleton, titleGridClass } from "@/components/titles/title-grid";
import { getViewer } from "@/lib/auth";
import { getPublicList, LIST_SELECT, toSummary, type ListDetail, type ListRow } from "@/lib/social";
import { createClient } from "@/lib/supabase/server";
import { getTitleCards } from "@/lib/tmdb/lookup";

type Props = PageProps<"/lists/[id]">;

export async function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const list = await getPublicList((await params).id);
  if (!list) return { title: "List", robots: { index: false } };
  return {
    title: `${list.title} — a list by @${list.owner.username}`,
    description: list.description ?? `${list.itemCount} titles picked by @${list.owner.username}.`,
    alternates: { canonical: `/lists/${list.id}` },
  };
}

export default function ListPage({ params }: Props) {
  return (
    <div className="container-page space-y-8 pt-28 pb-10">
      <Suspense fallback={<TitleGridSkeleton count={12} />}>
        <List params={params} />
      </Suspense>
    </div>
  );
}

/** Public lists come from cache; a private list is only visible to its owner, via their session. */
async function loadList(id: string): Promise<ListDetail | null> {
  const pub = await getPublicList(id);
  if (pub) return pub;
  const viewer = await getViewer();
  if (!viewer || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("lists").select(LIST_SELECT).eq("id", id).eq("user_id", viewer.id).maybeSingle();
  return data ? toSummary(data as unknown as ListRow) : null;
}

async function List({ params }: Pick<Props, "params">) {
  const list = await loadList((await params).id);
  if (!list) notFound();
  const titles = await getTitleCards(list.items);
  const noteFor = (id: number, type: string) => list.items.find((i) => i.tmdbId === id && i.mediaType === type)?.note;

  return (
    <>
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wider text-ember uppercase">
              List · {list.itemCount} title{list.itemCount === 1 ? "" : "s"}
            </p>
            <h1 className="flex items-center gap-3 font-display text-5xl leading-none tracking-wide">
              {!list.isPublic && <LockIcon className="size-6 text-muted-foreground" aria-label="Private list" />}
              {list.title}
            </h1>
          </div>
          <ListOwnerControls
            listId={list.id}
            ownerId={list.owner.id}
            initial={{ title: list.title, description: list.description ?? "", isPublic: list.isPublic }}
          />
        </div>
        <AuthorChip author={list.owner} />
        {list.description && <p className="max-w-2xl whitespace-pre-line text-foreground/90">{list.description}</p>}
      </header>

      {titles.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          This list is empty. Add titles from any movie page with{" "}
          <span className="text-foreground">⋯ → Add to a list</span>, or{" "}
          <Link href="/movies" className="text-ember hover:underline">
            browse movies
          </Link>
          .
        </p>
      ) : (
        <ol className={titleGridClass}>
          {titles.map((t, i) => (
            <li key={`${t.mediaType}-${t.id}`} className="relative space-y-1.5">
              <span className="absolute -top-2 -left-2 z-10 flex size-7 items-center justify-center rounded-full bg-ember text-xs font-bold text-primary-foreground shadow">
                {i + 1}
              </span>
              <RemoveFromListButton
                listId={list.id}
                ownerId={list.owner.id}
                item={{ mediaType: t.mediaType, tmdbId: t.id, title: t.title }}
              />
              <TitleCard title={t} className="w-full sm:w-full" priority={i < 6} />
              {noteFor(t.id, t.mediaType) && (
                <p className="text-xs text-muted-foreground italic">“{noteFor(t.id, t.mediaType)}”</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
