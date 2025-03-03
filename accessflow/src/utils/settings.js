/**
 * Default settings for AccessFlow
 */
export const DEFAULT_SETTINGS = {
  simplificationLevel: 'moderate',  // easy, moderate, minimal
  fontSize: 16,                    // in px
  fontFamily: 'default',           // default, serif, sans-serif, monospace
  lineSpacing: 'normal',           // normal, loose, tight
  readAloudSpeed: 1.0,             // 0.5 to 2.0
  highlightColor: '#FFD700',       // color for highlighting key concepts
  darkMode: false                  // dark mode toggle
};

/**
 * Load user settings from storage
 * @returns {Object} User settings
 */
export async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('accessflow_settings', (result) => {
      const settings = result.accessflow_settings || {};
      resolve({ ...DEFAULT_SETTINGS, ...settings });
    });
  });
}

/**
 * Save user settings to storage
 * @param {Object} settings - User settings
 * @returns {Promise} Promise that resolves when settings are saved
 */
export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { 'accessflow_settings': { ...settings } }, 
      () => resolve(settings)
    );
  });
}

/**
 * Apply settings to a container element
 * @param {Object} settings - User settings to apply
 * @param {Element} container - DOM element to apply settings to
 */
export function applySettings(settings, container) {
  if (!container) return;
  
  // Font size
  container.style.fontSize = `${settings.fontSize}px`;
  
  // Font family
  switch (settings.fontFamily) {
    case 'serif':
      container.style.fontFamily = 'Georgia, Times, serif';
      break;
    case 'sans-serif':
      container.style.fontFamily = 'Arial, Helvetica, sans-serif';
      break;
    case 'monospace':
      container.style.fontFamily = 'Consolas, "Courier New", monospace';
      break;
    default:
      container.style.fontFamily = 'inherit';
  }
  
  // Line spacing
  switch (settings.lineSpacing) {
    case 'loose':
      container.style.lineHeight = '1.8';
      break;
    case 'tight':
      container.style.lineHeight = '1.2';
      break;
    default:
      container.style.lineHeight = '1.5';
  }
  
  // Dark mode
  if (settings.darkMode) {
    container.classList.add('dark-mode');
  } else {
    container.classList.remove('dark-mode');
  }
  
  // Custom highlight color for key concepts
  const style = document.getElementById('accessflow-custom-styles') || document.createElement('style');
  style.id = 'accessflow-custom-styles';
  style.textContent = `
    .key-concept-term.highlight {
      background-color: ${settings.highlightColor};
    }
  `;
  document.head.appendChild(style);
}
