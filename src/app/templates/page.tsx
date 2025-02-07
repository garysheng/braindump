'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth-context";
import { getUserTemplates, deleteTemplate } from '@/lib/template-service';
import type { Template } from '@/types';
import { Plus, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userTemplates = await getUserTemplates(user.uid);
      setTemplates(userTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadTemplates();
    }
  }, [user, authLoading, router, loadTemplates]);

  const handleDeleteTemplate = async () => {
    if (!user || !templateToDelete) return;

    try {
      setIsDeleting(true);
      await deleteTemplate(user.uid, templateToDelete.id);
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      toast({
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  };

  if (authLoading || (isLoading && !templates.length)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">
            {authLoading ? "Checking authentication..." : "Loading templates..."}
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Templates</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Create and manage your question templates
            </p>
          </div>
          <Button onClick={() => router.push('/templates/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <div
              key={template.id}
              className="p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative flex flex-col min-h-[200px]"
            >
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-medium">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <p className="text-sm text-muted-foreground">{template.questions.length} questions</p>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/templates/${template.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemplateToDelete(template)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full">
              <div className="rounded-lg border bg-card p-8">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium">No templates yet</p>
                    <p className="text-sm">Create your first template to get started</p>
                  </div>
                  <Button onClick={() => router.push('/templates/new')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Template
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template &quot;{templateToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Template'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
} 