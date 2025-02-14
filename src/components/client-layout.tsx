'use client';

import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from "@/components/app-header";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative flex min-h-screen flex-col">
        <AppHeader />
        {children}
      </div>
      <Toaster />
    </>
  );
} 