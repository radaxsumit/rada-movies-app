"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactLenis } from "lenis/react";
import { ViewerProvider } from "@/components/auth/viewer-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

/** Client-side providers: data cache, smooth scrolling, tooltips, toasts. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }} />
      <ViewerProvider>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster position="bottom-center" />
        </TooltipProvider>
      </ViewerProvider>
    </QueryClientProvider>
  );
}
