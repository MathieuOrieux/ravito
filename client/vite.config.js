import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En dev, le front appelle /api/... et Vite relaie vers l'API Express.
    proxy: { '/api': process.env.VITE_API_PROXY || 'http://localhost:3001' },
  },
});
