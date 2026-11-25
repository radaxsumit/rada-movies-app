"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { sendMagicLink, signInWithGoogle, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function SignInForm({
  next,
  error,
  googleEnabled,
}: {
  next: string;
  error: string | null;
  googleEnabled: boolean;
}) {
  const [state, action] = useActionState<AuthState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="space-y-3 rounded-2xl border bg-card/60 p-6 text-center" role="status">
        <MailCheckIcon className="mx-auto size-10 text-ember" aria-hidden />
        <h2 className="text-lg font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to <span className="font-medium text-foreground">{state.email}</span>. Open it on this
          device to continue. It may take a minute, and check spam too.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {(error || state.status === "error") && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          {state.status === "error" ? state.message : error}
        </p>
      )}

      {googleEnabled && (
        <>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <GoogleButton />
          </form>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> or use email <Separator className="flex-1" />
          </div>
        </>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className="h-11 rounded-full px-4"
        />
        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full rounded-full" disabled={pending}>
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : "Email me a sign-in link"}
    </Button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" variant="secondary" className="h-11 w-full gap-2 rounded-full" disabled={pending}>
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
