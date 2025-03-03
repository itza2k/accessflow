// Simple background worker that doesn't use DOM
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: "accessflow-process",
    title: "Process with AccessFlow",
    contexts: ["selection"]
  });

  // Show welcome page on first install
  chrome.storage.local.get(['accessflow_installed'], (result) => {
    if (!result.accessflow_installed) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("welcome.html")
      });
      chrome.storage.local.set({ 'accessflow_installed': true });
    }
  });
});

// Handle context menu item click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "accessflow-process" && info.selectionText) {
    // Store selected text
    chrome.storage.local.set({
      'accessflow_selected_text': info.selectionText
    }, () => {
      // Open popup
      chrome.action.openPopup();
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processText") {
    chrome.storage.local.set({
      'accessflow_selected_text': message.text
    });
    sendResponse({success: true});
  }
  return true;
});