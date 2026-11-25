"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { resolveReport } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";

export function ResolveReportButtons({ reportId, canRemove }: { reportId: string; canRemove: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: "dismiss" | "remove") => {
    if (action === "remove" && !window.confirm("Delete this content for everyone? This can’t be undone.")) return;
    startTransition(async () => {
      const res = await resolveReport(reportId, action);
      if (!res.ok) return void toast.error(res.error);
      toast.success(action === "remove" ? "Content removed" : "Report dismissed");
      router.refresh();
    });
  };
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" className="rounded-full" disabled={pending} onClick={() => run("dismiss")}>
        Keep it (dismiss)
      </Button>
      {canRemove && (
        <Button
          size="sm"
          variant="destructive"
          className="rounded-full"
          disabled={pending}
          onClick={() => run("remove")}
        >
          Remove content
        </Button>
      )}
    </div>
  );
}
