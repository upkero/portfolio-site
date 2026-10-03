import { defineConfig, loadEnv } from 'vite';
import { createLiveHandler } from './server/live.js';

export default defineConfig(({ mode }) => {
  // '' prefix: read every variable, but only here on the server side —
  // nothing without VITE_ ever reaches the browser bundle.
  const live = createLiveHandler(loadEnv(mode, process.cwd(), ''));
  const mount = (server) => {
    server.middlewares.use('/live', live);
  };
  return {
    plugins: [{ name: 'live-bridge', configureServer: mount, configurePreviewServer: mount }],
    // livekit-client (~560 kB) is a lazy chunk loaded only when a voice call starts
    build: { chunkSizeWarningLimit: 600 },
  };
});
