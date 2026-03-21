'use client';

import { QueryProvider } from '@/providers/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Provider as JotaiProvider } from 'jotai';
import { Toaster } from '@/components/ui/sonner';
import type { PropsWithChildren } from 'react';
import { ThemeProvider } from 'next-themes';

export function ClientProviders({ children }: PropsWithChildren) {
  return (
    <NuqsAdapter>
      <JotaiProvider>
        <QueryProvider>
          <TooltipProvider>
            <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
              <SidebarProvider
                style={
                  {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                  } as React.CSSProperties
                }
              >
                {children}
                <Toaster />
              </SidebarProvider>
            </ThemeProvider>
          </TooltipProvider>
        </QueryProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}
