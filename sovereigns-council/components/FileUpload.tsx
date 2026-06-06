'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileAttachment } from '@/lib/types';

interface FileUploadProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
}

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsProcessing(true);
      const newFiles: FileAttachment[] = [];

      for (const file of acceptedFiles) {
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isPdf) {
          continue;
        }

        if (isImage) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          newFiles.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: 'image',
            data: dataUrl,
          });
        } else if (isPdf) {
          // For PDFs, we'll store the file data and process it later
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          newFiles.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: 'pdf',
            data: dataUrl,
          });
        }
      }

      onFilesChange([...files, ...newFiles]);
      setIsProcessing(false);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
    },
    maxFiles: 5,
  });

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors hover:border-primary/50 hover:bg-primary/5
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Drop files here...' : 'Drag & drop images or PDFs, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">Max 5 files</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 bg-muted rounded-full pr-2 pl-3 py-1"
            >
              {file.type === 'image' ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <File className="w-4 h-4" />
              )}
              <span className="text-xs truncate max-w-[100px]">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isProcessing && (
        <p className="text-xs text-muted-foreground text-center">Processing files...</p>
      )}
    </div>
  );
}