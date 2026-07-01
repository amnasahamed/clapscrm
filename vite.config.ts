import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const vercelApiPlugin = () => ({
  name: 'vercel-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.startsWith('/api/')) {
        try {
          const apiPath = req.url.split('?')[0];
          // Mock Vercel response helpers
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          // Dynamically import the handler (assuming .js files in api folder)
          const handler = await import(`.${apiPath}.js`);
          await handler.default(req, res);
        } catch (err) {
          console.error('Error handling API request:', err);
          next();
        }
      } else {
        next();
      }
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), vercelApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
