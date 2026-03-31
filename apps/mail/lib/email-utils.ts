import DOMPurify from 'dompurify';

export const cleanHtml = (html: string) => {
  if (!html) return '<p><em>No email content available</em></p>';

  try {
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.warn('DOMPurify Failed or not Available, falling back to Default HTML ', error);
    return '<p><em>No email content available</em></p>';
  }
};
