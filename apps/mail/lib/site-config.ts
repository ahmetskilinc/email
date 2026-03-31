const TITLE = 'zeitmail';
const DESCRIPTION = 'Email, better.';

export const siteConfig = {
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: '/favicon.ico',
  },
  applicationName: 'zeitmail',
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    // images: [
    //   {
    //     url: `${process.env.NEXT_PUBLIC_APP_URL}/og.png`,
    //     width: 1200,
    //     height: 630,
    //     alt: TITLE,
    //   },
    // ],
  },
  category: 'Email Client',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },
  keywords: [
    'Mail',
    'Email',
    'Open Source',
    'Email Client',
    'Gmail Alternative',
    'Webmail',
    'Secure Email',
    'Email Management',
    'Email Platform',
    'Communication Tool',
    'Productivity',
    'Business Email',
    'Personal Email',
    'Mail Server',
    'Email Software',
    'Collaboration',
    'Message Management',
    'Digital Communication',
    'Email Service',
    'Web Application',
  ],
  //   metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
};
