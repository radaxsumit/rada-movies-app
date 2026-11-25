"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useViewer } from "./viewer-provider";

export function ProfileForm({
  defaults,
  next,
  submitLabel,
}: {
  defaults: { username: string; displayName: string; bio: string };
  /** When set, the action redirects here after saving (onboarding). */
  next?: string;
  submitLabel: string;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(saveProfile, { status: "idle" });
  const { refresh } = useViewer();

  useEffect(() => {
    if (state.status === "saved") {
      toast.success("Profile saved");
      void refresh();
    }
  }, [state, refresh]);

  const errorFor = (field: string) => (state.status === "error" && state.field === field ? state.message : null);

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      <Field
        label="Username"
        hint="Your public handle. Your profile lives at /u/your-username."
        error={errorFor("username")}
      >
        <div className="flex items-center rounded-full border bg-card/50 pl-4 focus-within:ring-2 focus-within:ring-ring">
          <span className="text-muted-foreground">@</span>
          <Input
            name="username"
            defaultValue={defaults.username}
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]{3,20}"
            autoComplete="username"
            className="h-11 border-0 bg-transparent pl-1 shadow-none focus-visible:ring-0"
            aria-invalid={!!errorFor("username")}
          />
        </div>
      </Field>

      <Field label="Display name" error={errorFor("displayName")}>
        <Input
          name="displayName"
          defaultValue={defaults.displayName}
          maxLength={50}
          autoComplete="name"
          className="h-11 rounded-full px-4"
        />
      </Field>

      <Field label="Bio" hint="Optional. What do you love watching?" error={errorFor("bio")}>
        <Textarea name="bio" defaultValue={defaults.bio} maxLength={300} rows={3} className="rounded-2xl" />
      </Field>

      {state.status === "error" && !state.field && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Submit label={submitLabel} />
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs text-destructive">
          {error}
        </span>
      ) : (
        hint && <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full rounded-full" disabled={pending}>
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : label}
    </Button>
  );
}
