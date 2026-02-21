import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Works on GitHub Pages for ANY repo name, and also when opening dist/index.html locally.
// Set VITE_BASE to '/<repo>/' if you want an explicit base.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || './';
  return {
    base,
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
