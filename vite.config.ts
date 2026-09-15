import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
import { cdnAdapter } from '@vinext/cloudflare/cache/cdn-adapter';

export default defineConfig({
  server: {
    watch: { ignored: ['**/test-results/**', '**/playwright-report/**', '**/artifacts/**', '**/docs/**'] },
  },
  plugins: [
    vinext({
      cache: { cdn: cdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr'],
      },
    }),
  ],
});
