import { config } from '../../domains/shared/config';
export function GET() {
  return Response.json({
    id: '/',
    name: config.name,
    short_name: config.shortName,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fdfcf9',
    theme_color: '#175e51',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  });
}
