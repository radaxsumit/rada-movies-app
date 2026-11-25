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
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-b bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-background/90 to-transparent",
      )}
    >
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
