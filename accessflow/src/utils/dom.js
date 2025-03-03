import { simplifyText, summarizeText, explainConcept } from './api.js';

/**
 * Process text with the selected mode and return result
 * 
 * @param {string} text - Text to process
 * @param {string} mode - Processing mode ('simplify' or 'summarize')
 * @param {string} simplificationLevel - Level of simplification 
 * @returns {Promise<Object>} Processed result
 */
export async function processText(text, mode, simplificationLevel = 'moderate') {
  try {
    if (!text) throw new Error(`Please enter some text to ${mode}.`);
    
    // Choose processing method based on mode
    let result;
    if (mode === 'simplify') {
      result = await simplifyText(text, simplificationLevel);
    } else {
      result = await summarizeText(text);
    }
    
    return result;
  } catch (error) {
    console.error(`Error processing text in ${mode} mode:`, error);
    throw error;
  }
}

/**
 * Display processed text in the UI
 * 
 * @param {Object} result - The processed text result
 * @param {Element} outputContainer - The container for output
 * @param {Element} outputText - The element to display processed text
 * @param {Element} keyConceptsContainer - The element to display key concepts
 */
export function displayProcessedText(result, outputContainer, outputText, keyConceptsContainer) {
  // Clear previous content
  if (outputText) {
    const processedText = result.simplifiedText || result.summarizedText || '';
    outputText.innerHTML = processedText;
  }
  
  if (keyConceptsContainer && result.keyConcepts && result.keyConcepts.length > 0) {
    // Create key concepts heading
    const heading = document.createElement('h3');
    heading.textContent = 'Key Concepts';
    keyConceptsContainer.appendChild(heading);
    
    // Create list of key concepts
    const list = document.createElement('ul');
    list.className = 'key-concepts-list';
    
    // Add each concept with explanation button
    result.keyConcepts.forEach(concept => {
      const item = document.createElement('li');
      
      const term = document.createElement('span');
      term.className = 'key-concept-term';
      term.textContent = concept.term;
      
      const explainButton = document.createElement('button');
      explainButton.className = 'key-concept-explain';
      explainButton.innerHTML = '?';
      explainButton.setAttribute('aria-label', `Explain ${concept.term}`);
      explainButton.addEventListener('click', async (e) => {
        try {
          // Replace button with loading indicator
          const originalContent = explainButton.innerHTML;
          explainButton.innerHTML = '...';
          explainButton.disabled = true;
          
          // Get explanation for the concept
          const explanation = await explainConcept(concept.term);
          
          // Show tooltip with explanation
          showExplanationTooltip(concept.term, explanation || concept.explanation, explainButton);
          
          // Reset button
          explainButton.innerHTML = originalContent;
          explainButton.disabled = false;
          
        } catch (error) {
          console.error('Error explaining concept:', error);
          
          // Reset button and show error
          explainButton.innerHTML = '!';
          explainButton.disabled = false;
          setTimeout(() => {
            explainButton.innerHTML = '?';
          }, 2000);
        }
      });
      
      item.appendChild(term);
      item.appendChild(explainButton);
      list.appendChild(item);
    });
    
    keyConceptsContainer.appendChild(list);
    
    // Show the output actions if present
    const outputActions = document.getElementById('output-actions');
    if (outputActions) {
      outputActions.style.display = 'flex';
    }
  }
}

/**
 * Shows a tooltip with concept explanation
 * 
 * @param {string} concept - The concept being explained
 * @param {string} explanation - The explanation text
 * @param {Element} anchor - Element to position the tooltip near
 */
function showExplanationTooltip(concept, explanation, anchor) {
  // Remove any existing tooltips
  const existingTooltips = document.querySelectorAll('.accessflow-tooltip');
  existingTooltips.forEach(tooltip => tooltip.remove());
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'accessflow-tooltip';
  
  // Create tooltip content
  const conceptHeading = document.createElement('strong');
  conceptHeading.textContent = concept;
  
  const explanationText = document.createElement('p');
  explanationText.textContent = explanation;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'tooltip-close';
  closeButton.innerHTML = '×';
  closeButton.setAttribute('aria-label', 'Close explanation');
  
  // Add content to tooltip
  tooltip.appendChild(closeButton);
  tooltip.appendChild(conceptHeading);
  tooltip.appendChild(explanationText);
  
  // Position tooltip
  document.body.appendChild(tooltip);
  const anchorRect = anchor.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Position tooltip according to available space
  const tooltipTop = anchorRect.top - tooltipRect.height - 5;
  const tooltipLeft = Math.max(10, anchorRect.left - (tooltipRect.width / 2) + (anchorRect.width / 2));
  
  tooltip.style.top = `${tooltipTop < 10 ? anchorRect.bottom + 5 : tooltipTop}px`;
  tooltip.style.left = `${tooltipLeft}px`;
  
  // Add event listeners
  closeButton.addEventListener('click', () => {
    tooltip.remove();
  });
  
  // Auto-remove after a delay
  setTimeout(() => {
    if (document.body.contains(tooltip)) {
      tooltip.remove();
    }
  }, 6000);
  
  // Also close on click outside
  document.addEventListener('click', (e) => {
    if (!tooltip.contains(e.target) && e.target !== anchor) {
      tooltip.remove();
    }
  }, { once: true });
}

/**
 * Create a notification message
 * 
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success', 'error', 'info')
 */
export function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `accessflow-feedback ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 3000);
}
