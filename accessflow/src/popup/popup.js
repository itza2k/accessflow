import { processText, displayProcessedText } from '../utils/dom.js';
import { initSettingsPanel } from './settings.js';
import { loadSettings, applySettings } from '../utils/settings.js';
import { getApiKey } from '../utils/api.js';
import SpeechHandler from '../utils/speech.js';

// Initialize speech handler
const speechHandler = new SpeechHandler();

document.addEventListener('DOMContentLoaded', async function() {
  // Handle dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
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

  // Handle tab switching
  const tabs = document.querySelectorAll('.accessflow-popup-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and sections
      document.querySelectorAll('.accessflow-popup-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.accessflow-popup-section').forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding section
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById(`${tabName}-section`).classList.add('active');
    });
  });

  // Initialize settings panel
  initSettingsPanel();
  
  // Check if we should open settings tab directly (from welcome page)
  chrome.storage.local.get('accessflow_open_settings', (result) => {
    if (result.accessflow_open_settings) {
      // Switch to settings tab
      document.querySelectorAll('.accessflow-popup-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.accessflow-popup-section').forEach(s => s.classList.remove('active'));
      
      document.querySelector('.accessflow-popup-tab[data-tab="settings"]').classList.add('active');
      document.getElementById('settings-section').classList.add('active');
      
      // Clear the flag
      chrome.storage.local.remove('accessflow_open_settings');
    }
  });
  
  // Check if API key is set
  const apiKey = await getApiKey();
  if (!apiKey) {
    document.getElementById('api-key-missing').style.display = 'block';
    document.getElementById('process-controls').style.display = 'none';
  } else {
    document.getElementById('api-key-missing').style.display = 'none';
    document.getElementById('process-controls').style.display = 'block';
  }
  
  // Go to settings button
  document.getElementById('goto-settings').addEventListener('click', () => {
    document.querySelectorAll('.accessflow-popup-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.accessflow-popup-section').forEach(s => s.classList.remove('active'));
    
    document.querySelector('.accessflow-popup-tab[data-tab="settings"]').classList.add('active');
    document.getElementById('settings-section').classList.add('active');
  });
  
  // Load selected text if available
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "processText" && message.text) {
      document.getElementById('input-text').value = message.text;
      sendResponse({ received: true });
    }
  });
  
  // Check for stored text from background script
  chrome.storage.local.get('accessflow_selected_text', (result) => {
    if (result.accessflow_selected_text) {
      document.getElementById('input-text').value = result.accessflow_selected_text;
      // Clear stored text
      chrome.storage.local.remove('accessflow_selected_text');
    }
  });
  
  // Load user settings
  const settings = await loadSettings();
  applySettings(settings, document.body);
  
  // Set up simplify button
  document.getElementById('simplify-btn').addEventListener('click', async () => {
    processWithMode('simplify', settings);
  });
  
  // Set up summarize button
  document.getElementById('summarize-btn').addEventListener('click', async () => {
    processWithMode('summarize', settings);
  });
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Alt+S - Simplify
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      processWithMode('simplify', settings);
    }
    
    // Alt+M - Summarize
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      processWithMode('summarize', settings);
    }
    
    // Alt+R - Read aloud
    if (e.altKey && e.key === 'r') {
      e.preventDefault();
      const outputText = document.getElementById('output-text');
      if (outputText.textContent.trim()) {
        const existingReadButton = document.querySelector('.accessflow-read-aloud-btn');
        if (existingReadButton && existingReadButton.style.display !== 'none') {
          existingReadButton.click();
        }
      }
    }
  });
  
  // Function to process text with a specific mode
  async function processWithMode(mode, settings) {
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
    
    try {
      // Show processing state
      document.getElementById(buttonId).disabled = true;
      document.getElementById(buttonId).innerHTML = `
        <div class="accessflow-mini-loading"></div>
        Processing...
      `;
      document.getElementById('output-text').innerHTML = '<div class="accessflow-loading"></div>';
      document.getElementById('key-concepts').innerHTML = '';
      
      // Process text
      const result = await processText(text, mode, settings.simplificationLevel);
      const outputContainer = document.getElementById('output-container');
      const outputText = document.getElementById('output-text');
      const keyConcepts = document.getElementById('key-concepts');
      
      // Display processed text
      const processedOutput = displayProcessedText(result, outputContainer, outputText, keyConcepts);
      
      // Set up read aloud for processed text
      setupReadAloud(processedOutput);
    } catch (error) {
      document.getElementById('output-text').innerHTML = `
        <div class="accessflow-error">
          ${error.message || `Failed to ${mode} text. Please try again later.`}
        </div>
      `;
      document.getElementById('key-concepts').innerHTML = '';
    } finally {
      // Reset button state
      if (mode === 'simplify') {
        document.getElementById(buttonId).innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M13 16.172l-3.536-3.536 1.415-1.414 2.12 2.122 5.657-5.657 1.414 1.414L13 16.172zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/></svg>
          Simplify
        `;
      } else {
        document.getElementById(buttonId).innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm0 15h14v2H3v-2zm0-5h18v2H3v-2zm0-5h14v2H3V9z"/></svg>
          Summarize
        `;
      }
      document.getElementById(buttonId).disabled = false;
    }
  }
  
  // Set up read aloud functionality
  function setupReadAloud(textElement) {
    // Remove any existing read aloud buttons
    const existingButtons = document.querySelectorAll('.accessflow-read-aloud-btn, .accessflow-stop-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Add read aloud button
    const readBtn = document.createElement('button');
    readBtn.className = 'accessflow-read-aloud-btn';
    readBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M5.889 16H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3.889l5.294-4.332a.5.5 0 0 1 .817.387v15.89a.5.5 0 0 1-.817.387L5.89 16zm13.517 4.134l-1.416-1.416A8.978 8.978 0 0 0 21 12a8.982 8.982 0 0 0-3.304-6.968l1.42-1.42A10.976 10.976 0 0 1 23 12c0 3.223-1.386 6.122-3.594 8.134zm-3.543-3.543l-1.422-1.422A3.993 3.993 0 0 0 16 12c0-1.43-.75-2.685-1.88-3.392l1.439-1.439A5.991 5.991 0 0 1 18 12c0 1.842-.83 3.49-2.137 4.591z"/>
      </svg>
      Read Aloud
    `;
    readBtn.setAttribute('aria-label', 'Read text aloud');
    
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
    
    // Configure speech handler with settings
    speechHandler.setOptions({
      rate: settings.readAloudSpeed,
      volume: 1
    });
    
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
    outputContainer.insertBefore(stopBtn, textElement);
    outputContainer.insertBefore(readBtn, textElement);
  }
});
