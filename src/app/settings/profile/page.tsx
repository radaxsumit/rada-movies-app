import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "@/components/auth/profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile settings", robots: { index: false } };

export default function ProfileSettingsPage() {
  return (
    <section className="container-page max-w-xl pt-28 pb-10">
      <h1 className="mb-8 font-display text-5xl leading-none tracking-wide">Profile settings</h1>
      <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
        <Settings />
      </Suspense>
    </section>
  );
}

async function Settings() {
  const viewer = await requireViewer("/settings/profile");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("bio").eq("id", viewer.id).single();
  return (
    <ProfileForm
      submitLabel="Save changes"
      defaults={{ username: viewer.username, displayName: viewer.displayName ?? "", bio: data?.bio ?? "" }}
    />
  );
}
