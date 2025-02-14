import { User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createContext, useContext } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";

const HeaderContext = createContext<React.ReactNode>(null);

export function HeaderContent({ children }: { children: React.ReactNode }) {
  return <HeaderContext.Provider value={children}>{children}</HeaderContext.Provider>;
}

interface AppHeaderProps {
  children?: React.ReactNode;
}

export function AppHeader({ children }: AppHeaderProps) {
  const router = useRouter();
  const content = useContext(HeaderContext);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl items-center px-5">
        <div className="flex items-center gap-6">
          <Link href="/" className="shrink-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text italic">
              BrainDump
            </h1>
          </Link>
          <div className="flex-1">
            {content || children}
          </div>
        </div>
        {user ? (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/profile')}
            className="ml-auto"
          >
            <User className="w-4 h-4" />
            <span className="sr-only">Profile</span>
          </Button>
        ) : (
          <Button 
            onClick={() => router.push('/login')}
            className="ml-auto gap-2"
          >
            Start <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
} 