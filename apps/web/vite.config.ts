import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// VITE_BASE controls the public path, e.g. "/mumbaaai/" for https://<user>.github.io/mumbaaai/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || '/';
  return {
    base: base.endsWith('/') ? base : base + '/',
    plugins: [react(), tailwindcss()],
    build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
    server: { port: 5173 },
  };
});
