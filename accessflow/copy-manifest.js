import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source and destination paths
const sourceDir = path.join(__dirname, 'public');
const destDir = path.join(__dirname, 'dist');

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy manifest.json
try {
  const manifestSource = path.join(sourceDir, 'manifest.json');
  const manifestDest = path.join(destDir, 'manifest.json');
  
  if (fs.existsSync(manifestSource)) {
    fs.copyFileSync(manifestSource, manifestDest);
    console.log('Copying manifest.json to dist folder...');
  } else {
    console.error('Error: manifest.json not found in public directory');
    // Create a basic manifest to prevent build errors
    const basicManifest = {
      "manifest_version": 3,
      "name": "AccessFlow",
      "version": "1.0.0",
      "description": "AI-powered accessibility browser extension",
      "icons": {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      },
      "action": {
        "default_popup": "src/popup/popup.html",
        "default_icon": {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      },
      "permissions": ["storage", "contextMenus"],
      "host_permissions": ["<all_urls>"],
      "background": {
        "service_worker": "assets/background.js",
        "type": "module"
      },
      "content_scripts": [
        {
          "matches": ["<all_urls>"],
          "js": ["assets/content.js"]
        }
      ]
    };
    
    fs.writeFileSync(manifestDest, JSON.stringify(basicManifest, null, 2));
    console.log('Created basic manifest.json in dist folder');
  }
} catch (error) {
  console.error('Error copying manifest.json:', error.message);
}

// Copy CSS files if they exist
try {
  const cssSource = path.join(sourceDir, 'style.css');
  const cssDest = path.join(destDir, 'style.css');
  
  if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, cssDest);
    console.log('Copying style.css to dist folder...');
  }
} catch (error) {
  console.error('Error copying CSS:', error.message);
}

// Copy welcome.html as index.html for the extension's welcome page
try {
  const welcomeSource = path.join(__dirname, 'src/welcome/welcome.html');
  const welcomeDest = path.join(destDir, 'welcome.html');
  
  if (fs.existsSync(welcomeSource)) {
    fs.copyFileSync(welcomeSource, welcomeDest);
    console.log('Copying welcome.html to dist folder as welcome.html...');
    
    // Adjust paths in the welcome.html file for the dist environment
    let welcomeContent = fs.readFileSync(welcomeDest, 'utf8');
    welcomeContent = welcomeContent
      .replace('../../assets/welcome.css', 'assets/welcome.css')
      .replace('../../icons/', 'icons/')
      .replace('../../assets/welcome.js', 'assets/welcome.js');
    fs.writeFileSync(welcomeDest, welcomeContent);
  }
} catch (error) {
  console.error('Error copying welcome.html:', error.message);
}

// Copy icon files
try {
  const iconSourceDir = path.join(sourceDir, 'icons');
  const iconDestDir = path.join(destDir, 'icons');
  
  if (!fs.existsSync(iconDestDir)) {
    fs.mkdirSync(iconDestDir, { recursive: true });
  }
  
  if (fs.existsSync(iconSourceDir)) {
    const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
    
    icons.forEach(icon => {
      const iconSource = path.join(iconSourceDir, icon);
      const iconDest = path.join(iconDestDir, icon);
      
      if (fs.existsSync(iconSource)) {
        fs.copyFileSync(iconSource, iconDest);
        console.log(`Copied icon: ${icon}`);
      } else {
        // Create an empty placeholder icon
        fs.writeFileSync(iconDest, '');
        console.log(`Created placeholder for icon: ${icon}`);
      }
    });
  }
} catch (error) {
  console.error('Error copying icons:', error.message);
}

console.log('Asset copying complete.');
