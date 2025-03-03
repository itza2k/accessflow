/**
 * Default settings for AccessFlow
 */
const DEFAULT_SETTINGS = {
  simplificationLevel: 'moderate', // basic, moderate, advanced
  fontSize: 'medium', // small, medium, large
  fontFamily: 'default', // default, serif, sans-serif, dyslexic
  highContrast: false,
  readAloudSpeed: 1.0,
  autoCopyToClipboard: false,
  saveHistory: true,
  maxHistoryItems: 10
};

/**
 * Save settings to Chrome storage
 * @param {Object} settings - Settings to save
 * @returns {Promise} Promise resolving when settings are saved
 */
export function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 
      'accessflow_settings': {
        ...DEFAULT_SETTINGS,
        ...settings
      }
    }, () => {
      resolve();
    });
  });
}

/**
 * Load settings from Chrome storage
 * @returns {Promise<Object>} Promise resolving with settings
 */
export async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('accessflow_settings', (result) => {
      const settings = result.accessflow_settings || {};
      resolve({
        ...DEFAULT_SETTINGS,
        ...settings
      });
    });
  });
}

/**
 * Apply settings to the UI
 * @param {Object} settings - Settings to apply
 * @param {Element} container - Container to apply settings to
 */
export function applySettings(settings, container) {
  if (!container) return;
  
  // Apply font size
  switch (settings.fontSize) {
    case 'small':
      container.style.fontSize = '0.9rem';
      break;
    case 'medium':
      container.style.fontSize = '1rem';
      break;
    case 'large':
      container.style.fontSize = '1.2rem';
      break;
  }
  
  // Apply font family
  switch (settings.fontFamily) {
    case 'default':
      container.style.fontFamily = '"Inter", sans-serif';
      break;
    case 'serif':
      container.style.fontFamily = '"Georgia", serif';
      break;
    case 'sans-serif':
      container.style.fontFamily = '"Arial", sans-serif';
      break;
    case 'dyslexic':
      // Add OpenDyslexic font if not already added
      if (!document.getElementById('dyslexic-font')) {
        const link = document.createElement('link');
        link.id = 'dyslexic-font';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/dist/opendyslexic.min.css';
        document.head.appendChild(link);
      }
      container.style.fontFamily = '"OpenDyslexic", sans-serif';
      container.style.letterSpacing = '0.05em';
      container.style.wordSpacing = '0.15em';
      break;
  }
  
  // Apply high contrast
  if (settings.highContrast) {
    container.classList.add('high-contrast');
  } else {
    container.classList.remove('high-contrast');
  }
}
