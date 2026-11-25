import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[80vh] flex-col items-center justify-center gap-6 pt-16 text-center">
      <p className="font-display text-[clamp(6rem,22vw,14rem)] leading-none tracking-wide text-ember">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">This reel is missing</h1>
        <p className="max-w-md text-muted-foreground">
          The page you’re after was cut in the edit, or never shot at all.
        </p>
      </div>
      <Button asChild size="lg" className="rounded-full">
        <Link href="/">Back to home</Link>
      </Button>
    </section>
  );
}
