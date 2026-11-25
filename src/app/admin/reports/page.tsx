import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { ResolveReportButtons } from "@/components/admin/resolve-report-buttons";
import { TimeAgo, VerdictBadge } from "@/components/reviews/review-bits";
import { Skeleton } from "@/components/ui/skeleton";
import type { VerdictId } from "@/config/verdicts";
import { isAdmin, requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reports · Admin", robots: { index: false } };

export default function AdminReportsPage() {
  return (
    <div className="container-page max-w-4xl space-y-8 pt-28 pb-10">
      <h1 className="flex items-center gap-3 font-display text-5xl leading-none tracking-wide">
        <ShieldCheckIcon className="size-8 text-ember" aria-hidden /> Reports
      </h1>
      <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
        <Reports />
      </Suspense>
    </div>
  );
}

type ReportRow = {
  id: string;
  reason: string;
  created_at: string;
  reporter: { username: string } | null;
  review: { id: string; body: string | null; verdict: VerdictId; author: { username: string } | null } | null;
  comment: { id: string; body: string; review_id: string; author: { username: string } | null } | null;
};

async function Reports() {
  await requireViewer("/admin/reports");
  // Non-admins get a 404, so the page doesn't even reveal that it exists.
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      `id, reason, created_at,
       reporter:profiles!reports_reporter_id_fkey(username),
       review:reviews!reports_review_id_fkey(id, body, verdict, author:profiles!reviews_user_id_fkey(username)),
       comment:review_comments!reports_comment_id_fkey(id, body, review_id, author:profiles!review_comments_user_id_fkey(username))`,
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Failed to load reports: ${error.message}`);
  const reports = data as unknown as ReportRow[];

  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No open reports. 🎉</p>
    );
  }

  return (
    <ul className="space-y-4">
      {reports.map((r) => {
        const target = r.review ?? r.comment;
        const href = r.review ? `/review/${r.review.id}` : r.comment ? `/review/${r.comment.review_id}` : null;
        return (
          <li key={r.id} className="space-y-3 rounded-2xl border bg-card/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <span className="font-semibold">{r.reason}</span>
                <span className="text-muted-foreground">
                  {" · reported by @"}
                  {r.reporter?.username ?? "deleted"} · <TimeAgo date={r.created_at} />
                </span>
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{r.review ? "Review" : "Comment"}</span>
            </div>
            {target ? (
              <blockquote className="space-y-2 rounded-xl border-l-2 border-ember/60 bg-background/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  by @{target.author?.username ?? "deleted"}
                  {r.review && (
                    <span className="ml-2">
                      <VerdictBadge verdict={r.review.verdict} />
                    </span>
                  )}
                </p>
                <p className="whitespace-pre-line">
                  {target.body || <em className="text-muted-foreground">Verdict only</em>}
                </p>
                {href && (
                  <Link href={href} className="text-xs text-muted-foreground hover:text-foreground">
                    Open in context →
                  </Link>
                )}
              </blockquote>
            ) : (
              <p className="text-sm text-muted-foreground">The reported content was already deleted.</p>
            )}
            <ResolveReportButtons reportId={r.id} canRemove={Boolean(target)} />
          </li>
        );
      })}
    </ul>
  );
}
