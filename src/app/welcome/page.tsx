import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "@/components/auth/profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireViewer, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

/** First stop after signing up: pick a username (we pre-fill a generated one). */
export default function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  return (
    <section className="container-page flex min-h-[85vh] items-center justify-center pt-24 pb-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-4xl" aria-hidden>
            🍿
          </p>
          <h1 className="font-display text-5xl leading-none tracking-wide">You’re in!</h1>
          <p className="text-muted-foreground">Pick how you’ll show up next to your verdicts.</p>
        </div>
        <Suspense fallback={<FormSkeleton />}>
          <Onboarding searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function Onboarding({ searchParams }: Pick<PageProps<"/welcome">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);
  const viewer = await requireViewer("/welcome");
  return (
    <ProfileForm
      next={next}
      submitLabel="Start exploring"
      defaults={{ username: viewer.username, displayName: viewer.displayName ?? "", bio: "" }}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-11 rounded-full" />
      <Skeleton className="h-11 rounded-full" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-11 rounded-full" />
    </div>
  );
}
