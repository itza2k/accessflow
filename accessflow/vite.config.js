import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Create an input object from src directories
const inputFiles = {
  popup: resolve(__dirname, 'src/popup/popup.html'),
  welcome: resolve(__dirname, 'src/welcome/welcome.html'),
  background: resolve(__dirname, 'src/background/background.js'),
  content: resolve(__dirname, 'src/content/content.js')
};

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: inputFiles,
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep manifest.json filename unchanged
          if (assetInfo.name === 'manifest.json') {
            return 'manifest.json';
          }
          return '[name].[ext]';
        }
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
      name: 'copy-extension-files',
      writeBundle() {
        // Copy manifest.json to dist
        const manifestSrc = resolve(__dirname, 'src/manifest.json');
        const manifestDest = resolve(__dirname, 'dist/manifest.json');
        fs.copyFileSync(manifestSrc, manifestDest);
        console.log('Copied manifest.json to dist');

        // Copy icons if they exist
        const iconsDir = resolve(__dirname, 'src/icons');
        const destIconsDir = resolve(__dirname, 'dist/icons');
        
        if (fs.existsSync(iconsDir)) {
          if (!fs.existsSync(destIconsDir)) {
            fs.mkdirSync(destIconsDir, { recursive: true });
          }
          
          fs.readdirSync(iconsDir).forEach(file => {
            const srcPath = resolve(iconsDir, file);
            const destPath = resolve(destIconsDir, file);
            if (fs.statSync(srcPath).isFile()) {
              fs.copyFileSync(srcPath, destPath);
              console.log(`Copied ${file} to dist/icons`);
            }
          });
        }
      }
    }
  ]
});
