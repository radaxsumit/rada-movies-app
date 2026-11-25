import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand/logo";
import { SignInForm } from "@/components/auth/sign-in-form";
import { site } from "@/config/site";
import { getEnabledProviders } from "@/lib/auth-providers";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  link_expired: "That sign-in link has expired or was already used. Request a new one below.",
  google_unavailable: "Google sign-in isn’t switched on yet. Use your email for now.",
  missing_code: "That sign-in link looks incomplete. Request a new one below.",
};

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <section className="container-page flex min-h-[85vh] items-center justify-center pt-24 pb-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <LogoMark className="mx-auto size-12" />
          <h1 className="font-display text-5xl leading-none tracking-wide">Join the conversation</h1>
          <p className="text-muted-foreground">
            Sign in to give verdicts, write reviews and keep a watchlist on {site.name}.
          </p>
        </div>
        <Suspense>
          <SignInContent searchParams={searchParams} />
        </Suspense>
        <p className="text-center text-xs text-muted-foreground">
          No password needed. New here? Signing in creates your account.
        </p>
      </div>
    </section>
  );
}

async function SignInContent({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const errorKey = one(params.error);
  const providers = await getEnabledProviders();
  return (
    <SignInForm
      next={one(params.next) ?? "/"}
      error={errorKey ? (ERRORS[errorKey] ?? ERRORS.link_expired) : null}
      googleEnabled={providers.google}
    />
  );
}
