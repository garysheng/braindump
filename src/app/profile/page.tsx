'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/firebase/auth-context";
import { signOut } from "@/lib/firebase/auth-service";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Key, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    // Load API key from localStorage
    const savedKey = localStorage.getItem('openai-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [user, authLoading, router]);

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleUpdateKey = async () => {
    if (!apiKey.trim().startsWith('sk-')) {
      toast({
        title: "Error",
        description: "Please enter a valid OpenAI API key starting with 'sk-'",
        variant: "destructive",
      });
      return;
    }

    setIsTestingKey(true);
    try {
      const response = await fetch('/api/test-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      localStorage.setItem('openai-api-key', apiKey);
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
    } catch (error) {
      console.error('Error testing API key:', error);
      toast({
        title: "Error",
        description: "Invalid API key. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('openai-api-key');
    setApiKey("");
    toast({
      description: "API key removed successfully",
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>

        <div className="space-y-8">
          {/* User Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Account</h2>
            <div className="p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* API Key Management */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">OpenAI API Key</h2>
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono"
                    />
                    <Button 
                      onClick={handleUpdateKey}
                      disabled={!apiKey.trim().startsWith('sk-') || isTestingKey}
                    >
                      {isTestingKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      <span className="ml-2">Update Key</span>
                    </Button>
                  </div>
                </div>

                {apiKey && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveKey}
                    className="w-full"
                  >
                    Remove API Key
                  </Button>
                )}

                <p className="text-sm text-muted-foreground">
                  Your API key is stored locally and never sent to our servers.
                  You can get an API key from the{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    OpenAI dashboard
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-4">
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
} 