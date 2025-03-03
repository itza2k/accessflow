/**
 * History item structure
 * @typedef {Object} HistoryItem
 * @property {string} id - Unique ID
 * @property {string} originalText - Original text
 * @property {string} processedText - Processed text
 * @property {string} mode - Processing mode (simplify or summarize)
 * @property {Array} keyConcepts - Key concepts extracted
 * @property {Date} timestamp - When the processing occurred
 */

/**
 * Get processing history
 * @returns {Promise<Array<HistoryItem>>} History items
 */
export async function getHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get('accessflow_history', (result) => {
      resolve(result.accessflow_history || []);
    });
  });
}

/**
 * Add item to history
 * @param {Object} item - History item to add
 * @param {string} item.originalText - Original text
 * @param {string} item.processedText - Processed text
 * @param {string} item.mode - Processing mode
 * @param {Array} item.keyConcepts - Key concepts
 * @param {number} maxItems - Maximum number of items to keep
 * @returns {Promise<Array<HistoryItem>>} Updated history
 */
export async function addToHistory(item, maxItems = 10) {
  const history = await getHistory();
  
  // Create history item with ID and timestamp
  const historyItem = {
    ...item,
    id: generateId(),
    timestamp: new Date().toISOString()
  };
  
  // Add to beginning of history
  const newHistory = [historyItem, ...history].slice(0, maxItems);
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ 'accessflow_history': newHistory }, () => {
      resolve(newHistory);
    });
  });
}

/**
 * Clear history
 * @returns {Promise} Promise that resolves when history is cleared
 */
export async function clearHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 'accessflow_history': [] }, resolve);
  });
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
