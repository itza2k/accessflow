import { processText, displayProcessedText } from '../utils/dom.js';
import { initSettingsPanel } from './settings-ui.js';  // Updated import path
import { loadSettings, applySettings } from '../utils/settings.js';
import { getApiKey } from '../utils/api.js';
import SpeechHandler from '../utils/speech.js';

// Initialize speech handler
const speechHandler = new SpeechHandler();

document.addEventListener('DOMContentLoaded', async function() {
  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    const savedTheme = localStorage.getItem('accessflow-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
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

  // Tab switching
  document.querySelectorAll('.accessflow-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // ...existing tab switch code...
      document.querySelectorAll('.accessflow-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.accessflow-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      const section = document.getElementById(`${tabName}-section`);
      if (section) section.classList.add('active');
    });
  });

  // Initialize settings panel
  await initSettingsPanel(speechHandler);
  
  // Switch to settings tab if needed
  chrome.storage.local.get('accessflow_open_settings', (result) => {
    if (result.accessflow_open_settings) {
      // ...existing switch tab code...
      chrome.storage.local.remove('accessflow_open_settings');
    }
  });
  
  // Set API key status visibility
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
  
  // ...existing settings-button code...
  const gotoSettings = document.getElementById('goto-settings');
  if (gotoSettings) {
    gotoSettings.addEventListener('click', () => {
      // ...switch to settings tab...
    });
  }
  
  // Load text passed from background
  chrome.storage.local.get('accessflow_selected_text', (result) => {
    if (result.accessflow_selected_text) {
      const inputText = document.getElementById('input-text');
      if (inputText) {
        inputText.value = result.accessflow_selected_text;
        chrome.storage.local.remove('accessflow_selected_text');
      }
    }
  });
  
  // Load user settings and apply
  const settings = await loadSettings();
  applySettings(settings, document.body);
  
  // Set up processing buttons
  document.getElementById('simplify-btn')?.addEventListener('click', async () => {
    await processTextWithMode('simplify');
  });
  document.getElementById('summarize-btn')?.addEventListener('click', async () => {
    await processTextWithMode('summarize');
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      processTextWithMode('simplify');
    }
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      processTextWithMode('summarize');
    }
  });
  
  setupReadAloud(settings);
});

/**
 * Process text with the selected mode and update UI
 * @param {string} mode - The processing mode (simplify or summarize)
 */
async function processTextWithMode(mode) {
  const settings = await loadSettings();
  const text = document.getElementById('input-text').value.trim();
  if (!text) {
    document.getElementById('output-text').innerHTML = `
      <div class="accessflow-error">
        Please enter some text to ${mode === 'simplify' ? 'simplify' : 'summarize'}.
      </div>
    `;
    return;
  }
  
  const buttonId = `${mode}-btn`;
  const button = document.getElementById(buttonId);
  const outputText = document.getElementById('output-text');
  const keyConcepts = document.getElementById('key-concepts');
  
  try {
    // Show processing state
    if (button) button.disabled = true;
    if (button) button.innerHTML = `
      <div class="accessflow-mini-loading"></div>
      Processing...
    `;
    if (outputText) outputText.innerHTML = '<div class="accessflow-loading"></div>';
    if (keyConcepts) keyConcepts.innerHTML = '';
    
    // Process text
    const result = await processText(text, mode, settings.simplificationLevel);
    const outputContainer = document.getElementById('output-container');
    
    // Display processed text
    displayProcessedText(result, outputContainer, outputText, keyConcepts);
    
    // Setup read aloud functionality
    setupReadAloudForText(outputText);
    
  } catch (error) {
    if (outputText) {
      outputText.innerHTML = `
        <div class="accessflow-error">
          ${error.message || `Failed to ${mode} text. Please try again later.`}
        </div>
      `;
    }
    if (keyConcepts) keyConcepts.innerHTML = '';
  } finally {
    // Reset button state
    if (button) {
      button.disabled = false;
      if (mode === 'simplify') {
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M13 16.172l-3.536-3.536 1.415-1.414 2.12 2.122 5.657-5.657 1.414 1.414L13 16.172zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/></svg>
          Simplify
        `;
      } else {
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm0 15h14v2H3v-2zm0-5h18v2H3v-2zm0-5h14v2H3V9z"/></svg>
          Summarize
        `;
      }
    }
  }
}

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
 * Setup read aloud functionality for a specific text element
 * @param {Element} textElement - The text element to read
 */
function setupReadAloudForText(textElement) {
  if (!textElement || !textElement.textContent.trim()) return;
  
  // Remove any existing read aloud buttons
  const existingButtons = document.querySelectorAll('.accessflow-read-aloud-btn, .accessflow-stop-btn');
  existingButtons.forEach(btn => btn.remove());
  
  // Create read aloud button
  const readBtn = document.createElement('button');
  readBtn.className = 'accessflow-read-aloud-btn';
  readBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
      <path fill="none" d="M0 0h24v24H0z"/>
      <path d="M5.889 16H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v15.89a.5.5 0 0 1-.817.387L5.89 16zm13.517 4.134l-1.416-1.416A8.978 8.978 0 0 0 21 12a8.982 8.982 0 0 0-3.304-6.968l1.42-1.42A10.976 10.976 0 0 1 23 12c0 3.223-1.386 6.122-3.594 8.134z"/>
    </svg>
    Read Aloud
  `;
  readBtn.setAttribute('aria-label', 'Read text aloud');
  
  // Create stop button
  const stopBtn = document.createElement('button');
  stopBtn.className = 'accessflow-stop-btn';
  stopBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
      <path fill="none" d="M0 0h24v24H0z"/>
      <path d="M6 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>
    </svg>
    Stop
  `;
  stopBtn.setAttribute('aria-label', 'Stop reading');
  stopBtn.style.display = 'none';
  
  // Add event listeners
  readBtn.addEventListener('click', () => {
    readBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    speechHandler.speak(textElement);
  });
  
  stopBtn.addEventListener('click', () => {
    stopBtn.style.display = 'none';
    readBtn.style.display = 'inline-block';
    speechHandler.stop();
  });
  
  // Add buttons to the DOM
  const outputContainer = document.getElementById('output-container');
  if (outputContainer) {
    outputContainer.insertBefore(stopBtn, textElement);
    outputContainer.insertBefore(readBtn, textElement);
  } else {
    const parent = textElement.parentNode;
    if (parent) {
      parent.insertBefore(stopBtn, textElement);
      parent.insertBefore(readBtn, textElement);
    }
  }
}
