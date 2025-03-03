// Welcome page script

document.addEventListener('DOMContentLoaded', () => {
  // Setup API key button
  const setupApiKeyButton = document.getElementById('setup-api-key');
  if (setupApiKeyButton) {
    setupApiKeyButton.addEventListener('click', () => {
      // Open the popup and switch to settings tab
      chrome.storage.local.set({ 'accessflow_open_settings': true }, () => {
        chrome.runtime.openOptionsPage ? 
          chrome.runtime.openOptionsPage() : 
          chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html') });
      });
    });
  }
  
  // Open extension button
  const openExtensionButton = document.getElementById('open-extension');
  if (openExtensionButton) {
    openExtensionButton.addEventListener('click', () => {
      chrome.action.openPopup ? 
        chrome.action.openPopup() : 
        chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html') });
    });
  }
  
  // Check if API key is already set
  chrome.storage.local.get('accessflow_api_key', (result) => {
    if (result.accessflow_api_key) {
      if (setupApiKeyButton) {
        setupApiKeyButton.textContent = 'Update API Key';
      }
    }
  });
  
  // Add themed background
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDarkMode) {
    document.body.classList.add('dark-mode');
  }
  
  // Listen for theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    document.body.classList.toggle('dark-mode', event.matches);
  });
});
