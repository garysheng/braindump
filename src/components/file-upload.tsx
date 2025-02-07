'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X, Paperclip } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  files: Array<{ url: string; type: string; name: string }>;
  onRemove: (index: number) => void;
  isUploading?: boolean;
}

export function FileUpload({
  onFileSelect,
  files,
  onRemove,
  isUploading = false,
}: FileUploadProps) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList) return;
      onFileSelect(Array.from(fileList));
      e.target.value = ''; // Reset input
    },
    [onFileSelect]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
          className="relative overflow-hidden"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4 mr-2" />
          )}
          Attach Files
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />
        </Button>
        {isUploading && (
          <span className="text-sm text-muted-foreground">Uploading...</span>
        )}
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={file.url}
              className="flex items-center justify-between p-2 rounded-md bg-card"
            >
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              <button
                onClick={() => onRemove(index)}
                className="p-1 hover:bg-accent rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 