'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { updateTemplate, deleteTemplate } from '@/lib/template-service';
import { TemplateForm } from "@/components/template-form";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Template } from "@/types";
import { use } from 'react';

interface EditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const resolvedParams = use(params);

  const loadTemplate = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const templateRef = doc(db, 'users', user.uid, 'templates', resolvedParams.id);
      const templateDoc = await getDoc(templateRef);

      if (!templateDoc.exists()) {
        toast({
          title: "Error",
          description: "Template not found",
          variant: "destructive",
        });
        router.push('/templates');
        return;
      }

      const data = templateDoc.data();
      setTemplate({
        id: templateDoc.id,
        userId: user.uid,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        questions: data.questions,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
      router.push('/templates');
    } finally {
      setIsLoading(false);
    }
  }, [user, resolvedParams.id, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && resolvedParams.id) {
      loadTemplate();
    }
  }, [user, authLoading, resolvedParams.id, router, loadTemplate]);

  const handleSubmit = async (data: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !template) return;

    try {
      setIsSubmitting(true);
      await updateTemplate(user.uid, template.id, data);
      toast({
        title: "Success",
        description: "Template updated successfully!",
      });
      router.push('/templates');
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !template) return;

    try {
      setIsDeleting(true);
      await deleteTemplate(user.uid, template.id);
      toast({
        description: "Template deleted successfully",
      });
      router.push('/templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">
            {authLoading ? "Checking authentication..." : "Loading template..."}
          </span>
        </div>
      </div>
    );
  }

  if (!user || !template) {
    return null;
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Edit Template</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Make changes to your template
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Template
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <TemplateForm
            initialData={template}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template &quot;{template?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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