'use client';

import { Figma, FileImage, FileText } from 'lucide-react';

export function getFileIcon(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-[#F43F5E]" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return <FileImage className="h-4 w-4" />;
    case 'docx':
      return <FileText className="h-4 w-4 text-[#2563EB]" />;
    case 'fig':
      return <Figma className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4 text-[#8B5CF6]" />;
  }
}
