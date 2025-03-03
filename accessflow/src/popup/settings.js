import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../utils/settings.js';
import { getApiKey, saveApiKey, verifyApiKey } from '../utils/api.js';

/**
 * Initialize the settings panel
 */
export async function initSettingsPanel() {
  const settingsContainer = document.getElementById('settings-container');
  if (!settingsContainer) return;
  
  const settings = await loadSettings();
  
  // the settign ui
  settingsContainer.innerHTML = `
    <h2>Settings</h2>
    
    <div class="setting-group">
      <label class="setting-label" for="apiKey">Gemini API Key</label>
      <input type="password" id="apiKey" class="setting-control" placeholder="Enter your Gemini API key">
      <p class="setting-help">Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></p>
      <button id="saveApiKey" class="accessflow-button">Save API Key</button>
      <div id="api-key-status"></div>
    </div>
    
    <div class="setting-group">
      <label class="setting-label" for="simplificationLevel">Simplification Level</label>
      <select id="simplificationLevel" class="setting-control">
        <option value="easy" ${settings.simplificationLevel === 'easy' ? 'selected' : ''}>Easy (simpler words and shorter sentences)</option>
        <option value="moderate" ${settings.simplificationLevel === 'moderate' ? 'selected' : ''}>Moderate (balanced simplification)</option>
        <option value="minimal" ${settings.simplificationLevel === 'minimal' ? 'selected' : ''}>Minimal (light clarification only)</option>
      </select>
    </div>
    
    <div class="setting-group">
      <label class="setting-label" for="fontFamily">Font Family</label>
      <select id="fontFamily" class="setting-control">
        <option value="default" ${settings.fontFamily === 'default' ? 'selected' : ''}>Default</option>
        <option value="serif" ${settings.fontFamily === 'serif' ? 'selected' : ''}>Serif (Georgia, Times)</option>
        <option value="sans-serif" ${settings.fontFamily === 'sans-serif' ? 'selected' : ''}>Sans-serif (Arial, Helvetica)</option>
        <option value="monospace" ${settings.fontFamily === 'monospace' ? 'selected' : ''}>Monospace (Consolas, Courier)</option>
      </select>
    </div>
    
    <div class="setting-group">
      <label class="setting-label" for="fontSize">Font Size: ${settings.fontSize}px</label>
      <input type="range" id="fontSize" min="12" max="24" step="1" value="${settings.fontSize}" class="setting-control">
    </div>
    
    <div class="setting-group">
      <label class="setting-label" for="lineSpacing">Line Spacing</label>
      <select id="lineSpacing" class="setting-control">
        <option value="tight" ${settings.lineSpacing === 'tight' ? 'selected' : ''}>Tight</option>
        <option value="normal" ${settings.lineSpacing === 'normal' ? 'selected' : ''}>Normal</option>
        <option value="loose" ${settings.lineSpacing === 'loose' ? 'selected' : ''}>Loose</option>
      </select>
    </div>
    
    <div class="setting-group">
      <label class="setting-label" for="readAloudSpeed">Read Aloud Speed: ${settings.readAloudSpeed}x</label>
      <input type="range" id="readAloudSpeed" min="0.5" max="2" step="0.1" value="${settings.readAloudSpeed}" class="setting-control">
    </div>
    
    <div class="settings-buttons">
      <button id="saveSettings" class="accessflow-button">Save Settings</button>
      <button id="resetSettings" class="accessflow-button secondary">Reset to Defaults</button>
    </div>
  `;
  
  // populate from the api key
  const apiKey = await getApiKey();
  const apiKeyInput = document.getElementById('apiKey');
  if (apiKeyInput && apiKey) {
    apiKeyInput.value = '********';
  }
  
  
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  if (saveApiKeyBtn) { //save the key
    saveApiKeyBtn.addEventListener('click', async () => {
      const apiKeyInput = document.getElementById('apiKey');
      const apiKeyStatus = document.getElementById('api-key-status');
      
      if (!apiKeyInput || !apiKeyStatus) return;
      
      const newApiKey = apiKeyInput.value.trim();
      
      if (!newApiKey) {
        apiKeyStatus.innerHTML = '<span class="status-error">Please enter an API key</span>';
        return;
      }
      
      apiKeyStatus.innerHTML = 'Verifying API key...';
      
      try {
        const isValid = await verifyApiKey(newApiKey);
        
        if (isValid) {
          await saveApiKey(newApiKey);
          apiKeyStatus.innerHTML = '<span class="status-success">API key saved successfully</span>';
          
          // update for cases
          const apiKeyMissingNotice = document.getElementById('api-key-missing');
          const processControls = document.getElementById('process-controls');
          
          if (apiKeyMissingNotice && processControls) {
            apiKeyMissingNotice.style.display = 'none';
            processControls.style.display = 'block';
          }
        } else {
          apiKeyStatus.innerHTML = '<span class="status-error">Invalid API key</span>';
        }
      } catch (error) {
        apiKeyStatus.innerHTML = '<span class="status-error">Error verifying API key</span>';
        console.error('API key verification error:', error);
      }
    });
  }
  
  // font sizze change
  const fontSizeSlider = document.getElementById('fontSize');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', () => {
      const label = document.querySelector('label[for="fontSize"]');
      if (label) {
        label.textContent = `Font Size: ${fontSizeSlider.value}px`;
      }
    });
  }
  
  
  const readAloudSpeedSlider = document.getElementById('readAloudSpeed');
  if (readAloudSpeedSlider) {
    readAloudSpeedSlider.addEventListener('input', () => {
      const label = document.querySelector('label[for="readAloudSpeed"]');//aloud speaker
      if (label) {
        label.textContent = `Read Aloud Speed: ${readAloudSpeedSlider.value}x`;
      }
    });
  }
  
  // save
  const saveSettingsBtn = document.getElementById('saveSettings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const newSettings = {
        simplificationLevel: document.getElementById('simplificationLevel')?.value || settings.simplificationLevel,
        fontSize: parseInt(document.getElementById('fontSize')?.value || settings.fontSize),
        fontFamily: document.getElementById('fontFamily')?.value || settings.fontFamily,
        lineSpacing: document.getElementById('lineSpacing')?.value || settings.lineSpacing,
        readAloudSpeed: parseFloat(document.getElementById('readAloudSpeed')?.value || settings.readAloudSpeed),
        darkMode: document.body.classList.contains('dark-mode')
      };
      
      try {
        await saveSettings(newSettings);
        const feedback = document.createElement('div');
        feedback.className = 'accessflow-feedback';
        feedback.textContent = 'Settings saved successfully';
        document.body.appendChild(feedback);
        
        setTimeout(() => {
          feedback.remove();
        }, 3000);
        
        // Apply settings
        applySettings(newSettings, document.body);
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    });
  }
  
  // revert reset
  const resetSettingsBtn = document.getElementById('resetSettings');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', async () => {
      try {
        await saveSettings(DEFAULT_SETTINGS);
        
        // Reset UI to defaults
        const simplificationLevel = document.getElementById('simplificationLevel');
        if (simplificationLevel) {
          simplificationLevel.value = DEFAULT_SETTINGS.simplificationLevel;
        }
        
        const fontSize = document.getElementById('fontSize');
        if (fontSize) {
          fontSize.value = DEFAULT_SETTINGS.fontSize;
          const label = document.querySelector('label[for="fontSize"]');
          if (label) {
            label.textContent = `Font Size: ${DEFAULT_SETTINGS.fontSize}px`;
          }
        }
        
        const fontFamily = document.getElementById('fontFamily');
        if (fontFamily) {
          fontFamily.value = DEFAULT_SETTINGS.fontFamily;
        }
        
        const lineSpacing = document.getElementById('lineSpacing');
        if (lineSpacing) {
          lineSpacing.value = DEFAULT_SETTINGS.lineSpacing;
        }
        
        const readAloudSpeed = document.getElementById('readAloudSpeed');
        if (readAloudSpeed) {
          readAloudSpeed.value = DEFAULT_SETTINGS.readAloudSpeed;
          const label = document.querySelector('label[for="readAloudSpeed"]');
          if (label) {
            label.textContent = `Read Aloud Speed: ${DEFAULT_SETTINGS.readAloudSpeed}x`;
          }
        }
        
        //basic default settings
        applySettings(DEFAULT_SETTINGS, document.body);
        
        // any feed back
        const feedback = document.createElement('div');
        feedback.className = 'accessflow-feedback';
        feedback.textContent = 'Settings reset to defaults';
        document.body.appendChild(feedback);
        
        setTimeout(() => {
          feedback.remove();
        }, 3000);
      } catch (error) {
        console.error('Error resetting settings:', error);
      }
    });
  }
}
