import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { recommendDepartmentWithGemini } from './src/server/aiRecommendation.ts';

dotenv.config();

function apiPlugin(): Plugin {
  return {
    name: 'api-recommendation-plugin',
    configureServer(server) {
      server.middlewares.use('/api/recommend-department', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const result = await recommendDepartmentWithGemini({
              symptoms: parsed.symptoms || '',
              patientAge: parsed.patientAge ? Number(parsed.patientAge) : undefined,
              patientGender: parsed.patientGender,
            });
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
