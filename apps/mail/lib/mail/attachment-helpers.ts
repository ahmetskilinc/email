import { toast } from 'sonner';

export function formatFileSize(size: number) {
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);
  return sizeInMB === '0.00' ? '' : `${sizeInMB} MB`;
}

export function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers: number[] = Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function downloadAttachment(attachment: {
  body: string;
  mimeType: string;
  filename: string;
  attachmentId: string;
}) {
  try {
    if (!attachment.body) {
      throw new Error('Attachment data not found');
    }

    const blob = decodeBase64ToBlob(attachment.body, attachment.mimeType);
    triggerBlobDownload(blob, attachment.filename);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    toast.error('Failed to download attachment');
  }
}

export function createDownloadAllZipHandler(
  subject: string,
  attachments: { body: string; mimeType: string; filename: string }[],
) {
  return async () => {
    if (!attachments.length) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    attachments.forEach((attachment) => {
      try {
        const blob = decodeBase64ToBlob(attachment.body, attachment.mimeType);
        zip.file(attachment.filename, blob, { date: new Date() });
      } catch (error) {
        console.error(`Error adding ${attachment.filename} to zip:`, error);
      }
    });

    zip
      .generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      })
      .then((content) => {
        triggerBlobDownload(content, `attachments-${subject || 'email'}.zip`);
      })
      .catch((error) => {
        console.error('Error generating zip file:', error);
      });
  };
}

export async function openAttachment(attachment: {
  body: string;
  mimeType: string;
  filename: string;
  attachmentId: string;
}) {
  try {
    if (!attachment.body) {
      throw new Error('Attachment data not found');
    }

    const blob = decodeBase64ToBlob(attachment.body, attachment.mimeType);
    const url = window.URL.createObjectURL(blob);

    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      url,
      'attachment-viewer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,location=no,menubar=no`,
    );

    if (popup) {
      popup.focus();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    console.error('Error opening attachment:', error);
    toast.error('Failed to open attachment');
  }
}
