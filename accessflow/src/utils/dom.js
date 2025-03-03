import { simplifyText, summarizeText, explainConcept } from './api.js';
import SpeechHandler from './speech.js';
import { loadSettings, applySettings } from './settings.js';

// Initialize speech handler
const speechHandler = new SpeechHandler();

// Process text with a specific mode (simplify or summarize)
async function processText(text, mode, simplificationLevel = 'moderate') {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Please provide some text to process.");
    }
    
    let result;
    if (mode === 'simplify') {
      result = await simplifyText(text, simplificationLevel);
    } else if (mode === 'summarize') {
      result = await summarizeText(text);
    } else {
      throw new Error("Invalid processing mode");
    }
    
    return result;
  } catch (error) {
    console.error("Error processing text:", error);
    throw error;
  }
}

// Display processed text with key concepts
function displayProcessedText(result, container, outputContainer, keyConceptsContainer) {
  // Get the processed text from the result
  const processedText = result.simplifiedText || result.summarizedText || '';
  
  // Clear existing content
  outputContainer.innerHTML = '';
  keyConceptsContainer.innerHTML = '';
  
  // Display the processed text
  outputContainer.textContent = processedText;
  
  // Display key concepts if available
  if (result.keyConcepts && result.keyConcepts.length > 0) {
    const heading = document.createElement('h3');
    heading.textContent = 'Key Concepts';
    keyConceptsContainer.appendChild(heading);
    
    const list = document.createElement('ul');
    list.className = 'key-concepts-list';
    
    result.keyConcepts.forEach((concept) => {
      const item = document.createElement('li');
      
      // Create the concept term
      const term = document.createElement('span');
      term.className = 'key-concept-term';
      term.textContent = concept.term;
      item.appendChild(term);
      
      // Create the explain button
      const explainBtn = document.createElement('button');
      explainBtn.className = 'key-concept-explain';
      explainBtn.textContent = '?';
      explainBtn.setAttribute('aria-label', `Explain ${concept.term}`);
      explainBtn.dataset.concept = concept.term;
      explainBtn.dataset.explanation = concept.explanation || '';
      
      // Add click handler for explanation
      explainBtn.addEventListener('click', async (e) => {
        try {
          let explanation = e.target.dataset.explanation;
          
          // If no pre-cached explanation, fetch one
          if (!explanation) {
            const conceptTerm = e.target.dataset.concept;
            explanation = await explainConcept(conceptTerm);
            e.target.dataset.explanation = explanation;
          }
          
          showExplanation(explanation, e.target);
        } catch (error) {
          console.error("Failed to get explanation:", error);
          showExplanation("Unable to load explanation.", e.target);
        }
      });
      
      item.appendChild(explainBtn);
      list.appendChild(item);
    });
    
    keyConceptsContainer.appendChild(list);
  }
  
  // Apply settings to the container
  loadSettings().then(settings => {
    applySettings(settings, container);
  });
  
  return outputContainer;
}

// Show explanation tooltip
function showExplanation(explanation, targetElement) {
  // Remove any existing tooltip
  const existingTooltip = document.querySelector('.accessflow-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'accessflow-tooltip';
  tooltip.textContent = explanation;
  
  // Position tooltip near the target element
  document.body.appendChild(tooltip);
  
  const targetRect = targetElement.getBoundingClientRect();
  tooltip.style.left = `${targetRect.left}px`;
  tooltip.style.top = `${targetRect.bottom + 5}px`;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tooltip-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close explanation');
  closeBtn.addEventListener('click', () => tooltip.remove());
  tooltip.appendChild(closeBtn);
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (document.body.contains(tooltip)) {
      tooltip.remove();
    }
  }, 15000);
}

// Handle read aloud functionality
function setupReadAloud(textElement, settings) {
  // Configure speech handler with user settings
  speechHandler.setOptions({
    rate: settings.readAloudSpeed,
    voice: settings.readAloudVoice ? speechHandler.getVoices().find(v => v.name === settings.readAloudVoice) : null
  });
  
  // Create play/pause and stop buttons
  const playBtn = document.createElement('button');
  playBtn.textContent = '🔊 Read Aloud';
  playBtn.className = 'accessflow-read-aloud-btn';
  playBtn.setAttribute('aria-label', 'Read text aloud');
  
  const stopBtn = document.createElement('button');
  stopBtn.textContent = '⏹ Stop';
  stopBtn.className = 'accessflow-stop-btn';
  stopBtn.setAttribute('aria-label', 'Stop reading');
  stopBtn.style.display = 'none';
  
  // Add click handlers
  playBtn.addEventListener('click', () => {
    playBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    speechHandler.speak(textElement);
  });
  
  stopBtn.addEventListener('click', () => {
    stopBtn.style.display = 'none';
    playBtn.style.display = 'inline-block';
    speechHandler.stop();
  });
  
  // Add buttons before the text element
  textElement.parentNode.insertBefore(stopBtn, textElement);
  textElement.parentNode.insertBefore(playBtn, textElement);
}

// Set up the main AccessFlow functionality for the demo page
function setupAccessFlow() {
  const inputText = document.querySelector('#input-text');
  const simplifyBtn = document.querySelector('#simplify-btn');
  const summarizeBtn = document.querySelector('#summarize-btn');
  const outputText = document.querySelector('#output-text');
  const keyConcepts = document.querySelector('#key-concepts');
  const container = document.querySelector('.accessflow-container');
  
  if (!inputText || !simplifyBtn || !summarizeBtn || !outputText || !keyConcepts) {
    console.error("Required elements not found");
    return;
  }
  
  // Load user settings
  loadSettings().then(settings => {
    // Apply settings to the UI
    applySettings(settings, container);
    
    // Simplify button handler
    simplifyBtn.addEventListener('click', async () => {
      const text = inputText.value.trim();
      if (!text) {
        outputText.innerHTML = '<div class="accessflow-error">Please enter some text to simplify.</div>';
        return;
      }
      
      try {
        simplifyBtn.disabled = true;
        simplifyBtn.textContent = 'Processing...';
        
        outputText.innerHTML = '<div class="accessflow-loading"></div>';
        keyConcepts.innerHTML = '';
        
        const result = await processText(text, 'simplify', settings.simplificationLevel);
        const processedOutput = displayProcessedText(result, container, outputText, keyConcepts);
        
        // Set up read aloud for the processed text
        setupReadAloud(processedOutput, settings);
      } catch (error) {
        outputText.innerHTML = `<div class="accessflow-error">${error.message}</div>`;
        keyConcepts.innerHTML = '';
      } finally {
        simplifyBtn.disabled = false;
        simplifyBtn.textContent = 'Simplify';
      }
    });
    
    // Summarize button handler
    summarizeBtn.addEventListener('click', async () => {
      const text = inputText.value.trim();
      if (!text) {
        outputText.innerHTML = '<div class="accessflow-error">Please enter some text to summarize.</div>';
        return;
      }
      
      try {
        summarizeBtn.disabled = true;
        summarizeBtn.textContent = 'Processing...';
        
        outputText.innerHTML = '<div class="accessflow-loading"></div>';
        keyConcepts.innerHTML = '';
        
        const result = await processText(text, 'summarize');
        const processedOutput = displayProcessedText(result, container, outputText, keyConcepts);
        
        // Set up read aloud for the processed text
        setupReadAloud(processedOutput, settings);
      } catch (error) {
        outputText.innerHTML = `<div class="accessflow-error">${error.message}</div>`;
        keyConcepts.innerHTML = '';
      } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = 'Summarize';
      }
    });
  });
}

export { setupAccessFlow, processText, displayProcessedText };
