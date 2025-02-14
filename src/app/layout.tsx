import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { ClientLayout } from "@/components/client-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrainDump",
  description: "Record and transcribe your thoughts through guided questions, then transform them into polished drafts with AI assistance.",
  openGraph: {
    title: "BrainDump",
    description: "Record and transcribe your thoughts through guided questions, then transform them into polished drafts with AI assistance.",
    url: "https://braindump.so",
    siteName: "BrainDump",
    images: [
      {
        url: "/og.png",
        width: 1732,
        height: 1180,
        alt: "BrainDump - Voice to Draft in Minutes"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrainDump",
    description: "Record and transcribe your thoughts through guided questions, then transform them into polished drafts with AI assistance.",
    images: ["/og.png"],
    creator: "@garysheng",
  },
  metadataBase: new URL("https://braindump.so"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        inter.className,
        "min-h-screen bg-background text-foreground"
      )}>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
