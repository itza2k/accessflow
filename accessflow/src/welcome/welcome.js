// Welcome page standalone script
document.addEventListener('DOMContentLoaded', function() {
  console.log('Welcome page loaded');
  
  // API Key verification function
  async function verifyApiKey(apiKey) {
    if (!apiKey || apiKey.trim().length === 0) return false;
    
    try {
      const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
      const url = `${API_BASE_URL}?key=${apiKey}`;
      const requestBody = { 
        contents: [{ parts: [{ text: "test" }] }], 
        generationConfig: { maxOutputTokens: 5 } 
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      return response.ok;
    } catch (error) {
      console.error("API key verification error:", error);
      return false;
    }
  }

  // Save API key function
  function saveApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ 'accessflow_api_key': apiKey }, resolve);
    });
  }
  
  // Safe DOM element access
  function getElement(id) {
    return document.getElementById(id);
  }
  
  // Check if API key already exists
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('accessflow_api_key', (result) => {
      const apiKeyInput = getElement('api-key-input');
      const apiKeyStatus = getElement('api-key-status');
      
      if (result.accessflow_api_key && apiKeyInput && apiKeyStatus) {
        apiKeyInput.value = '********';
        apiKeyStatus.innerHTML = '<span class="status-success">✓ API key already set</span>';
      }
    });
  }
  
  // Setup save API key button
  const saveKeyBtn = getElement('save-api-key');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', async () => {
      const apiKeyInput = getElement('api-key-input');
      const apiKeyStatus = getElement('api-key-status');
      
      if (!apiKeyInput || !apiKeyStatus) return;
      
      const apiKey = apiKeyInput.value.trim();
      
      if (!apiKey) {
        apiKeyStatus.innerHTML = '<span class="status-error">× Please enter an API key</span>';
        return;
      }
      
      apiKeyStatus.innerHTML = 'Verifying API key...';
      
      try {
        const isValid = await verifyApiKey(apiKey);
        
        if (isValid) {
          await saveApiKey(apiKey);
          apiKeyStatus.innerHTML = '<span class="status-success">✓ API key verified and saved</span>';
        } else {
          apiKeyStatus.innerHTML = '<span class="status-error">× Invalid API key. Please check and try again.</span>';
        }
      } catch (error) {
        apiKeyStatus.innerHTML = '<span class="status-error">× Error verifying API key. Check your internet connection.</span>';
        console.error('API key verification error:', error);
      }
    });
  }
  
  // Start using button
  const startBtn = getElement('start-using');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('accessflow_api_key', (result) => {
          if (result.accessflow_api_key) {
            window.close();
          } else {
            alert('Please set your API key before continuing.');
            const apiKeyInput = getElement('api-key-input');
            if (apiKeyInput) apiKeyInput.focus();
          }
        });
      } else {
        window.close();
      }
    });
  }
  
  // Open extension button
  const openBtn = getElement('open-extension');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "openSettings" });
        setTimeout(() => window.close(), 300);
      }
    });
  }
  
  // Get started button
  const getStartedBtn = getElement('get-started');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      window.close();
    });
  }
});
