import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'MediFlow — Smart Hospital Management System',
  description: 'Healthcare, Simplified. Hospital ERP + Patient App + Doctor App + AI Assistant.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
