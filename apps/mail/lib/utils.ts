import { differenceInCalendarMonths, format, isThisMonth, isToday } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Sender } from '@/types';

export const FOLDERS = {
  SPAM: 'spam',
  INBOX: 'inbox',
  ARCHIVE: 'archive',
  BIN: 'bin',
  DRAFT: 'draft',
  SENT: 'sent',
  SNOOZED: 'snoozed',
} as const;

export const LABELS = {
  SPAM: 'SPAM',
  INBOX: 'INBOX',
  UNREAD: 'UNREAD',
  IMPORTANT: 'IMPORTANT',
  SENT: 'SENT',
  TRASH: 'TRASH',
  SNOOZED: 'SNOOZED',
} as const;

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const parseAndValidateDate = (dateString: string): Date | null => {
  try {
    // Handle empty input
    if (!dateString) {
      return null;
    }

    // Parse the date string to a Date object
    const dateObj = new Date(dateString);

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date', dateString);
      return null;
    }

    return dateObj;
  } catch (error) {
    console.error('Error parsing date', error);
    return null;
  }
};

/**
 * Helper function to determine if a separate time display is needed
 * Returns false for emails from today or within last 12 hours since formatDate already shows time for these
 */
export const shouldShowSeparateTime = (dateString: string | undefined): boolean => {
  if (!dateString) return false;

  const dateObj = parseAndValidateDate(dateString);
  if (!dateObj) return false;

  const now = new Date();

  // Don't show separate time if email is from today
  if (isToday(dateObj)) return false;

  // Don't show separate time if email is within the last 12 hours
  const hoursDifference = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
  if (hoursDifference <= 12) return false;

  // Show separate time for older emails
  return true;
};

/**
 * Formats a date with different formatting logic based on parameters
 * Overloaded to handle both mail date formatting and notes date formatting
 */
export function formatDate(dateInput: string | Date | number): string {
  if (typeof dateInput === 'number') {
    dateInput = new Date(dateInput).toISOString();
  }

  // Notes formatting logic (when date is a Date object)
  if (dateInput instanceof Date) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : (dateInput as Date);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Original mail formatting logic
  const dateObj = parseAndValidateDate(dateInput as string);
  if (!dateObj) {
    return '';
  }

  try {
    const now = new Date();

    // If it's today, always show the time
    if (isToday(dateObj)) {
      return format(dateObj, 'h:mm a');
    }

    // Calculate hours difference between now and the email date
    const hoursDifference = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

    // If it's not today but within the last 12 hours, show the time
    if (hoursDifference <= 12) {
      return format(dateObj, 'h:mm a');
    }

    // If it's this month or last month, show the month and day
    if (isThisMonth(dateObj) || differenceInCalendarMonths(now, dateObj) === 1) {
      return format(dateObj, 'MMM dd');
    }

    // Otherwise show the date in MM/DD/YY format
    return format(dateObj, 'MM/dd/yy');
  } catch (error) {
    console.error('Error formatting date', error);
    return '';
  }
}

export const formatTime = (date: string) => {
  const dateObj = parseAndValidateDate(date);
  if (!dateObj) {
    return '';
  }

  try {
    // Always return the time in h:mm a format
    return format(dateObj, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time', error);
    return '';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const convertJSONToHTML = (json: any): string => {
  if (!json) return '';

  // Handle different types
  if (typeof json === 'string') return json;
  if (typeof json === 'number' || typeof json === 'boolean') return json.toString();
  if (json === null) return '';

  // Handle arrays
  if (Array.isArray(json)) {
    return json.map((item) => convertJSONToHTML(item)).join('');
  }

  // Handle objects (assuming they might have specific email content structure)
  if (typeof json === 'object') {
    // Check if it's a text node
    if (json.type === 'text') {
      let text = json.text || '';

      // Apply formatting if present
      if (json.bold) text = `<strong>${text}</strong>`;
      if (json.italic) text = `<em>${text}</em>`;
      if (json.underline) text = `<u>${text}</u>`;
      if (json.code) text = `<code>${text}</code>`;

      return text;
    }

    // Handle paragraph
    if (json.type === 'paragraph') {
      return `<p>${convertJSONToHTML(json.children)}</p>`;
    }

    // Handle headings
    if (json.type?.startsWith('heading-')) {
      const level = json.type.split('-')[1];
      return `<h${level}>${convertJSONToHTML(json.children)}</h${level}>`;
    }

    // Handle lists
    if (json.type === 'bulleted-list') {
      return `<ul>${convertJSONToHTML(json.children)}</ul>`;
    }

    if (json.type === 'numbered-list') {
      return `<ol>${convertJSONToHTML(json.children)}</ol>`;
    }

    if (json.type === 'list-item') {
      return `<li>${convertJSONToHTML(json.children)}</li>`;
    }

    // Handle links
    if (json.type === 'link') {
      return `<a href="${json.url}">${convertJSONToHTML(json.children)}</a>`;
    }

    // Handle images
    if (json.type === 'image') {
      return `<img src="${json.url}" alt="${json.alt || ''}" />`;
    }

    // Handle blockquote
    if (json.type === 'block-quote') {
      return `<blockquote>${convertJSONToHTML(json.children)}</blockquote>`;
    }

    // Handle code blocks
    if (json.type === 'code-block') {
      return `<pre><code>${convertJSONToHTML(json.children)}</code></pre>`;
    }

    // If it has children property, process it
    if (json.children) {
      return convertJSONToHTML(json.children);
    }

    // Process all other properties
    return Object.values(json)
      .map((value) => convertJSONToHTML(value))
      .join('');
  }

  return '';
};

export const constructReplyBody = (
  formattedMessage: string,
  originalDate: string,
  originalSender: Sender | undefined,
  otherRecipients: Sender[],
) => {
  const senderName = originalSender?.name || originalSender?.email || 'Unknown Sender';
  const recipientEmails = otherRecipients.map((r) => r.email).join(', ');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="">
        ${formattedMessage}
      </div>
      <div style="padding-left: 16px; border-left: 3px solid #e2e8f0; color: #64748b;">
        <div style="font-size: 12px;">
          On ${originalDate}, ${senderName} ${recipientEmails ? `&lt;${recipientEmails}&gt;` : ''} wrote:
        </div>
      </div>
    </div>
  `;
};

export const constructForwardBody = (
  formattedMessage: string,
  originalDate: string,
  originalSender: Sender | undefined,
  otherRecipients: Sender[],
) => {
  const senderName = originalSender?.name || originalSender?.email || 'Unknown Sender';
  const recipientEmails = otherRecipients.map((r) => r.email).join(', ');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="">
        ${formattedMessage}
      </div>
      <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">
          ---------- Forwarded message ----------<br/>
          From: ${senderName} ${originalSender?.email ? `&lt;${originalSender.email}&gt;` : ''}<br/>
          Date: ${originalDate}<br/>
          Subject: ${originalSender?.subject || 'No Subject'}<br/>
          To: ${recipientEmails || 'No Recipients'}
        </div>
      </div>
    </div>
  `;
};
