import Link from "next/link";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Placeholder mark: a film frame with a play cut-out. Replace with the final
 * logo SVG once the brand is designed — keep the same component API.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect x="2" y="5" width="28" height="22" rx="6" className="fill-ember" />
      <g className="fill-ink">
        <rect x="5" y="8" width="3" height="3" rx="1" />
        <rect x="5" y="14.5" width="3" height="3" rx="1" />
        <rect x="5" y="21" width="3" height="3" rx="1" />
        <rect x="24" y="8" width="3" height="3" rx="1" />
        <rect x="24" y="14.5" width="3" height="3" rx="1" />
        <rect x="24" y="21" width="3" height="3" rx="1" />
        <path d="M13 11.2v9.6a.8.8 0 0 0 1.2.7l7.6-4.8a.8.8 0 0 0 0-1.4l-7.6-4.8a.8.8 0 0 0-1.2.7Z" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label={`${site.name} home`}>
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-display text-2xl leading-none tracking-wide">
        {site.shortName}
        <span className="text-ember"> Movies</span>
      </span>
    </Link>
  );
}
