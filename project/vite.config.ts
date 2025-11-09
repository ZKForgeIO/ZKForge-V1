import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@solana/web3.js', 'bs58', 'tweetnacl', 'tweetnacl-util', '@noble/hashes'],
  },
  resolve: {
    alias: {
      '@solana/web3.js': '@solana/web3.js/lib/index.esm.js',
    },
  },
});
