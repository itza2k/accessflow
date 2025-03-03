/**
 * Default settings for AccessFlow
 */
const DEFAULT_SETTINGS = {
  simplificationLevel: 'moderate', // basic, moderate, advanced
  fontSize: 'medium',             // small, medium, large
  fontFamily: 'default',          // default, serif, sans-serif, dyslexic
  lineSpacing: 'normal',          // normal, comfortable, wide
  highContrast: false,
  darkMode: null,                 // null (system), true, false
  readAloudSpeed: 1.0,
  readAloudVoice: '',             // Use default voice when empty
  highlightColor: '#4285F4',      // Default highlight color
  autoCopyToClipboard: false,
  saveHistory: true,
  maxHistoryItems: 10
};

/**
 * Available font families
 */
export const FONT_FAMILIES = {
  default: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  'sans-serif': 'Arial, Helvetica, sans-serif',
  dyslexic: '"OpenDyslexic", sans-serif'
};

/**
 * Line spacing options
 */
export const LINE_SPACINGS = {
  normal: '1.5',
  comfortable: '1.8',
  wide: '2.2'
};

/**
 * Font size options
 */
export const FONT_SIZES = {
  small: '0.9rem',
  medium: '1rem',
  large: '1.2rem'
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
  container.style.fontSize = FONT_SIZES[settings.fontSize] || FONT_SIZES.medium;
  
  // Apply font family
  container.style.fontFamily = FONT_FAMILIES[settings.fontFamily] || FONT_FAMILIES.default;
  
  // Apply line spacing
  container.style.lineHeight = LINE_SPACINGS[settings.lineSpacing] || LINE_SPACINGS.normal;
  
  // Apply high contrast mode
  if (settings.highContrast) {
    container.classList.add('high-contrast');
  } else {
    container.classList.remove('high-contrast');
  }
  
  // Apply dyslexia friendly styles
  if (settings.fontFamily === 'dyslexic') {
    // Add OpenDyslexic font if not already added
    if (!document.getElementById('dyslexic-font')) {
      const link = document.createElement('link');
      link.id = 'dyslexic-font';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/dist/opendyslexic.min.css';
      document.head.appendChild(link);
    }
    
    // Add dyslexia friendly class for additional styling
    container.classList.add('dyslexia-friendly');
  } else {
    container.classList.remove('dyslexia-friendly');
  }
  
  // Apply dark mode if explicitly set (otherwise use system preference)
  if (settings.darkMode !== null) {
    if (settings.darkMode) {
      container.classList.add('dark-mode');
    } else {
      container.classList.remove('dark-mode');
    }
  }
  
  // Apply custom CSS variables for highlighting
  if (settings.highlightColor) {
    container.style.setProperty('--highlight-color', settings.highlightColor);
  }
}
