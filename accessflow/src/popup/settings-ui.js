import { loadSettings, saveSettings } from '../utils/settings.js';
import { getApiKey, saveApiKey, verifyApiKey } from '../utils/api.js';
import { showNotification } from '../utils/dom.js';

/**
 * Initialize the settings panel
 * @param {Object} speechHandler - Speech handler instance for read aloud
 * @returns {Promise} Promise that resolves when settings are loaded
 */
export async function initSettingsPanel(speechHandler) {
  const settingsContainer = document.getElementById('settings-container');
  if (!settingsContainer) return;
  
  // Get current settings
  const settings = await loadSettings();
  const apiKey = await getApiKey();
  
  // Create settings interface
  settingsContainer.innerHTML = `
    <div class="setting-group">
      <h3>API Key</h3>
      <label class="setting-label" for="api-key">Gemini API Key</label>
      <input type="password" id="api-key" class="setting-control" value="${apiKey || ''}" placeholder="Enter your Gemini API key">
      <p class="setting-help">Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></p>
      <div class="settings-buttons">
        <button id="verify-api-key" class="accessflow-button secondary">Verify Key</button>
        <button id="save-api-key" class="accessflow-button">Save Key</button>
      </div>
    </div>
    
    <div class="setting-group">
      <h3>Text Processing</h3>
      <label class="setting-label" for="simplification-level">Simplification Level</label>
      <select id="simplification-level" class="setting-control">
        <option value="basic" ${settings.simplificationLevel === 'basic' ? 'selected' : ''}>Basic (Elementary)</option>
        <option value="moderate" ${settings.simplificationLevel === 'moderate' ? 'selected' : ''}>Moderate (Middle School)</option>
        <option value="advanced" ${settings.simplificationLevel === 'advanced' ? 'selected' : ''}>Advanced (High School)</option>
      </select>
      <p class="setting-help">Select how much to simplify text when using "Simplify" mode</p>
    </div>
    
    <div class="setting-group">
      <h3>Display Options</h3>
      <label class="setting-label" for="font-size">Font Size</label>
      <select id="font-size" class="setting-control">
        <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
        <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
      </select>
      
      <label class="setting-label" for="font-family">Font Family</label>
      <select id="font-family" class="setting-control">
        <option value="default" ${settings.fontFamily === 'default' ? 'selected' : ''}>Default</option>
        <option value="serif" ${settings.fontFamily === 'serif' ? 'selected' : ''}>Serif</option>
        <option value="sans-serif" ${settings.fontFamily === 'sans-serif' ? 'selected' : ''}>Sans Serif</option>
        <option value="dyslexic" ${settings.fontFamily === 'dyslexic' ? 'selected' : ''}>OpenDyslexic</option>
      </select>
      
      <div class="setting-checkbox">
        <input type="checkbox" id="high-contrast" ${settings.highContrast ? 'checked' : ''}>
        <label for="high-contrast">High Contrast Mode</label>
      </div>
    </div>
    
    <div class="setting-group">
      <h3>Read Aloud</h3>
      <label class="setting-label" for="read-aloud-speed">Speed</label>
      <input type="range" id="read-aloud-speed" min="0.5" max="2" step="0.1" value="${settings.readAloudSpeed}">
      <div class="range-labels">
        <span>Slow</span>
        <span>${settings.readAloudSpeed}x</span>
        <span>Fast</span>
      </div>
      <button id="test-read-aloud" class="accessflow-button secondary">Test Read Aloud</button>
    </div>
    
    <div class="setting-group">
      <h3>Other Settings</h3>
      <div class="setting-checkbox">
        <input type="checkbox" id="auto-copy" ${settings.autoCopyToClipboard ? 'checked' : ''}>
        <label for="auto-copy">Auto-copy results to clipboard</label>
      </div>
      
      <div class="setting-checkbox">
        <input type="checkbox" id="save-history" ${settings.saveHistory ? 'checked' : ''}>
        <label for="save-history">Save processing history</label>
      </div>
      
      <label class="setting-label" for="max-history">Max History Items</label>
      <input type="number" id="max-history" class="setting-control" min="1" max="50" value="${settings.maxHistoryItems}">
    </div>
    
    <div class="settings-buttons">
      <button id="reset-settings" class="accessflow-button secondary">Reset to Default</button>
      <button id="save-settings" class="accessflow-button">Save Settings</button>
    </div>
  `;
  
  // Set up event listeners
  setupSettingsEventListeners(settings, speechHandler);
}

/**
 * Set up event listeners for settings
 * @param {Object} currentSettings - Current settings
 * @param {Object} speechHandler - Speech handler instance
 */
function setupSettingsEventListeners(currentSettings, speechHandler) {
  // API Key settings
  document.getElementById('save-api-key')?.addEventListener('click', async () => {
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
      const newApiKey = apiKeyInput.value.trim();
      if (!newApiKey) {
        showNotification('API key cannot be empty', 'error');
        return;
      }
      
      try {
        await saveApiKey(newApiKey);
        showNotification('API key saved successfully');
      } catch (error) {
        showNotification('Failed to save API key', 'error');
      }
    }
  });
  
  document.getElementById('verify-api-key')?.addEventListener('click', async () => {
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
      const keyToVerify = apiKeyInput.value.trim();
      if (!keyToVerify) {
        showNotification('Please enter an API key to verify', 'error');
        return;
      }
      
      // Show verification in progress
      const verifyButton = document.getElementById('verify-api-key');
      const originalText = verifyButton.textContent;
      verifyButton.disabled = true;
      verifyButton.textContent = 'Verifying...';
      
      try {
        const isValid = await verifyApiKey(keyToVerify);
        if (isValid) {
          showNotification('API key is valid');
        } else {
          showNotification('API key is invalid', 'error');
        }
      } catch (error) {
        showNotification('Failed to verify API key', 'error');
      } finally {
        verifyButton.disabled = false;
        verifyButton.textContent = originalText;
      }
    }
  });
  
  // Read aloud settings
  const speedRangeInput = document.getElementById('read-aloud-speed');
  if (speedRangeInput) {
    speedRangeInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      const rangeLabels = document.querySelector('.range-labels span:nth-child(2)');
      if (rangeLabels) {
        rangeLabels.textContent = `${value.toFixed(1)}x`;
      }
      
      // Update speech handler
      if (speechHandler) {
        speechHandler.setOptions({ rate: value });
      }
    });
  }
  
  // Test read aloud
  document.getElementById('test-read-aloud')?.addEventListener('click', () => {
    if (speechHandler) {
      const testText = document.createElement('div');
      testText.textContent = "This is a test of the AccessFlow read aloud feature. You can adjust the speed using the slider above.";
      speechHandler.stop(); // Stop any current speech
      speechHandler.speak(testText);
      showNotification('Testing read aloud...');
    }
  });
  
  // Display settings
  document.getElementById('font-size')?.addEventListener('change', (e) => {
    const fontSize = e.target.value;
    const updatedSettings = { ...currentSettings, fontSize };
    applySettingChange(updatedSettings);
  });
  
  document.getElementById('font-family')?.addEventListener('change', (e) => {
    const fontFamily = e.target.value;
    const updatedSettings = { ...currentSettings, fontFamily };
    applySettingChange(updatedSettings);
  });
  
  document.getElementById('high-contrast')?.addEventListener('change', (e) => {
    const highContrast = e.target.checked;
    const updatedSettings = { ...currentSettings, highContrast };
    applySettingChange(updatedSettings);
  });
  
  // Simplification level
  document.getElementById('simplification-level')?.addEventListener('change', (e) => {
    const simplificationLevel = e.target.value;
    const updatedSettings = { ...currentSettings, simplificationLevel };
    applySettingChange(updatedSettings);
  });
  
  // Other settings
  document.getElementById('auto-copy')?.addEventListener('change', (e) => {
    const autoCopyToClipboard = e.target.checked;
    const updatedSettings = { ...currentSettings, autoCopyToClipboard };
    applySettingChange(updatedSettings);
  });
  
  document.getElementById('save-history')?.addEventListener('change', (e) => {
    const saveHistory = e.target.checked;
    const updatedSettings = { ...currentSettings, saveHistory };
    applySettingChange(updatedSettings);
  });
  
  document.getElementById('max-history')?.addEventListener('change', (e) => {
    const maxHistoryItems = parseInt(e.target.value, 10);
    if (maxHistoryItems > 0 && maxHistoryItems <= 50) {
      const updatedSettings = { ...currentSettings, maxHistoryItems };
      applySettingChange(updatedSettings);
    }
  });
  
  // Reset settings
  document.getElementById('reset-settings')?.addEventListener('click', async () => {
    if (confirm("Are you sure you want to reset all settings to their default values?")) {
      try {
        // Save default settings (this will merge with the DEFAULT_SETTINGS in the saveSettings function)
        await saveSettings({});
        
        // Reload page to apply default settings
        showNotification('Settings have been reset');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        showNotification('Failed to reset settings', 'error');
      }
    }
  });
  
  // Save all settings
  document.getElementById('save-settings')?.addEventListener('click', async () => {
    try {
      const newSettings = {
        simplificationLevel: document.getElementById('simplification-level')?.value || currentSettings.simplificationLevel,
        fontSize: document.getElementById('font-size')?.value || currentSettings.fontSize,
        fontFamily: document.getElementById('font-family')?.value || currentSettings.fontFamily,
        highContrast: document.getElementById('high-contrast')?.checked || false,
        readAloudSpeed: parseFloat(document.getElementById('read-aloud-speed')?.value) || currentSettings.readAloudSpeed,
        autoCopyToClipboard: document.getElementById('auto-copy')?.checked || false,
        saveHistory: document.getElementById('save-history')?.checked || false,
        maxHistoryItems: parseInt(document.getElementById('max-history')?.value, 10) || currentSettings.maxHistoryItems
      };
      
      await saveSettings(newSettings);
      showNotification('Settings saved successfully');
      
      // Apply settings to UI
      import('../utils/settings.js').then(module => {
        module.applySettings(newSettings, document.body);
      });
    } catch (error) {
      showNotification('Failed to save settings', 'error');
    }
  });
}

/**
 * Apply a setting change in real-time
 * @param {Object} updatedSettings - The updated settings object
 */
async function applySettingChange(updatedSettings) {
  try {
    // Save the updated settings
    await saveSettings(updatedSettings);
    
    // Apply the updated settings to the UI
    import('../utils/settings.js').then(module => {
      module.applySettings(updatedSettings, document.body);
    });
  } catch (error) {
    console.error('Failed to apply setting change:', error);
  }
}
