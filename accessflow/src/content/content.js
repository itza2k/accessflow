// Handle messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      // Send the selected text to the background script
      chrome.runtime.sendMessage({
        action: "processText", 
        text: selectedText
      }, (response) => {
        // Handle response if needed
        if (chrome.runtime.lastError) {
          console.error("Error sending selected text:", chrome.runtime.lastError);
        }
      });
      
      // Provide user feedback that text was selected
      const feedback = document.createElement('div');
      feedback.className = 'accessflow-selection-feedback';
      feedback.textContent = 'Text sent to AccessFlow';
      feedback.style.position = 'fixed';
      feedback.style.bottom = '20px';
      feedback.style.right = '20px';
      feedback.style.padding = '10px 15px';
      feedback.style.backgroundColor = '#4285F4';
      feedback.style.color = 'white';
      feedback.style.borderRadius = '4px';
      feedback.style.zIndex = '10000';
      feedback.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      document.body.appendChild(feedback);
      
      // Remove after 2 seconds
      setTimeout(() => {
        if (document.body.contains(feedback)) {
          feedback.remove();
        }
      }, 2000);
    }
    sendResponse({ success: true });
  }
});

// Add keyboard accessibility for context menu
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+A (or Command+Shift+A on Mac) to activate AccessFlow on selected text
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'a') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "processText", 
        text: selectedText
      });
    }
  }
});