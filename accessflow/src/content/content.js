// Content script for AccessFlow - Has DOM access

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      // Send the selected text to the background script
      chrome.runtime.sendMessage({
        action: "processText", 
        text: selectedText
      });
      
      // Provide user feedback that text was selected
      showFeedbackNotification("Text sent to AccessFlow");
    }
    sendResponse({ success: true });
    return true;
  }
});

// Add keyboard accessibility for context menu
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+A (or Command+Shift+A on Mac) to activate AccessFlow on selected text
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "processText", 
        text: selectedText
      });
      
      // Show feedback notification
      showFeedbackNotification("Text sent to AccessFlow");
    }
  }
});

/**
 * Show feedback notification on the page
 * @param {string} message - Message to show in the notification
 */
function showFeedbackNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'accessflow-selection-feedback';
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.padding = '10px 15px';
  notification.style.backgroundColor = '#4285F4';
  notification.style.color = 'white';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '10000';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  notification.style.fontFamily = 'Arial, sans-serif';
  notification.style.fontSize = '14px';
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 2000);
}