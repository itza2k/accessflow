// Default settings for AccessFlow
export const DEFAULT_SETTINGS = {
  simplificationLevel: 'moderate',
  fontSize: 16,
  fontFamily: 'default',
  lineSpacing: 'normal',
  readAloudSpeed: 1.0,
  highlightColor: '#FFD700',
  darkMode: false
};

// Load settings from storage
export async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('accessflow_settings', (result) => {
      if (result.accessflow_settings) {
        resolve({ ...DEFAULT_SETTINGS, ...result.accessflow_settings });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

// Save settings to storage
export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 'accessflow_settings': settings }, () => {
      resolve(settings);
    });
  });
}

// Update a single setting
async function updateSetting(key, value) {
  const settings = await loadSettings();
  settings[key] = value;
  return saveSettings(settings);
}

// Apply settings to a container element
export function applySettings(settings, container) {
  if (!container) return;
  
  // Apply font size
  container.style.fontSize = `${settings.fontSize}px`;
  
  // Apply font family
  if (settings.fontFamily === 'opendyslexic') {
    // Load OpenDyslexic font if not already loaded
    if (!document.getElementById('dyslexic-font-style')) {
      const linkElement = document.createElement('link');
      linkElement.id = 'dyslexic-font-style';
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.css';
      document.head.appendChild(linkElement);
    }
    container.style.fontFamily = '"OpenDyslexic", sans-serif';
  } else {
    container.style.fontFamily = 'var(--font-family)';
  }
  
  // Apply line spacing
  if (settings.lineSpacing === '1.5x') {
    container.style.lineHeight = '1.5';
  } else if (settings.lineSpacing === '2x') {
    container.style.lineHeight = '2';
  } else {
    container.style.lineHeight = 'normal';
  }
  
  // Apply highlight color as a CSS variable
  document.documentElement.style.setProperty('--highlight-color', settings.highlightColor);
  
  // Set dark mode if needed
  if (settings.darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}
