// Import utilities with correct paths for build output
import { getApiKey, verifyApiKey } from '../utils/api.js';

// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "accessflow-menuitem",
    title: "Process with AccessFlow",
    contexts: ["selection"] // Only show on text selection
  });
  
  // Check for API key and show welcome page if needed
  checkApiKey(true);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "accessflow-menuitem") {
    // Send a message to the content script to get the selected text
    chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processText") {
    console.log("Received text to process:", message.text);
    
    // Store the selected text so the popup can access it
    chrome.storage.local.set({ 'accessflow_selected_text': message.text });
    
    // Open the popup
    chrome.action.openPopup();
    
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === "openSettings") {
    // Open the extension popup with the settings tab active
    chrome.storage.local.set({ 'accessflow_open_settings': true });
    chrome.action.openPopup();
    return true;
  }
});

// Check if API key exists and show popup badge if it doesn't
async function checkApiKey(isInitialInstall = false) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    // Set badge to show user they need to add API key
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF5722" });
    
    // Show welcome page on first install if API key is not set
    if (isInitialInstall) {
      chrome.storage.local.get('accessflow_installed', (installResult) => {
        if (!installResult.accessflow_installed) {
          chrome.tabs.create({
            url: chrome.runtime.getURL("src/welcome/welcome.html")
          });
          
          // Mark as installed
          chrome.storage.local.set({ 'accessflow_installed': true });
        }
      });
    }
  } else {
    // Clear badge if API key is set
    chrome.action.setBadgeText({ text: "" });
  }
}

// Listen for changes to API key
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.accessflow_api_key) {
    checkApiKey();
  }
});