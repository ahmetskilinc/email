'use client';

import {
  Ellipsis,
  Figma,
  FileImage,
  FileText,
  Forward,
  HardDriveDownload,
  Lock,
  Reply,
  ReplyAll,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn, formatDate, formatTime, shouldShowSeparateTime } from '@/lib/utils';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useAttachments } from '@/hooks/use-attachments';
import type { Attachment, ParsedMessage } from '@/types';
import { useThread } from '@/hooks/use-threads';
import { BimiAvatar } from '../ui/bimi-avatar';
import { cleanHtml } from '@/lib/email-utils';
import { MailContent } from './mail-content';
import { useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { format } from 'date-fns';
import { toast } from 'sonner';

const formatFileSize = (size: number) => {
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);
  return sizeInMB === '0.00' ? '' : `${sizeInMB} MB`;
};

function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers: number[] = Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

const getFileIcon = (filename: string) => {
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
};

type Props = {
  emailData: ParsedMessage;
  index: number;
  totalEmails?: number;
  demo?: boolean;
  threadAttachments?: Attachment[];
};

const cleanEmailDisplay = (email?: string) => {
  if (!email) return '';
  const match = email.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1] : email;
};

const cleanNameDisplay = (name?: string) => {
  if (!name) return '';
  return name.trim();
};

const ThreadAttachments = ({ attachments }: { attachments: Attachment[] }) => {
  if (!attachments || attachments.length === 0) return null;

  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = decodeBase64ToBlob(attachment.body, attachment.mimeType);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  return (
    <div className="mt-2 w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Thread Attachments <span className="text-[#8D8D8D]">[{attachments.length}]</span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <button
            key={`${attachment.attachmentId}-${attachment.filename}`}
            onClick={() => handleDownload(attachment)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-[#F0F0F0] dark:bg-[#262626] dark:hover:bg-[#303030]"
          >
            <span className="text-muted-foreground">{getFileIcon(attachment.filename)}</span>
            <span className="max-w-[200px] truncate" title={attachment.filename}>
              {attachment.filename}
            </span>
            <span className="text-muted-foreground">{formatFileSize(attachment.size)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

type ActionButtonProps = {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  text: string;
  shortcut?: string;
};

const ActionButton = ({ onClick, icon, text, shortcut }: ActionButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-md border bg-white px-1.5 transition-colors hover:bg-gray-100 dark:border-none dark:bg-[#313131] dark:hover:bg-[#3d3d3d]"
    >
      {icon}
      <div className="flex items-center justify-center gap-2.5 pl-0.5 pr-1">
        <div className="justify-start text-sm leading-none text-black dark:text-white">{text}</div>
      </div>
      {shortcut && (
        <kbd
          className={cn(
            'border-muted-foreground/10 bg-accent h-6 rounded-[6px] border px-1.5 font-mono text-xs leading-6',
            '-me-1 ms-auto hidden max-h-full items-center md:inline-flex',
          )}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
};

const downloadAttachment = async (attachment: {
  body: string;
  mimeType: string;
  filename: string;
  attachmentId: string;
}) => {
  try {
    if (!attachment.body) {
      throw new Error('Attachment data not found');
    }

    const blob = decodeBase64ToBlob(attachment.body, attachment.mimeType);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    toast.error('Failed to download attachment');
  }
};

const handleDownloadAllAttachments =
  (subject: string, attachments: { body: string; mimeType: string; filename: string }[]) =>
  async () => {
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
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attachments-${subject || 'email'}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Error generating zip file:', error);
      });
  };

const openAttachment = async (attachment: {
  body: string;
  mimeType: string;
  filename: string;
  attachmentId: string;
}) => {
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
};

const MailDisplay = ({ emailData, index, totalEmails, demo, threadAttachments }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { data: threadData } = useThread(emailData.threadId ?? null);
  const { data: messageAttachments } = useAttachments(emailData.id);
  const [preventCollapse, setPreventCollapse] = useState(false);
  const { folder } = useParams<{ folder: string }>();
  const [openDetailsPopover, setOpenDetailsPopover] = useState<boolean>(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [activeReplyId, setActiveReplyId] = useQueryState('activeReplyId');

  const isLastEmail = useMemo(
    () => emailData.id === threadData?.latest?.id,
    [emailData.id, threadData?.latest?.id],
  );

  const [, setMode] = useQueryState('mode');

  useEffect(() => {
    if (!demo) {
      if (activeReplyId === emailData.id) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(!isLastEmail);
      }
      if (totalEmails && index === totalEmails - 1) {
        if (totalEmails > 5) {
          setTimeout(() => {
            const element = document.getElementById(`mail-${emailData.id}`);
            element?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  }, [demo, emailData.id, isLastEmail, activeReplyId, totalEmails, index]);

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const handlePopoverChange = useCallback((open: boolean) => {
    setOpenDetailsPopover(open);

    if (!open) {
      setPreventCollapse(true);

      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }

      collapseTimeoutRef.current = setTimeout(() => {
        setPreventCollapse(false);
      }, 300);
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    if (!preventCollapse && !openDetailsPopover) {
      setIsCollapsed(!isCollapsed);
    }
  }, [isCollapsed, preventCollapse, openDetailsPopover]);

  return (
    <div
      className={cn('relative flex-1 overflow-hidden')}
      id={`mail-${emailData.id}`}
      onClick={(e) => {
        if (openDetailsPopover) {
          e.stopPropagation();
        }
      }}
    >
      <div className="relative h-full overflow-y-auto">
        {index === 0 && threadAttachments && threadAttachments.length > 0 && (
          <div className={cn('px-4 py-4', index === 0 && 'border-b')}>
            <ThreadAttachments attachments={threadAttachments} />
          </div>
        )}
        <div className="flex cursor-pointer flex-col pb-2 duration-200" onClick={toggleCollapse}>
          <div className="mt-3 flex w-full items-start justify-between gap-4 px-4">
            <div className="flex w-full items-center justify-center gap-4">
              <BimiAvatar email={emailData?.sender?.email} name={emailData?.sender?.name} />

              <div className="flex w-full items-center justify-between">
                <div className="flex w-full items-center justify-start">
                  <div className="flex w-full flex-col">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {cleanNameDisplay(emailData?.sender?.name)}
                        </span>

                        <Popover open={openDetailsPopover} onOpenChange={handlePopoverChange}>
                          <PopoverTrigger asChild>
                            <button
                              className="hover:bg-iconLight/10 dark:hover:bg-iconDark/20 flex cursor-pointer items-center gap-2 rounded-md p-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setOpenDetailsPopover(!openDetailsPopover);
                              }}
                              ref={triggerRef}
                            >
                              <p className="text-muted-foreground text-xs underline dark:text-[#8C8C8C]">
                                {'Details'}
                              </p>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="dark:bg-panelDark flex w-[420px] overflow-auto rounded-lg border p-4 text-left shadow-lg md:w-auto"
                            onBlur={(e) => {
                              if (!triggerRef.current?.contains(e.relatedTarget)) {
                                setOpenDetailsPopover(false);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-1 text-sm">
                              <div className="flex">
                                <span className="w-24 text-end text-gray-500">{'From'}:</span>
                                <div className="ml-3">
                                  <span className="text-muted-foreground text-nowrap pr-1 font-bold">
                                    {cleanNameDisplay(emailData?.sender?.name)}
                                  </span>
                                  {emailData?.sender?.name !== emailData?.sender?.email && (
                                    <span className="text-muted-foreground text-nowrap">
                                      {cleanEmailDisplay(emailData?.sender?.email)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex">
                                <span className="w-24 text-nowrap text-end text-gray-500">
                                  {'To'}:
                                </span>
                                <span className="text-muted-foreground ml-3 text-nowrap">
                                  {emailData?.to?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
                                </span>
                              </div>
                              {emailData?.replyTo && emailData.replyTo.length > 0 && (
                                <div className="flex">
                                  <span className="w-24 text-nowrap text-end text-gray-500">
                                    {'Reply To'}:
                                  </span>
                                  <span className="text-muted-foreground ml-3 text-nowrap">
                                    {cleanEmailDisplay(emailData?.replyTo)}
                                  </span>
                                </div>
                              )}
                              {emailData?.cc && emailData.cc.length > 0 && (
                                <div className="flex">
                                  <span className="shrink-0text-nowrap w-24 text-end text-gray-500">
                                    {'Cc'}:
                                  </span>
                                  <span className="text-muted-foreground ml-3 text-nowrap">
                                    {emailData?.cc
                                      ?.map((t) => cleanEmailDisplay(t.email))
                                      .join(', ')}
                                  </span>
                                </div>
                              )}
                              {emailData?.bcc && emailData.bcc.length > 0 && (
                                <div className="flex">
                                  <span className="w-24 text-end text-gray-500">{'Bcc'}:</span>
                                  <span className="text-muted-foreground ml-3 text-nowrap">
                                    {emailData?.bcc
                                      ?.map((t) => cleanEmailDisplay(t.email))
                                      .join(', ')}
                                  </span>
                                </div>
                              )}
                              <div className="flex">
                                <span className="w-24 text-end text-gray-500">{'Date'}:</span>
                                <span className="text-muted-foreground ml-3 text-nowrap">
                                  {emailData?.receivedOn &&
                                  !isNaN(new Date(emailData.receivedOn).getTime())
                                    ? format(new Date(emailData.receivedOn), 'PPpp')
                                    : ''}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 text-end text-gray-500">{'Mailed-By'}:</span>
                                <span className="text-muted-foreground ml-3 text-nowrap">
                                  {cleanEmailDisplay(emailData?.sender?.email)}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 text-end text-gray-500">{'Signed-By'}:</span>
                                <span className="text-muted-foreground ml-3 text-nowrap">
                                  {cleanEmailDisplay(emailData?.sender?.email)}
                                </span>
                              </div>
                              {emailData.tls && (
                                <div className="flex items-center">
                                  <span className="w-24 text-end text-gray-500">{'Security'}:</span>
                                  <div className="text-muted-foreground ml-3 flex items-center gap-1">
                                    <Lock className="h-4 w-4 text-green-600" />{' '}
                                    {'Standard encryption (TLS)'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="text-muted-foreground flex-nowrap! mr-2 flex flex-col items-end text-sm font-medium dark:text-[#8C8C8C]">
                          <time className="whitespace-nowrap">
                            {emailData?.receivedOn ? formatDate(emailData.receivedOn) : ''}
                          </time>
                          {shouldShowSeparateTime(emailData?.receivedOn) && (
                            <time className="whitespace-nowrap text-xs opacity-75">
                              {emailData?.receivedOn && formatTime(emailData.receivedOn)}
                            </time>
                          )}
                        </div>

                        {(messageAttachments?.length ?? 0) > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-md bg-white transition-colors hover:bg-gray-100 focus:outline-none focus:ring-0 dark:bg-[#313131] dark:hover:bg-[#3d3d3d]"
                              >
                                <Ellipsis className="text-iconLight dark:text-iconDark" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDownloadAllAttachments(
                                    emailData.subject || 'email',
                                    messageAttachments || [],
                                  )();
                                }}
                              >
                                <HardDriveDownload className="mr-2 h-4 w-4" />
                                Download All Attachments
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex gap-1">
                        <p className="text-muted-foreground text-sm font-medium dark:text-[#8C8C8C]">
                          {'To'}:{' '}
                          {(() => {
                            const allRecipients = [
                              ...(emailData?.to || []),
                              ...(emailData?.cc || []),
                            ];

                            if (allRecipients.length === 1 && folder !== 'sent') {
                              return <span key="you">You</span>;
                            }

                            const visibleRecipients = allRecipients.slice(0, 3);
                            const remainingCount = allRecipients.length - 3;

                            return (
                              <>
                                {visibleRecipients.map((recipient, i) => (
                                  <span key={recipient.email}>
                                    {cleanNameDisplay(recipient.name) ||
                                      cleanEmailDisplay(recipient.email)}
                                    {i < visibleRecipients.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                                {remainingCount > 0 && (
                                  <span key="others">{`, +${remainingCount} others`}</span>
                                )}
                              </>
                            );
                          })()}
                        </p>
                        {(emailData?.bcc?.length || 0) > 0 && (
                          <p className="text-muted-foreground text-sm font-medium dark:text-[#8C8C8C]">
                            Bcc:{' '}
                            {emailData?.bcc?.map((recipient, i) => (
                              <span key={recipient.email}>
                                {cleanNameDisplay(recipient.name) ||
                                  cleanEmailDisplay(recipient.email)}
                                {i < (emailData?.bcc?.length || 0) - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('h-0 overflow-hidden duration-200', !isCollapsed && 'h-px')}></div>

        <div
          className={cn(
            'grid overflow-hidden duration-200',
            isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="h-fit w-full p-0">
              {emailData?.decodedBody ? (
                <MailContent
                  id={emailData.id}
                  html={emailData?.decodedBody}
                  senderEmail={emailData.sender.email}
                />
              ) : null}
              {messageAttachments && messageAttachments.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-2 px-4 pt-4">
                  {messageAttachments.map((attachment) => (
                    <div key={`${attachment.filename}-${attachment.attachmentId}`} className="flex">
                      <button
                        className="flex cursor-pointer items-center gap-1 rounded-[5px] bg-[#FAFAFA] px-1.5 py-1 text-sm font-medium hover:bg-[#F0F0F0] dark:bg-[#262626] dark:hover:bg-[#303030]"
                        onClick={() => openAttachment(attachment)}
                      >
                        {getFileIcon(attachment.filename)}
                        <span className="max-w-[15ch] truncate text-sm text-black dark:text-white">
                          {attachment.filename}
                        </span>{' '}
                        <span className="text-muted-foreground whitespace-nowrap text-sm dark:text-[#929292]">
                          {formatFileSize(attachment.size)}
                        </span>
                      </button>
                      <button
                        onClick={() => downloadAttachment(attachment)}
                        className="flex cursor-pointer items-center gap-1 rounded-[5px] px-1.5 py-1 text-sm"
                      >
                        <HardDriveDownload className="text-muted-foreground dark:text-muted-foreground h-4 w-4 fill-[#FAFAFA] dark:fill-[#262626]" />
                      </button>
                      {index < (messageAttachments?.length || 0) - 1 && (
                        <div className="m-auto h-2 w-px bg-[#E0E0E0] dark:bg-[#424242]" />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="my-2.5 flex gap-2 px-4">
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(false);
                    setMode('reply');
                    setActiveReplyId(emailData.id);
                  }}
                  icon={<Reply className="fill-muted-foreground dark:fill-[#9B9B9B]" />}
                  text={'Reply'}
                  shortcut={isLastEmail ? 'r' : undefined}
                />
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(false);
                    setMode('replyAll');
                    setActiveReplyId(emailData.id);
                  }}
                  icon={<ReplyAll className="fill-muted-foreground dark:fill-[#9B9B9B]" />}
                  text={'Reply All'}
                  shortcut={isLastEmail ? 'a' : undefined}
                />
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(false);
                    setMode('forward');
                    setActiveReplyId(emailData.id);
                  }}
                  icon={<Forward className="fill-muted-foreground dark:fill-[#9B9B9B]" />}
                  text={'Forward'}
                  shortcut={isLastEmail ? 'f' : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MailDisplay);
