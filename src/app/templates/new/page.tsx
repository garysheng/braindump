'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { createTemplate } from "@/lib/template-service";
import { TemplateForm } from "@/components/template-form";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Template } from "@/types";

export default function NewTemplatePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    router.push("/login");
    return null;
  }

  const handleSubmit = async (data: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      await createTemplate(user.uid, data);
      toast({
        title: "Success",
        description: "Template created successfully!",
      });
      router.push('/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Template</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new template for your recording sessions
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <TemplateForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>
      </div>
    </main>
  );
} 