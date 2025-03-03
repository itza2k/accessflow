import { processText, displayProcessedText } from '../utils/dom.js';
import { initSettingsPanel } from './settings-ui.js';
import { loadSettings, applySettings } from '../utils/settings.js';
import { getApiKey } from '../utils/api.js';
import SpeechHandler from '../utils/speech.js';
import { ErrorHandler, setupGlobalErrorHandling } from '../utils/error-handler.js';

// Initialize speech handler with default options
const speechHandler = new SpeechHandler();

document.addEventListener('DOMContentLoaded', async function() {
  // Set up global error handling
  setupGlobalErrorHandling();
  
  // Set proper dimensions for the popup
  document.documentElement.style.width = '450px';
  document.documentElement.style.height = '550px';
  
  // Load user settings and apply
  try {
    const settings = await loadSettings();
    applySettings(settings, document.body);
    
    // Configure speech handler with settings
    speechHandler.setOptions({
      rate: settings.readAloudSpeed || 1.0,
      voiceName: settings.readAloudVoice || '',
      highlightColor: settings.highlightColor || '#4285F4'
    });
  } catch (error) {
    const errorObj = ErrorHandler.handleError(error, 'settings');
    console.error('Failed to load settings:', errorObj);
  }
  
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
      document.querySelectorAll('.accessflow-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.accessflow-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      const section = document.getElementById(`${tabName}-section`);
      if (section) section.classList.add('active');
    });
  });

  // Initialize settings panel
  try {
    await initSettingsPanel(speechHandler);
  } catch (error) {
    const errorObj = ErrorHandler.handleError(error, 'settings');
    console.error('Failed to initialize settings panel:', errorObj);
  }
  
  // Switch to settings tab if needed
  chrome.storage.local.get('accessflow_open_settings', (result) => {
    if (result.accessflow_open_settings) {
      const settingsTab = document.querySelector('.accessflow-tab[data-tab="settings"]');
      if (settingsTab) {
        settingsTab.click();
      }
      chrome.storage.local.remove('accessflow_open_settings');
    }
  });
  
  // Set API key status visibility
  try {
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
  } catch (error) {
    const errorObj = ErrorHandler.handleError(error, 'api_key');
    console.error('Failed to check API key:', errorObj);
  }
  
  // Handle settings button
  const gotoSettings = document.getElementById('goto-settings');
  if (gotoSettings) {
    gotoSettings.addEventListener('click', () => {
      const settingsTab = document.querySelector('.accessflow-tab[data-tab="settings"]');
      if (settingsTab) {
        settingsTab.click();
      }
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
  
  // Set up processing buttons
  document.getElementById('simplify-btn')?.addEventListener('click', async () => {
    await processTextWithMode('simplify');
  });
  document.getElementById('summarize-btn')?.addEventListener('click', async () => {
    await processTextWithMode('summarize');
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Alt+S - Simplify
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      processTextWithMode('simplify');
    }
    // Alt+M - Summarize
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      processTextWithMode('summarize');
    }
    // Alt+R - Read Aloud
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
  
  // Set up clipboard functions
  document.getElementById('copy-btn')?.addEventListener('click', () => {
    const outputText = document.getElementById('output-text');
    if (outputText && outputText.textContent) {
      copyToClipboard(outputText.textContent);
    }
  });
  
  // Set up additional accessibility features
  setupAccessibility();
  
  // Monitor network connectivity
  ErrorHandler.monitorConnectivity(
    () => {
      // Online callback
      const errorElements = document.querySelectorAll('.error-type-network_error');
      if (errorElements.length > 0) {
        // Auto-retry when coming back online
        document.dispatchEvent(new CustomEvent('accessflow-retry'));
      }
    },
    () => {
      // Offline callback
      const errorObj = ErrorHandler.createError(
        'You are currently offline. Please check your connection.',
        'network_error'
      );
      
      // Show offline notification
      const notification = document.createElement('div');
      notification.className = 'accessflow-feedback error';
      notification.textContent = errorObj.message;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 5000);
    }
  );
});

/**
 * Process text with the selected mode and update UI
 * @param {string} mode - The processing mode (simplify or summarize)
 */
async function processTextWithMode(mode) {
  const settings = await loadSettings();
  const text = document.getElementById('input-text').value.trim();
  if (!text) {
    const emptyInputError = ErrorHandler.createError(
      `Please enter some text to ${mode}.`,
      'user_input_error'
    );
    
    const outputText = document.getElementById('output-text');
    if (outputText) {
      ErrorHandler.displayError(
        ErrorHandler.handleError(emptyInputError, 'input'),
        outputText
      );
    }
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
    
    // Auto-copy result if enabled in settings
    if (settings.autoCopyToClipboard && result) {
      const textToCopy = result.simplifiedText || result.summarizedText || '';
      if (textToCopy) {
        copyToClipboard(textToCopy);
      }
    }
    
  } catch (error) {
    if (outputText) {
      const errorObj = ErrorHandler.handleError(error, 'processing');
      ErrorHandler.displayError(errorObj, outputText);
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

/**
 * Copy text to clipboard and show feedback
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
  if (!text) return;
  
  navigator.clipboard.writeText(text).then(() => {
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'accessflow-feedback';
    notification.textContent = 'Copied to clipboard';
    document.body.appendChild(notification);
    
    // Show animation on copy button if exists
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
      copyBtn.classList.add('copy-success');
      setTimeout(() => copyBtn.classList.remove('copy-success'), 1000);
    }
    
    // Remove notification after delay
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    const errorObj = ErrorHandler.handleError(err, 'clipboard');
    
    // Show error notification
    const notification = document.createElement('div');
    notification.className = 'accessflow-feedback error';
    notification.textContent = 'Failed to copy to clipboard';
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  });
}

/**
 * Set up additional accessibility features for the popup
 */
function setupAccessibility() {
  // Focus outline for keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
  
  // Add ARIA attributes for better screen reader support
  document.querySelectorAll('.accessflow-tab').forEach(tab => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('tabindex', '0');
    
    // Allow keyboard activation with Enter key
    tab.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tab.click();
      }
    });
  });
  
  // Set up export button if available
  document.getElementById('export-btn')?.addEventListener('click', () => {
    exportToPDF();
  });
  
  // Set up share button if available
  document.getElementById('share-btn')?.addEventListener('click', () => {
    shareContent();
  });
  
  // Set up tab trapping for the popup to improve keyboard navigation
  setupTabTrapping();
}

/**
 * Export processed text to PDF
 */
function exportToPDF() {
  const outputText = document.getElementById('output-text');
  if (!outputText || !outputText.textContent.trim()) {
    // Nothing to export
    return;
  }
  
  try {
    // Open print dialog with simplified CSS
    const originalContent = document.body.innerHTML;
    
    // Create a printer-friendly version
    const printContent = `
      <html>
      <head>
        <title>AccessFlow - Exported Content</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            font-size: 18pt;
            color: #4285F4;
            margin-bottom: 15px;
          }
          .content {
            font-size: 12pt;
            white-space: pre-wrap;
            margin-bottom: 20px;
          }
          .concepts {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          .concepts h2 {
            font-size: 14pt;
            color: #34A853;
            margin-bottom: 10px;
          }
          .concept-item {
            margin-bottom: 10px;
          }
          .concept-term {
            font-weight: bold;
          }
          .concepts-list {
            list-style-type: none;
            padding-left: 0;
          }
          footer {
            margin-top: 30px;
            font-size: 9pt;
            color: #5f6368;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>AccessFlow Generated Content</h1>
        <div class="content">${outputText.innerHTML}</div>
        <div class="concepts">
          ${document.getElementById('key-concepts')?.innerHTML || ''}
        </div>
        <footer>Generated by AccessFlow | ${new Date().toLocaleString()}</footer>
      </body>
      </html>
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Trigger print when content is loaded
    printWindow.onload = function() {
      printWindow.print();
      // Close the window after printing (some browsers)
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  } catch (error) {
    const errorObj = ErrorHandler.handleError(error, 'export');
    
    // Show error notification
    const notification = document.createElement('div');
    notification.className = 'accessflow-feedback error';
    notification.textContent = 'Failed to export content';
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

/**
 * Share processed content
 * Uses Web Share API if available, falls back to copy to clipboard
 */
function shareContent() {
  const outputText = document.getElementById('output-text');
  if (!outputText || !outputText.textContent.trim()) {
    return;
  }
  
  const textToShare = outputText.textContent;
  
  // Check if Web Share API is available
  if (navigator.share) {
    navigator.share({
      title: 'AccessFlow Generated Content',
      text: textToShare
    }).then(() => {
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'accessflow-feedback';
      notification.textContent = 'Shared successfully';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }).catch(err => {
      // User probably cancelled the share operation
      if (err.name !== 'AbortError') {
        console.error('Error sharing content:', err);
        // Fall back to clipboard
        copyToClipboard(textToShare);
      }
    });
  } else {
    // Fall back to clipboard
    copyToClipboard(textToShare);
  }
}

/**
 * Keep keyboard focus within the popup for better accessibility
 */
function setupTabTrapping() {
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    
    // Find all focusable elements
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Trap focus in the popup
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  });
}
