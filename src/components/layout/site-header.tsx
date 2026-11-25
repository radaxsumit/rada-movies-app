"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchCommand } from "@/components/search/search-command";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 isolate z-50">
      {/*
        No border: the background is a blurred layer that fades out below the header,
        so it melts into the page instead of ending in a hard line.
      */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -bottom-8 -z-10 transition-opacity duration-300",
          "bg-background/80 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]",
          // The blur is only applied while visible: an invisible backdrop-filter still costs a repaint per frame.
          scrolled ? "opacity-100 backdrop-blur-md" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -bottom-10 -z-10 bg-gradient-to-b from-background/85 via-background/40 to-transparent transition-opacity duration-300",
          scrolled ? "opacity-0" : "opacity-100",
        )}
      />
      <div className="container-page flex h-16 items-center gap-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {site.nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-secondary text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchCommand />
          <UserMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
