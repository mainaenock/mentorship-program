import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header, Footer, RuntimeControls } from '../domains/marketing/chrome';
import { config } from '../domains/shared/config';

export const metadata: Metadata = {
  title: { default: config.name, template: `%s | ${config.name}` },
  description:
    'Turn meaningful goals into measurable progress with practical learning, action plans, and mentorship.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#175e51',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: config.name,
              description: metadata.description,
              inLanguage: config.locale,
            }).replaceAll('<', '\\u003c'),
          }}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <RuntimeControls />
      </body>
    </html>
  );
}
