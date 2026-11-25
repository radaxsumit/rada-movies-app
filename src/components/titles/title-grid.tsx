import { Skeleton } from "@/components/ui/skeleton";

export const titleGridClass = "grid grid-cols-2 gap-x-4 gap-y-6 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";

export function TitleGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className={titleGridClass} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
