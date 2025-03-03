import { saveApiKey, verifyApiKey } from '../utils/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if API key already exists
  chrome.storage.local.get('accessflow_api_key', (result) => {
    if (result.accessflow_api_key) {
      document.getElementById('api-key-input').value = '********';
      document.getElementById('api-key-status').innerHTML = '<span class="status-success">✓ API key already set</span>';
    }
  });
  
  // API Key save button
  document.getElementById('save-api-key').addEventListener('click', async () => {
    const apiKey = document.getElementById('api-key-input').value.trim();
    
    if (!apiKey) {
      document.getElementById('api-key-status').innerHTML = '<span class="status-error">× Please enter an API key</span>';
      return;
    }
    
    document.getElementById('api-key-status').innerHTML = 'Verifying API key...';
    
    try {
      const isValid = await verifyApiKey(apiKey);
      
      if (isValid) {
        await saveApiKey(apiKey);
        document.getElementById('api-key-status').innerHTML = '<span class="status-success">✓ API key verified and saved</span>';
      } else {
        document.getElementById('api-key-status').innerHTML = '<span class="status-error">× Invalid API key. Please check and try again.</span>';
      }
    } catch (error) {
      document.getElementById('api-key-status').innerHTML = '<span class="status-error">× Error verifying API key. Check your internet connection.</span>';
      console.error('API key verification error:', error);
    }
  });
  
  // Start using button
  document.getElementById('start-using').addEventListener('click', () => {
    // Close this tab
    chrome.storage.local.get('accessflow_api_key', (result) => {
      if (result.accessflow_api_key) {
        // Close tab if API key is set
        window.close();
      } else {
        // Show alert if API key is not set
        alert('Please set your API key before continuing.');
        document.getElementById('api-key-input').focus();
      }
    });
  });

  document.getElementById('open-extension').addEventListener('click', () => {
    // Open extension popup with settings tab active
    chrome.runtime.sendMessage({ action: "openSettings" });
    window.close();
  });
  
  document.getElementById('get-started').addEventListener('click', () => {
    window.close();
  });
});
