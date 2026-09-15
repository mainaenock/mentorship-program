export function GET() {
  return new Response(
    'User-agent: *\nDisallow: /dashboard\nDisallow: /onboarding\nDisallow: /guardian/\nDisallow: /mentor/application\nDisallow: /reset-password\n',
    { headers: { 'Content-Type': 'text/plain' } },
  );
}
