import { processText, displayProcessedText, processWithMode } from '../utils/dom.js';
import { initSettingsPanel } from './settings.js';
import { loadSettings, applySettings } from '../utils/settings.js';
import { getApiKey, saveApiKey, verifyApiKey } from '../utils/api.js';
import SpeechHandler from '../utils/speech.js';

// Initialize speech handler
const speechHandler = new SpeechHandler();

document.addEventListener('DOMContentLoaded', async function() {
  // Handle dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  if (darkModeToggle) {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('accessflow-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
    
    // Handle theme switch
    darkModeToggle.addEventListener('change', () => {
      if (darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('accessflow-theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('accessflow-theme', 'light');
      }
    });
  }

  // Handle tab switching
  const tabs = document.querySelectorAll('.accessflow-tab');
  if (tabs) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and sections
        document.querySelectorAll('.accessflow-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.accessflow-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding section
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        const section = document.getElementById(`${tabName}-section`);
        if (section) section.classList.add('active');
      });
    });
  }

  // Initialize settings panel
  await initSettingsPanel();
  
  // Check if we should open settings tab directly (from welcome page)
  chrome.storage.local.get('accessflow_open_settings', (result) => {
    if (result.accessflow_open_settings) {
      // Switch to settings tab
      document.querySelectorAll('.accessflow-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.accessflow-section').forEach(s => s.classList.remove('active'));
      
      const settingsTab = document.querySelector('.accessflow-tab[data-tab="settings"]');
      const settingsSection = document.getElementById('settings-section');
      
      if (settingsTab) settingsTab.classList.add('active');
      if (settingsSection) settingsSection.classList.add('active');
      
      // Clear the flag
      chrome.storage.local.remove('accessflow_open_settings');
    }
  });
  
  // Check if API key is set
  const apiKey = await getApiKey();
  const apiKeyMissing = document.getElementById('api-key-missing');
  const processControls = document.getElementById('process-controls');
  
  if (!apiKey && apiKeyMissing && processControls) {
    apiKeyMissing.style.display = 'block';
    processControls.style.display = 'none';
  } else if (apiKeyMissing && processControls) {
    apiKeyMissing.style.display = 'none';
    processControls.style.display = 'block';
  }
  
  // Go to settings button
  const gotoSettings = document.getElementById('goto-settings');
  if (gotoSettings) {
    gotoSettings.addEventListener('click', () => {
      document.querySelectorAll('.accessflow-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.accessflow-section').forEach(s => s.classList.remove('active'));
      
      const settingsTab = document.querySelector('.accessflow-tab[data-tab="settings"]');
      const settingsSection = document.getElementById('settings-section');
      
      if (settingsTab) settingsTab.classList.add('active');
      if (settingsSection) settingsSection.classList.add('active');
    });
  }
  
  // Check for stored text from background script
  chrome.storage.local.get('accessflow_selected_text', (result) => {
    if (result.accessflow_selected_text) {
      const inputText = document.getElementById('input-text');
      if (inputText) {
        inputText.value = result.accessflow_selected_text;
        // Clear stored text
        chrome.storage.local.remove('accessflow_selected_text');
      }
    }
  });
  
  // Load user settings
  const settings = await loadSettings();
  applySettings(settings, document.body);
  
  // Set up simplify button
  const simplifyBtn = document.getElementById('simplify-btn');
  if (simplifyBtn) {
    simplifyBtn.addEventListener('click', async () => {
      processWithMode('simplify', settings);
    });
  }
  
  // Set up summarize button
  const summarizeBtn = document.getElementById('summarize-btn');
  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', async () => {
      processWithMode('summarize', settings);
    });
  }
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Alt+S - Simplify
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      processWithMode('simplify', settings);
    }
    
    // Alt+M - Summarize
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      processWithMode('summarize', settings);
    }
  });
  
  // Set up read aloud functionality
  setupReadAloud(settings);
});

/**
 * Set up read aloud functionality
 */
function setupReadAloud(settings) {
  // Configure speech handler with settings
  speechHandler.setOptions({
    rate: settings.readAloudSpeed || 1.0,
    volume: 1.0
  });
  
  // Add event listener for Alt+R keyboard shortcut
  document.addEventListener('keydown', (e) => {
    // Alt+R - Read aloud
    if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      const outputText = document.getElementById('output-text');
      if (outputText && outputText.textContent.trim()) {
        const existingReadButton = document.querySelector('.accessflow-read-aloud-btn');
        if (existingReadButton && existingReadButton.style.display !== 'none') {
          existingReadButton.click();
        } else {
          const existingStopButton = document.querySelector('.accessflow-stop-btn');
          if (existingStopButton && existingStopButton.style.display !== 'none') {
            existingStopButton.click();
          }
        }
      }
    }
  });
}

/**
 * Initialize the settings panel
 */
async function initSettingsPanel() {
  const settingsContainer = document.getElementById('settings-container');
  if (!settingsContainer) return;
  
  const settings = await loadSettings();
  
  // Create settings UI
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
  
  // Get API key and populate field
  const apiKey = await getApiKey();
  const apiKeyInput = document.getElementById('apiKey');
  if (apiKeyInput && apiKey) {
    apiKeyInput.value = '********';
  }
  
  // Save API key
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  if (saveApiKeyBtn) {
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
          
          // Update the API key missing notice if present
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
  
  // Update font size label when slider changes
  const fontSizeSlider = document.getElementById('fontSize');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', () => {
      const label = document.querySelector('label[for="fontSize"]');
      if (label) {
        label.textContent = `Font Size: ${fontSizeSlider.value}px`;
      }
    });
  }
  
  // Update read aloud speed label when slider changes
  const readAloudSpeedSlider = document.getElementById('readAloudSpeed');
  if (readAloudSpeedSlider) {
    readAloudSpeedSlider.addEventListener('input', () => {
      const label = document.querySelector('label[for="readAloudSpeed"]');
      if (label) {
        label.textContent = `Read Aloud Speed: ${readAloudSpeedSlider.value}x`;
      }
    });
  }
  
  // Save settings
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
        
        // Apply settings immediately
        applySettings(newSettings, document.body);
        
        // Update speech handler options
        speechHandler.setOptions({ rate: newSettings.readAloudSpeed });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    });
  }
  
  // Reset settings
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
        
        // Apply default settings
        applySettings(DEFAULT_SETTINGS, document.body);
        
        // Update speech handler options
        speechHandler.setOptions({ rate: DEFAULT_SETTINGS.readAloudSpeed });
        
        // Show feedback
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
