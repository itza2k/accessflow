async function saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set(settings, () => {
        resolve();
      });
    });
  }
  
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => { 
        resolve(items);
      });
    });
  }
  
  export { saveSettings, loadSettings };