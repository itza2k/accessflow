import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        welcome: resolve(__dirname, 'src/welcome/welcome.html'),
        background: resolve(__dirname, 'src/background/background.js'),
        content: resolve(__dirname, 'src/content/content.js'),
        welcomeScript: resolve(__dirname, 'src/welcome/welcome.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Ensure welcome.js is output as welcome.js without chunking
          if (chunkInfo.name === 'welcomeScript') {
            return 'welcome.js';
          }
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [
    {
      name: 'copy-assets',
      generateBundle() {
        console.log('Assets will be copied during build');
      }
    }
  ]
});
